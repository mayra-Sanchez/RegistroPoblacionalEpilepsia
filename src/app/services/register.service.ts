// consola-registro.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ResearchLayer, Variable, ErrorWithCode } from './../modules/consola-registro/interfaces';
import { AuthService } from './auth.service';

/**
 * Interfaz para solicitudes de paginación
 */
export interface PaginationRequest {
    page: number;
    size: number;
    sort: string;
    sortDirection: 'ASC' | 'DESC';
}

/**
 * Interfaz para la creación/actualización de registros de pacientes
 */
export interface RegisterRequest {
    registerInfo: {
        researchLayerId: string;
        researchLayerName: string;
        variablesInfo: Array<{
            id: string;
            name: string;
            value: any;
            type: string;
        }>;
    };
    patientIdentificationNumber: number;
    patientIdentificationType: string;
    patient: {
        name: string;
        sex: string;
        birthdate: string | null;
        age: number;
        email: string;
        phoneNumber: string;
        deathDate: string | null;
        economicStatus: string;
        educationLevel: string;
        maritalStatus: string;
        hometown: string;
        currentCity: string;
        firstCrisisDate: string | null;
        crisisStatus: string;
    };
    caregiver?: {
        name: string;
        identificationType: string;
        identificationNumber: number;
        age: number;
        educationLevel: string;
        occupation: string;
    };
}

/**
 * Interfaz para respuestas paginadas
 */
export interface PaginatedResponse {
    content: any[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

/**
 * Interfaz para respuestas básicas del servidor
 */
export interface BasicResponse {
    message: string;
}

/**
 * Interfaz para el historial de cambios en registros
 */
interface RegisterHistory {
    id: string;
    registerId: string;
    changedBy: string;
    changedAt: string;
    operation: string;
    patientIdentificationNumber: number;
    isResearchLayerGroup: {
        researchLayerId: string;
        researchLayerName: string;
        variables: Array<{
            id: string;
            name: string;
            type: string;
            valueAsString: string | null;
            valueAsNumber: number | null;
        }>;
    };
}

/**
 * Interfaz para la respuesta del historial de registros
 */
export interface RegisterHistoryResponse {
    data: RegisterHistory[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
}

/**
 * Servicio para gestionar operaciones relacionadas con registros de pacientes,
 * capas de investigación y variables del sistema de consola de registro.
 * 
 * Este servicio proporciona métodos para CRUD de registros, obtención de capas de investigación,
 * variables, historial de cambios y gestión de permisos de usuario.
 * 
 * @Injectable Decorador que marca la clase como disponible para inyección de dependencias
 */
@Injectable({
    providedIn: 'root'
})
export class ConsolaRegistroService {
    // URLs base para las APIs
    private apiUrl = `${environment.backendUrl}${environment.endpoints.registers}`;
    private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;
    private readonly API_LAYERS = `${environment.backendUrl}${environment.endpoints.researchLayer}`;
    private readonly API_VARIABLES = `${environment.backendUrl}${environment.endpoints.variables}`;

    // Subject para notificar cambios en los datos
    private dataChangedSource = new Subject<void>();
    
    /**
     * Observable que emite cuando hay cambios en los datos de registros
     * Los componentes pueden suscribirse para actualizar vistas cuando los datos cambian
     */
    dataChanged$ = this.dataChangedSource.asObservable();

    /**
     * Constructor del servicio
     * @param http Cliente HTTP para realizar peticiones
     * @param authService Servicio de autenticación
     */
    constructor(private http: HttpClient, private authService: AuthService) { }

    /**
     * Notifica a los suscriptores que los datos han cambiado
     * Útil para actualizar componentes que dependen de los datos de registros
     */
    notifyDataChanged(): void {
        this.dataChangedSource.next();
    }

    /**
     * Obtiene el token de autenticación del localStorage
     * @returns Token JWT o null si no existe
     */
    getToken(): string | null {
        return localStorage.getItem('kc_token');
    }

    /**
     * Genera los headers de autenticación para las peticiones HTTP
     * @returns HttpHeaders con el token de autorización
     * @throws Error si no hay token disponible
     */
    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        if (!token) {
            throw new Error('No authentication token available');
        }
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    /**
     * Método alias para obtener headers de autenticación
     * Mantiene compatibilidad con código existente
     * @returns HttpHeaders con autenticación
     */
    private getHeaders(): HttpHeaders {
        return this.getAuthHeaders();
    }

    /**
     * Verifica si el usuario actual tiene rol de Doctor
     * @returns true si el usuario tiene rol de Doctor, false en caso contrario
     */
    private isDoctor(): boolean {
        try {
            const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
            return userRoles.includes('Doctor_client_role');
        } catch (error) {
            console.error('Error parsing user roles:', error);
            return false;
        }
    }

    // ============================ MÉTODOS DE USUARIOS ============================

    /**
     * Obtiene información del usuario autenticado por email
     * @param email Email del usuario a buscar
     * @param headers Headers HTTP opcionales (usa los por defecto si no se proporcionan)
     * @returns Observable con la información del usuario
     */
    obtenerUsuarioAutenticado(email: string, headers?: HttpHeaders): Observable<any> {
        const token = this.getToken();
        if (!token) {
            return throwError(() => new Error('No hay token disponible.'));
        }

        const defaultHeaders = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        const finalHeaders = headers || defaultHeaders;
        const params = new HttpParams().set('email', email);

        return this.http.get<any>(this.API_USERS, {
            headers: finalHeaders,
            params: params
        }).pipe(
            catchError(error => {
                console.error('Error al obtener usuario:', error);
                return throwError(() => new Error(error.error?.message || 'Ocurrió un error al obtener el usuario.'));
            })
        );
    }

    // ============================ MÉTODOS DE CAPAS DE INVESTIGACIÓN ============================

    /**
     * Obtiene una capa de investigación por su ID
     * @param id ID de la capa de investigación
     * @returns Observable con la información de la capa
     */
    obtenerCapaPorId(id: string): Observable<ResearchLayer> {
        // Validación robusta del ID
        if (!id || id.trim() === '' || id === 'none' || id === 'undefined' || id === 'null') {
            return throwError(() => this.createError('Layer ID is required and must be valid', 'VALIDATION_ERROR'));
        }

        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams().set('id', id);

            return this.http.get<ResearchLayer>(this.API_LAYERS, {
                headers,
                params
            }).pipe(
                tap((capa: ResearchLayer) => {
                    try {
                        localStorage.setItem('capaInvestigacion', JSON.stringify(capa));
                    } catch (storageError) {
                        console.error('Failed to store layer in localStorage:', storageError);
                    }
                }),
                catchError(error => this.handleHttpError(error, `Failed to fetch layer with ID: ${id}`))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    // ============================ MÉTODOS DE VARIABLES ============================

    /**
     * Obtiene las variables asociadas a una capa de investigación
     * @param researchLayerId ID de la capa de investigación
     * @returns Observable con el array de variables
     */
    obtenerVariablesPorCapa(researchLayerId: string): Observable<Variable[]> {
        if (!researchLayerId) {
            return throwError(() => this.createError('Research layer ID is required', 'VALIDATION_ERROR'));
        }

        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams().set('researchLayerId', researchLayerId);

            return this.http.get<Variable[]>(`${this.API_VARIABLES}/ResearchLayerId`, { 
                headers, 
                params 
            }).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch variables for layer'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    // ============================ MÉTODOS CRUD DE REGISTROS ============================

    /**
     * Crea un nuevo registro de paciente
     * @param userEmail Email del usuario que realiza la operación
     * @param registerData Datos del registro a crear
     * @returns Observable con la respuesta del servidor
     */
    saveRegister(userEmail: string, registerData: any): Observable<any> {
        // ✅ VERIFICAR PERMISOS ANTES DE CONTINUAR
        if (!this.isDoctor()) {
            const error = new Error('Solo los usuarios con rol de Doctor pueden crear registros');
            (error as any).code = 'PERMISSION_DENIED';
            (error as any).status = 403;
            return throwError(() => error);
        }

        console.log('🔗 URL COMPLETA:', `${this.apiUrl}?userEmail=${userEmail}`);
        console.log('📤 DATOS ENVIADOS:', JSON.stringify(registerData, null, 2));

        return this.http.post<any>(`${this.apiUrl}?userEmail=${userEmail}`, registerData, {
            headers: this.getHeaders()
        }).pipe(
            catchError((error: HttpErrorResponse) => {
                console.error('💥 ERROR EN LA PETICIÓN:', error);

                // Obtener detalles del error del backend
                let errorDetails = 'Error desconocido';
                let errorMessage = error.message;

                if (error.error) {
                    if (typeof error.error === 'object') {
                        errorDetails = JSON.stringify(error.error);
                        // Intentar extraer mensaje más específico
                        if (error.error.message) {
                            errorMessage = error.error.message;
                        } else if (error.error.error) {
                            errorMessage = error.error.error;
                        }
                    } else {
                        errorDetails = error.error;
                        errorMessage = error.error;
                    }
                }

                console.error('📋 ERROR BODY:', errorDetails);
                console.error('🔧 ERROR HEADERS:', error.headers);

                // Crear un error más descriptivo
                const customError = new Error(`Error ${error.status}: ${errorMessage}. Detalles: ${errorDetails}`);
                return throwError(() => customError);
            })
        );
    }

    /**
     * Actualiza un registro existente
     * @param registerId ID del registro a actualizar
     * @param userEmail Email del usuario que realiza la operación
     * @param registerRequest Datos actualizados del registro
     * @returns Observable con la respuesta básica del servidor
     */
    updateRegister(registerId: string, userEmail: string, registerRequest: RegisterRequest): Observable<BasicResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('registerId', registerId)
                .set('userEmail', userEmail);

            return this.http.put<BasicResponse>(this.apiUrl, registerRequest, {
                headers,
                params
            }).pipe(
                tap(() => this.notifyDataChanged()), // Notificar cambio
                catchError(error => this.handleHttpError(error, 'Failed to update register'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare update request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    /**
     * Elimina un registro
     * @param registerId ID del registro a eliminar
     * @returns Observable con la respuesta básica del servidor
     */
    deleteRegister(registerId: string): Observable<BasicResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams().set('registerId', registerId);

            return this.http.delete<BasicResponse>(this.apiUrl, {
                headers,
                params
            }).pipe(
                tap(() => this.notifyDataChanged()), // Notificar cambio
                catchError(error => this.handleHttpError(error, 'Failed to delete register'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare delete request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    // ============================ MÉTODOS DE CONSULTA DE REGISTROS ============================

    /**
     * Obtiene registros paginados por paciente
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con la respuesta paginada
     */
    getRegistersByPatient(patientIdentificationNumber: number, pagination: PaginationRequest): Observable<PaginatedResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('patientIdentificationNumber', patientIdentificationNumber.toString())
                .set('page', pagination.page.toString())
                .set('size', pagination.size.toString())
                .set('sort', pagination.sort)
                .set('sortDirection', pagination.sortDirection);

            return this.http.get<PaginatedResponse>(`${this.apiUrl}/allByPatient`, {
                headers,
                params
            }).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch patient registers'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare patient registers request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    /**
     * Obtiene registros paginados por capa de investigación
     * @param researchLayerId ID de la capa de investigación
     * @param userEmail Email del usuario
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con la respuesta paginada
     */
    getRegistersByResearchLayer(
        researchLayerId: string,
        userEmail: string,
        patientIdentificationNumber: number,
        pagination: PaginationRequest
    ): Observable<PaginatedResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('researchLayerId', researchLayerId)
                .set('userEmail', userEmail)
                .set('patientIdentificationNumber', patientIdentificationNumber.toString())
                .set('page', pagination.page.toString())
                .set('size', pagination.size.toString())
                .set('sort', pagination.sort)
                .set('sortDirection', pagination.sortDirection);

            return this.http.get<PaginatedResponse>(`${this.apiUrl}/allResearchLayerRegisters`, {
                headers,
                params
            }).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch research layer registers'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare research layer registers request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    /**
     * Obtiene registros de cuidadores por paciente
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con la respuesta paginada
     */
    getCaregiverRegisters(patientIdentificationNumber: number, pagination: PaginationRequest): Observable<PaginatedResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('patientIdentificationNumber', patientIdentificationNumber.toString())
                .set('page', pagination.page.toString())
                .set('size', pagination.size.toString())
                .set('sort', pagination.sort)
                .set('sortDirection', pagination.sortDirection);

            return this.http.get<PaginatedResponse>(`${this.apiUrl}/allCarevigerRegisters`, {
                headers,
                params
            }).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch caregiver registers'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare caregiver registers request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    /**
     * Obtiene registros de información básica del paciente
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con la respuesta paginada
     */
    getPatientBasicInfoRegisters(patientIdentificationNumber: number, pagination: PaginationRequest): Observable<PaginatedResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('patientIdentificationNumber', patientIdentificationNumber.toString())
                .set('page', pagination.page.toString())
                .set('size', pagination.size.toString())
                .set('sort', pagination.sort)
                .set('sortDirection', pagination.sortDirection);

            return this.http.get<PaginatedResponse>(`${this.apiUrl}/allPatientBasicInfoRegisters`, {
                headers,
                params
            }).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch patient basic info registers'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare patient basic info request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    /**
     * Obtiene el registro actual de un paciente para una capa de investigación específica
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param researchLayerId ID de la capa de investigación
     * @returns Observable con el registro actual
     */
    getActualRegisterByPatient(patientIdentificationNumber: number, researchLayerId: string): Observable<any> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('patientIdentificationNumber', patientIdentificationNumber.toString())
                .set('researchLayerId', researchLayerId);

            return this.http.get<any>(`${this.apiUrl}/actualRegisterByPatient`, {
                headers,
                params
            }).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch actual patient register'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare actual register request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    // ============================ MÉTODOS DE HISTORIAL ============================

    /**
     * Obtiene el historial de cambios de registros para una capa de investigación
     * @param researchLayerId ID de la capa de investigación
     * @param userEmail Email del usuario
     * @param page Número de página (por defecto 0)
     * @param size Tamaño de página (por defecto 10)
     * @sort Campo de ordenamiento (por defecto 'changedAt')
     * @sortDirection Dirección de ordenamiento (por defecto 'DESC')
     * @returns Observable con el historial de registros
     */
    getRegisterHistory(
        researchLayerId: string,
        userEmail: string,
        page: number = 0,
        size: number = 10,
        sort: string = 'RegisterDate',
        sortDirection: 'ASC' | 'DESC' = 'DESC'
    ): Observable<RegisterHistoryResponse> {
        if (!researchLayerId) {
            return throwError(() => this.createError('Research layer ID is required', 'VALIDATION_ERROR'));
        }

        if (!userEmail) {
            return throwError(() => this.createError('User email is required', 'VALIDATION_ERROR'));
        }

        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('researchLayerId', researchLayerId)
                .set('userEmail', userEmail)
                .set('page', page.toString())
                .set('size', size.toString())
                .set('sort', sort)
                .set('sortDirection', sortDirection);

            return this.http.get<RegisterHistoryResponse>(
                `${this.apiUrl}/allResearchLayerHistoryById`, 
                { headers, params }
            ).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch register history'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare register history request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    /**
     * Elimina un registro del historial
     * @param registerId ID del registro a eliminar del historial
     * @returns Observable con la respuesta básica del servidor
     */
    deleteRegisterHistory(registerId: string): Observable<BasicResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams().set('registerId', registerId);

            return this.http.delete<BasicResponse>(`${this.apiUrl}`, {
                headers,
                params
            }).pipe(
                tap(() => this.notifyDataChanged()),
                catchError(error => this.handleHttpError(error, 'Failed to delete register history'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare delete history request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    // ============================ MÉTODOS DE COMPATIBILIDAD ============================

    /**
     * Método de compatibilidad para obtener registros por paciente
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param page Número de página (por defecto 0)
     * @param size Tamaño de página (por defecto 10)
     * @param sort Campo de ordenamiento (por defecto 'registerDate')
     * @param sortDirection Dirección de ordenamiento (por defecto 'DESC')
     * @returns Observable con la respuesta paginada
     */
    obtenerRegistrosPorPaciente(
        patientIdentificationNumber: number,
        page: number = 0,
        size: number = 10,
        sort: string = 'registerDate',
        sortDirection: string = 'DESC'
    ): Observable<PaginatedResponse> {
        const pagination: PaginationRequest = {
            page,
            size,
            sort,
            sortDirection: sortDirection as 'ASC' | 'DESC'
        };

        return this.getRegistersByPatient(patientIdentificationNumber, pagination);
    }

    // ============================ MÉTODOS PRIVADOS DE UTILIDAD ============================

    /**
     * Maneja errores HTTP de manera consistente
     * @param error Error HTTP recibido
     * @param defaultMessage Mensaje por defecto para el error
     * @returns Observable que emite un error manejado
     */
    private handleHttpError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
        console.error('HTTP Error:', error);

        if (error.status === 0) {
            return throwError(() => this.createError('Network error - please check your connection', 'NETWORK_ERROR', error));
        }

        if (error.status === 401) {
            return throwError(() => this.createError('Session expired - please login again', 'AUTH_ERROR', error, 401));
        }

        if (error.status === 403) {
            return throwError(() => this.createError('You do not have permission for this action', 'PERMISSION_ERROR', error, 403));
        }

        if (error.status === 404) {
            return throwError(() => this.createError('Resource not found', 'NOT_FOUND_ERROR', error, 404));
        }

        if (error.status >= 500) {
            return throwError(() => this.createError('Server error - please try again later', 'SERVER_ERROR', error, error.status));
        }

        const serverMessage = error.error?.message || error.message || defaultMessage;
        return throwError(() => this.createError(serverMessage, 'API_ERROR', error, error.status));
    }

    /**
     * Crea un error personalizado con código y información adicional
     * @param message Mensaje de error
     * @param code Código de error personalizado
     * @param originalError Error original (opcional)
     * @param status Código de estado HTTP (opcional)
     * @returns Error personalizado con información extendida
     */
    private createError(
        message: string,
        code: string,
        originalError?: any,
        status?: number
    ): ErrorWithCode {
        const error = new Error(message) as ErrorWithCode;
        error.code = code;
        error.originalError = originalError;
        error.status = status;
        return error;
    }
}
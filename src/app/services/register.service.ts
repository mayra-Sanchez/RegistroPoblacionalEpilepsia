import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ResearchLayer, Variable, ErrorWithCode, RegisterResponse } from './../modules/consola-registro/interfaces';
import { AuthService } from './auth.service';

/**
 * Interfaz para solicitudes de paginación
 * Define los parámetros necesarios para realizar consultas paginadas
 */
export interface PaginationRequest {
    /** Número de página actual (base 0) */
    page: number;
    /** Cantidad de elementos por página */
    size: number;
    /** Campo por el cual ordenar los resultados */
    sort: string;
    /** Dirección del ordenamiento: ASCENDENTE o DESCENDENTE */
    sortDirection: 'ASC' | 'DESC';
}

/**
 * Interfaz para la creación/actualización de registros de pacientes
 * Define la estructura completa de datos para crear o actualizar un registro médico
 */
export interface RegisterRequest {
    /** Información específica del registro */
    registerInfo: {
        /** Identificador único de la capa de investigación */
        researchLayerId: string;
        /** Nombre descriptivo de la capa de investigación */
        researchLayerName: string;
        /** Lista de variables y sus valores asociados al registro */
        variablesInfo: Array<{
            /** Identificador único de la variable */
            id: string;
            /** Nombre descriptivo de la variable */
            name: string;
            /** Valor de la variable (puede ser de cualquier tipo según la variable) */
            value: any;
            /** Tipo de dato de la variable (string, number, boolean, etc.) */
            type: string;
        }>;
    };
    /** Número de identificación del paciente */
    patientIdentificationNumber: number;
    /** Tipo de documento de identificación del paciente */
    patientIdentificationType: string;
    /** Información demográfica y clínica del paciente */
    patient: {
        /** Nombre completo del paciente */
        name: string;
        /** Sexo del paciente */
        sex: string;
        /** Fecha de nacimiento en formato ISO string o null si no está disponible */
        birthDate: string | null;
        /** Edad del paciente en años */
        age: number;
        /** Correo electrónico del paciente */
        email: string;
        /** Número de teléfono del paciente */
        phoneNumber: string;
        /** Fecha de fallecimiento en formato ISO string o null si el paciente está vivo */
        deathDate: string | null;
        /** Nivel socioeconómico del paciente */
        economicStatus: string;
        /** Nivel educativo alcanzado */
        educationLevel: string;
        /** Estado civil actual */
        maritalStatus: string;
        /** Ciudad de origen o nacimiento */
        hometown: string;
        /** Ciudad de residencia actual */
        currentCity: string;
        /** Fecha de la primera crisis en formato ISO string o null si no aplica */
        firstCrisisDate: string | null;
        /** Estado actual de la condición de crisis */
        crisisStatus: string;
    };
    /** Información del cuidador (opcional) */
    caregiver?: {
        /** Nombre completo del cuidador */
        name: string;
        /** Tipo de documento de identificación del cuidador */
        identificationType: string;
        /** Número de identificación del cuidador */
        identificationNumber: number;
        /** Edad del cuidador en años */
        age: number;
        /** Nivel educativo del cuidador */
        educationLevel: string;
        /** Ocupación o profesión del cuidador */
        occupation: string;
    };
}

/**
 * Interfaz para la respuesta de validación de paciente
 * Contiene información sobre el estado del paciente en el sistema y capa de investigación
 */
export interface ValidatePatientResponse {
    /** Acción resultante de la validación */
    action: 'patient_already_exist_in_layer' | 'patient_doesnt_exist_in_layer' | 'patient_doesnt_exist';
    /** Identificador del registro si existe, null en caso contrario */
    registerId: string | null;
    /** Número de identificación del paciente */
    patientIdentificationNumber: number | null;
    /** Tipo de documento de identificación */
    patientIdentificationType: string | null;
    /** Información de registros existentes en diferentes capas de investigación */
    registerInfo: Array<{
        /** Identificador de la capa de investigación */
        researchLayerId: string;
        /** Nombre de la capa de investigación */
        researchLayerName: string;
        /** Variables asociadas al registro */
        variablesInfo: Array<{
            /** Identificador único de la variable */
            variableId: string;
            /** Nombre descriptivo de la variable */
            variableName: string;
            /** Tipo de dato de la variable */
            variableType: string;
            /** Valor como string si aplica, null en caso contrario */
            valueAsString: string | null;
            /** Valor como número si aplica, null en caso contrario */
            valueAsNumber: number | null;
        }>;
    }> | null;
    /** Información básica del paciente si existe en el sistema */
    patientBasicInfo: {
        /** Nombre completo del paciente */
        name: string;
        /** Sexo del paciente */
        sex: string;
        /** Fecha de nacimiento */
        birthDate: string | null;
        /** Edad del paciente */
        age: number | null;
        /** Correo electrónico */
        email: string;
        /** Número de teléfono */
        phoneNumber: string;
        /** Fecha de fallecimiento */
        deathDate: string | null;
        /** Nivel socioeconómico */
        economicStatus: string;
        /** Nivel educativo */
        educationLevel: string;
        /** Estado civil */
        maritalStatus: string;
        /** Ciudad de origen */
        hometown: string;
        /** Ciudad de residencia actual */
        currentCity: string;
        /** Fecha de primera crisis */
        firstCrisisDate: string | null;
        /** Estado de crisis */
        crisisStatus: string;
    } | null;
    /** Información del cuidador si existe */
    caregiver: {
        /** Nombre completo del cuidador */
        name: string;
        /** Tipo de documento */
        identificationType: string;
        /** Número de identificación */
        identificationNumber: number;
        /** Edad del cuidador */
        age: number;
        /** Nivel educativo */
        educationLevel: string;
        /** Ocupación */
        occupation: string;
    } | null;
}

/**
 * Interfaz para respuestas paginadas del servidor
 * Estructura estandarizada para todas las respuestas que contienen datos paginados
 */
export interface PaginatedResponse {
    /** Array de elementos de la página actual */
    data: any[];
    /** Número total de elementos en todas las páginas */
    totalElements: number;
    /** Número total de páginas disponibles */
    totalPages: number;
    /** Número de página actual (base 0) */
    currentPage: number;
    /** Array de elementos (alias de data para compatibilidad) */
    content?: any[];
    /** Tamaño de la página (alias de data.length para compatibilidad) */
    size?: number;
    /** Número de página (alias de currentPage para compatibilidad) */
    number?: number;
}

/**
 * Interfaz para respuestas básicas del servidor
 * Respuestas simples que principalmente contienen mensajes de estado
 */
export interface BasicResponse {
    /** Mensaje descriptivo de la respuesta */
    message: string;
    /** Indicador de éxito de la operación (opcional) */
    success?: boolean;
}

/**
 * Interfaz para el historial de cambios en registros
 * Representa un registro individual en el historial de cambios
 */
interface RegisterHistory {
    /** Identificador único del registro de historial */
    id: string;
    /** Identificador del registro principal asociado */
    registerId: string;
    /** Email del usuario que realizó el cambio */
    changedBy: string;
    /** Fecha y hora en que se realizó el cambio (ISO string) */
    changedAt: string;
    /** Tipo de operación realizada (CREATE, UPDATE, DELETE, etc.) */
    operation: string;
    /** Número de identificación del paciente */
    patientIdentificationNumber: number;
    /** Información del grupo de capa de investigación */
    isResearchLayerGroup: {
        /** Identificador de la capa de investigación */
        researchLayerId: string;
        /** Nombre de la capa de investigación */
        researchLayerName: string;
        /** Variables y sus valores en el momento del cambio */
        variables: Array<{
            /** Identificador único de la variable */
            id: string;
            /** Nombre de la variable */
            name: string;
            /** Tipo de dato de la variable */
            type: string;
            /** Valor como string si aplica */
            valueAsString: string | null;
            /** Valor como número si aplica */
            valueAsNumber: number | null;
        }>;
    };
}

/**
 * Interfaz para la respuesta del historial de registros
 * Estructura paginada para el historial de cambios
 */
export interface RegisterHistoryResponse {
    /** Array de registros de historial */
    data: RegisterHistory[];
    /** Página actual */
    currentPage: number;
    /** Total de páginas disponibles */
    totalPages: number;
    /** Total de elementos en todas las páginas */
    totalElements: number;
}

/**
 * Servicio para gestionar operaciones relacionadas con registros de pacientes,
 * capas de investigación y variables del sistema de consola de registro.
 * 
 * Este servicio proporciona funcionalidades completas para:
 * - Gestión de registros médicos (CRUD)
 * - Validación de pacientes
 * - Consulta de historiales
 * - Gestión de capas de investigación y variables
 * - Operaciones paginadas
 * 
 * @example
 * // Uso básico del servicio
 * constructor(private consolaService: ConsolaRegistroService) {}
 * 
 * // Obtener una capa de investigación
 * this.consolaService.obtenerCapaPorId('123').subscribe(capa => {
 *   console.log('Capa obtenida:', capa);
 * });
 * 
 * // Crear un nuevo registro
 * this.consolaService.saveRegister('medico@hospital.com', registroData).subscribe(
 *   response => console.log('Registro creado:', response),
 *   error => console.error('Error:', error)
 * );
 */
@Injectable({
    providedIn: 'root'
})
export class ConsolaRegistroService {
    /** URL base para endpoints de registros */
    private apiUrl = `${environment.backendUrl}${environment.endpoints.registers}`;

    /** URL base para endpoints de usuarios */
    private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;

    /** URL base para endpoints de capas de investigación */
    private readonly API_LAYERS = `${environment.backendUrl}${environment.endpoints.researchLayer}`;

    /** URL base para endpoints de variables */
    private readonly API_VARIABLES = `${environment.backendUrl}${environment.endpoints.variables}`;

    /** Subject para notificar cambios en los datos */
    private dataChangedSource = new Subject<void>();

    /** Observable para suscribirse a cambios en los datos */
    dataChanged$ = this.dataChangedSource.asObservable();

    /**
     * Constructor del servicio
     * @param http Cliente HTTP para realizar peticiones
     * @param authService Servicio de autenticación
     */
    constructor(private http: HttpClient, private authService: AuthService) { }

    /**
     * Notifica a los suscriptores que los datos han cambiado
     * Útil para actualizar componentes cuando se realizan operaciones CRUD
     */
    notifyDataChanged(): void {
        this.dataChangedSource.next();
    }

    /**
     * Obtiene el token de autenticación del localStorage
     * @returns Token JWT o null si no está disponible
     */
    getToken(): string | null {
        return localStorage.getItem('kc_token');
    }

    /**
     * Genera headers de autenticación para las peticiones HTTP
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
     * Obtiene headers para peticiones HTTP (alias de getAuthHeaders)
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
     * @param email Email del usuario a consultar
     * @param headers Headers HTTP personalizados (opcional)
     * @returns Observable con la información del usuario
     * @throws Error si no hay token disponible o ocurre un error en la petición
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
     * @param id Identificador único de la capa de investigación
     * @returns Observable con la información de la capa de investigación
     * @throws Error si el ID no es válido o ocurre un error en la petición
     */
    obtenerCapaPorId(id: string): Observable<ResearchLayer> {
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
     * @param researchLayerId Identificador de la capa de investigación
     * @returns Observable con el array de variables
     * @throws Error si el researchLayerId no es válido o ocurre un error en la petición
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
     * Guarda un nuevo registro de paciente
     * @param userEmail Email del usuario que realiza la operación
     * @param registerData Datos completos del registro a crear
     * @returns Observable con la respuesta del servidor
     * @throws Error si el usuario no tiene permisos de Doctor o ocurre un error
     */
    saveRegister(userEmail: string, registerData: any): Observable<any> {
        if (!this.isDoctor()) {
            const error = new Error('Solo los usuarios con rol de Doctor pueden crear registros');
            (error as any).code = 'PERMISSION_DENIED';
            (error as any).status = 403;
            return throwError(() => error);
        }

        const token = this.authService.getToken();
        if (!token) {
            return throwError(() => this.createError('No authentication token available', 'AUTH_ERROR'));
        }

        console.log('🔗 URL COMPLETA:', `${this.apiUrl}?userEmail=${userEmail}`);

        return this.http.post<any>(`${this.apiUrl}?userEmail=${userEmail}`, registerData, {
            headers: this.getHeaders()
        }).pipe(
            // ✅ CORREGIDO: Agregar tap para notificar después del éxito
            tap((response) => {
                console.log('✅ SERVICE - SaveRegister Success, notificando cambio...');
                this.notifyDataChanged();
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('💥 ERROR EN LA PETICIÓN:', error);

                let errorDetails = 'Error desconocido';
                let errorMessage = error.message;

                if (error.error) {
                    if (typeof error.error === 'object') {
                        errorDetails = JSON.stringify(error.error);
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

                const customError = this.createError(`Error ${error.status}: ${errorMessage}. Detalles: ${errorDetails}`, 'API_ERROR', error, error.status);
                return throwError(() => customError);
            })
        );
    }

    /**
     * Actualiza un registro existente
     * @param registerId Identificador único del registro a actualizar
     * @param userEmail Email del usuario que realiza la actualización
     * @param registerRequest Datos actualizados del registro
     * @returns Observable con la respuesta básica del servidor
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
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
                tap((response) => {
                    console.log('✅ SERVICE - UpdateRegister Success, notificando cambio...');
                    this.notifyDataChanged(); // ✅ YA ESTÁ IMPLEMENTADO
                }),
                catchError(error => {
                    console.error('❌ SERVICE - UpdateRegister Error:', error);
                    return this.handleHttpError(error, 'Failed to update register');
                })
            );
        } catch (error) {
            console.error('❌ SERVICE - UpdateRegister Preparation Error:', error);
            return throwError(() => this.createError('Failed to prepare update request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }
    /**
     * Elimina un registro del sistema
     * @param registerId Identificador único del registro a eliminar
     * @returns Observable con la respuesta básica del servidor
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
     */
    deleteRegister(registerId: string): Observable<BasicResponse> {
        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams().set('registerId', registerId);

            return this.http.delete<BasicResponse>(this.apiUrl, {
                headers,
                params
            }).pipe(
                tap(() => {
                    console.log('✅ SERVICE - DeleteRegister Success, notificando cambio...');
                    this.notifyDataChanged(); // ✅ YA ESTÁ IMPLEMENTADO
                }),
                catchError(error => this.handleHttpError(error, 'Failed to delete register'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare delete request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }
    // ============================ MÉTODOS DE CONSULTA DE REGISTROS ============================

    /**
     * Obtiene registros paginados por número de identificación del paciente
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con respuesta paginada de registros
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
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
     * @param researchLayerId Identificador de la capa de investigación
     * @param userEmail Email del usuario que realiza la consulta
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con respuesta paginada de registros
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
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
     * Obtiene registros paginados de cuidadores por paciente
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con respuesta paginada de registros de cuidadores
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
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
     * Obtiene registros paginados de información básica del paciente
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param pagination Configuración de paginación
     * @returns Observable con respuesta paginada de registros de información básica
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
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
     * Obtiene el registro actual de un paciente en una capa de investigación específica
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param researchLayerId Identificador de la capa de investigación
     * @returns Observable con el registro actual del paciente
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
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
     * Obtiene el historial de cambios de registros paginado
     * @param researchLayerId Identificador de la capa de investigación
     * @param userEmail Email del usuario que realiza la consulta
     * @param page Número de página (por defecto 0)
     * @param size Tamaño de página (por defecto 10)
     * @param sort Campo de ordenamiento (por defecto 'RegisterDate')
     * @param sortDirection Dirección de ordenamiento (por defecto 'DESC')
     * @returns Observable con respuesta paginada del historial
     * @throws Error si los parámetros requeridos no son válidos
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
     * Elimina el historial de un registro específico
     * @param registerId Identificador único del registro
     * @returns Observable con la respuesta básica del servidor
     * @throws Error si ocurre un error en la preparación o ejecución de la petición
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
     * @returns Observable con respuesta paginada de registros
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

    // ============================ MÉTODO VALIDAR PACIENTE CORREGIDO ============================

    /**
     * Valida la existencia de un paciente en el sistema y en capas de investigación específicas
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param researchLayerId Identificador de la capa de investigación
     * @returns Observable con la respuesta de validación del paciente
     * @throws Error si los parámetros requeridos no son válidos
     */
    validarPaciente(patientIdentificationNumber: number, researchLayerId: string): Observable<ValidatePatientResponse> {
        if (!patientIdentificationNumber) {
            return throwError(() => this.createError('Patient identification number is required', 'VALIDATION_ERROR'));
        }

        if (!researchLayerId) {
            return throwError(() => this.createError('Research layer ID is required', 'VALIDATION_ERROR'));
        }

        try {
            const userEmail = this.authService.getUserEmail();
            if (!userEmail) {
                return throwError(() => this.createError('User email is required', 'AUTH_ERROR'));
            }

            const headers = this.getAuthHeaders();
            const params = new HttpParams()
                .set('researchLayerId', researchLayerId)
                .set('userEmail', userEmail)
                .set('patientIdentificationNumber', patientIdentificationNumber.toString());

            console.log('🔍 Validating patient:', {
                patientIdentificationNumber,
                researchLayerId,
                userEmail
            });

            return this.http.get<ValidatePatientResponse>(`${this.apiUrl}/validatePatient`, {
                headers,
                params
            }).pipe(
                tap(response => {
                    console.log('✅ Patient validation response:', response);
                }),
                catchError(error => this.handleHttpError(error, 'Error al validar paciente'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare validation request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }


    // ============================ MÉTODOS ADICIONALES PARA LA CONSOLA ============================

    /**
     * Obtiene el historial de cambios de cuidador por paciente (método de compatibilidad)
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param page Número de página (por defecto 0)
     * @param size Tamaño de página (por defecto 10)
     * @param sort Campo de ordenamiento (por defecto 'registerDate')
     * @param sortDirection Dirección de ordenamiento (por defecto 'DESC')
     * @returns Observable con respuesta paginada de registros de cuidadores
     */
    obtenerHistorialCuidador(
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

        return this.getCaregiverRegisters(patientIdentificationNumber, pagination);
    }

    /**
     * Obtiene el historial de cambios de información básica del paciente (método de compatibilidad)
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param page Número de página (por defecto 0)
     * @param size Tamaño de página (por defecto 10)
     * @param sort Campo de ordenamiento (por defecto 'registerDate')
     * @param sortDirection Dirección de ordenamiento (por defecto 'DESC')
     * @returns Observable con respuesta paginada de registros de información básica
     */
    obtenerHistorialPaciente(
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

        return this.getPatientBasicInfoRegisters(patientIdentificationNumber, pagination);
    }

    /**
     * Obtiene el historial de cambios de capa de investigación del paciente
     * @param researchLayerId Identificador de la capa de investigación
     * @param patientIdentificationNumber Número de identificación del paciente
     * @param page Número de página (por defecto 0)
     * @param size Tamaño de página (por defecto 10)
     * @param sort Campo de ordenamiento (por defecto 'registerDate')
     * @param sortDirection Dirección de ordenamiento (por defecto 'DESC')
     * @returns Observable con respuesta paginada de registros
     * @throws Error si ocurre un error en la preparación de la petición
     */
    obtenerHistorialCapaPaciente(
        researchLayerId: string,
        patientIdentificationNumber: number,
        page: number = 0,
        size: number = 10,
        sort: string = 'registerDate',
        sortDirection: string = 'DESC'
    ): Observable<PaginatedResponse> {
        try {
            const userEmail = this.authService.getUserEmail() || 'doctor@gmail.com';
            const pagination: PaginationRequest = {
                page,
                size,
                sort,
                sortDirection: sortDirection as 'ASC' | 'DESC'
            };

            return this.getRegistersByResearchLayer(researchLayerId, userEmail, patientIdentificationNumber, pagination);
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare patient layer history request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    /**
     * Obtiene el historial completo de cambios de capa de investigación
     * @param researchLayerId Identificador de la capa de investigación
     * @param page Número de página (por defecto 0)
     * @param size Tamaño de página (por defecto 10)
     * @param sort Campo de ordenamiento (por defecto 'registerDate')
     * @param sortDirection Dirección de ordenamiento (por defecto 'DESC')
     * @returns Observable con respuesta paginada del historial completo
     * @throws Error si ocurre un error en la preparación de la petición
     */
    obtenerHistorialCompletoCapa(
        researchLayerId: string,
        page: number = 0,
        size: number = 10,
        sort: string = 'registerDate',
        sortDirection: string = 'DESC'
    ): Observable<RegisterHistoryResponse> {
        try {
            const userEmail = this.authService.getUserEmail() || 'doctor@gmail.com';
            return this.getRegisterHistory(researchLayerId, userEmail, page, size, sort, sortDirection as 'ASC' | 'DESC');
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare complete layer history request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }

    // ============================ MÉTODOS PRIVADOS DE UTILIDAD ============================

    /**
     * Maneja errores HTTP de manera consistente
     * @param error Objeto de error HTTP
     * @param defaultMessage Mensaje por defecto si no se puede obtener del error
     * @returns Observable que emite un error personalizado
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
     * Crea un objeto de error personalizado con código y información adicional
     * @param message Mensaje descriptivo del error
     * @param code Código único del error
     * @param originalError Error original (opcional)
     * @param status Código de estado HTTP (opcional)
     * @returns Objeto ErrorWithCode personalizado
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
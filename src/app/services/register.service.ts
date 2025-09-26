// consola-registro.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ResearchLayer, Variable, ErrorWithCode } from './../modules/consola-registro/interfaces';
import { AuthService } from './auth.service';

export interface PaginationRequest {
    page: number;
    size: number;
    sort: string;
    sortDirection: 'ASC' | 'DESC';
}

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

export interface PaginatedResponse {
    content: any[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface BasicResponse {
    message: string;
}

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


export interface RegisterHistoryResponse {
    data: RegisterHistory[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
}

@Injectable({
    providedIn: 'root'
})
export class ConsolaRegistroService {
    private apiUrl = `${environment.backendUrl}${environment.endpoints.registers}`;
    private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;
    private readonly API_LAYERS = `${environment.backendUrl}${environment.endpoints.researchLayer}`;
    private readonly API_VARIABLES = `${environment.backendUrl}${environment.endpoints.variables}`;

    constructor(private http: HttpClient, private authService: AuthService) { }

    // Subject para notificar cambios en los datos
    private dataChangedSource = new Subject<void>();
    dataChanged$ = this.dataChangedSource.asObservable();

    notifyDataChanged(): void {
        this.dataChangedSource.next();
    }

    getToken(): string | null {
        return localStorage.getItem('kc_token');
    }

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

    // Añadir este método que falta
    private getHeaders(): HttpHeaders {
        return this.getAuthHeaders(); // Usamos el mismo método de autenticación
    }

    private isDoctor(): boolean {
        try {
            const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
            return userRoles.includes('Doctor_client_role');
        } catch (error) {
            console.error('Error parsing user roles:', error);
            return false;
        }
    }

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

    obtenerVariablesPorCapa(researchLayerId: string): Observable<Variable[]> {
        if (!researchLayerId) {
            return throwError(() => this.createError('Research layer ID is required', 'VALIDATION_ERROR'));
        }

        try {
            const headers = this.getAuthHeaders();
            const params = new HttpParams().set('researchLayerId', researchLayerId);

            return this.http.get<Variable[]>(`${this.API_VARIABLES}/ResearchLayerId`, { headers, params }).pipe(
                catchError(error => this.handleHttpError(error, 'Failed to fetch variables for layer'))
            );
        } catch (error) {
            return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
        }
    }


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


    // Método para obtener registros por paciente (manteniendo compatibilidad)
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

    getRegisterHistory(
    researchLayerId: string,
    userEmail: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'changedAt', // Cambié de 'registerDate' a 'changedAt' según tu response
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
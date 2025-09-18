import { Injectable } from '@angular/core';
import { formatDate } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject, of } from 'rxjs';
import { catchError, tap, map, switchMap, timeout } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { ResearchLayer, Variable, Register, RegisterResponse2 } from '../modules/consola-registro/interfaces';
import { environment } from '../environments/environment';

// Interfaces para diferentes estructuras de respuesta
interface PaginatedDataResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

interface PaginatedRegistersResponse<T> {
  registers: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

// Mantén la interfaz original para compatibilidad
interface PaginatedResponse<T> extends PaginatedDataResponse<T> { }

interface ErrorWithCode extends Error {
  code: string;
  originalError?: any;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConsolaRegistroService {
  //#region Constantes de URL
  private readonly API_REGISTERS = `${environment.backendUrl}${environment.endpoints.registers}`;
  private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;
  private readonly API_LAYERS = `${environment.backendUrl}${environment.endpoints.researchLayer}`;
  private readonly API_VARIABLES = `${environment.backendUrl}${environment.endpoints.variables}`;
  //#endregion

  //#region Subjects y Observables
  private dataUpdated = new Subject<void>();
  private dataChanged = new Subject<void>();
  //#endregion

  constructor(private http: HttpClient, private authService: AuthService) { }

  //#region Métodos Públicos
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  dataChanged$ = this.dataChanged.asObservable();

  notifyDataChanged(): void {
    this.dataChanged.next();
  }
  //#endregion

  //#region Métodos de Autenticación y Autorización
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

  private isDoctor(): boolean {
    try {
      const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      return userRoles.includes('Doctor_client_role');
    } catch (error) {
      console.error('Error parsing user roles:', error);
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('kc_token');
  }
  //#endregion

  verifyLayerPermission(layerId: string): Observable<boolean> {
    return this.obtenerCapaPorId(layerId).pipe(
      map(capa => !!capa?.id),
      catchError(error => {
        console.error('Error verificando permiso:', error);
        return of(false);
      }),
      timeout(5000)
    );
  }

  //#region Métodos de Usuarios
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
  //#endregion

  //#region Métodos de Registros
  registrarRegistro(registerData: any, userEmail: string): Observable<any> {
    if (!this.isDoctor()) {
      return throwError(() => this.createError(
        'Solo los doctores pueden crear registros',
        'PERMISSION_DENIED',
        null,
        403
      ));
    }

    if (!userEmail || !registerData) {
      return throwError(() => this.createError(
        userEmail ? 'Register data is required' : 'User email is required',
        'VALIDATION_ERROR'
      ));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('userEmail', userEmail);

      return this.http.post(this.API_REGISTERS, registerData, { headers, params }).pipe(
        tap(() => console.log('Register created successfully')),
        catchError(error => this.handleHttpError(error, 'Failed to create register'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerRegistros(
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/all`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerRegistrosPorPaciente(
    patientIdentificationNumber: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<PaginatedDataResponse<Register>> {
    if (!patientIdentificationNumber) {
      return throwError(() => this.createError('Patient identification number is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('patientIdentificationNumber', patientIdentificationNumber.toString())
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<PaginatedDataResponse<Register>>(`${this.API_REGISTERS}/allByPatient`, { headers, params }).pipe(
        map(response => ({
          data: response.data || [],
          currentPage: response.currentPage || 0,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0
        })),
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers by patient'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREparation_ERROR', error));
    }
  }

  obtenerRegistroMasRecientePorPaciente(patientIdentificationNumber: number): Observable<Register> {
    if (!patientIdentificationNumber) {
      return throwError(() => this.createError('Patient identification number is required', 'VALIDATION_ERROR'));
    }

    return this.obtenerRegistrosPorPaciente(patientIdentificationNumber, 0, 1, 'registerDate', 'DESC').pipe(
      map(response => {
        if (!response.data || response.data.length === 0) {
          throw this.createError('Patient not found', 'NOT_FOUND_ERROR');
        }
        return response.data[0];
      }),
      catchError(error => this.handleHttpError(error, 'Failed to fetch latest patient register'))
    );
  }

  obtenerRegistrosPorCapa(
    researchLayerId: string,
    userEmail: string,
    patientIdentificationNumber?: number,
    page: number = 0,
    size: number = 10,
    sort?: string,
    sortDirection?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('researchLayerId', researchLayerId)
      .set('userEmail', userEmail)
      .set('page', page.toString())
      .set('size', size.toString());

    // Agregar filtro por paciente si se proporciona
    if (patientIdentificationNumber !== undefined && patientIdentificationNumber !== null) {
      params = params.set('patientIdentificationNumber', patientIdentificationNumber.toString());
    }

    // Agregar parámetros de ordenamiento si se proporcionan
    if (sort) {
      params = params.set('sort', sort);
    }

    if (sortDirection) {
      params = params.set('sortDirection', sortDirection);
    }

    console.log('Llamando a endpoint con params:', params.toString());

    return this.http.get<any>(`${this.API_REGISTERS}/allResearchLayerRegisters`, { params });
  }

  obtenerRegistrosCuidadoresPorPaciente(
    patientIdentificationNumber: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<PaginatedRegistersResponse<Register>> {
    if (!patientIdentificationNumber) {
      return throwError(() => this.createError('Patient identification number is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('patientIdentificationNumber', patientIdentificationNumber.toString())
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<PaginatedRegistersResponse<Register>>(`${this.API_REGISTERS}/allCarevigerRegisters`, { headers, params }).pipe(
        map(response => ({
          registers: response.registers || [],
          currentPage: response.currentPage || 0,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0
        })),
        catchError(error => this.handleHttpError(error, 'Failed to fetch caregiver registers'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerInformacionBasicaPaciente(
    patientIdentificationNumber: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<PaginatedRegistersResponse<Register>> {
    if (!patientIdentificationNumber) {
      return throwError(() => this.createError('Patient identification number is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('patientIdentificationNumber', patientIdentificationNumber.toString())
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<PaginatedRegistersResponse<Register>>(`${this.API_REGISTERS}/allPatientBasicInfoRegisters`, { headers, params }).pipe(
        map(response => ({
          registers: response.registers || [],
          currentPage: response.currentPage || 0,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0
        })),
        catchError(error => this.handleHttpError(error, 'Failed to fetch patient basic info registers'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerRegistroActualPorPaciente(
    patientIdentificationNumber: number,
    researchLayerId: string
  ): Observable<RegisterResponse2> {
    if (!patientIdentificationNumber || !researchLayerId) {
      return throwError(() => this.createError(
        patientIdentificationNumber ? 'Research layer ID is required' : 'Patient identification number is required',
        'VALIDATION_ERROR'
      ));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('patientIdentificationNumber', patientIdentificationNumber.toString())
        .set('researchLayerId', researchLayerId);

      return this.http.get<RegisterResponse2>(`${this.API_REGISTERS}/actualRegisterByPatient`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch actual patient register'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  actualizarRegistro(registerId: string, userEmail: string, data: any): Observable<any> {
    if (!registerId || !userEmail) {
      return throwError(() => new Error(
        registerId ? 'Email de usuario es requerido' : 'ID de registro es requerido'
      ));
    }

    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('registerId', registerId)
      .set('userEmail', userEmail);

    return this.http.put(`${this.API_REGISTERS}`, data, { headers, params }).pipe(
      catchError(error => {
        console.error('Error al actualizar registro:', error);
        return throwError(() => error);
      })
    );
  }

  deleteRegistro(registerId: string): Observable<any> {
    if (!registerId) {
      return throwError(() => this.createError('Register ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('registerId', registerId);

      return this.http.delete<any>(this.API_REGISTERS, { headers, params }).pipe(
        tap(() => console.log(`Registro eliminado: ${registerId}`)),
        catchError(error => this.handleHttpError(error, 'Failed to delete register'))
      );
    } catch (error) {
      return throwError(() =>
        this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error)
      );
    }
  }
  //#endregion

  //#region Métodos de Capas de Investigación
  obtenerTodasLasCapas(): Observable<ResearchLayer[]> {
    try {
      const headers = this.getAuthHeaders();
      return this.http.get<ResearchLayer[]>(`${this.API_LAYERS}/GetAll`, { headers }).pipe(
        tap(response => console.log('All layers fetched:', response)),
        catchError(error => this.handleHttpError(error, 'Failed to fetch all research layers'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  buscarCapaPorNombre(nombreCapa: string): Observable<ResearchLayer> {
    if (!nombreCapa) {
      return throwError(() => this.createError('Layer name is required', 'VALIDATION_ERROR'));
    }

    return this.obtenerTodasLasCapas().pipe(
      map(capas => {
        const capaEncontrada = capas.find(c =>
          c.layerName.toLowerCase() === nombreCapa.toLowerCase()
        );

        if (!capaEncontrada) {
          throw this.createError(`Layer not found: ${nombreCapa}`, 'NOT_FOUND_ERROR');
        }
        return capaEncontrada;
      }),
      catchError(error => {
        if (error.code === 'NOT_FOUND_ERROR') {
          return throwError(() => error);
        }
        return throwError(() => this.createError('Failed to search layer', 'SEARCH_ERROR', error));
      })
    );
  }

  obtenerCapaCompleta(nombreCapa: string): Observable<ResearchLayer> {
    return this.buscarCapaPorNombre(nombreCapa).pipe(
      switchMap(capa => {
        return this.obtenerDetallesCapa(capa.id).pipe(
          map(detalles => ({
            ...capa,
            ...detalles
          })),
          catchError(error => throwError(() =>
            this.createError('Failed to get layer details', 'DETAILS_FETCH_ERROR', error)
          ))
        );
      }),
      catchError(error => throwError(() =>
        this.createError('Failed to get complete layer', 'LAYER_FETCH_ERROR', error)
      ))
    );
  }

  obtenerCapaPorId(id: string): Observable<ResearchLayer> {
    if (!id) {
      return throwError(() => this.createError('Layer ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('id', id);

      return this.http.get<ResearchLayer>(this.API_LAYERS, { headers, params }).pipe(
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
  //#endregion

  //#region Métodos de Variables
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
  //#endregion

  //#region Métodos Privados
  private validateRegisterData(data: any): void {
    if (!data.patient) {
      throw new Error('Patient data is required');
    }
    if (!data.variablesRegister) {
      data.variablesRegister = [];
    }
  }

  private formatRegisterData(data: any): any {
    try {
      this.validateRegisterData(data);

      const formattedData = { ...data };

      // Format dates
      if (formattedData.patient?.birthDate) {
        formattedData.patient.birthDate = this.formatDateToBackend(data.patient.birthDate);
      }
      if (formattedData.patient?.deathDate) {
        formattedData.patient.deathDate = this.formatDateToBackend(data.patient.deathDate);
      }

      return formattedData;
    } catch (error) {
      console.error('Error formatting register data:', error);
      throw this.createError('Failed to format register data', 'DATA_FORMAT_ERROR', error);
    }
  }

  private formatDateToBackend(dateString: string | null | undefined): string | null {
    if (!dateString) return null;

    try {
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-');
        return `${year}-${month}-${day}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      return formatDate(date, 'yyyy-MM-dd', 'en-US');
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateString;
    }
  }

  private obtenerDetallesCapa(id: string): Observable<ResearchLayer> {
    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('id', id);

      return this.http.get<ResearchLayer>(this.API_LAYERS, { headers, params }).pipe(
        tap(response => console.log('Layer details fetched:', response)),
        catchError(error => {
          if (error.status === 404) {
            throw this.createError(`Layer not found with ID: ${id}`, 'NOT_FOUND_ERROR', error);
          }
          throw this.createError('Server error fetching layer', 'SERVER_ERROR', error);
        })
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
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
  //#endregion
}
/**
 * Servicio para la gestión de registros médicos, capas de investigación y variables.
 * Proporciona métodos para crear, actualizar y consultar registros médicos,
 * así como para interactuar con capas de investigación y variables asociadas.
 * 
 * @Injectable Decorador que marca la clase como disponible para inyección de dependencias.
 */
import { Injectable } from '@angular/core';
import { formatDate } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { ResearchLayer, Variable, Register } from '../modules/consola-registro/interfaces';
import { environment } from '../environments/environment';
import { timeout } from 'rxjs/operators';
import { Constants } from './constants';

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
  /**
   * Obtiene un Observable que emite cuando los datos han sido actualizados.
   * @returns Observable<void>
   */
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  /**
   * Observable que emite cuando los datos han cambiado.
   */
  dataChanged$ = this.dataChanged.asObservable();

  /**
   * Notifica a los suscriptores que los datos han cambiado.
   */
  notifyDataChanged() {
    this.dataChanged.next();
  }
  //#endregion

  //#region Métodos de Autenticación y Autorización
  /**
   * Obtiene los headers de autenticación con el token JWT.
   * @returns HttpHeaders Headers con el token de autenticación.
   * @throws Error Si no hay token disponible.
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
   * Verifica si el usuario actual tiene rol de doctor.
   * @returns boolean True si el usuario es doctor, false en caso contrario.
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

  /**
   * Obtiene el token almacenado en localStorage.
   * @returns string | null Token JWT o null si no existe.
   */
  getToken(): string | null {
    return localStorage.getItem('kc_token');
  }
  //#endregion

  /**
   * Verifica si el usuario tiene permiso para acceder a una capa específica.
   * @param layerId ID de la capa a verificar.
   * @returns Observable<boolean> True si tiene permiso, false en caso contrario.
   */
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
  /**
   * Obtiene información del usuario autenticado.
   * @param email Email del usuario.
   * @param headers Headers HTTP opcionales.
   * @returns Observable<any> Información del usuario.
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
  //#endregion

  //#region Métodos de Registros
  /**
   * Registra un nuevo registro médico.
   * @param registerData Datos del registro.
   * @param userEmail Email del usuario que realiza el registro.
   * @returns Observable<any> Respuesta del servidor.
   */
  registrarRegistro(registerData: any, userEmail: string): Observable<any> {
    if (!this.isDoctor()) {
      return throwError(() => this.createError(
        'Solo los doctores pueden crear registros',
        'PERMISSION_DENIED',
        null,
        403
      ));
    }

    if (!userEmail) {
      return throwError(() => this.createError('User email is required', 'VALIDATION_ERROR'));
    }

    if (!registerData) {
      return throwError(() => this.createError('Register data is required', 'VALIDATION_ERROR'));
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

  /**
   * Obtiene todos los registros médicos paginados.
   * @param page Número de página (0-based).
   * @param size Tamaño de la página.
   * @param sort Campo por el que ordenar.
   * @param sortDirection Dirección de ordenación (ASC/DESC).
   * @returns Observable<any> Lista de registros paginados.
   */
  obtenerRegistros(
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    try {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/all`, { params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  /**
   * Obtiene registros médicos por profesional de la salud.
   * @param healthProfessionalId ID del profesional de la salud.
   * @param page Número de página (0-based).
   * @param size Tamaño de la página.
   * @param sort Campo por el que ordenar.
   * @param sortDirection Dirección de ordenación (ASC/DESC).
   * @returns Observable<any> Lista de registros paginados.
   */
  obtenerRegistrosPorProfesional(
    healthProfessionalId: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    if (!healthProfessionalId) {
      return throwError(() => this.createError('Health professional ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('healthProfesionalIdentificationNumber', healthProfessionalId.toString())
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/allByHealtProfessional`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers by professional'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  /**
   * Obtiene registros médicos por paciente.
   * @param patientIdentificationNumber Número de identificación del paciente.
   * @param page Número de página (0-based).
   * @param size Tamaño de la página.
   * @param sort Campo por el que ordenar.
   * @param sortDirection Dirección de ordenación (ASC/DESC).
   * @returns Observable<any> Lista de registros paginados.
   */
  obtenerRegistrosPorPaciente(
    patientIdentificationNumber: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
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

      return this.http.get<any>(`${this.API_REGISTERS}/allByPatient`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers by patient'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  /**
   * Obtiene el registro más reciente de un paciente.
   * @param patientIdentificationNumber Número de identificación del paciente.
   * @returns Observable<Register> Registro más reciente del paciente.
   */
  obtenerRegistroMasRecientePorPaciente(patientIdentificationNumber: number): Observable<Register> {
    if (!patientIdentificationNumber) {
      return throwError(() => this.createError('Patient identification number is required', 'VALIDATION_ERROR'));
    }

    return this.obtenerRegistrosPorPaciente(patientIdentificationNumber, 0, 1, 'registerDate', 'DESC').pipe(
      map(response => {
        if (!response.registers || response.registers.length === 0) {
          throw this.createError('Patient not found', 'NOT_FOUND_ERROR');
        }
        return response.registers[0];
      }),
      catchError(error => this.handleHttpError(error, 'Failed to fetch latest patient register'))
    );
  }

  /**
   * Obtiene registros médicos por capa de investigación.
   * @param researchLayerId ID de la capa de investigación.
   * @param page Número de página (0-based).
   * @param size Tamaño de la página.
   * @param sort Campo por el que ordenar.
   * @param sortDirection Dirección de ordenación (ASC/DESC).
   * @returns Observable con registros paginados.
   */
  obtenerRegistrosPorCapa(
    researchLayerId: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<{ registers: Register[], currentPage: number, totalPages: number, totalElements: number }> {
    if (!researchLayerId) {
      return throwError(() => this.createError('Research layer ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('researchLayerId', researchLayerId)
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/allByResearchLayer`, { headers, params }).pipe(
        tap(response => console.log('API Response:', response)),
        map(response => {
          if (!response) {
            throw this.createError('Empty response from server', 'EMPTY_RESPONSE');
          }
          return {
            registers: response.registers || [],
            currentPage: response.currentPage || 0,
            totalPages: response.totalPages || 0,
            totalElements: response.totalElements || 0
          };
        }),
        catchError(error => {
          console.error('Detailed API Error:', {
            url: error.url,
            status: error.status,
            error: error.error,
            message: error.message
          });
          return this.handleHttpError(error, 'Failed to fetch registers by research layer');
        })
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  /**
   * Actualiza un registro existente.
   * @param registerId ID del registro a actualizar.
   * @param userEmail Email del usuario que realiza la actualización.
   * @param data Datos actualizados del registro.
   * @returns Observable<any> Respuesta del servidor.
   */
  actualizarRegistro(registerId: string, userEmail: string, data: {
    variables: Array<{
      id: string;
      variableName: string;
      value: any;
      type: string;
      researchLayerId: string;
      researchLayerName?: string;
    }>;
    patientIdentificationNumber: number;
    patientIdentificationType: string;
    patient: {
      name: string;
      sex: string;
      birthDate: string;
      age: number;
      email: string;
      phoneNumber: string;
      deathDate?: string;
      economicStatus: string;
      educationLevel: string;
      maritalStatus: string;
      hometown: string;
      currentCity: string;
    };
    caregiver?: {
      name: string;
      identificationType: string;
      identificationNumber: number;
      age: number;
      educationLevel: string;
      occupation: string;
    };
    healthProfessional?: {
      id: string;
      name: string;
      identificationNumber: number;
    };
  }): Observable<any> {
    if (!registerId) {
      return throwError(() => new Error('ID de registro es requerido'));
    }

    if (!userEmail) {
      return throwError(() => new Error('Email de usuario es requerido'));
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
  //#endregion

  //#region Métodos de Capas de Investigación
  /**
   * Obtiene todas las capas de investigación.
   * @returns Observable<ResearchLayer[]> Lista de capas de investigación.
   */
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

  /**
   * Busca una capa de investigación por nombre.
   * @param nombreCapa Nombre de la capa a buscar.
   * @returns Observable<ResearchLayer> Capa encontrada.
   */
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

  /**
   * Obtiene una capa de investigación completa con sus detalles.
   * @param nombreCapa Nombre de la capa.
   * @returns Observable<ResearchLayer> Capa con todos sus detalles.
   */
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

  /**
   * Obtiene una capa de investigación por su ID.
   * @param id ID de la capa.
   * @returns Observable<ResearchLayer> Capa encontrada.
   */
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
  /**
   * Obtiene variables asociadas a una capa de investigación.
   * @param researchLayerId ID de la capa de investigación.
   * @returns Observable<Variable[]> Lista de variables.
   */
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
  /**
   * Valida los datos de un registro médico.
   * @param data Datos del registro a validar.
   * @throws Error Si los datos no son válidos.
   */
  private validateRegisterData(data: any): void {
    if (!data.patient) {
      throw new Error('Patient data is required');
    }
    if (!data.variablesRegister) {
      data.variablesRegister = [];
    }
  }

  /**
   * Formatea los datos de un registro para enviarlos al backend.
   * @param data Datos del registro.
   * @returns any Datos formateados.
   * @throws ErrorWithCode Si hay error en el formato.
   */
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

  /**
   * Formatea una fecha al formato esperado por el backend.
   * @param dateString Fecha a formatear.
   * @returns string | null Fecha formateada o null si no hay fecha.
   */
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

  /**
   * Obtiene detalles adicionales de una capa de investigación.
   * @param id ID de la capa.
   * @returns Observable<ResearchLayer> Detalles de la capa.
   */
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

  /**
   * Obtiene IDs de capas de investigación asociadas a un profesional de la salud.
   * @param healthProfessionalId ID del profesional de la salud.
   * @returns Observable<string[]> Lista de IDs de capas.
   */
  obtenerResearchLayerIdsPorProfesional(healthProfessionalId: number): Observable<string[]> {
    if (!healthProfessionalId) {
      return throwError(() => this.createError('Health professional ID is required', 'VALIDATION_ERROR'));
    }

    return this.obtenerRegistrosPorProfesional(healthProfessionalId, 0, 100, 'registerDate', 'DESC').pipe(
      map(response => {
        try {
          const registros: Register[] = response.registers || [];
          const layerIds = new Set<string>();

          registros.forEach((reg: Register) => {
            reg.variablesRegister.forEach((variable: { researchLayerId?: string }) => {
              if (variable.researchLayerId) {
                layerIds.add(variable.researchLayerId);
              }
            });
          });

          return Array.from(layerIds);
        } catch (error) {
          throw this.createError('Failed to process research layer IDs', 'PROCESSING_ERROR', error);
        }
      }),
      catchError(error => throwError(() =>
        this.createError('Failed to fetch research layers for professional', 'FETCH_ERROR', error)
      ))
    );
  }

  /**
   * Maneja errores HTTP de manera consistente.
   * @param error Error HTTP.
   * @param defaultMessage Mensaje por defecto.
   * @returns Observable<never> Observable que emite el error.
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
   * Crea un objeto de error con código y estado adicionales.
   * @param message Mensaje de error.
   * @param code Código de error personalizado.
   * @param originalError Error original (opcional).
   * @param status Estado HTTP (opcional).
   * @returns ErrorWithCode Error con metadatos adicionales.
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
  //#endregion
}

/**
 * Interfaz que extiende Error con metadatos adicionales.
 */
interface ErrorWithCode extends Error {
  code: string;
  originalError?: any;
  status?: number;
}
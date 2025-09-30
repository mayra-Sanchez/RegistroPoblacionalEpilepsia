import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { Register, ResearchLayer } from '../modules/consola-registro/interfaces';
import { environment } from '../environments/environment';

// ============================
// INTERFACES DEL SERVICIO
// ============================

/**
 * Interfaz para variables de investigación
 */
export interface ResearchVariable {
  id: string;
  name: string;
  type: string;
  valueAsString: string | null;
  valueAsNumber: number | null;
}

/**
 * Interfaz para grupos de capas de investigación en el historial
 */
export interface ResearchLayerGroupHistory {
  researchLayerId: string;
  researchLayerName: string;
  variables: ResearchVariable[];
}

/**
 * Interfaz para el historial de capas de investigación
 * Incluye información del paciente y operaciones realizadas
 */
export interface ResearchLayerHistory {
  id: string;
  registerId: string;
  changedBy: string;
  changedAt: string;
  operation: string;
  patientIdentificationNumber: number;
  isResearchLayerGroup: ResearchLayerGroupHistory;
  patientBasicInfo?: {
    sex?: string;
    educationLevel?: string;
    economicStatus?: string;
    maritalStatus?: string;
    crisisStatus?: string;
    currentCity?: string;
    hometown?: string;
    caregiver?: boolean;
  };
}

/**
 * Interfaz para la respuesta paginada de registros
 */
export interface PaginatedRegistersResponse {
  registers: Register[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

/**
 * Interfaz para la respuesta paginada del historial
 */
export interface PaginatedHistoryResponse {
  data: ResearchLayerHistory[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

/**
 * Servicio para manejar operaciones relacionadas con registros médicos e investigación
 * 
 * Este servicio proporciona métodos para:
 * - Obtener registros por capa de investigación
 * - Gestionar el historial de cambios
 * - Obtener información de capas de investigación
 * - Manejar registros actuales de pacientes
 * 
 * @example
 * // Uso en un componente
 * constructor(private investigadorService: ConsolaInvestigadorService) {}
 * 
 * // Obtener registros por capa
 * this.investigadorService.obtenerRegistrosPorCapa('layer-id', 0, 10).subscribe(...);
 * 
 * // Obtener historial de capa
 * this.investigadorService.obtenerHistorialCapaInvestigacion('layer-id', 'user@email.com').subscribe(...);
 */
@Injectable({
  providedIn: 'root'
})
export class ConsolaInvestigadorService {

  // ============================
  // CONSTANTES Y CONFIGURACIÓN
  // ============================

  /** URL base para endpoints de registros */
  private readonly API_URL = `${environment.backendUrl}${environment.endpoints.registers}`;

  /** URL base para endpoints de capas de investigación */
  private readonly API_RESEARCH_LAYER_URL = `${environment.backendUrl}${environment.endpoints.researchLayer}`;

  /** Subject para notificar actualizaciones de datos */
  private dataUpdated = new Subject<void>();

  /** Subject para notificar cambios de datos */
  private dataChanged = new Subject<void>();

  // ============================
  // CONSTRUCTOR
  // ============================

  /**
   * Constructor del servicio
   * @param http Cliente HTTP para realizar peticiones
   * @param authService Servicio de autenticación
   */
  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) { }

  // ============================
  // MÉTODOS PÚBLICOS - OBSERVABLES DE ESTADO
  // ============================

  /**
   * Obtiene un observable para escuchar actualizaciones de datos
   * @returns Observable que emite cuando los datos son actualizados
   */
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  /**
   * Observable público para escuchar cambios de datos
   */
  dataChanged$ = this.dataChanged.asObservable();

  /**
   * Notifica a los suscriptores que los datos han cambiado
   */
  notifyDataChanged(): void {
    this.dataChanged.next();
  }

  // ============================
  // MÉTODOS PÚBLICOS - OPERACIONES PRINCIPALES
  // ============================

  /**
   * Obtiene registros filtrados por capa de investigación con paginación
   * 
   * @param researchLayerId - ID de la capa de investigación
   * @param page - Página actual (por defecto: 0)
   * @param size - Tamaño de la página (por defecto: 10)
   * @param sort - Campo para ordenar (por defecto: 'registerDate')
   * @param sortDirection - Dirección del orden (por defecto: 'DESC')
   * @returns Observable con la respuesta paginada de registros
   * 
   * @example
   * obtenerRegistrosPorCapa('12345', 0, 10, 'registerDate', 'DESC')
   *   .subscribe(response => {
   *     console.log('Registros:', response.registers);
   *     console.log('Página actual:', response.currentPage);
   *     console.log('Total de páginas:', response.totalPages);
   *   });
   */
  obtenerRegistrosPorCapa(
    researchLayerId: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<PaginatedRegistersResponse> {
    const headers = this.getAuthHeaders();

    const params = new HttpParams()
      .set('researchLayerId', researchLayerId)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<PaginatedRegistersResponse>(
      `${this.API_URL}/allByResearchLayer`, 
      { headers, params }
    ).pipe(
      tap(response => console.log('✅ Registros por capa obtenidos exitosamente:', response)),
      catchError(error => this.handleHttpError(error, 'Error al cargar registros por capa'))
    );
  }

  /**
   * Obtiene una capa de investigación por su ID
   * 
   * @param id - ID de la capa de investigación
   * @returns Observable con la información de la capa
   * 
   * @example
   * obtenerCapaPorId('12345').subscribe(capa => {
   *   console.log('Capa obtenida:', capa.layerName);
   * });
   */
  obtenerCapaPorId(id: string): Observable<ResearchLayer> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id);

    return this.http.get<ResearchLayer>(this.API_RESEARCH_LAYER_URL, {
      headers,
      params
    }).pipe(
      tap((capa) => {
        console.log('✅ Capa obtenida y almacenada en localStorage:', capa.layerName);
        localStorage.setItem('capaInvestigacion', JSON.stringify(capa));
      }),
      catchError(error => this.handleHttpError(error, 'Error al obtener capa por ID'))
    );
  }

  /**
   * Obtiene el historial de cambios de una capa de investigación
   * 
   * @param researchLayerId - ID de la capa de investigación
   * @param userEmail - Email del usuario autenticado
   * @param page - Página actual (por defecto: 0)
   * @param size - Tamaño de la página (por defecto: 10)
   * @param sort - Campo para ordenar (por defecto: 'changedAt')
   * @param sortDirection - Dirección del orden (por defecto: 'DESC')
   * @returns Observable con la respuesta paginada del historial
   * 
   * @example
   * obtenerHistorialCapaInvestigacion('12345', 'investigador@email.com')
   *   .subscribe(historial => {
   *     console.log('Historial:', historial.data);
   *     console.log('Total de elementos:', historial.totalElements);
   *   });
   */
  obtenerHistorialCapaInvestigacion(
    researchLayerId: string,
    userEmail: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'changedAt',
    sortDirection: string = 'DESC'
  ): Observable<PaginatedHistoryResponse> {
    // Validación de parámetros requeridos
    if (!researchLayerId || !userEmail) {
      return throwError(() => this.createError(
        'researchLayerId y userEmail son requeridos', 
        'VALIDATION_ERROR'
      ));
    }

    const headers = this.getAuthHeaders();

    const params = new HttpParams()
      .set('researchLayerId', researchLayerId)
      .set('userEmail', userEmail)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<PaginatedHistoryResponse>(
      `${this.API_URL}/allResearchLayerHistoryById`, 
      { headers, params }
    ).pipe(
      tap(response => console.log('✅ Historial de capa obtenido exitosamente:', response)),
      catchError(error => this.handleHttpError(error, 'Error al obtener historial de capa'))
    );
  }

  /**
   * Obtiene el registro actual de un paciente en una capa específica
   * 
   * @param patientIdentificationNumber - Número de identificación del paciente
   * @param researchLayerId - ID de la capa de investigación
   * @returns Observable con el registro actual del paciente
   * 
   * @example
   * obtenerRegistroActual(12345678, 'capaid-123').subscribe(registro => {
   *   console.log('Registro actual:', registro);
   * });
   */
  obtenerRegistroActual(
    patientIdentificationNumber: number, 
    researchLayerId: string
  ): Observable<Register> {
    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('patientIdentificationNumber', patientIdentificationNumber.toString())
        .set('researchLayerId', researchLayerId);

      return this.http.get<Register>(
        `${this.API_URL}/actualRegisterByPatient`, 
        { headers, params }
      ).pipe(
        tap(registro => console.log('✅ Registro actual obtenido:', registro.registerId)),
        catchError(error => this.handleHttpError(error, 'Error al obtener registro actual del paciente'))
      );
    } catch (error) {
      return throwError(() => this.createError(
        'Error al preparar solicitud de registro actual', 
        'REQUEST_PREPARATION_ERROR', 
        error
      ));
    }
  }

  // ============================
  // MÉTODOS PRIVADOS - UTILIDADES
  // ============================

  /**
   * Genera los headers de autenticación para las peticiones HTTP
   * @returns HttpHeaders con el token de autenticación
   * 
   * @private
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Verifica si el usuario actual tiene rol de Doctor
   * @returns true si el usuario tiene rol de Doctor
   * 
   * @private
   */
  private isDoctor(): boolean {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    return userRoles.includes('Doctor_client_role');
  }

  // ============================
  // MÉTODOS PRIVADOS - MANEJO DE ERRORES
  // ============================

  /**
   * Maneja errores HTTP de manera centralizada
   * 
   * @param error - Error capturado
   * @param operation - Descripción de la operación que falló
   * @returns Observable que emite el error procesado
   * 
   * @private
   */
  private handleHttpError(error: any, operation: string): Observable<never> {
    console.error(`❌ ${operation}:`, error);

    // Manejo de errores de autenticación/autorización
    if (error.status === 401 || error.status === 403) {
      console.warn('🔐 Error de autenticación/autorización, cerrando sesión...');
      this.authService.logout();
      return throwError(() => this.createError(
        'No tiene permisos para realizar esta acción', 
        'AUTH_ERROR'
      ));
    }

    // Manejo de errores de conexión
    if (error.status === 0) {
      return throwError(() => this.createError(
        'Error de conexión con el servidor. Verifique su conexión a internet.', 
        'NETWORK_ERROR'
      ));
    }

    // Manejo de errores de servidor
    if (error.status >= 500) {
      return throwError(() => this.createError(
        'Error del servidor interno. Por favor, intente más tarde.', 
        'SERVER_ERROR'
      ));
    }

    // Manejo de errores de cliente (4xx)
    const errorMsg = error.error?.message || error.message || 'Error desconocido';
    return throwError(() => this.createError(errorMsg, 'CLIENT_ERROR', error));
  }

  /**
   * Crea un error estructurado con información adicional
   * 
   * @param message - Mensaje de error descriptivo
   * @param code - Código de error identificativo
   * @param originalError - Error original (opcional)
   * @returns Error estructurado
   * 
   * @private
   */
  private createError(message: string, code: string, originalError?: any): Error {
    const error = new Error(message) as any;
    error.code = code;
    error.originalError = originalError;
    error.timestamp = new Date().toISOString();
    
    console.error(`🔧 Error estructurado [${code}]:`, {
      message,
      code,
      timestamp: error.timestamp,
      originalError: originalError?.message || 'N/A'
    });
    
    return error;
  }

  /**
   * Método alternativo para manejo de errores (mantenido por compatibilidad)
   * 
   * @param operation - Descripción de la operación
   * @param error - Error capturado
   * @returns Observable que emite el error procesado
   * 
   * @private
   * @deprecated Use handleHttpError en su lugar
   */
  private handleError(operation: string, error: any): Observable<never> {
    console.warn(`⚠️ handleError está deprecado, use handleHttpError en su lugar para: ${operation}`);
    return this.handleHttpError(error, operation);
  }
}
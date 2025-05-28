import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/login/services/auth.service';
import { ResearchLayer, Variable, Register } from '../interfaces';

/**
 * Servicio para manejar operaciones relacionadas con registros médicos
 * 
 * Este servicio proporciona métodos para:
 * - Obtener y gestionar registros de pacientes
 * - Interactuar con capas de investigación
 * - Manejar variables de investigación
 * - Realizar operaciones CRUD sobre registros médicos
 * 
 * @example
 * constructor(private consolaService: ConsolaRegistroService) {}
 */
@Injectable({
  providedIn: 'root'
})
export class ConsolaRegistroService {
  //#region Constantes de URL

  /**
   * URL base para operaciones con registros
   * @type {string}
   */
  private readonly API_URL = 'http://localhost:8080/api/v1/registers';

  /**
   * URL base para operaciones con usuarios
   * @type {string}
   */
  private readonly API_USERS_URL = 'http://localhost:8080/api/v1/users';

  /**
   * URL base para operaciones con variables
   * @type {string}
   */
  private readonly API_VARIABLE_URL = 'http://localhost:8080/api/v1/Variable';

  /**
   * URL base para operaciones con capas de investigación
   * @type {string}
   */
  private readonly API_RESEARCH_LAYER_URL = 'http://localhost:8080/api/v1/ResearchLayer';

  //#endregion

  //#region Subjects y Observables

  /**
   * Subject para notificar actualizaciones de datos
   * @private
   * @type {Subject<void>}
   */
  private dataUpdated = new Subject<void>();

  /**
   * Subject para notificar cambios en los datos
   * @private
   * @type {Subject<void>}
   */
  private dataChanged = new Subject<void>();

  //#endregion

  //#region Constructor

  /**
   * Constructor del servicio
   * @param {HttpClient} http Cliente HTTP de Angular
   * @param {AuthService} authService Servicio de autenticación
   */
  constructor(private http: HttpClient, private authService: AuthService) { }

  //#endregion

  //#region Métodos Públicos

  /**
   * Obtiene un observable para escuchar actualizaciones de datos
   * @returns {Observable<void>} Observable que emite cuando hay actualizaciones
   */
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  /**
   * Observable público para que otros componentes se suscriban a cambios de datos
   * @type {Observable<void>}
   */
  dataChanged$ = this.dataChanged.asObservable();

  /**
   * Notifica a los suscriptores que los datos han cambiado
   */
  notifyDataChanged() {
    this.dataChanged.next();
  }

  //#endregion

  //#region Métodos de Autenticación y Autorización

  /**
   * Obtiene los headers de autenticación
   * @private
   * @returns {HttpHeaders} Headers con el token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Verifica si el usuario actual tiene rol de doctor
   * @private
   * @returns {boolean} True si el usuario es doctor
   */
  private isDoctor(): boolean {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    return userRoles.includes('Doctor_client_role');
  }

  //#endregion

  //#region Métodos de Usuarios

  /**
   * Obtiene información del usuario autenticado
   * @param {string} email Email del usuario a buscar
   * @returns {Observable<any>} Observable con los datos del usuario
   */
  obtenerUsuarioAutenticado(email: string): Observable<any> {
    const token = this.authService.getToken();

    if (!token) {
      console.error('⚠️ No hay token disponible, abortando solicitud.');
      return throwError(() => new Error('No hay token disponible.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams().set('email', email);

    return this.http.get<any>(`${this.API_USERS_URL}`, {
      headers: headers,
      params: params
    }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener usuario:', error);
        return throwError(() => new Error(error.error?.message || 'Ocurrió un error al obtener el usuario.'));
      })
    );
  }

  //#endregion

  //#region Métodos de Registros

  /**
   * Registra un nuevo registro médico
   * @param {any} registerData Datos del registro a crear
   * @param {string} userEmail Email del usuario que realiza el registro
   * @returns {Observable<any>} Observable con la respuesta del servidor
   */
  registrarRegistro(registerData: any, userEmail: string): Observable<any> {
    if (!userEmail) {
      return throwError(() => new Error('Email del usuario es requerido'));
    }

    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('userEmail', userEmail);

    return this.http.post(this.API_URL, registerData, {
      headers,
      params
    }).pipe(
      catchError(error => {
        console.error('Error en el registro:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene todos los registros paginados
   * @param {number} [page=0] Número de página
   * @param {number} [size=10] Tamaño de la página
   * @param {string} [sort='registerDate'] Campo para ordenar
   * @param {string} [sortDirection='DESC'] Dirección de ordenamiento
   * @returns {Observable<any>} Observable con los registros paginados
   */
  obtenerRegistros(
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<any>(`${this.API_URL}/all`, { params })
      .pipe(
        catchError(error => {
          console.error('Error en obtenerRegistros:', error);
          return throwError(() => new Error('Error al cargar registros'));
        })
      );
  }

  /**
   * Obtiene registros filtrados por profesional de salud
   * @param {number} healthProfessionalId ID del profesional
   * @param {number} [page=0] Número de página
   * @param {number} [size=10] Tamaño de la página
   * @param {string} [sort='registerDate'] Campo para ordenar
   * @param {string} [sortDirection='DESC'] Dirección de ordenamiento
   * @returns {Observable<any>} Observable con los registros paginados
   */
  obtenerRegistrosPorProfesional(
    healthProfessionalId: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    const headers = this.getAuthHeaders();

    const params = new HttpParams()
      .set('healthProfesionalIdentificationNumber', healthProfessionalId.toString())
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<any>(`${this.API_URL}/allByHealtProfessional`, { headers, params }).pipe(
      catchError(error => {
        console.error('Error al obtener registros por profesional:', error);
        return throwError(() => new Error('Error al cargar registros por profesional'));
      })
    );
  }

  /**
   * Obtiene registros filtrados por paciente
   * @param {number} patientIdentificationNumber ID del paciente
   * @param {number} [page=0] Número de página
   * @param {number} [size=10] Tamaño de la página
   * @param {string} [sort='registerDate'] Campo para ordenar
   * @param {string} [sortDirection='DESC'] Dirección de ordenamiento
   * @returns {Observable<any>} Observable con los registros paginados
   */
  obtenerRegistrosPorPaciente(
    patientIdentificationNumber: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    const headers = this.getAuthHeaders();

    const params = new HttpParams()
      .set('patientIdentificationNumber', patientIdentificationNumber.toString())
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<any>(`${this.API_URL}/allByPatient`, { headers, params }).pipe(
      catchError(error => {
        console.error('Error al obtener registros por paciente:', error);
        return throwError(() => new Error('Error al cargar registros por paciente'));
      })
    );
  }

  /**
   * Obtiene registros filtrados por capa de investigación
   * @param {string} researchLayerId ID de la capa de investigación
   * @param {number} [page=0] Número de página
   * @param {number} [size=10] Tamaño de la página
   * @param {string} [sort='registerDate'] Campo para ordenar
   * @param {string} [sortDirection='DESC'] Dirección de ordenamiento
   * @returns {Observable<{registers: Register[], currentPage: number, totalPages: number, totalElements: number}>} 
   * Observable con los registros paginados y metadatos
   */
  obtenerRegistrosPorCapa(
    researchLayerId: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<{ registers: Register[], currentPage: number, totalPages: number, totalElements: number }> {
    const headers = this.getAuthHeaders();

    console.log('Realizando petición para obtener registros por capa:', {
      researchLayerId,
      page,
      size,
      sort,
      sortDirection
    });

    const params = new HttpParams()
      .set('researchLayerId', researchLayerId)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<any>(`${this.API_URL}/allByResearchLayer`, { headers, params }).pipe(
      tap(response => console.log('Respuesta del servidor:', response)),
      catchError(error => {
        console.error('Error al obtener registros por capa:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        return throwError(() => new Error('Error al cargar registros'));
      })
    );
  }

  /**
   * Actualiza un registro existente
   * @param {string} registerId ID del registro a actualizar
   * @param {any} data Nuevos datos del registro
   * @returns {Observable<any>} Observable con la respuesta del servidor
   */
  actualizarRegistro(registerId: string, data: any): Observable<any> {
    if (!this.isDoctor()) {
      return throwError(() => new Error('⛔ Acceso denegado: solo los doctores pueden realizar esta acción.'));
    }

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      return throwError(() => new Error('⚠️ No se pudo obtener el email del usuario.'));
    }

    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('⚠️ No hay token disponible.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams()
      .set('registerId', registerId)
      .set('userEmail', userEmail);

    const formattedData = this.formatRegisterData(data);

    return this.http.put(this.API_URL, formattedData, {
      headers: headers,
      params: params
    }).pipe(
      tap(() => console.log('✅ Registro actualizado exitosamente')),
      catchError(error => {
        console.error('❌ Error al actualizar registro:', error);

        if (error.status === 401) {
          return throwError(() => new Error('🔐 Sesión expirada. Por favor inicie sesión nuevamente.'));
        } else if (error.status === 403) {
          return throwError(() => new Error('⛔ No tiene permisos para realizar esta acción.'));
        } else {
          return throwError(() => new Error(error.error?.message || 'Error desconocido al actualizar el registro.'));
        }
      })
    );
  }

  //#endregion

  //#region Métodos de Capas de Investigación

  /**
   * Obtiene todas las capas de investigación
   * @returns {Observable<ResearchLayer[]>} Observable con la lista de capas
   */
  obtenerTodasLasCapas(): Observable<ResearchLayer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ResearchLayer[]>(`${this.API_RESEARCH_LAYER_URL}/GetAll`, { headers }).pipe(
      tap(response => console.log('Todas las capas obtenidas:', response)),
      catchError(error => {
        console.error('Error al obtener todas las capas:', error);
        return throwError(() => new Error('Error al obtener la lista de capas'));
      })
    );
  }

  /**
   * Busca una capa por nombre (insensible a mayúsculas)
   * @param {string} nombreCapa Nombre de la capa a buscar
   * @returns {Observable<ResearchLayer>} Observable con los datos de la capa encontrada
   */
  buscarCapaPorNombre(nombreCapa: string): Observable<ResearchLayer> {
    return this.obtenerTodasLasCapas().pipe(
      map(capas => {
        const capaEncontrada = capas.find(c =>
          c.layerName.toLowerCase() === nombreCapa.toLowerCase()
        );

        if (!capaEncontrada) {
          throw new Error(`No se encontró la capa: ${nombreCapa}`);
        }
        return capaEncontrada;
      }),
      catchError(error => {
        console.error('Error al buscar capa:', error);
        return throwError(() => new Error(error.message || 'Error al buscar capa'));
      })
    );
  }

  /**
   * Obtiene información completa de una capa por su nombre
   * @param {string} nombreCapa Nombre de la capa
   * @returns {Observable<ResearchLayer>} Observable con los datos completos de la capa
   */
  obtenerCapaCompleta(nombreCapa: string): Observable<ResearchLayer> {
    return this.buscarCapaPorNombre(nombreCapa).pipe(
      switchMap(capa => {
        return this.obtenerDetallesCapa(capa.id).pipe(
          map(detalles => ({
            ...capa,
            ...detalles
          }))
        );
      })
    );
  }

  /**
   * Obtiene una capa por su ID
   * @param {string} id ID de la capa
   * @returns {Observable<ResearchLayer>} Observable con los datos de la capa
   */
  obtenerCapaPorId(id: string): Observable<ResearchLayer> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id);

    return this.http.get<ResearchLayer>(this.API_RESEARCH_LAYER_URL, {
      headers,
      params
    }).pipe(
      catchError(error => {
        console.error('Error al obtener capa por ID:', error);
        return throwError(() => new Error(`No se encontró la capa con ID: ${id}`));
      })
    );
  }

  //#endregion

  //#region Métodos de Variables

  /**
   * Obtiene variables asociadas a una capa de investigación
   * @param {string} researchLayerId ID de la capa de investigación
   * @returns {Observable<Variable[]>} Observable con la lista de variables
   */
  obtenerVariablesPorCapa(researchLayerId: string): Observable<Variable[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('researchLayerId', researchLayerId);

    return this.http.get<Variable[]>(`${this.API_VARIABLE_URL}/ResearchLayerId`, {
      headers,
      params
    }).pipe(
      catchError(error => {
        console.error('Error al obtener variables:', error);
        return throwError(() => new Error('Error al obtener variables de la capa'));
      })
    );
  }

  //#endregion

  //#region Métodos Privados

  /**
   * Formatea los datos de un registro para enviar al backend
   * @private
   * @param {any} data Datos del registro
   * @returns {any} Datos formateados
   */
  private formatRegisterData(data: any): any {
    const formattedData = { ...data };

    if (formattedData.patient?.birthDate) {
      formattedData.patient.birthDate = this.formatDateToBackend(data.patient.birthDate);
    }
    if (formattedData.patient?.deathDate) {
      formattedData.patient.deathDate = this.formatDateToBackend(data.patient.deathDate);
    }

    return formattedData;
  }

  /**
   * Formatea una fecha al formato dd-MM-yyyy para el backend
   * @private
   * @param {string} dateString Fecha a formatear
   * @returns {string} Fecha formateada
   */
  private formatDateToBackend(dateString: string): string {
    // Validate input
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.warn(`Invalid date format: ${dateString}. Expected YYYY-MM-DD.`);
      return dateString; // Return original string or handle as needed
    }

    // Split the date string and create a UTC date
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day)); // month is 0-based in JavaScript

    // Format as DD-MM-YYYY using UTC methods
    const formattedDay = date.getUTCDate().toString().padStart(2, '0');
    const formattedMonth = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const formattedYear = date.getUTCFullYear();
    return `${formattedDay}-${formattedMonth}-${formattedYear}`;
  }

  /**
   * Obtiene detalles adicionales de una capa por ID
   * @private
   * @param {string} id ID de la capa
   * @returns {Observable<ResearchLayer>} Observable con los detalles de la capa
   */
  private obtenerDetallesCapa(id: string): Observable<ResearchLayer> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id);

    return this.http.get<ResearchLayer>(this.API_RESEARCH_LAYER_URL, {
      headers,
      params
    }).pipe(
      tap(response => console.log('Detalles de capa obtenidos:', response)),
      catchError(error => {
        console.error('Error al obtener detalles:', error);
        if (error.status === 404) {
          return throwError(() => new Error(`No se encontró la capa con ID: ${id}`));
        }
        return throwError(() => new Error(`Error del servidor al obtener la capa: ${error.message}`));
      })
    );
  }

  //#endregion
}
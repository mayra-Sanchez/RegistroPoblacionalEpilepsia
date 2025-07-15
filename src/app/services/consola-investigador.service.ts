import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { Register, ResearchLayer } from '../modules/consola-registro/interfaces';

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
export class ConsolaInvestigadorService {

  /**
   * URL base para operaciones con registros
   * @type {string}
   */
  private readonly API_URL = 'http://localhost:8080/api/v1/registers';

  /**
 * URL base para operaciones con capas de investigación
 * @type {string}
 */
  private readonly API_RESEARCH_LAYER_URL = 'http://localhost:8080/api/v1/ResearchLayer';

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

  /**
   * Obtiene registros filtrados por capa de investigación
   * @param {string} researchLayerId ID de la capa de investigación
   * @param {number} [page=0] Número de página
   * @param {number} [size=10] Tamaño de la página
   * @param {string} [sort='registerDate'] Campo para ordenar
   * @param {string} [sortDirection='DESC'] Dirección de ordenamiento
   * @returns {Observable<{ registers: Register[], currentPage: number, totalPages: number, totalElements: number }>} 
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
* Obtiene una capa por su ID y la guarda en localStorage
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
      tap((capa) => {
        // Guardar la capa completa o solo su ID/nombre, según lo que necesites
        localStorage.setItem('capaInvestigacion', JSON.stringify(capa));
      }),
      catchError(error => {
        if (error.status === 403) {
          console.error('Acceso denegado. Verifica tus permisos o la validez de tu token.');
          this.authService.logout();
        }
        return throwError(() => new Error(`No se encontró la capa con ID: ${id}`));
      })
    );
  }


}
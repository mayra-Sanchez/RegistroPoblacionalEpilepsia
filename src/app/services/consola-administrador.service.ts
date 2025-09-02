import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

/**
 * Servicio para la consola de administración que proporciona funcionalidades para:
 * - Gestión de capas de investigación
 * - Administración de usuarios
 * - Manejo de variables
 * - Operaciones con registros
 * 
 * Este servicio se comunica con el backend a través de API REST y maneja:
 * - Autenticación y autorización
 * - Notificaciones de actualización de datos
 * - Manejo centralizado de errores
 */
@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {

  // URLs de los endpoints API
  private readonly API_LAYERS = `${environment.backendUrl}${environment.endpoints.researchLayer}`;
  private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;
  private readonly API_VARIABLES = `${environment.backendUrl}${environment.endpoints.variables}`;
  private readonly API_REGISTERS = `${environment.backendUrl}${environment.endpoints.registers}`;

  // Subjects para notificar actualizaciones
  private dataUpdated = new Subject<void>();
  private capaUpdated = new BehaviorSubject<void>(undefined);
  private varUpdated = new BehaviorSubject<void>(undefined);
  private userUpdated = new BehaviorSubject<void>(undefined);

  // Observables públicos para suscribirse a actualizaciones
  capaUpdated$ = this.capaUpdated.asObservable();
  varUpdated$ = this.varUpdated.asObservable();
  userUpdated$ = this.userUpdated.asObservable();

  /**
   * Constructor del servicio
   * @param http Cliente HTTP para realizar peticiones
   * @param authService Servicio de autenticación
   */
  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Obtiene un observable para escuchar actualizaciones de datos
   * @returns Observable que emite cuando hay actualizaciones
   */
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  /**
   * Notifica a todos los suscriptores que los datos han sido actualizados
   */
  public notifyDataUpdated(): void {
    this.dataUpdated.next();
    this.capaUpdated.next();
    this.varUpdated.next();
    this.userUpdated.next();
  }

  /**
   * Obtiene los headers de autenticación
   * @returns HttpHeaders con el token de autenticación
   * @throws Error si no hay token disponible
   * @private
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.authService.logout();
      throw new Error('Sesión expirada');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  /**
   * Maneja errores HTTP de forma centralizada
   * @param operation Nombre de la operación que falló
   * @returns Función que procesa el error
   * @private
   */
  private handleHttpError(operation: string = 'Operación'): (error: any) => Observable<never> {
    return (error: any): Observable<never> => {
      let errorMsg = `${operation} fallida.`;
      if (error.error?.message) {
        errorMsg += ` ${error.error.message}`;
      } else if (typeof error.error === 'string') {
        errorMsg += ` ${error.error}`;
      } else if (error.message) {
        errorMsg += ` ${error.message}`;
      } else {
        errorMsg += ' Error inesperado.';
      }
      return throwError(() => new Error(errorMsg));
    };
  }

  /**
   * Verifica si el usuario actual tiene privilegios de administrador
   * @returns true si el usuario es admin, false en caso contrario
   * @private
   */
  private isAdmin(): boolean {
    const token = this.authService.getToken();
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      const clientRoles = decoded.resource_access?.['registers-users-api-rest']?.roles || [];
      const realmRoles = decoded.realm_access?.roles || [];

      return clientRoles.includes('Admin_client_role') ||
        clientRoles.includes('SuperAdmin_client_role') ||
        realmRoles.includes('SuperAdmin');
    } catch (error) {
      return false;
    }
  }

  // ==================== MÉTODOS PARA CAPAS ====================

  /**
   * Obtiene todas las capas de investigación
   * @returns Observable con array de capas
   */
  getAllLayers(): Observable<any[]> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }
    return this.http.get<any[]>(`${this.API_LAYERS}/GetAll`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleHttpError('Carga de capas')));
  }

  /**
   * Obtiene una capa por su ID
   * @param id ID de la capa a buscar
   * @returns Observable con los datos de la capa
   */
  getLayerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_LAYERS}`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('id', id)
    }).pipe(
      catchError(this.handleHttpError('Consulta de capa por ID'))
    );
  }

  /**
   * Registra una nueva capa de investigación
   * @param capaData Datos de la capa a registrar
   * @returns Observable con la respuesta del servidor
   */
  registrarCapa(capaData: any): Observable<any> {
    return this.http.post<any>(this.API_LAYERS, capaData, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Registro de capa'))
      );
  }

  /**
   * Actualiza una capa existente
   * @param id ID de la capa a actualizar
   * @param capaData Nuevos datos de la capa
   * @returns Observable con la respuesta del servidor
   */
  actualizarCapa(id: string, capaData: any): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.put(`${this.API_LAYERS}?researchLayerId=${id}`, capaData, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Actualización de capa'))
      );
  }

  /**
   * Elimina una capa de investigación
   * @param capaId ID de la capa a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarCapa(capaId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_LAYERS}?researchLayerId=${capaId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Eliminación de capa'))
    );
  }

  // ==================== MÉTODOS PARA USUARIOS ====================

  /**
   * Obtiene todos los usuarios
   * @returns Observable con array de usuarios
   */
  getAllUsuarios(): Observable<any[]> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.get<any[]>(`${this.API_USERS}/GetAll`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleHttpError('Carga de usuarios')));
  }

  /**
   * Crea un nuevo usuario
   * @param usuario Datos del usuario a crear
   * @returns Observable con la respuesta del servidor
   */
  crearUsuario(usuario: any): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.post<any>(`${this.API_USERS}/create`, usuario, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Creación de usuario'))
      );
  }

  /**
   * Actualiza un usuario existente
   * @param userId ID del usuario a actualizar
   * @param usuario Nuevos datos del usuario
   * @returns Observable con la respuesta del servidor
   */
  updateUsuario(userId: string, usuario: any): Observable<any> {
    const url = `${this.API_USERS}/update?userId=${userId}`;
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        return '';
      }
    };

    const payload = {
      firstName: usuario.firstName || usuario.nombre,
      lastName: usuario.lastName || usuario.apellido,
      email: usuario.email,
      username: usuario.username || usuario.usuario,
      password: usuario.password || '',
      identificationType: usuario.identificationType || usuario.tipoDocumento,
      identificationNumber: usuario.identificationNumber || usuario.documento,
      birthDate: formatDate(usuario.birthDate || usuario.fechaNacimiento),
      researchLayer: usuario.researchLayer || usuario.capaRawValue || usuario.capaId,
      role: usuario.role
    };

    return this.http.put<any>(url, payload, { headers: this.getAuthHeaders() }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Actualización de usuario'))
    );
  }

  /**
   * Elimina un usuario
   * @param userId ID del usuario a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarUsuario(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.delete<any>(`${this.API_USERS}/delete`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Eliminación de usuario'))
    );
  }

  /**
   * Habilita un usuario
   * @param userId ID del usuario a habilitar
   * @returns Observable con la respuesta del servidor
   */
  enableUser(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.post(`${this.API_USERS}/enabledUser`, null, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Habilitar usuario'))
    );
  }

  /**
   * Deshabilita un usuario
   * @param userId ID del usuario a deshabilitar
   * @returns Observable con la respuesta del servidor
   */
  disableUser(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.post(`${this.API_USERS}/disableUser`, null, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Deshabilitar usuario'))
    );
  }

  // ==================== MÉTODOS PARA VARIABLES ====================

  /**
   * Obtiene todas las variables
   * @returns Observable con array de variables
   */
  getAllVariables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_VARIABLES}/GetAll`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleHttpError('Carga de variables')));
  }

  /**
   * Crea una nueva variable
   * @param variable Datos de la variable a crear
   * @returns Observable con la respuesta del servidor
   */
  crearVariable(variable: any): Observable<any> {
    return this.http.post<any>(this.API_VARIABLES, variable, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Creación de variable'))
      );
  }

  /**
   * Elimina una variable
   * @param variableId ID de la variable a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarVariable(variableId: string): Observable<any> {
    return this.http.delete<any>(this.API_VARIABLES, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('variableId', variableId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Eliminación de variable'))
    );
  }

  /**
   * Actualiza una variable existente
   * @param variable Datos actualizados de la variable
   * @returns Observable con la respuesta del servidor
   */
  actualizarVariable(variable: any): Observable<any> {
    const variableData = {
      variableName: variable.variableName,
      description: variable.description,
      researchLayerId: variable.researchLayerId,
      type: variable.type,
      options: variable.options || []
    };
    return this.http.put<any>(`${this.API_VARIABLES}?variableId=${variable.id}`, variableData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Actualización de variable'))
    );
  }

  /**
   * Obtiene variables asociadas a una capa específica
   * @param capaId ID de la capa
   * @returns Observable con array de variables
   */
  obtenerVariablesPorCapa(capaId: string): Observable<any[]> {
    if (!capaId || capaId.trim() === '') {
      return throwError(() => new Error('ID de capa no válido'));
    }

    const url = `${this.API_VARIABLES}/ResearchLayerId`;
    const params = new HttpParams().set('researchLayerId', capaId);

    return this.http.get<any[]>(url, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(this.handleHttpError('Carga de variables por capa'))
    );
  }

  /**
   * Obtiene una variable por su ID
   * @param id ID de la variable a buscar
   * @returns Observable con los datos de la variable
   */
  getVariableById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_VARIABLES}`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('id', id)
    }).pipe(
      catchError(this.handleHttpError('Consulta de variable por ID'))
    );
  }

  // ==================== MÉTODOS PARA REGISTROS ====================

  /**
   * Obtiene registros de capas con paginación y ordenamiento
   * @param page Número de página (0-based)
   * @param size Tamaño de página
   * @param sort Campo para ordenar
   * @param sortDirection Dirección de ordenamiento (ASC/DESC)
   * @returns Observable con los registros paginados
   */
  getRegistrosCapas(page: number = 0, size: number = 10, sort: string = 'registerDate', sortDirection: string = 'DESC') {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<any>(this.API_REGISTERS, { params })
      .pipe(catchError(this.handleHttpError('Carga de registros de capas')));
  }

  /**
   * Elimina un registro de capa
   * @param registerId ID del registro a eliminar
   * @returns Observable con la respuesta del servidor
   */
  deleteRegistroCapa(registerId: string): Observable<any> {
    return this.http.delete(this.API_REGISTERS, {
      params: new HttpParams().set('registerId', registerId)
    }).pipe(catchError(this.handleHttpError('Eliminación de registro de capa')));
  }


  /**
   * Descarga todos los documentos (para auditoría)
   * @returns Observable con el blob del archivo
   */
  downloadAllDocuments(): Observable<Blob> {
    const url = `${environment.backendUrl}/documents/download/all`;
    return this.http.get(url, { responseType: 'blob' })
      .pipe(
        catchError(this.handleHttpError('Descarga de documentos'))
      );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/login/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

/**
 * Servicio para la consola de administración
 * 
 * Este servicio proporciona métodos para interactuar con la API backend para:
 * - Gestión de usuarios (CRUD completo)
 * - Administración de variables de investigación
 * - Control de capas de investigación
 * - Manejo de registros de capas
 * 
 * Además, implementa un sistema de notificación para actualizaciones de datos.
 */
@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {

  /* -------------------- Configuración de endpoints -------------------- */

  /**
   * URL base de la API
   */
  private readonly API_URL = 'http://localhost:8080';

  /**
   * Endpoint para gestión de capas de investigación
   */
  private readonly API_LAYERS = `${this.API_URL}/api/v1/ResearchLayer`;

  /**
   * Endpoint para gestión de usuarios
   */
  private readonly API_USERS = `${this.API_URL}/api/v1/users`;

  /**
   * Endpoint para gestión de variables
   */
  private readonly API_VARIABLES = `${this.API_URL}/api/v1/Variable`;

  /* -------------------- Subjects para notificaciones -------------------- */

  /**
   * Subject para notificaciones generales de actualización
   */
  private dataUpdated = new Subject<void>();

  /**
   * BehaviorSubject para notificaciones específicas de capas
   */
  private capaUpdated = new BehaviorSubject<void>(undefined);

  /**
   * BehaviorSubject para notificaciones específicas de variables
   */
  private varUpdated = new BehaviorSubject<void>(undefined);

  /**
   * BehaviorSubject para notificaciones específicas de usuarios
   */
  private userUpdated = new BehaviorSubject<void>(undefined);

  /**
   * Observable para suscripción a actualizaciones de capas
   */
  capaUpdated$ = this.capaUpdated.asObservable();

  /**
   * Observable para suscripción a actualizaciones de variables
   */
  varUpdated$ = this.varUpdated.asObservable();

  /**
   * Observable para suscripción a actualizaciones de usuarios
   */
  userUpdated$ = this.userUpdated.asObservable();

  /**
   * Constructor del servicio
   * @param http Cliente HTTP de Angular
   * @param authService Servicio de autenticación
   */
  constructor(private http: HttpClient, private authService: AuthService) { }

  /* -------------------- Métodos de notificación -------------------- */

  /**
   * Obtiene un observable para escuchar actualizaciones de datos
   * @returns Observable de notificaciones
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

  /* -------------------- Métodos de utilidad -------------------- */

  /**
   * Genera las cabeceras HTTP con el token de autenticación
   * @returns HttpHeaders configuradas
   * @throws Error si no hay token disponible
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No se encontró token JWT');
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
   * Maneja una solicitud HTTP genérica con registro y manejo de errores
   * @param obs Observable de la solicitud
   * @param successMsg Mensaje a registrar en éxito
   * @returns Observable de la respuesta
   */
  private handleRequest<T>(obs: Observable<T>, successMsg: string): Observable<T> {
    return obs.pipe(
      tap(response => console.log(successMsg, response)),
      catchError(error => {
        console.error('❌ Error en la petición:', error);
        return throwError(() => new Error(error.error?.message || 'Ocurrió un error en la solicitud.'));
      })
    );
  }

  /**
   * Verifica si el usuario actual tiene rol de administrador
   * @returns boolean indicando si es admin
   */
  private isAdmin(): boolean {
    const token = localStorage.getItem('kc_token');
    if (!token) return false;
  
    try {
      const decoded: any = jwtDecode(token);
      // Roles de cliente específico
      const clientRoles = decoded.resource_access?.['registers-users-api-rest']?.roles || [];
      // Roles de realm (globales)
      const realmRoles = decoded.realm_access?.roles || [];
      
      // Verifica ambos tipos de roles
      return clientRoles.includes('Admin_client_role') || 
             clientRoles.includes('SuperAdmin_client_role') ||
             realmRoles.includes('SuperAdmin');
    } catch (error) {
      console.error('Error decodificando token:', error);
      return false;
    }
  }

  /* -------------------- Métodos para Capas de Investigación -------------------- */

  /**
   * Obtiene todas las capas de investigación
   * @returns Observable con la lista de capas
   */
  getAllLayers(): Observable<any[]> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }
  
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.API_LAYERS}/GetAll`, { headers }).pipe(
      catchError(error => {
        if (error.status === 403) {
          console.error('Acceso denegado - Verifica los roles del usuario');
          if (error.error?.message?.includes('expired')) {
            this.authService.logout();
          }
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene una capa por su ID
   * @param id ID de la capa
   * @returns Observable con los datos de la capa
   */
  getLayerById(id: string): Observable<any> {
    return this.handleRequest(
      this.http.get<any>(`${this.API_LAYERS}`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('id', id)
      }),
      `📌 Capa obtenida (ID: ${id})`
    );
  }

  /**
   * Registra una nueva capa de investigación
   * @param capaData Datos de la nueva capa
   * @returns Observable con la respuesta
   */
  registrarCapa(capaData: any): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.handleRequest(
      this.http.post<any>(this.API_LAYERS, capaData, { headers }),
      '✅ Capa registrada'
    ).pipe(
      tap(() => this.notifyDataUpdated())
    );
  }

  /**
   * Actualiza una capa existente
   * @param id ID de la capa a actualizar
   * @param capaData Nuevos datos de la capa
   * @returns Observable con la respuesta
   */
  actualizarCapa(id: string, capaData: any): Observable<any> {
    if (!this.isAdmin()) {
      console.error('⛔ Acceso denegado: solo administradores pueden actualizar capas');
      return throwError(() => new Error('Acceso denegado'));
    }

    const url = `${this.API_LAYERS}?researchLayerId=${id}`;
    return this.http.put(url, capaData, { headers: this.getAuthHeaders() }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(error => {
        console.error('Error al actualizar capa:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina una capa
   * @param capaId ID de la capa a eliminar
   * @returns Observable con la respuesta
   */
  eliminarCapa(capaId: string): Observable<any> {
    const url = `${this.API_LAYERS}?researchLayerId=${capaId}`;
    return this.http.delete<any>(url).pipe(
      tap(() => {
        console.log(`Capa eliminada (ID: ${capaId})`);
        this.notifyDataUpdated();
      }),
      catchError((error) => {
        console.error('Error al eliminar la capa:', error);
        return throwError(() => new Error('No se pudo eliminar la capa.'));
      })
    );
  }

  /* -------------------- Métodos para Usuarios -------------------- */

  /**
   * Obtiene todos los usuarios (solo para administradores)
   * @returns Observable con la lista de usuarios
   */
  getAllUsuarios(): Observable<any[]> {
    if (!this.isAdmin()) {
      console.error('⛔ Acceso denegado: solo los administradores pueden obtener la lista de usuarios.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_USERS}/GetAll`, { headers: this.getAuthHeaders() }),
      '👥 Usuarios obtenidos'
    );
  }

  /**
   * Crea un nuevo usuario (solo para administradores)
   * @param usuario Datos del nuevo usuario
   * @returns Observable con la respuesta
   */
  crearUsuario(usuario: any): Observable<any> {
    if (!this.isAdmin()) {
      console.error('⛔ Acceso denegado: solo los administradores pueden crear usuarios.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }
    return this.handleRequest(
      this.http.post<any>(`${this.API_USERS}/create`, usuario, { headers: this.getAuthHeaders() }),
      '✅ Usuario creado'
    ).pipe(
      tap(() => this.notifyDataUpdated())
    );
  }

  /**
   * Actualiza un usuario existente (solo para administradores)
   * @param userId ID del usuario a actualizar
   * @param usuario Nuevos datos del usuario
   * @returns Observable con la respuesta
   */
  updateUsuario(userId: string, usuario: any): Observable<any> {
    if (!this.isAdmin()) {
      console.error('⛔ Acceso denegado: solo los administradores pueden actualizar usuarios.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }

    const url = `${this.API_USERS}/update?userId=${userId}`;

    const payload = {
      firstName: usuario.firstName || usuario.nombre,
      lastName: usuario.lastName || usuario.apellido,
      email: usuario.email,
      username: usuario.username || usuario.usuario,
      password: usuario.password || '',
      identificationType: usuario.identificationType || usuario.tipoDocumento,
      identificationNumber: usuario.identificationNumber || usuario.documento,
      birthDate: usuario.birthDate || usuario.fechaNacimiento,
      researchLayer: usuario.researchLayer || usuario.capaRawValue || usuario.capaId,
      role: usuario.role
    };

    return this.http.put<any>(url, payload, { headers: this.getAuthHeaders() }).pipe(
      tap(updatedUser => {
        console.log('Usuario actualizado:', updatedUser);
        this.notifyDataUpdated();
      }),
      catchError(error => {
        console.error('Error al actualizar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un usuario (solo para administradores)
   * @param userId ID del usuario a eliminar
   * @returns Observable con la respuesta
   */
  eliminarUsuario(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      console.error('⛔ Acceso denegado: solo los administradores pueden eliminar usuarios.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }
    return this.handleRequest(
      this.http.delete<any>(`${this.API_USERS}/delete`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('userId', userId)
      }),
      `🗑️ Usuario eliminado (ID: ${userId})`
    ).pipe(
      tap(() => this.notifyDataUpdated())
    );
  }

  /**
   * Habilita un usuario
   * @param userId ID del usuario a habilitar
   * @returns Observable con la respuesta
   */
  enableUser(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado: solo administradores pueden habilitar usuarios'));
    }

    return this.http.post(`${this.API_USERS}/enabledUser`, null, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => {
        console.log(`Usuario ${userId} habilitado`);
        this.notifyDataUpdated();
      }),
      catchError(error => {
        console.error('Error al habilitar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Deshabilita un usuario
   * @param userId ID del usuario a deshabilitar
   * @returns Observable con la respuesta
   */
  disableUser(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado: solo administradores pueden deshabilitar usuarios'));
    }

    return this.http.post(`${this.API_USERS}/disableUser`, null, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => {
        console.log(`Usuario ${userId} deshabilitado`);
        this.notifyDataUpdated();
      }),
      catchError(error => {
        console.error('Error al deshabilitar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /* -------------------- Métodos para Variables -------------------- */

  /**
   * Obtiene todas las variables
   * @returns Observable con la lista de variables
   */
  getAllVariables(): Observable<any[]> {
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_VARIABLES}/GetAll`, { headers: this.getAuthHeaders() }),
      '📊 Variables obtenidas'
    );
  }

  /**
   * Crea una nueva variable
   * @param variable Datos de la nueva variable
   * @returns Observable con la respuesta
   */
  crearVariable(variable: any): Observable<any> {
    return this.handleRequest(
      this.http.post<any>(this.API_VARIABLES, variable, { headers: this.getAuthHeaders() }),
      '✅ Variable creada'
    ).pipe(
      tap(() => this.notifyDataUpdated())
    );
  }

  /**
   * Elimina una variable existente
   * @param variableId ID de la variable a eliminar
   * @returns Observable con la respuesta
   */
  eliminarVariable(variableId: string): Observable<any> {
    return this.handleRequest(
      this.http.delete<any>(this.API_VARIABLES, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('variableId', variableId)
      }),
      `🗑️ Variable eliminada (ID: ${variableId})`
    ).pipe(
      tap(() => this.notifyDataUpdated())
    );
  }

  /**
   * Actualiza una variable existente
   * @param variable Datos actualizados de la variable
   * @returns Observable con la respuesta
   */
  actualizarVariable(variable: any): Observable<any> {
    const variableData = {
      variableName: variable.variableName,
      description: variable.description,
      researchLayerId: variable.researchLayerId,
      type: variable.type,
      options: variable.options || []
    };

    const url = `${this.API_VARIABLES}?variableId=${variable.id}`;
    return this.http.put<any>(url, variableData, { headers: this.getAuthHeaders() }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(error => {
        console.error('Error al actualizar la variable:', error);
        return throwError(() => new Error('No se pudo actualizar la variable.'));
      })
    );
  }

  /* -------------------- Métodos para Registros de Capas -------------------- */

  /**
   * Obtiene registros de capas con paginación
   * @param page Número de página (default: 0)
   * @param size Tamaño de página (default: 10)
   * @param sort Campo para ordenar (default: 'registerDate')
   * @param sortDirection Dirección de ordenamiento (default: 'DESC')
   * @returns Observable con los registros paginados
   */
  getRegistrosCapas(page: number = 0, size: number = 10, sort: string = 'registerDate', sortDirection: string = 'DESC') {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    console.log('Solicitando a:', `${this.API_URL}/api/v1/registers`);
    console.log('Con parámetros:', params.toString());

    return this.http.get<any>(`${this.API_URL}/api/v1/registers`, { params })
      .pipe(
        tap(response => console.log('Respuesta recibida:', response)),
        catchError(error => {
          console.error('Error completo:', error);
          if (error.error) {
            console.error('Cuerpo del error:', error.error);
          }
          return throwError(() => new Error('Error al cargar registros'));
        })
      );
  }

  /**
   * Elimina un registro de capa
   * @param registerId ID del registro a eliminar
   * @returns Observable con la respuesta
   */
  deleteRegistroCapa(registerId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/api/v1/registers`, {
      params: new HttpParams().set('registerId', registerId)
    });
  }
}
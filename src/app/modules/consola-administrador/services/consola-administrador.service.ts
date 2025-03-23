import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject  } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/login/services/auth.service';

/**
 * El servicio ConsolaAdministradorService es un servicio Angular que proporciona métodos para interactuar con una API backend relacionada con la gestión 
 * de usuarios, variables y capas de investigación. Este servicio se encarga de realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) y notificar 
 * cambios a los componentes suscritos.
 */
@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {

  /**
   * Propiedades
   */
  private readonly API_URL = 'http://localhost:8080';
  private readonly API_LAYERS = `${this.API_URL}/api/v1/ResearchLayer`;
  private readonly API_USERS = `${this.API_URL}/api/v1/users`;
  private readonly API_VARIABLES = `${this.API_URL}/api/v1/Variable`;

  // BehaviorSubject para notificar cambios en los datos
  private dataUpdated = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Devuelve un observable para escuchar cambios en los datos.
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  // Notifica a los suscriptores que los datos han sido actualizados.
  private notifyDataUpdated(): void {
    this.dataUpdated.next();
  }

  //  Genera las cabeceras HTTP con el token de autenticación.
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  //  Maneja las solicitudes HTTP, incluyendo el registro de éxito y el manejo de errores.
  private handleRequest<T>(obs: Observable<T>, successMsg: string): Observable<T> {
    return obs.pipe(
      tap(response => console.log(successMsg, response)),
      catchError(error => {
        console.error('❌ Error en la petición:', error);
        return throwError(() => new Error(error.error?.message || 'Ocurrió un error en la solicitud.'));
      })
    );
  }

  // Métodos para Capas de Investigación
  //Obtiene todas las capas de investigación
  getAllLayers(): Observable<any[]> {
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_LAYERS}/GetAll`, { headers: this.getAuthHeaders() }),
      '📊 Capas obtenidas'
    );
  }

  // Obtiene una capa de investigación por su ID
  getLayerById(id: string): Observable<any> {
    return this.handleRequest(
      this.http.get<any>(`${this.API_LAYERS}`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('id', id)
      }),
      `📌 Capa obtenida (ID: ${id})`
    );
  }

  // Registra una nueva capa de investigación
  registrarCapa(capaData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.API_LAYERS, JSON.stringify(capaData), { headers }).pipe(
      tap(() => this.notifyDataUpdated()) // Notificar después de crear
    );
  }

  // Actualiza una capa de investigación existente
  actualizarCapa(id: string, capaData: any): Observable<any> {
    const url = `http://localhost:8080/api/v1/ResearchLayer?researchLayerId=${id}`;
    const token = localStorage.getItem('kc_token');

    if (!token) {
      console.error('❌ No se encontró el token en localStorage');
      alert('No autenticado. Por favor, inicia sesión.');
      return throwError(() => new Error('No autenticado'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(url, capaData, { headers }).pipe(
      tap(() => this.notifyDataUpdated()), // Notificar después de actualizar
      catchError(error => {
        console.error('❌ Error en la solicitud:', error);
        return throwError(() => new Error('Error en la actualización'));
      })
    );
  }

  //  Elimina una capa de investigación.
  eliminarCapa(capaId: string): Observable<any> {
    const url = `${this.API_LAYERS}?researchLayerId=${capaId}`;
    return this.http.delete<any>(url).pipe(
      tap(() => {
        console.log(`Capa eliminada (ID: ${capaId})`);
        this.notifyDataUpdated(); // Notificar después de eliminar
      }),
      catchError((error) => {
        console.error('Error al eliminar la capa:', error);
        return throwError(() => new Error('No se pudo eliminar la capa.'));
      })
    );
  }

  // Métodos para Usuarios
  // Verifica si el usuario actual tiene el rol de administrador.
  private isAdmin(): boolean {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    return userRoles.includes('Admin_client_role');
  }

  // Obtiene todos los usuarios (solo para administradores).
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

  // Crea un nuevo usuario (solo para administradores).
  crearUsuario(usuario: any): Observable<any> {
    if (!this.isAdmin()) {
      console.error('⛔ Acceso denegado: solo los administradores pueden crear usuarios.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }
    return this.handleRequest(
      this.http.post<any>(`${this.API_USERS}/create`, usuario, { headers: this.getAuthHeaders() }),
      '✅ Usuario creado'
    ).pipe(
      tap(() => this.notifyDataUpdated()) // Notificar después de crear
    );
  }

  // Actualiza un usuario existente (solo para administradores).
  updateUsuario(userId: string, usuario: any): Observable<any> {
    if (!this.isAdmin()) {
      console.error('⛔ Acceso denegado: solo los administradores pueden actualizar usuarios.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }
    const url = `${this.API_USERS}/update?userId=${userId}`;
    return this.handleRequest(
      this.http.put<any>(url, usuario, { headers: this.getAuthHeaders() }),
      `✏️ Usuario actualizado (ID: ${userId})`
    ).pipe(
      tap(() => this.notifyDataUpdated()) // Notificar después de actualizar
    );
  }

  // Elimina un usuario (solo para administradores).
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

  // Métodos para Variables
  // Obtiene todas las variables.
  getAllVariables(): Observable<any[]> {
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_VARIABLES}/GetAll`, { headers: this.getAuthHeaders() }),
      '📊 Variables obtenidas'
    );
  }

  // Crea una nueva variable.
  crearVariable(variable: any): Observable<any> {
    return this.handleRequest(
      this.http.post<any>(this.API_VARIABLES, variable, { headers: this.getAuthHeaders() }),
      '✅ Variable creada'
    ).pipe(
      tap(() => this.notifyDataUpdated())
    );
  }

  //Elimina una variable existente.
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

  actualizarVariable(variable: any): Observable<any> {
    const variableData = {
      idCapaInvestigacion: variable.idCapaInvestigacion,
      nombreVariable: variable.nombreVariable,  
      descripcion: variable.descripcion,
      tipo: variable.tipo,
      opciones: variable.opciones || []
    };

    const url = `${this.API_VARIABLES}?variableId=${variable.id}`;

    return this.http.put<any>(url, variableData).pipe(
      tap(() => {
        console.log('Variable actualizada:', variableData);
        this.notifyDataUpdated(); // Notificar después de actualizar
      }),
      catchError(error => {
        console.error('Error al actualizar la variable:', error);
        return throwError(() => new Error('No se pudo actualizar la variable.'));
      })
    );
  }
}
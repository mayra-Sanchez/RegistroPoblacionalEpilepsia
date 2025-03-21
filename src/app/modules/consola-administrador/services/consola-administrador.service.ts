import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject  } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/login/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {

  private token: string = '';
  private apiUrl = 'http://localhost:8080/api/v1';
  private readonly API_URL = 'http://localhost:8080';
  private readonly API_LAYERS = `${this.API_URL}/api/v1/ResearchLayer`;
  private readonly API_USERS = `${this.API_URL}/api/v1/users`;
  private readonly API_VARIABLES = `${this.API_URL}/api/v1/Variable`;

  // BehaviorSubject para notificar cambios en los datos
  private dataUpdated = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Método para obtener el observable
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  // Método para notificar cambios
  private notifyDataUpdated(): void {
    this.dataUpdated.next();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleRequest<T>(obs: Observable<T>, successMsg: string): Observable<T> {
    return obs.pipe(
      tap(response => console.log(successMsg, response)),
      catchError(error => {
        console.error('❌ Error en la petición:', error);
        return throwError(() => new Error(error.error?.message || 'Ocurrió un error en la solicitud.'));
      })
    );
  }

  // 📌 CAPAS
  getAllLayers(): Observable<any[]> {
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_LAYERS}/GetAll`, { headers: this.getAuthHeaders() }),
      '📊 Capas obtenidas'
    );
  }

  getLayerById(id: string): Observable<any> {
    return this.handleRequest(
      this.http.get<any>(`${this.API_LAYERS}`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('id', id)
      }),
      `📌 Capa obtenida (ID: ${id})`
    );
  }

  registrarCapa(capaData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.API_LAYERS, JSON.stringify(capaData), { headers }).pipe(
      tap(() => this.notifyDataUpdated()) // Notificar después de crear
    );
  }

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

  // 📌 USUARIOS
  private isAdmin(): boolean {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    return userRoles.includes('Admin_client_role');
  }

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
      tap(() => this.notifyDataUpdated()) // Notificar después de eliminar
    );
  }

  // 📌 VARIABLES
  getAllVariables(): Observable<any[]> {
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_VARIABLES}/GetAll`, { headers: this.getAuthHeaders() }),
      '📊 Variables obtenidas'
    );
  }

  crearVariable(variable: any): Observable<any> {
    return this.handleRequest(
      this.http.post<any>(this.API_VARIABLES, variable, { headers: this.getAuthHeaders() }),
      '✅ Variable creada'
    ).pipe(
      tap(() => this.notifyDataUpdated()) // Notificar después de crear
    );
  }

  eliminarVariable(variableId: string): Observable<any> {
    return this.handleRequest(
      this.http.delete<any>(this.API_VARIABLES, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('variableId', variableId)
      }),
      `🗑️ Variable eliminada (ID: ${variableId})`
    ).pipe(
      tap(() => this.notifyDataUpdated()) // Notificar después de eliminar
    );
  }

  actualizarVariable(variable: any): Observable<any> {
    const variableData = {
      idCapaInvestigacion: variable.idCapaInvestigacion,
      nombreVariable: variable.nombreVariable + " ",  // Pequeño truco para forzar cambio
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
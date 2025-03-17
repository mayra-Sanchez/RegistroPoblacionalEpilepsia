import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
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
  private readonly API_USERS = `${this.API_URL}/Users`;
  private readonly API_VARIABLES = `${this.API_URL}/api/v1/Variable`;

  private capasUpdated = new Subject<void>();     // Notifica cambios en capas
  private variablesUpdated = new Subject<void>(); // Notifica cambios en variables
  private usuariosUpdated = new Subject<void>();  // Notifica cambios en usuarios

  constructor(private http: HttpClient, private authService: AuthService) { }

  // ✅ Escuchar cambios en listas
  getCapasUpdatedListener(): Observable<void> {
    return this.capasUpdated.asObservable();
  }
  getVariablesUpdatedListener(): Observable<void> {
    return this.variablesUpdated.asObservable();
  }
  getUsuariosUpdatedListener(): Observable<void> {
    return this.usuariosUpdated.asObservable();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });
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
  // 📌 OBTENER TODAS LAS CAPAS
  getAllLayers(): Observable<any[]> {
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_LAYERS}/GetAll`, { headers: this.getAuthHeaders() }),
      '📊 Capas obtenidas'
    );
  }

  // 📌 OBTENER CAPA POR ID
  getLayerById(id: string): Observable<any> {
    return this.handleRequest(
      this.http.get<any>(`${this.API_LAYERS}`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('id', id)
      }),
      `📌 Capa obtenida (ID: ${id})`
    );
  }

  // 📌 CREAR CAPA
  // Registrar una nueva capa
  registrarCapa(capaData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(this.API_LAYERS, JSON.stringify(capaData), { headers });
  }



  // 📌 ACTUALIZAR USUARIO
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
  
    console.log('🔹 URL de la solicitud:', url);
    console.log('🔹 Token enviado:', token);
    console.log('🔹 Headers enviados:', headers.keys());
    console.log('🔹 Cuerpo enviado:', JSON.stringify(capaData, null, 2));
  
    return this.http.put(url, capaData, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error en la solicitud:', error);
        return throwError(() => new Error('Error en la actualización'));
      })
    );
  }
  
  

  // 📌 ELIMINAR CAPA
  eliminarCapa(capaId: string): Observable<any> {
    const url = `${this.API_LAYERS}?researchLayerId=${capaId}`; // Pasar el ID como query param
    return this.http.delete<any>(url).pipe(
      tap(() => {
        console.log(`Capa eliminada (ID: ${capaId})`);
        this.capasUpdated.next(); // Notificar actualización
      }),
      catchError((error) => {
        console.error('Error al eliminar la capa:', error);
        return throwError(() => new Error('No se pudo eliminar la capa.'));
      })
    );
  }


  // 📌 USUARIOS
  getAllUsuarios(): Observable<any[]> {
    return this.handleRequest(
      this.http.get<any[]>(`${this.API_USERS}/GetAll`, { headers: this.getAuthHeaders() }),
      '👥 Usuarios obtenidos'
    );
  }

  crearUsuario(usuario: any): Observable<any> {
    return this.handleRequest(
      this.http.post<any>(`${this.API_USERS}/create`, usuario, { headers: this.getAuthHeaders() }),
      '✅ Usuario creado'
    );
  }

  getUsuarioByEmail(email: string): Observable<any> {
    return this.handleRequest(
      this.http.get<any>(`${this.API_USERS}/get`, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('email', email)
      }),
      `📩 Usuario obtenido: ${email}`
    );
  }

  updateUsuario(userId: string, usuario: any): Observable<any> {
    // El backend espera /Users/update?userId=xxx con un body que contenga
    // firstName, lastName, email, etc.
    const url = `${this.API_USERS}/update?userId=${userId}`;
    return this.http.put<any>(url, usuario, { headers: this.getAuthHeaders() });
  }

  eliminarUsuario(userId: string): Observable<any> {
    return this.authService.hasRole('Admin_client_role') ?
      this.handleRequest(
        this.http.delete<any>(`${this.API_USERS}/delete`, {
          headers: this.getAuthHeaders(),
          params: new HttpParams().set('userId', userId)
        }),
        `🗑️ Usuario eliminado (ID: ${userId})`
      ) :
      throwError(() => new Error('⛔ Acceso denegado.'));
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
    );
  }

  eliminarVariable(variableId: string): Observable<any> {
    return this.handleRequest(
      this.http.delete<any>(this.API_VARIABLES, {
        headers: this.getAuthHeaders(),
        params: new HttpParams().set('variableId', variableId)
      }),
      `🗑️ Variable eliminada (ID: ${variableId})`
    );
  }

  getVariableById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_VARIABLES}/api/v1/Variable?id=${id}`).pipe(
      tap(data => console.log(`Variable obtenida (ID: ${id}):`, data)),
      catchError(error => {
        console.error('Error al obtener la variable:', error);
        return throwError(() => new Error('No se pudo obtener la variable.'));
      })
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
        this.variablesUpdated.next();
      }),
      catchError(error => {
        console.error('Error al actualizar la variable:', error);
        return throwError(() => new Error('No se pudo actualizar la variable.'));
      })
    );
  }

}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/login/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConsolaRegistroService {
  private readonly API_URL = 'http://localhost:8080/api/v1/registers';
  private readonly API_USERS_URL = 'http://localhost:8080/api/v1/users';
  private dataUpdated = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) { }

  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

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

  // 📌 Obtener variables por capa
  // 📌 Obtener variables por capa
  obtenerVariablesPorCapa(researchLayerId: string): Observable<any> {
    const params = new HttpParams().set('researchLayerId', researchLayerId);

    return this.handleRequest(
      this.http.get<any>(`${this.API_URL}/Variable/ResearchLayerId`, {
        headers: this.getAuthHeaders(),
        params: params
      }),
      `📊 Variables obtenidas para capa ID: ${researchLayerId}`
    );
  }



  // 📌 Obtener información del usuario autenticado
  obtenerUsuarioAutenticado(email: string): Observable<any> {
    const token = this.authService.getToken();

    if (!token) {
      console.error('⚠️ No hay token disponible, abortando solicitud.');
      return throwError(() => new Error('No hay token disponible.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.API_USERS_URL}?email=${email}`, { headers }).pipe(
      tap(data => console.log('✅ Usuario autenticado:', data)),
      catchError(error => {
        console.error('❌ Error en la petición:', error);
        return throwError(() => new Error('Ocurrió un error en la solicitud.'));
      })
    );
  }

  // 📌 Verifica si el usuario tiene el rol de Doctor
  private isDoctor(): boolean {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    return userRoles.includes('Doctor_client_role');
  }

  // 📌 Registrar un nuevo registro (solo doctores pueden hacerlo)
  registrarRegistro(registerData: any): Observable<any> {
    if (!this.isDoctor()) {
      console.error('⛔ Acceso denegado: solo los doctores pueden registrar.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }

    return this.handleRequest(
      this.http.post(`${this.API_URL}`, registerData, { headers: this.getAuthHeaders() }),
      '✅ Registro creado'
    ).pipe(tap(() => this.notifyDataUpdated()));
  }

  // 📌 Obtener todos los registros paginados
  obtenerRegistros(page: number, size: number, sort: string, sortDirection: string): Observable<any> {
    return this.handleRequest(
      this.http.get<any>(
        `${this.API_URL}/all?page=${page}&size=${size}&sort=${sort}&sortDirection=${sortDirection}`,
        { headers: this.getAuthHeaders() }
      ),
      '📊 Registros obtenidos'
    );
  }

  // 📌 Actualizar un registro (solo doctores pueden hacerlo)
  actualizarRegistro(registerId: string, registerData: any): Observable<any> {
    if (!this.isDoctor()) {
      console.error('⛔ Acceso denegado: solo los doctores pueden actualizar registros.');
      return throwError(() => new Error('⛔ Acceso denegado.'));
    }

    return this.handleRequest(
      this.http.put(`${this.API_URL}?registerId=${registerId}`, registerData, { headers: this.getAuthHeaders() }),
      `✏️ Registro actualizado (ID: ${registerId})`
    ).pipe(tap(() => this.notifyDataUpdated()));
  }
}

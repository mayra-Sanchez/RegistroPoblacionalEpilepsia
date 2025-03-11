import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private backendUrl = 'http://localhost:8080'; // URL del backend Spring Boot

  constructor(private http: HttpClient, private router: Router) {}

  // Método para iniciar sesión
  login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post(`${this.backendUrl}/auth/login`, { email, password }, { headers }).pipe(
      tap((response: any) => {
        console.log('Respuesta del backend:', response);
        if (response && response.token) {
          // Guardar el token y roles en el localStorage
          localStorage.setItem('kc_token', response.token);
          localStorage.setItem('userRoles', JSON.stringify(response.roles || []));
        } else {
          console.warn('No se recibió token en la respuesta.');
        }
      }),
      catchError(this.handleError)
    );
  }

  // Método para cerrar sesión
  logout(): void {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('userRoles');
    this.router.navigate(['/']);
  }

  // Verifica si hay un token en el localStorage
  isLoggedIn(): boolean {
    return !!localStorage.getItem('kc_token');
  }

  // Recupera el token almacenado
  getToken(): string | null {
    const token = localStorage.getItem('kc_token');
    console.log('Token recuperado:', token);
    return token;
  }

  // Recupera los roles almacenados
  getStoredRoles(): string[] {
    return JSON.parse(localStorage.getItem('userRoles') || '[]');
  }

  // Retorna headers con el token de autorización
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
  }

  // Decodifica el token para obtener los roles del usuario
  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);

      return decoded.realm_access?.roles || [];
    } catch (error) {
      console.error('Error al decodificar el token', error);
      return [];
    }
  }

  // Carga y guarda los roles desde el token en el localStorage
  async loadUserRoles(): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);

      const roles = decoded.realm_access?.roles || [];
      localStorage.setItem('userRoles', JSON.stringify(roles));
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  }

  // Manejo de errores HTTP
  private handleError(error: HttpErrorResponse) {
    console.error('Error en la solicitud:', error);
    if (error.status === 0) {
      console.error('El backend no responde o hay un problema de conexión.');
    } else {
      console.error(`Código de error: ${error.status}, Mensaje: ${error.message}`);
    }
    return throwError(() => new Error('Error en la autenticación. Inténtalo de nuevo más tarde.'));
  }
}

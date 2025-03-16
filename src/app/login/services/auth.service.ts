import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import {jwtDecode} from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private backendUrl = 'http://localhost:8080'; 
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());

  authStatus$ = this.authStatus.asObservable(); 

  private isRefreshing = false;
  
  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.backendUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        console.log('🔍 Respuesta del backend:', response);

        if (response.access_token) {
          localStorage.setItem('kc_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          
          this.authStatus.next(true);
          // Decodificar el token y guardar los roles
          this.storeUserRoles(response.access_token);
        } else {
          console.warn('⚠️ No se recibió token en la respuesta.');
        }
      }),
      catchError(error => {
        console.error('❌ Error en el login:', error);
        throw error;
      })
    );
  }

  private storeUserRoles(token: string) {
    try {
      const decoded: any = jwtDecode(token);
      console.log('🔓 Token decodificado:', decoded);

      // Extraer los roles específicos del cliente "registers-users-api-rest"
      const roles = decoded.resource_access?.["registers-users-api-rest"]?.roles || [];
      console.log('🎭 Roles extraídos:', roles);

      localStorage.setItem('userRoles', JSON.stringify(roles));
    } catch (error) {
      console.error('❌ Error al decodificar el token:', error);
    }
  }

  getStoredRoles(): string[] {
    const token = localStorage.getItem('kc_token');
    if (!token) return [];
  
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1])); // Decodificar el token JWT
      const realmRoles = tokenPayload.realm_access?.roles || [];
      const clientRoles = tokenPayload.resource_access?.['registers-users-api-rest']?.roles || [];
      
      return [...realmRoles, ...clientRoles]; // 🔹 Combinar ambos tipos de roles
    } catch (error) {
      console.error('❌ Error al obtener roles del token:', error);
      return [];
    }
  }
  
  hasRole(requiredRole: string): boolean {
    const userRoles = this.getStoredRoles();
    return userRoles.includes(requiredRole);
    
  }

  getToken(): string | null {
    return localStorage.getItem('kc_token');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('kc_token');
    return !!token;
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No hay refresh token disponible.'));
    }

    return this.http.post(`${this.backendUrl}/refresh`, { refreshToken }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          console.log('🔄 Token refrescado con éxito');
          localStorage.setItem('kc_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.authStatus.next(true);
        } else {
          console.warn('⚠️ No se recibió nuevo access_token.');
          this.logout();
        }
      }),
      catchError(error => {
        console.error('❌ Error al refrescar el token:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('refresh_token');
    this.authStatus.next(false);
    this.router.navigate(['/']);
  }
}

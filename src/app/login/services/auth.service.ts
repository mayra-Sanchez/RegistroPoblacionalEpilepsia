import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {jwtDecode} from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private backendUrl = 'http://localhost:8080'; 
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());

  authStatus$ = this.authStatus.asObservable(); 

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
    return !!localStorage.getItem('kc_token');
  }

  logout(): void {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('userRoles');
    this.authStatus.next(false); // Emitir que el usuario cerró sesión
    this.router.navigate(['/']);
  }
}

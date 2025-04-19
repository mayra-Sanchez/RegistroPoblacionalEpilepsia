import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private backendUrl = 'http://localhost:8080/api/v1';
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());

  authStatus$ = this.authStatus.asObservable();

  private tokenRefreshInterval: any; // Para manejar el intervalo de refresco
  private readonly refreshTimeMs = 13 * 60 * 1000; // 13 minutos en milisegundos


  constructor(private http: HttpClient, private router: Router) { }

  private startTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    this.tokenRefreshInterval = setInterval(() => {
      this.refreshToken().subscribe({
        error: () => this.stopTokenRefresh() // Si falla, detenemos el refresco
      });
    }, this.refreshTimeMs);
  }

  private stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  getCurrentUserResearchLayerId(): string | null {
    const token = localStorage.getItem('kc_token');
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.attributes?.researchLayerId?.[0] || null;
    } catch (error) {
      console.error('Error decoding user data:', error);
      return null;
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.backendUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          localStorage.setItem('kc_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.authStatus.next(true);
          this.storeUserRoles(response.access_token);
          this.startTokenRefresh(); // Inicia el refresco automático
        }
      }),
      catchError(error => {
        console.error('❌ Error en el login:', error);
        throw error;
      })
    );
  }


  getUsername(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      return decoded.preferred_username || ''; // Ajusta según la estructura de tu token
    } catch (error) {
      console.error('❌ Error al obtener el nombre de usuario:', error);
      return '';
    }
  }

  getUserRole(): string {
    const roles = this.getStoredRoles();
    return roles.length > 0 ? roles[0] : 'Usuario'; // Ajusta para mostrar el rol adecuado
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

  getUserEmail(): string | null {
    const token = localStorage.getItem('kc_token');
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.email || null; // Asegúrate de que el campo "email" está presente en tu token JWT
    } catch (error) {
      console.error('❌ Error al obtener el email del token:', error);
      return null;
    }
  }


  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');

    // Verificación más robusta del refresh token
    if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
      console.error('⚠️ No hay refresh token válido en localStorage. Haciendo logout.');
      this.logout();
      return throwError(() => new Error('No hay refresh token disponible.'));
    }

    // Configuración completa de la solicitud
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}` // Si tu backend lo requiere
    });

    return this.http.post<any>('http://localhost:8080/auth/refresh', { refreshToken }, { headers }).pipe(
      tap((response: any) => {
        if (!response?.access_token) {
          console.warn('⚠️ Respuesta inesperada del servidor:', response);
          throw new Error('Respuesta inválida del servidor');
        }

        console.log('🔄 Token refrescado con éxito');
        localStorage.setItem('kc_token', response.access_token);

        // Solo actualiza el refresh_token si viene en la respuesta
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
      }),
      catchError(error => {
        console.error('❌ Error al refrescar token:', error);

        // Manejo específico de errores HTTP
        if (error.status === 401 || error.status === 403) {
          console.warn('⚠️ Refresh token inválido o expirado');
          this.logout();
        }

        return throwError(() => new Error('No se pudo refrescar el token.'));
      })
    );
  }

  getUserData(): any {
    const token = localStorage.getItem('kc_token');
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return {
        id: decoded.sub || '', // Use the 'sub' claim which is the user ID in Keycloak
        firstName: decoded.given_name || decoded.firstName || '',
        lastName: decoded.family_name || decoded.lastName || '',
        email: decoded.email || '',
        attributes: decoded.attributes || {}
      };
    } catch (error) {
      console.error('Error decoding user data:', error);
      return null;
    }
  }

  getUserFirstName(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      // Ajusta estos campos según la estructura de tu token JWT
      return decoded.given_name || decoded.name || decoded.preferred_username || '';
    } catch (error) {
      console.error('❌ Error al obtener el nombre del usuario:', error);
      return '';
    }
  }

  getUserLastName(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      // Ajusta estos campos según la estructura de tu token JWT
      return decoded.family_name || decoded.last_name || '';
    } catch (error) {
      console.error('❌ Error al obtener el apellido del usuario:', error);
      return '';
    }
  }

  hasAnyRole(requiredRoles: string[]): boolean {
    const userRoles = this.getStoredRoles();
    return requiredRoles.some(role => userRoles.includes(role));
  }

  getUserIdentificationNumber(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      console.log('Decoded token:', decoded); // For debugging

      // Check multiple possible locations for the identification number
      return decoded.identificationNumber ||
        decoded.identification_number ||
        decoded.documentNumber ||
        decoded.document_number ||
        decoded.attributes?.identificationNumber?.[0] || // Keycloak style
        '';
    } catch (error) {
      console.error('Error al obtener número de identificación:', error);
      return '';
    }
  }

  // Método para obtener nombre completo
  getUserFullName(): string {
    const firstName = this.getUserFirstName();
    const lastName = this.getUserLastName();
    return `${firstName} ${lastName}`.trim();
  }

  logout(): void {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRoles');
    this.authStatus.next(false);
    this.stopTokenRefresh(); // Detener el refresco automático
    this.router.navigate(['/']);
  }

}

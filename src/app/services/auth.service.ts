import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

/**
 * Servicio de autenticación que maneja el login, logout, gestión de tokens
 * y obtención de información del usuario.
 * 
 * Este servicio se encarga de:
 * - Autenticación de usuarios (login/logout)
 * - Gestión de tokens JWT (almacenamiento, refresco)
 * - Obtención de información del usuario
 * - Control de roles y permisos
 * - Comunicación con el backend para operaciones de autenticación
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private backendUrl = environment.backendUrl;
  private API_USERS_URL = `${this.backendUrl}/users`;
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());
  private userProfile = new BehaviorSubject<any>(null);
  authStatus$ = this.authStatus.asObservable();

  private tokenRefreshInterval: any; // Para manejar el intervalo de refresco
  private readonly refreshTimeMs = 13 * 60 * 1000; // 13 minutos en milisegundos

  /**
   * Constructor del servicio de autenticación
   * @param http Cliente HTTP para realizar peticiones
   * @param router Router para navegación
   */
  constructor(private http: HttpClient, private router: Router) { }

  /**
   * Inicia el refresco automático del token cada 13 minutos
   * @private
   */
  private startTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    this.tokenRefreshInterval = setInterval(() => {
      this.refreshToken().subscribe({
        error: () => this.stopTokenRefresh()
      });
    }, this.refreshTimeMs);
  }

  /**
   * Detiene el refresco automático del token
   * @private
   */
  private stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  /**
   * Obtiene la capa de investigación asociada al usuario actual
   * @returns Observable con el ID de la capa de investigación o null
   */
  getCurrentUserResearchLayer(): Observable<string | null> {
    const email = this.getUserEmail();
    if (!email) {
      console.error('No se pudo obtener el email del usuario');
      return of(null);
    }

    return this.obtenerUsuarioAutenticado(email).pipe(
      map((response: any) => {
        if (!response || !response[0]) {
          throw new Error('Respuesta inválida del servidor');
        }

        const userData = response[0];
        const researchLayerId = userData?.attributes?.researchLayerId?.[0] || null;

        if (!researchLayerId) {
          console.warn('Usuario sin capa asignada', userData);
        }

        return researchLayerId;
      }),
      catchError(error => {
        console.error('Error en getCurrentUserResearchLayer:', error);
        return throwError(() => new Error('Error al obtener la capa de investigación'));
      })
    );
  }

  /**
   * Obtiene los datos del usuario autenticado desde el backend
   * @param email Email del usuario a obtener
   * @returns Observable con los datos del usuario
   */
  obtenerUsuarioAutenticado(email: string): Observable<any> {
    const token = this.getToken();

    if (!token) {
      console.error('⚠️ No hay token disponible, abortando solicitud.');
      return throwError(() => new Error('No hay token disponible.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams().set('email', email);

    return this.http.get<any>(this.API_USERS_URL, {
      headers: headers,
      params: params
    }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener usuario:', error);
        return throwError(() => new Error(error.error?.message || 'Ocurrió un error al obtener el usuario.'));
      })
    );
  }

  /**
   * Realiza el login del usuario
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @returns Observable con la respuesta del servidor
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.backendUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          localStorage.setItem('kc_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.authStatus.next(true);
          this.storeUserRoles(response.access_token);
          this.startTokenRefresh(); // Inicia el refresco automático

          const email = this.getUserEmail();
          if (email) {
            this.obtenerUsuarioAutenticado(email).subscribe({
              next: (usuario) => {
                console.log('✅ Usuario autenticado desde backend:', usuario[0]);
              },
              error: (err) => {
                console.error('❌ Error obteniendo usuario:', err);
              }
            });
          }
        }
      }),
      catchError(error => {
        console.error('❌ Error en el login:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el nombre de usuario desde el token
   * @returns Nombre de usuario o cadena vacía si no está disponible
   */
  getUsername(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      return decoded.preferred_username || '';
    } catch (error) {
      console.error('❌ Error al obtener el nombre de usuario:', error);
      return '';
    }
  }

  /**
   * Obtiene el rol principal del usuario
   * @returns Rol principal del usuario o 'Usuario' por defecto
   */
  getUserRole(): string {
    const roles = this.getStoredRoles();
    return roles.length > 0 ? roles[0] : 'Usuario';
  }

  /**
   * Almacena los roles del usuario en localStorage
   * @param token Token JWT del usuario
   * @private
   */
  private storeUserRoles(token: string) {
    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded.resource_access?.["registers-users-api-rest"]?.roles || [];
      localStorage.setItem('userRoles', JSON.stringify(roles));
    } catch (error) {
      console.error('❌ Error al decodificar el token:', error);
    }
  }

  /**
   * Obtiene los roles almacenados del usuario
   * @returns Array de roles del usuario
   */
  getStoredRoles(): string[] {
    const token = localStorage.getItem('kc_token');
    if (!token) return [];

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const realmRoles = tokenPayload.realm_access?.roles || [];
      const clientRoles = tokenPayload.resource_access?.['registers-users-api-rest']?.roles || [];

      return [...realmRoles, ...clientRoles];
    } catch (error) {
      console.error('❌ Error al obtener roles del token:', error);
      return [];
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * @param requiredRole Rol a verificar
   * @returns true si el usuario tiene el rol, false en caso contrario
   */
  hasRole(requiredRole: string): boolean {
    const userRoles = this.getStoredRoles();
    return userRoles.includes(requiredRole);
  }

  /**
   * Obtiene el token JWT del usuario
   * @returns Token JWT o null si no está disponible
   */
  getToken(): string | null {
    return localStorage.getItem('kc_token');
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si el usuario está autenticado, false en caso contrario
   */
  isLoggedIn(): boolean {
    const token = localStorage.getItem('kc_token');
    return !!token;
  }

  /**
   * Obtiene el email del usuario desde el token
   * @returns Email del usuario o null si no está disponible
   */
  getUserEmail(): string | null {
    const token = localStorage.getItem('kc_token');
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.email || null;
    } catch (error) {
      console.error('❌ Error al obtener el email del token:', error);
      return null;
    }
  }

  /**
   * Refresca el token JWT usando el refresh token
   * @returns Observable con la respuesta del servidor
   */
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
      console.error('⚠️ No hay refresh token válido en localStorage. Haciendo logout.');
      this.logout();
      return throwError(() => new Error('No hay refresh token disponible.'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const params = new HttpParams().set('refreshToken', refreshToken);

    return this.http.post<any>(`${this.backendUrl}/auth/refresh`, null, {
      headers: headers,
      params: params
    }).pipe(
      tap((response: any) => {
        if (!response?.access_token) {
          console.warn('⚠️ Respuesta inesperada del servidor:', response);
          throw new Error('Respuesta inválida del servidor');
        }

        console.log('🔄 Token refrescado con éxito');
        localStorage.setItem('kc_token', response.access_token);

        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }

        this.startTokenRefresh();
      }),
      catchError(error => {
        console.error('❌ Error al refrescar token:', error);

        if (error.status === 401 || error.status === 403) {
          console.warn('⚠️ Refresh token inválido o expirado');
          this.logout();
          this.router.navigate(['/login']);
        }

        return throwError(() => new Error('No se pudo refrescar el token.'));
      })
    );
  }

  /**
   * Obtiene los datos del usuario desde el token
   * @returns Objeto con los datos del usuario o null si no está disponible
   */
  getUserData(): any {
    const token = localStorage.getItem('kc_token');
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return {
        id: decoded.sub || '',
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

  /**
   * Obtiene el primer nombre del usuario
   * @returns Primer nombre del usuario o cadena vacía si no está disponible
   */
  getUserFirstName(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      return decoded.given_name || decoded.name || decoded.preferred_username || '';
    } catch (error) {
      console.error('❌ Error al obtener el nombre del usuario:', error);
      return '';
    }
  }

  /**
   * Obtiene el apellido del usuario
   * @returns Apellido del usuario o cadena vacía si no está disponible
   */
  getUserLastName(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      return decoded.family_name || decoded.last_name || '';
    } catch (error) {
      console.error('❌ Error al obtener el apellido del usuario:', error);
      return '';
    }
  }

  /**
   * Verifica si el usuario tiene alguno de los roles requeridos
   * @param requiredRoles Array de roles a verificar
   * @returns true si el usuario tiene al menos uno de los roles, false en caso contrario
   */
  hasAnyRole(requiredRoles: string[]): boolean {
    const userRoles = this.getStoredRoles();
    return requiredRoles.some(role => userRoles.includes(role));
  }

  /**
   * Obtiene el número de identificación del usuario
   * @returns Número de identificación o cadena vacía si no está disponible
   */
  getUserIdentificationNumber(): string {
    const token = localStorage.getItem('kc_token');
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      return decoded.identificationNumber ||
        decoded.identification_number ||
        decoded.documentNumber ||
        decoded.document_number ||
        decoded.attributes?.identificationNumber?.[0] ||
        '';
    } catch (error) {
      console.error('Error al obtener número de identificación:', error);
      return '';
    }
  }

  /**
   * Obtiene el nombre completo del usuario
   * @returns Nombre completo del usuario o cadena vacía si no está disponible
   */
  getUserFullName(): string {
    const firstName = this.getUserFirstName();
    const lastName = this.getUserLastName();
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Realiza el logout del usuario
   * - Elimina los tokens del almacenamiento local
   * - Detiene el refresco automático del token
   * - Redirige al usuario a la página principal
   */
  logout(): void {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRoles');
    this.authStatus.next(false);
    this.stopTokenRefresh();
    this.router.navigate(['/']);
  }

  /**
   * Obtiene el ID del usuario desde el token
   * @returns ID del usuario o null si no está disponible
   */
  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.sub || null;
    } catch (error) {
      console.error('Error decodificando token para obtener ID:', error);
      return null;
    }
  }

  /**
   * Actualiza los datos del usuario en el almacenamiento local
   * @param data Objeto con los datos a actualizar
   */
  updateUserData(data: { username?: string, role?: string, firstName?: string, lastName?: string }): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);

      if (data.username) {
        decoded.preferred_username = data.username;
        localStorage.setItem('current_username', data.username);
      }

      if (data.role) {
        const roles = this.getStoredRoles();
        if (!roles.includes(data.role)) {
          localStorage.setItem('userRoles', JSON.stringify([...roles, data.role]));
        }
      }

      this.authStatus.next(true);
      this.userProfile.next(this.getUserData());

    } catch (error) {
      console.error('Error actualizando datos de usuario:', error);
    }
  }

  /**
   * Obtiene el perfil completo del usuario
   * @returns Observable con los datos del perfil del usuario
   */
  getUserProfile(): Observable<any> {
    const userData = this.getUserData();
    if (userData) {
      return of(userData);
    }

    const email = this.getUserEmail();
    if (!email) {
      return throwError(() => new Error('No se pudo obtener el email del usuario'));
    }

    return this.obtenerUsuarioAutenticado(email).pipe(
      map((response: any) => {
        if (!response || !response[0]) {
          throw new Error('Respuesta inválida del servidor');
        }
        return response[0];
      }),
      catchError(error => {
        console.error('Error obteniendo perfil de usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza el token JWT con nueva información
   * @param newToken Nuevo token JWT
   */
  updateToken(newToken: string): void {
    localStorage.setItem('kc_token', newToken);
    this.storeUserRoles(newToken);
    this.authStatus.next(true);
    this.userProfile.next(this.getUserData());
  }

  /**
   * Actualiza los datos de un usuario en el backend
   * @param userId ID del usuario a actualizar
   * @param userData Datos nuevos del usuario
   * @returns Observable con la respuesta del servidor
   */
  updateUser(userId: string, userData: any): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No hay token disponible'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.API_USERS_URL}/update?userId=${encodeURIComponent(userId)}`;

    return this.http.put(url, userData, { headers }).pipe(
      catchError(error => {
        console.error('Error completo en updateUser:', error);
        let errorMessage = 'Error al actualizar el usuario';

        if (error.error) {
          errorMessage = error.error.message ||
            error.error.error ||
            JSON.stringify(error.error);
        } else if (error.message) {
          errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Obtiene un usuario por su ID
   * @param userId ID del usuario a obtener
   * @returns Observable con los datos del usuario
   */
  getUserById(userId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.API_USERS_URL}/${userId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching user:', error);
        return throwError(() => new Error(error.error?.message || 'Error fetching user'));
      })
    );
  }

  /**
   * Obtiene un usuario por su email
   * @param email Email del usuario a obtener
   * @returns Observable con los datos del usuario
   */
  obtenerUsuarioPorEmail(email: string): Observable<any> {
    const token = this.getToken();

    if (!token) {
      console.error('⚠️ No hay token disponible, abortando solicitud.');
      return throwError(() => new Error('No hay token disponible.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.API_USERS_URL}`;
    const params = new HttpParams().set('email', email);

    return this.http.get<any>(url, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener usuario:', error);
        return throwError(() => new Error(error.error?.message || 'Ocurrió un error al obtener el usuario.'));
      })
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {

  private readonly API_URL = 'http://localhost:8080';
  private readonly API_LAYERS = `${this.API_URL}/api/v1/ResearchLayer`;
  private readonly API_USERS = `${this.API_URL}/api/v1/users`;
  private readonly API_VARIABLES = `${this.API_URL}/api/v1/Variable`;

  private dataUpdated = new Subject<void>();
  private capaUpdated = new BehaviorSubject<void>(undefined);
  private varUpdated = new BehaviorSubject<void>(undefined);
  private userUpdated = new BehaviorSubject<void>(undefined);

  capaUpdated$ = this.capaUpdated.asObservable();
  varUpdated$ = this.varUpdated.asObservable();
  userUpdated$ = this.userUpdated.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) { }

  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  public notifyDataUpdated(): void {
    this.dataUpdated.next();
    this.capaUpdated.next();
    this.varUpdated.next();
    this.userUpdated.next();
  }

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

  private handleHttpError(operation: string = 'Operación'): (error: any) => Observable<never> {
    return (error: any): Observable<never> => {
      let errorMsg = `${operation} fallida.`;
      if (error.error?.message) {
        errorMsg += ` ${error.error.message}`;
      } else if (typeof error.error === 'string') {
        errorMsg += ` ${error.error}`;
      } else if (error.message) {
        errorMsg += ` ${error.message}`;
      } else {
        errorMsg += ' Error inesperado.';
      }
      console.error(`❌ ${operation}:`, error);
      return throwError(() => new Error(errorMsg));
    };
  }

  private isAdmin(): boolean {
    const token = localStorage.getItem('kc_token');
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      const clientRoles = decoded.resource_access?.['registers-users-api-rest']?.roles || [];
      const realmRoles = decoded.realm_access?.roles || [];
      return clientRoles.includes('Admin_client_role') ||
        clientRoles.includes('SuperAdmin_client_role') ||
        realmRoles.includes('SuperAdmin');
    } catch (error) {
      console.error('Error decodificando token:', error);
      return false;
    }
  }

  getAllLayers(): Observable<any[]> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }
    return this.http.get<any[]>(`${this.API_LAYERS}/GetAll`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleHttpError('Carga de capas')));
  }

  getLayerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_LAYERS}`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('id', id)
    }).pipe(
      catchError(this.handleHttpError('Consulta de capa por ID'))
    );
  }


  registrarCapa(capaData: any): Observable<any> {
    return this.http.post<any>(this.API_LAYERS, capaData, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Registro de capa'))
      );
  }

  actualizarCapa(id: string, capaData: any): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.put(`${this.API_LAYERS}?researchLayerId=${id}`, capaData, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Actualización de capa'))
      );
  }

  eliminarCapa(capaId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_LAYERS}?researchLayerId=${capaId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Eliminación de capa'))
    );
  }

  getAllUsuarios(): Observable<any[]> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.get<any[]>(`${this.API_USERS}/GetAll`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleHttpError('Carga de usuarios')));
  }

  crearUsuario(usuario: any): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.post<any>(`${this.API_USERS}/create`, usuario, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Creación de usuario'))
      );
  }

  updateUsuario(userId: string, usuario: any): Observable<any> {
    const url = `${this.API_USERS}/update?userId=${userId}`;
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        return '';
      }
    };

    const payload = {
      firstName: usuario.firstName || usuario.nombre,
      lastName: usuario.lastName || usuario.apellido,
      email: usuario.email,
      username: usuario.username || usuario.usuario,
      password: usuario.password || '',
      identificationType: usuario.identificationType || usuario.tipoDocumento,
      identificationNumber: usuario.identificationNumber || usuario.documento,
      birthDate: formatDate(usuario.birthDate || usuario.fechaNacimiento),
      researchLayer: usuario.researchLayer || usuario.capaRawValue || usuario.capaId,
      role: usuario.role
    };

    return this.http.put<any>(url, payload, { headers: this.getAuthHeaders() }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Actualización de usuario'))
    );
  }

  eliminarUsuario(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.delete<any>(`${this.API_USERS}/delete`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Eliminación de usuario'))
    );
  }

  enableUser(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.post(`${this.API_USERS}/enabledUser`, null, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Habilitar usuario'))
    );
  }

  disableUser(userId: string): Observable<any> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return this.http.post(`${this.API_USERS}/disableUser`, null, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('userId', userId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Deshabilitar usuario'))
    );
  }

  getAllVariables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_VARIABLES}/GetAll`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleHttpError('Carga de variables')));
  }

  crearVariable(variable: any): Observable<any> {
    return this.http.post<any>(this.API_VARIABLES, variable, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.notifyDataUpdated()),
        catchError(this.handleHttpError('Creación de variable'))
      );
  }

  eliminarVariable(variableId: string): Observable<any> {
    return this.http.delete<any>(this.API_VARIABLES, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('variableId', variableId)
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Eliminación de variable'))
    );
  }

  actualizarVariable(variable: any): Observable<any> {
    const variableData = {
      variableName: variable.variableName,
      description: variable.description,
      researchLayerId: variable.researchLayerId,
      type: variable.type,
      options: variable.options || []
    };
    return this.http.put<any>(`${this.API_VARIABLES}?variableId=${variable.id}`, variableData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.notifyDataUpdated()),
      catchError(this.handleHttpError('Actualización de variable'))
    );
  }

  obtenerVariablesPorCapa(capaId: string): Observable<any[]> {
    if (!capaId || capaId.trim() === '') {
      console.error('❌ ID de capa inválido:', capaId);
      return throwError(() => new Error('ID de capa no válido'));
    }

    const url = `${this.API_VARIABLES}/ResearchLayerId`;
    const params = new HttpParams().set('researchLayerId', capaId);

    console.log('🔎 Obteniendo variables para capa:', capaId);

    return this.http.get<any[]>(url, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(this.handleHttpError('Carga de variables por capa'))
    );
  }

  getVariableById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_VARIABLES}`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('id', id)
    }).pipe(
      catchError(this.handleHttpError('Consulta de variable por ID'))
    );
  }



  getRegistrosCapas(page: number = 0, size: number = 10, sort: string = 'registerDate', sortDirection: string = 'DESC') {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<any>(`${this.API_URL}/api/v1/registers`, { params })
      .pipe(catchError(this.handleHttpError('Carga de registros de capas')));
  }

  deleteRegistroCapa(registerId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/api/v1/registers`, {
      params: new HttpParams().set('registerId', registerId)
    }).pipe(catchError(this.handleHttpError('Eliminación de registro de capa')));
  }
}

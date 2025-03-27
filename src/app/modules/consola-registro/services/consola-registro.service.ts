import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/login/services/auth.service';
import { ResearchLayer, Variable, Register } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ConsolaRegistroService {
  private readonly API_URL = 'http://localhost:8080/api/v1/registers';
  private readonly API_USERS_URL = 'http://localhost:8080/api/v1/users';
  private readonly API_VARIABLE_URL = 'http://localhost:8080/api/v1/Variable';
  private readonly API_RESEARCH_LAYER_URL = 'http://localhost:8080/api/v1/ResearchLayer';
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

  private isDoctor(): boolean {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    return userRoles.includes('Doctor_client_role');
  }

  private checkDoctorPermission(): void {
    if (!this.isDoctor()) {
      throw new Error('⛔ Acceso denegado: solo los doctores pueden realizar esta acción.');
    }
  }

  private handleRequest<T>(obs: Observable<T>, successMsg: string): Observable<T> {
    try {
      this.checkDoctorPermission();

      return obs.pipe(
        tap(response => console.log(successMsg, response)),
        catchError(error => {
          console.error('❌ Error en la petición:', error);
          return throwError(() => new Error(error.error?.message || 'Ocurrió un error en la solicitud.'));
        })
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  // 📌 Obtener información del usuario autenticado (solo doctores)
  obtenerUsuarioAutenticado(email: string): Observable<any> {
    const token = this.authService.getToken();

    if (!token) {
      console.error('⚠️ No hay token disponible, abortando solicitud.');
      return throwError(() => new Error('No hay token disponible.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Usar HttpParams para el parámetro query
    const params = new HttpParams().set('email', email);

    return this.http.get<any>(`${this.API_USERS_URL}`, {
      headers: headers,
      params: params
    }).pipe(
      tap(data => console.log('✅ Usuario autenticado:', data)),
      catchError(error => {
        console.error('❌ Error al obtener usuario:', error);
        return throwError(() => new Error(error.error?.message || 'Ocurrió un error al obtener el usuario.'));
      })
    );
  }

  // 📌 Registrar un nuevo registro (solo doctores)
  registrarRegistro(registerData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.API_URL, registerData, { headers }).pipe(
      catchError(error => {
        console.error('Error en el registro:', error);
        return throwError(() => error);
      })
    );
  }

  // 📌 Obtener todos los registros paginados (solo doctores)
  obtenerRegistros(page: number = 0, size: number = 10, sort: string = 'registerDate', sortDirection: string = 'DESC') {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('sortDirection', sortDirection);

    return this.http.get<any>('http://localhost:8080/api/v1/registers/all', { params })
      .pipe(
        catchError(error => {
          console.error('Error en obtenerRegistros:', error);
          return throwError(() => new Error('Error al cargar registros'));
        })
      );
  }


  // 📌 Actualizar un registro (solo doctores)
  // consola-registro.service.ts
  actualizarRegistro(registerId: string, registerData: Partial<Register>) {
    return this.http.put<Register>(`/api/v1/registers?registerId=${registerId}`, registerData);
  }

  // 📌 Eliminar un registro (solo doctores) - Ejemplo adicional
  eliminarRegistro(registerId: string): Observable<any> {
    return this.handleRequest(
      this.http.delete(`${this.API_URL}?registerId=${registerId}`, {
        headers: this.getAuthHeaders()
      }),
      `🗑️ Registro eliminado (ID: ${registerId})`
    ).pipe(tap(() => this.notifyDataUpdated()));
  }

  /**
     * Obtiene todas las capas de investigación
     */
  obtenerTodasLasCapas(): Observable<ResearchLayer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ResearchLayer[]>(`${this.API_RESEARCH_LAYER_URL}/GetAll`, { headers }).pipe(
      tap(response => console.log('Todas las capas obtenidas:', response)),
      catchError(error => {
        console.error('Error al obtener todas las capas:', error);
        return throwError(() => new Error('Error al obtener la lista de capas'));
      })
    );
  }

  /**
   * Busca una capa por nombre (insensible a mayúsculas)
   */
  buscarCapaPorNombre(nombreCapa: string): Observable<ResearchLayer> {
    return this.obtenerTodasLasCapas().pipe(
      map(capas => {
        const capaEncontrada = capas.find(c =>
          c.layerName.toLowerCase() === nombreCapa.toLowerCase()
        );

        if (!capaEncontrada) {
          throw new Error(`No se encontró la capa: ${nombreCapa}`);
        }
        return capaEncontrada;
      }),
      catchError(error => {
        console.error('Error al buscar capa:', error);
        return throwError(() => new Error(error.message || 'Error al buscar capa'));
      })
    );
  }

  /**
   * Obtiene información completa de una capa por su nombre
   */
  obtenerCapaCompleta(nombreCapa: string): Observable<ResearchLayer> {
    return this.buscarCapaPorNombre(nombreCapa).pipe(
      switchMap(capa => {
        return this.obtenerDetallesCapa(capa.id).pipe(
          map(detalles => ({
            ...capa,
            ...detalles
          }))
        );
      })
    );
  }

  /**
   * Obtiene detalles adicionales de una capa por ID
   */
  private obtenerDetallesCapa(id: string): Observable<Partial<ResearchLayer>> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id);

    return this.http.get<Partial<ResearchLayer>>(this.API_RESEARCH_LAYER_URL, {
      headers,
      params
    }).pipe(
      catchError(error => {
        console.error('Error al obtener detalles:', error);
        return throwError(() => new Error('Error al obtener detalles de la capa'));
      })
    );
  }

  obtenerVariablesPorCapa(researchLayerId: string): Observable<Variable[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('researchLayerId', researchLayerId);

    return this.http.get<Variable[]>(`${this.API_VARIABLE_URL}/ResearchLayerId`, {
      headers,
      params
    }).pipe(
      tap(response => console.log('Variables obtenidas:', response)),
      catchError(error => {
        console.error('Error al obtener variables:', error);
        return throwError(() => new Error('Error al obtener variables de la capa'));
      })
    );
  }

}
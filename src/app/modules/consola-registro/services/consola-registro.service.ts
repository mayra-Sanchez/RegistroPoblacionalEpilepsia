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

  private dataChanged = new Subject<void>();

  // Observable que otros componentes pueden suscribirse
  dataChanged$ = this.dataChanged.asObservable();

  // Método para notificar cambios
  notifyDataChanged() {
    this.dataChanged.next();
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
  actualizarRegistro(registerId: string, data: any): Observable<any> {
    // First verify doctor role
    if (!this.isDoctor()) {
      return throwError(() => new Error('⛔ Acceso denegado: solo los doctores pueden realizar esta acción.'));
    }

    // Ensure we have a valid token
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('⚠️ No hay token disponible.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Format dates before sending
    const formattedData = this.formatRegisterData(data);

    return this.http.put(this.API_URL, formattedData, {
      headers: headers,
      params: { registerId }
    }).pipe(
      tap(() => console.log('✅ Registro actualizado exitosamente')),
      catchError(error => {
        console.error('❌ Error al actualizar registro:', error);

        if (error.status === 401) {
          // Handle token refresh or re-authentication
          return throwError(() => new Error('🔐 Sesión expirada. Por favor inicie sesión nuevamente.'));
        } else if (error.status === 403) {
          return throwError(() => new Error('⛔ No tiene permisos para realizar esta acción.'));
        } else {
          return throwError(() => new Error(error.error?.message || 'Error desconocido al actualizar el registro.'));
        }
      })
    );
  }

  private formatRegisterData(data: any): any {
    // Clone the data to avoid modifying the original
    const formattedData = { ...data };

    // Format dates to 'dd-MM-yyyy'
    if (formattedData.patient?.birthDate) {
      formattedData.patient.birthDate = this.formatDateToBackend(data.patient.birthDate);
    }
    if (formattedData.patient?.deathDate) {
      formattedData.patient.deathDate = this.formatDateToBackend(data.patient.deathDate);
    }

    return formattedData;
  }

  private formatDateToBackend(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
     * Obtiene todas las capas de investigación
     */
  obtenerTodasLasCapas(): Observable<ResearchLayer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ResearchLayer[]>(`${this.API_RESEARCH_LAYER_URL}/GetAll`, { headers }).pipe(
      tap(response => console.log('Todas las capas obtenidas:', response)), // <-- Añade esto
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
   * Obtiene una capa completa por su ID
   */
  obtenerCapaPorId(id: string): Observable<ResearchLayer> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id);

    return this.http.get<ResearchLayer>(this.API_RESEARCH_LAYER_URL, {
      headers,
      params
    }).pipe(
      catchError(error => {
        console.error('Error al obtener capa por ID:', error);
        return throwError(() => new Error(`No se encontró la capa con ID: ${id}`));
      })
    );
  }
  /**
 * Obtiene detalles adicionales de una capa por ID
 */
  private obtenerDetallesCapa(id: string): Observable<ResearchLayer> {  // Cambiado a ResearchLayer en lugar de Partial
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id);

    return this.http.get<ResearchLayer>(this.API_RESEARCH_LAYER_URL, {
      headers,
      params
    }).pipe(
      tap(response => console.log('Detalles de capa obtenidos:', response)),
      catchError(error => {
        console.error('Error al obtener detalles:', error);
        if (error.status === 404) {
          return throwError(() => new Error(`No se encontró la capa con ID: ${id}`));
        }
        return throwError(() => new Error(`Error del servidor al obtener la capa: ${error.message}`));
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
      catchError(error => {
        console.error('Error al obtener variables:', error);
        return throwError(() => new Error('Error al obtener variables de la capa'));
      })
    );
  }

}
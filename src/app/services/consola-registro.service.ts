import { Injectable } from '@angular/core';
import { formatDate } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { ResearchLayer, Variable, Register } from '../modules/consola-registro/interfaces';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsolaRegistroService {
  //#region Constantes de URL
  private readonly API_REGISTERS = `${environment.backendUrl}${environment.endpoints.registers}`;
  private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;
  private readonly API_LAYERS = `${environment.backendUrl}${environment.endpoints.researchLayer}`;
  private readonly API_VARIABLES = `${environment.backendUrl}${environment.endpoints.variables}`;

  //#endregion

  //#region Subjects y Observables
  private dataUpdated = new Subject<void>();
  private dataChanged = new Subject<void>();
  //#endregion

  constructor(private http: HttpClient, private authService: AuthService) { }

  //#region Métodos Públicos
  getDataUpdatedListener(): Observable<void> {
    return this.dataUpdated.asObservable();
  }

  dataChanged$ = this.dataChanged.asObservable();

  notifyDataChanged() {
    this.dataChanged.next();
  }
  //#endregion

  //#region Métodos de Autenticación y Autorización
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private isDoctor(): boolean {
    try {
      const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      return userRoles.includes('Doctor_client_role');
    } catch (error) {
      console.error('Error parsing user roles:', error);
      return false;
    }
  }
  //#endregion

  //#region Métodos de Usuarios
  obtenerUsuarioAutenticado(email: string): Observable<any> {
    if (!email) {
      return throwError(() => this.createError('Email is required', 'VALIDATION_ERROR'));
    }

    try {
      const token = this.authService.getToken();
      if (!token) {
        return throwError(() => this.createError('No authentication token available', 'AUTH_ERROR'));
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const params = new HttpParams().set('email', email);

      return this.http.get<any>(`${this.API_USERS}`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch user'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }
  //#endregion

  //#region Métodos de Registros
  registrarRegistro(registerData: any, userEmail: string): Observable<any> {
    if (!userEmail) {
      return throwError(() => this.createError('User email is required', 'VALIDATION_ERROR'));
    }

    if (!registerData) {
      return throwError(() => this.createError('Register data is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('userEmail', userEmail);

      return this.http.post(this.API_REGISTERS, registerData, { headers, params }).pipe(
        tap(() => console.log('Register created successfully')),
        catchError(error => this.handleHttpError(error, 'Failed to create register'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerRegistros(
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    try {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/all`, { params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerRegistrosPorProfesional(
    healthProfessionalId: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    if (!healthProfessionalId) {
      return throwError(() => this.createError('Health professional ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('healthProfesionalIdentificationNumber', healthProfessionalId.toString())
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/allByHealtProfessional`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers by professional'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerRegistrosPorPaciente(
    patientIdentificationNumber: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<any> {
    if (!patientIdentificationNumber) {
      return throwError(() => this.createError('Patient identification number is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('patientIdentificationNumber', patientIdentificationNumber.toString())
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/allByPatient`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch registers by patient'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerRegistrosPorCapa(
    researchLayerId: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'registerDate',
    sortDirection: string = 'DESC'
  ): Observable<{ registers: Register[], currentPage: number, totalPages: number, totalElements: number }> {
    // Validate input
    if (!researchLayerId) {
      return throwError(() => this.createError('Research layer ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('researchLayerId', researchLayerId)
        .set('page', page.toString())
        .set('size', size.toString())
        .set('sort', sort)
        .set('sortDirection', sortDirection);

      return this.http.get<any>(`${this.API_REGISTERS}/allByResearchLayer`, { headers, params }).pipe(
        tap(response => console.log('API Response:', response)),
        map(response => {
          if (!response) {
            throw this.createError('Empty response from server', 'EMPTY_RESPONSE');
          }
          return {
            registers: response.registers || [],
            currentPage: response.currentPage || 0,
            totalPages: response.totalPages || 0,
            totalElements: response.totalElements || 0
          };
        }),
        catchError(error => {
          console.error('Detailed API Error:', {
            url: error.url,
            status: error.status,
            error: error.error,
            message: error.message
          });
          return this.handleHttpError(error, 'Failed to fetch registers by research layer');
        })
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  actualizarRegistro(registerId: string, data: any): Observable<any> {
    if (!registerId) {
      return throwError(() => this.createError('Register ID is required', 'VALIDATION_ERROR'));
    }

    if (!data) {
      return throwError(() => this.createError('Update data is required', 'VALIDATION_ERROR'));
    }

    if (!this.isDoctor()) {
      return throwError(() => this.createError('Only doctors can perform this action', 'AUTH_ERROR', null, 403));
    }

    try {
      const userEmail = this.authService.getUserEmail();
      if (!userEmail) {
        return throwError(() => this.createError('User email not available', 'AUTH_ERROR'));
      }

      // Ensure variables array exists
      if (!data.variablesRegister || !Array.isArray(data.variablesRegister)) {
        data.variablesRegister = [];
      }

      // Format dates and prepare payload
      const formattedData = this.formatRegisterData(data);

      const token = this.authService.getToken();
      if (!token) {
        return throwError(() => this.createError('No authentication token available', 'AUTH_ERROR'));
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const params = new HttpParams()
        .set('registerId', registerId)
        .set('userEmail', userEmail);

      return this.http.put(this.API_REGISTERS, formattedData, { headers, params }).pipe(
        tap(() => {
          this.notifyDataChanged();
        }),
        catchError(error => {
          console.error('Detailed error:', {
            url: error.url,
            status: error.status,
            error: error.error,
            message: error.message
          });
          return this.handleHttpError(error, 'Failed to update register');
        })
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }
  //#endregion

  //#region Métodos de Capas de Investigación
  obtenerTodasLasCapas(): Observable<ResearchLayer[]> {
    try {
      const headers = this.getAuthHeaders();
      return this.http.get<ResearchLayer[]>(`${this.API_LAYERS}/GetAll`, { headers }).pipe(
        tap(response => console.log('All layers fetched:', response)),
        catchError(error => this.handleHttpError(error, 'Failed to fetch all research layers'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  buscarCapaPorNombre(nombreCapa: string): Observable<ResearchLayer> {
    if (!nombreCapa) {
      return throwError(() => this.createError('Layer name is required', 'VALIDATION_ERROR'));
    }

    return this.obtenerTodasLasCapas().pipe(
      map(capas => {
        const capaEncontrada = capas.find(c =>
          c.layerName.toLowerCase() === nombreCapa.toLowerCase()
        );

        if (!capaEncontrada) {
          throw this.createError(`Layer not found: ${nombreCapa}`, 'NOT_FOUND_ERROR');
        }
        return capaEncontrada;
      }),
      catchError(error => {
        if (error.code === 'NOT_FOUND_ERROR') {
          return throwError(() => error);
        }
        return throwError(() => this.createError('Failed to search layer', 'SEARCH_ERROR', error));
      })
    );
  }

  obtenerCapaCompleta(nombreCapa: string): Observable<ResearchLayer> {
    return this.buscarCapaPorNombre(nombreCapa).pipe(
      switchMap(capa => {
        return this.obtenerDetallesCapa(capa.id).pipe(
          map(detalles => ({
            ...capa,
            ...detalles
          })),
          catchError(error => throwError(() =>
            this.createError('Failed to get layer details', 'DETAILS_FETCH_ERROR', error)
          ))
        );
      }),
      catchError(error => throwError(() =>
        this.createError('Failed to get complete layer', 'LAYER_FETCH_ERROR', error)
      ))
    );
  }

  obtenerCapaPorId(id: string): Observable<ResearchLayer> {
    if (!id) {
      return throwError(() => this.createError('Layer ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('id', id);

      return this.http.get<ResearchLayer>(this.API_LAYERS, { headers, params }).pipe(
        tap((capa: ResearchLayer) => {
          try {
            localStorage.setItem('capaInvestigacion', JSON.stringify(capa));
          } catch (storageError) {
            console.error('Failed to store layer in localStorage:', storageError);
          }
        }),
        catchError(error => this.handleHttpError(error, `Failed to fetch layer with ID: ${id}`))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }
  //#endregion

  //#region Métodos de Variables
  obtenerVariablesPorCapa(researchLayerId: string): Observable<Variable[]> {
    if (!researchLayerId) {
      return throwError(() => this.createError('Research layer ID is required', 'VALIDATION_ERROR'));
    }

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('researchLayerId', researchLayerId);

      return this.http.get<Variable[]>(`${this.API_VARIABLES}/ResearchLayerId`, { headers, params }).pipe(
        catchError(error => this.handleHttpError(error, 'Failed to fetch variables for layer'))
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }
  //#endregion

  //#region Métodos Privados

  private validateRegisterData(data: any): void {
    if (!data.patient) {
      throw new Error('Patient data is required');
    }
    if (!data.variablesRegister) {
      data.variablesRegister = [];
    }
  }

  private formatRegisterData(data: any): any {
    try {
      this.validateRegisterData(data);

      const formattedData = { ...data };

      // Format dates
      if (formattedData.patient?.birthDate) {
        formattedData.patient.birthDate = this.formatDateToBackend(data.patient.birthDate);
      }
      if (formattedData.patient?.deathDate) {
        formattedData.patient.deathDate = this.formatDateToBackend(data.patient.deathDate);
      }

      return formattedData;
    } catch (error) {
      console.error('Error formatting register data:', error);
      throw this.createError('Failed to format register data', 'DATA_FORMAT_ERROR', error);
    }
  }

  private formatDateToBackend(dateString: string | null | undefined): string | null {
    if (!dateString) return null;

    try {
      // Handle multiple possible date formats
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) { // dd-MM-yyyy format
        const [day, month, year] = dateString.split('-');
        return `${year}-${month}-${day}`; // Convert to yyyy-MM-dd
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) { // Already yyyy-MM-dd
        return dateString;
      }

      // Fallback for Date objects or other formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      return formatDate(date, 'yyyy-MM-dd', 'en-US');
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateString; // fallback
    }
  }

  private obtenerDetallesCapa(id: string): Observable<ResearchLayer> {
    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams().set('id', id);

      return this.http.get<ResearchLayer>(this.API_LAYERS, { headers, params }).pipe(
        tap(response => console.log('Layer details fetched:', response)),
        catchError(error => {
          if (error.status === 404) {
            throw this.createError(`Layer not found with ID: ${id}`, 'NOT_FOUND_ERROR', error);
          }
          throw this.createError('Server error fetching layer', 'SERVER_ERROR', error);
        })
      );
    } catch (error) {
      return throwError(() => this.createError('Failed to prepare request', 'REQUEST_PREPARATION_ERROR', error));
    }
  }

  obtenerResearchLayerIdsPorProfesional(healthProfessionalId: number): Observable<string[]> {
    if (!healthProfessionalId) {
      return throwError(() => this.createError('Health professional ID is required', 'VALIDATION_ERROR'));
    }

    return this.obtenerRegistrosPorProfesional(healthProfessionalId, 0, 100, 'registerDate', 'DESC').pipe(
      map(response => {
        try {
          const registros: Register[] = response.registers || [];
          const layerIds = new Set<string>();

          registros.forEach((reg: Register) => {
            reg.variablesRegister.forEach((variable: { researchLayerId?: string }) => {
              if (variable.researchLayerId) {
                layerIds.add(variable.researchLayerId);
              }
            });
          });

          return Array.from(layerIds);
        } catch (error) {
          throw this.createError('Failed to process research layer IDs', 'PROCESSING_ERROR', error);
        }
      }),
      catchError(error => throwError(() =>
        this.createError('Failed to fetch research layers for professional', 'FETCH_ERROR', error)
      ))
    );
  }

  private handleHttpError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    console.error('HTTP Error:', error);

    if (error.status === 0) {
      // Network error
      return throwError(() => this.createError('Network error - please check your connection', 'NETWORK_ERROR', error));
    }

    if (error.status === 401) {
      // Unauthorized
      return throwError(() => this.createError('Session expired - please login again', 'AUTH_ERROR', error, 401));
    }

    if (error.status === 403) {
      // Forbidden
      return throwError(() => this.createError('You do not have permission for this action', 'PERMISSION_ERROR', error, 403));
    }

    if (error.status === 404) {
      // Not found
      return throwError(() => this.createError('Resource not found', 'NOT_FOUND_ERROR', error, 404));
    }

    if (error.status >= 500) {
      // Server error
      return throwError(() => this.createError('Server error - please try again later', 'SERVER_ERROR', error, error.status));
    }

    // Business logic error from server
    const serverMessage = error.error?.message || error.message || defaultMessage;
    return throwError(() => this.createError(serverMessage, 'API_ERROR', error, error.status));
  }

  private createError(
    message: string,
    code: string,
    originalError?: any,
    status?: number
  ): ErrorWithCode {
    const error = new Error(message) as ErrorWithCode;
    error.code = code;
    error.originalError = originalError;
    error.status = status;
    return error;
  }
  //#endregion
}

interface ErrorWithCode extends Error {
  code: string;
  originalError?: any;
  status?: number;
}
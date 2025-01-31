import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {
  private apiUrl = 'http://localhost:8080';

  private capasUpdated = new Subject<void>(); // Notifica cambios en capas
  private variablesUpdated = new Subject<void>();

  constructor(private http: HttpClient) {}

  // Escuchadores para actualizaciones en capas y variables
  getCapasUpdatedListener(): Observable<void> {
    return this.capasUpdated.asObservable();
  }

  getVariablesUpdatedListener(): Observable<void> {
    return this.variablesUpdated.asObservable();
  }

  // Obtener todas las capas
  getAllLayers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ResearchLayer/GetAll`).pipe(
      tap((data) => console.log('Capas obtenidas:', data)),
      catchError((error) => {
        console.error('Error al obtener las capas:', error);
        return throwError(() => new Error('No se pudieron obtener las capas.'));
      })
    );
  }

  // Registrar una nueva capa
  registrarCapa(capa: any): Observable<any> {
    const capaData = {
      id: capa.id || null,
      nombreCapa: capa.nombreCapa,
      descripcion: capa.descripcion,
      jefeCapa: {
        id: capa.jefeCapa?.id || 1,
        nombre: capa.jefeCapa?.nombre,
        numero_identificacion: capa.jefeCapa?.numero_identificacion
      }
    };

    return this.http.post<any>(`${this.apiUrl}/ResearchLayer`, capaData).pipe(
      tap(() => {
        console.log('Capa registrada:', capaData);
        this.capasUpdated.next(); // Notificar actualización
      }),
      catchError((error) => {
        console.error('Error al registrar la capa:', error);
        return throwError(() => new Error('No se pudo registrar la capa.'));
      })
    );
  }

  // Obtener capa por ID
  getLayerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ResearchLayer/${id}`).pipe(
      tap((data) => console.log(`Capa obtenida (ID: ${id}):`, data)),
      catchError((error) => {
        console.error('Error al obtener la capa:', error);
        return throwError(() => new Error('No se pudo obtener la capa.'));
      })
    );
  }

  // Crear una nueva variable
  crearVariable(variable: any): Observable<any> {
    const variableData = {
      id: variable.id || null,
      idCapaInvestigacion: variable.idCapaInvestigacion,
      nombreVariable: variable.nombreVariable,
      descripcion: variable.descripcion,
      tipo: variable.tipo
    };

    return this.http.post<any>(`${this.apiUrl}/Variable`, variableData).pipe(
      tap(() => {
        console.log('Variable creada:', variableData);
        this.variablesUpdated.next(); // Notificar actualización
      }),
      catchError((error) => {
        console.error('Error al crear la variable:', error);
        return throwError(() => new Error('No se pudo crear la variable.'));
      })
    );
  }

  // Obtener todas las variables
  getAllVariables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Variable/GetAll`).pipe(
      tap((data) => console.log('Variables obtenidas:', data)),
      catchError((error) => {
        console.error('Error al obtener las variables:', error);
        return throwError(() => new Error('No se pudieron obtener las variables.'));
      })
    );
  }

  // Crear un nuevo usuario
  crearUsuario(usuario: any): Observable<any> {
    const usuarioData = {
      username: usuario.username,
      email: usuario.email,
      firstName: usuario.firstName,
      lastName: usuario.lastName,
      password: usuario.password,
      roles: usuario.roles || []
    };

    return this.http.post<any>(`${this.apiUrl}/User/create`, usuarioData).pipe(
      tap(() => console.log('Usuario creado:', usuarioData)),
      catchError((error) => {
        console.error('Error al crear el usuario:', error);
        return throwError(() => new Error('No se pudo crear el usuario.'));
      })
    );
  }

  // Eliminar una capa
  eliminarCapa(capaId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/ResearchLayer/${capaId}`).pipe(
      tap(() => {
        console.log(`Capa eliminada (ID: ${capaId})`);
        this.capasUpdated.next(); // Notificar actualización
      }),
      catchError((error) => {
        console.error('Error al eliminar la capa:', error);
        return throwError(() => new Error('No se pudo eliminar la capa.'));
      })
    );
  }
}

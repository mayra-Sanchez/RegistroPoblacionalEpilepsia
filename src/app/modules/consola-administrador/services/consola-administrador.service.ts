import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {
  private apiUrl = 'http://localhost:8080';

  private capasUpdated = new Subject<void>();     // Notifica cambios en capas
  private variablesUpdated = new Subject<void>();  // Notifica cambios en variables
  private usuariosUpdated = new Subject<void>();   // Notifica cambios en usuarios

  constructor(private http: HttpClient) {}

  // Listeners para actualizaciones
  getCapasUpdatedListener(): Observable<void> {
    return this.capasUpdated.asObservable();
  }
  getVariablesUpdatedListener(): Observable<void> {
    return this.variablesUpdated.asObservable();
  }
  getUsuariosUpdatedListener(): Observable<void> {
    return this.usuariosUpdated.asObservable();
  }

  // Métodos para ResearchLayer (Capas)
  getAllLayers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/ResearchLayer/GetAll`).pipe(
      tap(data => console.log('Capas obtenidas:', data)),
      catchError(error => {
        console.error('Error al obtener las capas:', error);
        return throwError(() => new Error('No se pudieron obtener las capas.'));
      })
    );
  }

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

    return this.http.post<any>(`${this.apiUrl}/api/v1/ResearchLayer`, capaData).pipe(
      tap(() => {
        console.log('Capa registrada:', capaData);
        this.capasUpdated.next();
      }),
      catchError(error => {
        console.error('Error al registrar la capa:', error);
        return throwError(() => new Error('No se pudo registrar la capa.'));
      })
    );
  }

  getLayerById(id: string): Observable<any> {
    // Se asume que el controlador espera un parámetro "id"
    return this.http.get<any>(`${this.apiUrl}/api/v1/ResearchLayer?id=${id}`).pipe(
      tap(data => console.log(`Capa obtenida (ID: ${id}):`, data)),
      catchError(error => {
        console.error('Error al obtener la capa:', error);
        return throwError(() => new Error('No se pudo obtener la capa.'));
      })
    );
  }

  eliminarCapa(capaId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/v1/ResearchLayer?researchLayerId=${capaId}`).pipe(
      tap(() => {
        console.log(`Capa eliminada (ID: ${capaId})`);
        this.capasUpdated.next();
      }),
      catchError(error => {
        console.error('Error al eliminar la capa:', error);
        return throwError(() => new Error('No se pudo eliminar la capa.'));
      })
    );
  }

  // Métodos para Variable
  crearVariable(variable: any): Observable<any> {
    const variableData = {
      id: variable.id || null,
      idCapaInvestigacion: variable.idCapaInvestigacion,
      nombreVariable: variable.nombreVariable,
      descripcion: variable.descripcion,
      tipo: variable.tipo
    };

    return this.http.post<any>(`${this.apiUrl}/api/v1/Variable`, variableData).pipe(
      tap(() => {
        console.log('Variable creada:', variableData);
        this.variablesUpdated.next();
      }),
      catchError(error => {
        console.error('Error al crear la variable:', error);
        return throwError(() => new Error('No se pudo crear la variable.'));
      })
    );
  }

  getAllVariables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/Variable/GetAll`).pipe(
      tap(data => console.log('Variables obtenidas:', data)),
      catchError(error => {
        console.error('Error al obtener las variables:', error);
        return throwError(() => new Error('No se pudieron obtener las variables.'));
      })
    );
  }

  eliminarVariable(variableId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/v1/Variable?variableId=${variableId}`).pipe(
      tap(() => {
        console.log(`Variable eliminada (ID: ${variableId})`);
        this.variablesUpdated.next();
      }),
      catchError(error => {
        console.error('Error al eliminar la variable:', error);
        return throwError(() => new Error('No se pudo eliminar la variable.'));
      })
    );
  }

  // Métodos para Usuario
  crearUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Users/create`, usuario).pipe(
      tap(() => {
        console.log('Usuario creado:', usuario);
        this.usuariosUpdated.next();
      }),
      catchError(error => {
        console.error('Error al crear el usuario:', error);
        return throwError(() => new Error('No se pudo crear el usuario.'));
      })
    );
  }

  getAllUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Users/GetAll`).pipe(
      tap(data => console.log('Usuarios obtenidos:', data)),
      catchError(error => {
        console.error('Error al obtener los usuarios:', error);
        return throwError(() => new Error('No se pudieron obtener los usuarios.'));
      })
    );
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/Users/delete?userId=${id}`).pipe(
      tap(() => {
        console.log(`Usuario eliminado (ID: ${id})`);
        this.usuariosUpdated.next();
      }),
      catchError(error => {
        console.error('Error al eliminar el usuario:', error);
        return throwError(() => new Error('No se pudo eliminar el usuario.'));
      })
    );
  }

  getVariableById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/Variable?id=${id}`).pipe(
      tap(data => console.log(`Variable obtenida (ID: ${id}):`, data)),
      catchError(error => {
        console.error('Error al obtener la variable:', error);
        return throwError(() => new Error('No se pudo obtener la variable.'));
      })
    );
  }
  
  actualizarVariable(variable: any): Observable<any> {
    const variableData = {
      id: variable.id,
      idCapaInvestigacion: variable.idCapaInvestigacion,
      nombreVariable: variable.nombreVariable,
      descripcion: variable.descripcion,
      tipo: variable.tipo
    };
  
    return this.http.put<any>(`${this.apiUrl}/api/v1/Variable`, variableData).pipe(
      tap(() => {
        console.log('Variable actualizada:', variableData);
        this.variablesUpdated.next();
      }),
      catchError(error => {
        console.error('Error al actualizar la variable:', error);
        return throwError(() => new Error('No se pudo actualizar la variable.'));
      })
    );
  }
  
}

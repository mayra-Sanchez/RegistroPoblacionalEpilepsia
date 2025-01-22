import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsolaAdministradorService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Método para obtener todas las capas
  getAllLayers(): Observable<any[]> {
    const headers = new HttpHeaders()
      .set('Accept', 'application/json');

    return this.http.get<any[]>(`${this.apiUrl}/ResearchLayer/GetAll`, { headers }).pipe(
      tap((data) => {
        console.log('Capas obtenidas del backend:', data);
      }),
      catchError((error) => {
        console.error('Error al obtener las capas:', error);
        return throwError(() => new Error('No se pudieron obtener las capas del servidor.'));
      })
    );
  }

  // Método para registrar una nueva capa
  registrarCapa(capa: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    // Estructura de datos enviada al backend
    const capaData = {
      id: capa.id || null, // Si no hay id, enviar null
      nombreCapa: capa.nombreCapa, // Nombre de la capa
      descripcion: capa.descripcion, // Descripción de la capa
      jefeCapa: {
        id: capa.jefeCapa?.id || 1, // ID del jefe de capa, por defecto 1 si no está presente
        nombre: capa.jefeCapa?.nombre, // Nombre del jefe de capa
        numero_identificacion: capa.jefeCapa?.numero_identificacion // Número de identificación
      }
    };

    console.log('Datos enviados para registrar la capa:', capaData);

    return this.http.post<any>(`${this.apiUrl}/ResearchLayer`, capaData, { headers }).pipe(
      tap((response) => {
        console.log('Respuesta del servidor al registrar capa:', response);
      }),
      catchError((error) => {
        console.error('Error al registrar la capa:', error);
        return throwError(() => new Error('No se pudo registrar la capa. Por favor, verifica los datos y vuelve a intentarlo.'));
      })
    );
  }

  // Método para obtener una capa de investigación por ID
  getLayerById(id: string): Observable<any> {
    const headers = new HttpHeaders().set('Accept', 'application/json');
    return this.http.get<any>(`${this.apiUrl}/ResearchLayer/${id}`, { headers }).pipe(
      tap((data) => {
        console.log(`Capa obtenida del backend con ID ${id}:`, data);
      }),
      catchError((error) => {
        console.error('Error al obtener la capa por ID:', error);
        return throwError(() => new Error('No se pudo obtener la capa. Verifica el ID.'));
      })
    );
  }

   // Método para crear una nueva variable
   crearVariable(variable: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    // Estructura de datos enviada al backend
    const variableData = {
      id: variable.id || null,  
      idCapaInvestigacion: variable.idCapaInvestigacion,
      nombreVariable: variable.nombreVariable,
      descripcion: variable.descripcion,
      tipo: variable.tipo
    };

    console.log('Datos enviados para crear variable:', variableData);

    return this.http.post<any>(`${this.apiUrl}/Variable`, variableData, { headers }).pipe(
      tap((response) => {
        console.log('Respuesta del servidor al crear variable:', response);
      }),
      catchError((error) => {
        console.error('Error al crear la variable:', error);
        return throwError(() => new Error('No se pudo crear la variable. Por favor, verifica los datos y vuelve a intentarlo.'));
      })
    );
  }

  getAllVariables(): Observable<any[]> {
    const headers = new HttpHeaders().set('Accept', 'application/json');
    
    return this.http.get<any[]>(`${this.apiUrl}/Variable/GetAll`, { headers }).pipe(
      tap((data) => {
        console.log('Variables obtenidas del backend:', data);
      }),
      catchError((error) => {
        console.error('Error al obtener las variables:', error);
        return throwError(() => new Error('No se pudieron obtener las variables del servidor.'));
      })
    );
  }

   // Método para crear un nuevo usuario
   crearUsuario(usuario: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    // Estructura de datos enviada al backend
    const usuarioData = {
      username: usuario.username, 
      email: usuario.email,       
      firstName: usuario.firstName, 
      lastName: usuario.lastName,   
      password: usuario.password,   
      roles: usuario.roles || []    
    };

    console.log('Datos enviados para crear usuario:', usuarioData);

    return this.http.post<any>(`${this.apiUrl}/User/create`, usuarioData, { headers }).pipe(
      tap((response) => {
        console.log('Respuesta del servidor al crear usuario:', response);
      }),
      catchError((error) => {
        console.error('Error al crear el usuario:', error);
        return throwError(() => new Error('No se pudo crear el usuario. Por favor, verifica los datos y vuelve a intentarlo.'));
      })
    );
  }
}

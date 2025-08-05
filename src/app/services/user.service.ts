import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

/**
 * Servicio para la gestión de usuarios.
 * Proporciona métodos para interactuar con la API de usuarios.
 * 
 * @Injectable Decorador que marca la clase como disponible para ser provista e inyectada como dependencia.
 * providedIn: 'root' indica que el servicio está disponible en toda la aplicación.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * URL base para las peticiones a la API de usuarios.
   * Se construye concatenando la URL del backend y el endpoint de usuarios definidos en environment.
   */
  private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;

  /**
   * Constructor del servicio.
   * @param http Cliente HTTP para realizar peticiones a la API.
   */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene un usuario por su ID.
   * @param userId Identificador único del usuario a obtener.
   * @returns Observable que emite la respuesta de la API con los datos del usuario.
   */
  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.API_USERS}/${userId}`);
  }

  /**
   * Actualiza los datos de un usuario.
   * @param userId Identificador único del usuario a actualizar.
   * @param userData Objeto con los nuevos datos del usuario.
   * @returns Observable que emite la respuesta de la API después de la actualización.
   */
  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.API_USERS}/update?userId=${userId}`, userData);
  }
}
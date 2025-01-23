import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'URL_API';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      map(response => {
        // Guardar la información del usuario en localStorage o sessionStorage
        return response;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  recoverPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recover-password`, { email }).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }
}

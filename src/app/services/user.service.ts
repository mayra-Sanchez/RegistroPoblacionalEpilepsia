import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;

  constructor(private http: HttpClient) {}

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.API_USERS}/${userId}`);
  }

  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.API_USERS}/update?userId=${userId}`, userData);
  }
}

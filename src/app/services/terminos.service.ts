import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TerminosService {
  private apiUrl = 'http://localhost:8080/api/v1/TermsConditions/GetAll'; // 👈 Ajusta base URL si es necesario

  constructor(private http: HttpClient) {}

  getTerminos(): Observable<{ termsAndConditionsInfo: string }> {
    return this.http.get<{ termsAndConditionsInfo: string }>(this.apiUrl);
  }
}

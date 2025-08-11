import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, catchError, of, map } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SupersetService {
  private supersetUrl = environment.production ? '/superset' : 'http://localhost:8088/superset';

  constructor(private http: HttpClient, private authService: AuthService,     private sanitizer: DomSanitizer) {}

  getDashboardUrl(capas: string[]): SafeResourceUrl {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const params = new URLSearchParams({
      native_filters_key: 'trWO8MsIFz5RHi3dRRrBz6Tt6Yy7ftZFqpL_P65OPhC4gpz98noEsmlQHNYKKTEK',
      standalone: 'true',
      show_filters: '0',
      show_title: '0',
      show_edit_button: '0',
      width: '100%',
      height: '100%',
      capas: capas.join(','),
      access_token: token
    });

    const url = `${this.supersetUrl}/dashboard/1/?${params.toString()}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Método para verificar la conexión con Superset
  checkSupersetConnection(): Observable<boolean> {
    return this.http.get(`${this.supersetUrl}/health`, { responseType: 'text' }).pipe(
      map(response => response.includes('OK')),
      catchError(() => of(false))
    );
  }
}
/**
 * INTERCEPTOR DE AUTENTICACIÓN HTTP - ANGULAR HTTP INTERCEPTOR
 * =============================================================
 * 
 * Archivo: auth.interceptor.ts
 * Tipo: Angular HTTP Interceptor
 * Autor: [Mayra Sánchez]
 * Fecha: [29/09/2025]
 * Versión: 1.0
 * 
 * DESCRIPCIÓN:
 * Este interceptor maneja automáticamente la autenticación en todas las solicitudes HTTP:
 * 1. Agrega tokens de autenticación a las solicitudes
 * 2. Maneja errores 401 (Unauthorized) mediante refresh token
 * 3. Previene múltiples solicitudes de refresh simultáneas
 * 4. Gestiona logout en caso de refresh token expirado
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Inyección automática de tokens Bearer
 * - Renewal transparente de tokens expirados
 * - Exclusión de endpoints de autenticación
 * - Manejo de estado de refresh concurrente
 */

import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  /**
   * ESTADO DE REFRESH DE TOKEN
   * ---------------------------
   * Controla el estado del proceso de refresh para prevenir múltiples
   * solicitudes simultáneas de refresh token.
   */
  private isRefreshing = false;

  /**
   * SUBJECT PARA COORDINACIÓN DE REFRESH
   * ------------------------------------
   * BehaviorSubject que emite el nuevo token cuando está disponible.
   * Permite que las solicitudes en espera continúen con el token renovado.
   */
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  /**
   * MÉTODO INTERCEPT - INTERCEPTOR PRINCIPAL
   * ----------------------------------------
   * Intercepta todas las solicitudes HTTP salientes para manejar la autenticación.
   * 
   * @param req - HttpRequest original que se está enviando
   * @param next - HttpHandler para continuar con la cadena de interceptors
   * 
   * @returns Observable<HttpEvent<any>> - Flujo de eventos HTTP
   * 
   * FLUJO PRINCIPAL:
   * 1. ✅ Excluir endpoints de auth del procesamiento
   * 2. ✅ Agregar token a solicitudes autenticadas
   * 3. ✅ Interceptar errores 401 para manejar refresh
   * 4. ✅ Propagar otros errores normalmente
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // EXCLUIR ENDPOINTS DE AUTENTICACIÓN
    // -----------------------------------
    // Los endpoints de login y refresh no deben llevar token ni ser interceptados
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }

    // AGREGAR TOKEN A LA SOLICITUD
    // ----------------------------
    const token = this.authService.getToken();
    if (token) {
      req = this.addTokenToRequest(req, token);
    }

    // PROCESAR SOLICITUD Y MANEJAR ERRORES
    // ------------------------------------
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.isUnauthorizedError(error) && !this.isRefreshEndpoint(req.url)) {
          return this.handleTokenExpiration(req, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * VERIFICAR SI ES ENDPOINT DE AUTENTICACIÓN
   * -----------------------------------------
   * Determina si la URL de la solicitud corresponde a un endpoint
   * que no debe ser interceptado (login, refresh).
   */
  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/refresh');
  }

  /**
   * VERIFICAR SI ES ENDPOINT DE REFRESH
   * -----------------------------------
   * Determina si la URL corresponde al endpoint de refresh token.
   */
  private isRefreshEndpoint(url: string): boolean {
    return url.includes('/auth/refresh');
  }

  /**
   * VERIFICAR ERROR 401 (UNAUTHORIZED)
   * ----------------------------------
   * Determina si el error corresponde a un 401 que requiere refresh.
   */
  private isUnauthorizedError(error: HttpErrorResponse): boolean {
    return error.status === 401;
  }

  /**
   * AGREGAR TOKEN A LA SOLICITUD HTTP
   * ---------------------------------
   * Clona la solicitud original agregando el header de Authorization.
   * 
   * @param req - Solicitud original
   * @param token - Token JWT a incluir
   * 
   * @returns HttpRequest - Nueva solicitud con header de autorización
   */
  private addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * MANEJAR ERROR DE TOKEN EXPIRADO (401)
   * -------------------------------------
   * Gestiona el proceso de refresh token cuando se detecta un 401.
   * 
   * ESTRATEGIA:
   * - Si no hay refresh en curso: iniciar proceso de refresh
   * - Si hay refresh en curso: esperar a que termine y usar nuevo token
   * - Si el refresh falla: hacer logout y propagar error
   */
  private handleTokenExpiration(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // CASO 1: NO HAY REFRESH EN CURSO - INICIAR NUEVO REFRESH
    // -------------------------------------------------------
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null); // Indicar que el refresh está en proceso

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          // REFRESH EXITOSO
          this.isRefreshing = false;
          const newToken = response.access_token;
          this.refreshTokenSubject.next(newToken); // Notificar a solicitudes en espera

          // Reintentar la solicitud original con el nuevo token
          return next.handle(this.addTokenToRequest(req, newToken));
        }),
        catchError((refreshError) => {
          // REFRESH FALLIDO - LOGOUT REQUERIDO
          this.isRefreshing = false;
          this.authService.logout(); // Limpiar sesión expirada
          return throwError(() => refreshError);
        })
      );
    }

    // CASO 2: REFRESH EN CURSO - ESPERAR Y REUTILIZAR
    // -----------------------------------------------
    else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null), // Esperar hasta que haya token disponible
        take(1), // Tomar solo el primer token válido
        switchMap((newToken) => {
          // Reintentar solicitud con el nuevo token
          return next.handle(this.addTokenToRequest(req, newToken!));
        })
      );
    }
  }
}

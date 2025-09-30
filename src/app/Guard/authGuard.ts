/**
 * GUARDIA DE AUTENTICACIÓN Y AUTORIZACIÓN - ANGULAR GUARD
 * =======================================================
 * 
 * Archivo: auth.guard.ts
 * Tipo: Angular Guard (CanActivate)
 * Autor: [Mayra Sánchez]
 * Fecha: [29/09/2025]
 * Versión: 1.0
 * 
 * DESCRIPCIÓN:
 * Este guardia protege las rutas de la aplicación verificando:
 * 1. Autenticación: Que el usuario haya iniciado sesión
 * 2. Autorización: Que el usuario tenga los roles necesarios para acceder a la ruta
 * 
 * IMPLEMENTACIÓN:
 * Implementa la interfaz CanActivate de Angular para controlar el acceso a rutas.
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Verifica si el usuario está logueado
 * 2. Si no está logueado → redirige a /login
 * 3. Si está logueado → verifica roles requeridos
 * 4. Si no tiene los roles → redirige a /acceso-denegado
 * 5. Si cumple todas las condiciones → permite el acceso
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  
  /**
   * CONSTRUCTOR
   * -----------
   * Inyecta las dependencias necesarias para el funcionamiento del guardia.
   * 
   * @param authService - Servicio de autenticación para verificar estado de login y roles
   * @param router - Servicio de routing para redirecciones
   */
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * MÉTODO CAN ACTIVATE
   * -------------------
   * Método principal del guardia que determina si una ruta puede ser activada.
   * 
   * @param route - Snapshot de la ruta actual que contiene datos de configuración
   * @param state - Snapshot del estado actual del router
   * 
   * @returns boolean - true si el acceso es permitido, false si es denegado
   * 
   * FLUJO DE DECISIÓN:
   * 1. ✅ Usuario logueado + roles correctos → true
   * 2. ❌ Usuario no logueado → redirige a login → false
   * 3. ❌ Usuario logueado + roles incorrectos → redirige a acceso-denegado → false
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    
    /**
     * OBTENER ROLES REQUERIDOS DE LA CONFIGURACIÓN DE RUTA
     * -----------------------------------------------------
     * Los roles se definen en la configuración de rutas en app-routing.module.ts
     * Ejemplo: { path: 'admin', component: AdminComponent, data: { roles: ['ADMIN', 'SUPERUSER'] } }
     */
    const requiredRoles = route.data['roles'] as string[];

    /**
     * VERIFICACIÓN DE AUTENTICACIÓN
     * -----------------------------
     * Comprueba si el usuario tiene una sesión activa en el sistema.
     * Si no está autenticado, se redirige a la página de login.
     */
    if (!this.authService.isLoggedIn()) {
      console.warn('AuthGuard: Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }

    /**
     * VERIFICACIÓN DE AUTORIZACIÓN (ROLES)
     * ------------------------------------
     * Si la ruta requiere roles específicos, verifica que el usuario tenga al menos uno de ellos.
     * Si no tiene los permisos necesarios, redirige a página de acceso denegado.
     */
    if (requiredRoles && requiredRoles.length > 0) {
      if (!this.authService.hasAnyRole(requiredRoles)) {
        console.warn(`AuthGuard: Usuario no tiene los roles requeridos: ${requiredRoles.join(', ')}`);
        this.router.navigate(['/acceso-denegado']);
        return false;
      }
    }

    /**
     * ACCESO PERMITIDO
     * ----------------
     * El usuario cumple con todos los requisitos de autenticación y autorización.
     */
    console.log('AuthGuard: Acceso permitido a la ruta');
    return true;
  }
}

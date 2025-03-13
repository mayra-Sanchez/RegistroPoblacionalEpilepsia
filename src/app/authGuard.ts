import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './login/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    try {
      const isLoggedIn = this.authService.isLoggedIn();
      if (!isLoggedIn) {
        console.warn('⛔ Usuario no autenticado. Redirigiendo al login...');
        this.router.navigate(['/']);
        return false;
      }

      let userRoles = this.authService.getStoredRoles();

      if (!userRoles || userRoles.length === 0) {
        console.warn('⚠️ No se encontraron roles en localStorage.');
        return false;
      }

      const requiredRoles = route.data['roles'];
      if (requiredRoles && !requiredRoles.some((role: string) => userRoles.includes(role))) {
        console.warn('⛔ Acceso denegado. No tienes los roles necesarios:', requiredRoles);
        this.router.navigate(['/']);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error en AuthGuard:', error);
      this.router.navigate(['/']);
      return false;
    }
  }
}

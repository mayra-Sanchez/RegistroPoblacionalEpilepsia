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
        this.router.navigate(['/login']);
        return false;
      }

      let userRoles = this.authService.getStoredRoles();
      if (!userRoles || userRoles.length === 0) {
        console.warn('⚠️ No se encontraron roles en localStorage.');
        this.router.navigate(['/unauthorized']); // Redirige a una página de acceso denegado
        return false;
      }

      const requiredRoles: string[] = route.data['roles'] || [];
      const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasAccess) {
        console.warn('⛔ Acceso denegado. No tienes los roles necesarios:', requiredRoles);
        this.router.navigate(['/unauthorized']); // Página de error de acceso denegado
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

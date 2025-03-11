import { Component } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoggedIn: boolean = false;
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.loading = true;
    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        console.log('✅ Login exitoso. Token guardado:', localStorage.getItem('kc_token'));
  
        const roles = this.authService.getStoredRoles();
        console.log('🎭 Roles del usuario:', roles);
  
        // Redirige según el rol
        if (roles.includes('Admin')) {
          this.router.navigate(['/administrador']);
        } else if (roles.includes('Doctor')) {
          this.router.navigate(['/registro']);
        } else if (roles.includes('Researcher')) {
          this.router.navigate(['/investigador']);
        } else {
          this.router.navigate(['/']);
        }
  
        this.isLoggedIn = true;
      },
      (error) => {
        console.error('❌ Error en el login:', error);
        this.errorMessage = '❌ Credenciales incorrectas.';
        this.loading = false;
      },
      () => {
        this.loading = false;
      }
    );
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }
}

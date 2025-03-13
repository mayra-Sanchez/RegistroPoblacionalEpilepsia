import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/login/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>(); // 🔹 Emitir evento para cerrar modal
  loginForm!: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  login() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe(
      (response) => {
        console.log('✅ Login exitoso. Token guardado:', localStorage.getItem('kc_token'));

        const roles = this.authService.getStoredRoles();
        console.log('🎭 Roles del usuario:', roles);

        this.redirectUser(roles);
        this.loginSuccess.emit(); // 🔹 Emitir evento para cerrar modal
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

  private redirectUser(roles: string[]) {
    if (roles.includes('Admin_client_role')) {
      this.router.navigate(['/administrador']);
    } else if (roles.includes('Doctor_client_role')) {
      this.router.navigate(['/registro']);
    } else if (roles.includes('Researcher_client_role')) {
      this.router.navigate(['/investigador']);
    } else {
      this.router.navigate(['/']);
    }
  }
}

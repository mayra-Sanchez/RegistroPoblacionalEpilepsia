import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/login/services/auth.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();
  loginForm!: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  login() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        const roles = this.getCombinedRoles(); // Obtenemos todos los roles combinados
        this.redirectUser(roles);
        this.loginSuccess.emit();
      },
      error: (error) => {
        this.errorMessage = '❌ Credenciales incorrectas. Inténtalo de nuevo.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private getCombinedRoles(): string[] {
    const token = localStorage.getItem('kc_token');
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);
      // Roles de cliente específico
      const clientRoles = decoded.resource_access?.['registers-users-api-rest']?.roles || [];
      // Roles de realm (globales)
      const realmRoles = decoded.realm_access?.roles || [];
      
      return [...clientRoles, ...realmRoles];
    } catch (error) {
      console.error('Error decoding token:', error);
      return [];
    }
  }

  private redirectUser(allRoles: string[]) {
    // Primero verificamos SuperAdmin (tanto rol de cliente como de realm)
    const isSuperAdmin = allRoles.includes('SuperAdmin_client_role') || 
                        allRoles.includes('SuperAdmin');

    if (isSuperAdmin || allRoles.includes('Admin_client_role')) {
      this.router.navigate(['/administrador']);
    } else if (allRoles.includes('Doctor_client_role')) {
      this.router.navigate(['/registro']);
    } else if (allRoles.includes('Researcher_client_role')) {
      this.router.navigate(['/investigador']);
    } else {
      this.router.navigate(['/']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    passwordInput.type = this.showPassword ? 'text' : 'password';
  }
}
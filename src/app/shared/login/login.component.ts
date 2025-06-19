import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

/**
 * Componente de inicio de sesión y recuperación de contraseña
 * 
 * @remarks
 * Este componente maneja la autenticación de usuarios, redirección basada en roles
 * y el proceso de recuperación de contraseña.
 * 
 * @example
 * ```html
 * <app-login (loginSuccess)="onLoginSuccess()"></app-login>
 * ```
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  /** Evento emitido cuando el login es exitoso */
  @Output() loginSuccess = new EventEmitter<void>();

  /** Formulario reactivo para el login */
  loginForm!: FormGroup;

  /** Formulario reactivo para recuperación de contraseña */
  resetPasswordForm!: FormGroup;

  /** Mensaje de error a mostrar en la UI */
  errorMessage: string = '';

  /** Mensaje de éxito a mostrar en la UI */
  successMessage: string = '';

  /** Flag para estado de carga */
  loading: boolean = false;

  /** Flag para mostrar/ocultar contraseña */
  showPassword: boolean = false;

  /** Flag para mostrar/ocultar formulario de recuperación */
  showResetPasswordForm: boolean = false;

  /**
   * Constructor del componente
   * @param fb - Servicio FormBuilder para crear formularios reactivos
   * @param authService - Servicio de autenticación
   * @param router - Servicio Router para navegación
   */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicializa los formularios al cargar el componente
   */
  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * Maneja el proceso de inicio de sesión
   * 
   * @remarks
   * Valida el formulario, llama al servicio de autenticación y maneja la respuesta.
   * En caso de éxito, redirige al usuario según sus roles.
   */
  login() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        const roles = this.getCombinedRoles();
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

  /**
   * Solicita el restablecimiento de contraseña
   * 
   * @remarks
   * Envía un correo con enlace de recuperación al email proporcionado.
   */
  requestPasswordReset() {
    if (this.resetPasswordForm.invalid) return;

    this.loading = true;
    const email = this.resetPasswordForm.get('email')?.value;

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.successMessage = `✅ Se ha enviado un enlace de recuperación a ${email}. Por favor, revisa tu correo.`;
        this.errorMessage = '';
        this.showResetPasswordForm = false;
      },
      error: (error) => {
        this.errorMessage = '❌ Error al solicitar el restablecimiento de contraseña. Verifica tu correo electrónico.';
        this.successMessage = '';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Alterna la visualización del formulario de recuperación de contraseña
   */
  toggleResetPasswordForm() {
    this.showResetPasswordForm = !this.showResetPasswordForm;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Obtiene los roles combinados del usuario desde el token JWT
   * @returns Array de strings con los roles del usuario
   * @private
   */
  private getCombinedRoles(): string[] {
    const token = localStorage.getItem('kc_token');
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);
      const clientRoles = decoded.resource_access?.['registers-users-api-rest']?.roles || [];
      const realmRoles = decoded.realm_access?.roles || [];
      return [...clientRoles, ...realmRoles];
    } catch (error) {
      console.error('Error decoding token:', error);
      return [];
    }
  }

  /**
   * Redirige al usuario según sus roles
   * @param allRoles - Array de roles del usuario
   * @private
   */
  private redirectUser(allRoles: string[]) {
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

  /**
   * Alterna la visibilidad de la contraseña en el input
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    passwordInput.type = this.showPassword ? 'text' : 'password';
  }
}
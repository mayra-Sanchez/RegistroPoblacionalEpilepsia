import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/login/services/auth.service';
import { Router } from '@angular/router';

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

    this.authService.login(email, password).subscribe(
      (response) => {
        const roles = this.authService.getStoredRoles();
        this.redirectUser(roles);
        this.loginSuccess.emit();
      },
      (error) => {
        this.errorMessage = '❌ Credenciales incorrectas. Inténtalo de nuevo.';
        this.loading = false;
      },
      () => {
        this.loading = false;
      }
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    passwordInput.type = this.showPassword ? 'text' : 'password';
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
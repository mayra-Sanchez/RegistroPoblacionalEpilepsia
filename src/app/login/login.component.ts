import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { PasswordRecoveryComponent } from './password-recovery/password-recovery.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.email.value, this.password.value).subscribe(
        (success: any) => {
          // Redireccionar según el rol del usuario
        },
        (error: any) => {
          this.errorMessage = 'Credenciales inválidas';
        }
      );
    }
  }

  openPasswordRecoveryModal() {
    const dialogRef = this.dialog.open(PasswordRecoveryComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log('El modal de recuperación de contraseña ha sido cerrado');
    });
  }
}
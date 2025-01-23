import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.css']
})
export class PasswordRecoveryComponent implements OnInit {
  recoveryForm!: FormGroup;
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<PasswordRecoveryComponent>
  ) {}

  ngOnInit() {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.recoveryForm.get('email')!;
  }

  onSubmit() {
    if (this.recoveryForm.valid) {
      this.authService.recoverPassword(this.email.value).subscribe(
        (success: any) => {
          this.message = 'Un correo electrónico ha sido enviado con las instrucciones para recuperar su contraseña.';
          setTimeout(() => this.dialogRef.close(), 3000); // Cierra el modal después de 3 segundos
        },
        (error: any) => {
          this.message = 'Hubo un error al intentar recuperar la contraseña. Por favor, inténtelo de nuevo.';
        }
      );
    }
  }
}
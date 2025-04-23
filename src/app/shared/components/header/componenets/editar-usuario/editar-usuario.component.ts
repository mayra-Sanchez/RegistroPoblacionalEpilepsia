import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.component.html',
  styleUrls: ['./editar-usuario.component.css']
})
export class EditarUsuarioComponent implements OnInit {
  @Input() userData: any;
  @Output() close = new EventEmitter<void>();
  @Output() updateSuccess = new EventEmitter<any>();

  editForm: FormGroup;
  showPassword = false;
  isLoading = true;
  errorMessage = '';
  isUpdating = false;
  currentUserId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private adminService: ConsolaAdministradorService
  ) {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], // Quita el disabled
      username: [{value: '', disabled: true}, Validators.required], // Añade disabled aquí
      password: [''],
      identificationType: ['', Validators.required],
      identificationNumber: ['', Validators.required],
      birthDate: ['', Validators.required],
      researchLayer: [''], // Este campo está en el FormGroup pero no en el HTML
      role: [{value: '', disabled: true}] // Este campo está en el FormGroup pero no en el HTML
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    
    if (this.userData) {
      this.prepareFormData(this.userData);
      this.isLoading = false;
    } else if (this.currentUserId) {
      this.loadUserData();
    } else {
      this.errorMessage = 'No se pudo identificar al usuario';
      this.isLoading = false;
    }
  }

  private loadUserData(): void {
    const email = this.authService.getUserEmail();
    if (!email) {
      this.errorMessage = 'No se pudo obtener el email del usuario';
      this.isLoading = false;
      return;
    }

    this.authService.obtenerUsuarioPorEmail(email).subscribe({
      next: (response) => {
        // Manejar respuesta como array o objeto único
        const userData = Array.isArray(response) ? response[0] : response;
        if (userData) {
          this.prepareFormData(userData);
        } else {
          this.errorMessage = 'No se encontraron datos del usuario';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los datos del usuario: ' + (err.message || 'Error desconocido');
        this.isLoading = false;
        console.error('Error loading user data:', err);
      }
    });
  }

  private prepareFormData(userData: any): void {
    const attributes = userData.attributes || {};
    
    this.editForm.patchValue({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      username: userData.username || '',
      identificationType: attributes.identificationType || '',
      identificationNumber: attributes.identificationNumber || '',
      birthDate: attributes.birthDate,
      researchLayer: attributes.researchLayerId || '',
      role: attributes.role || this.authService.getUserRole()
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    const formData = this.getFormData();
    this.updateUserData(formData);
  }

  private getFormData(): any {
    const formValue = this.editForm.getRawValue();
    
  
    return {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      username: formValue.username,
      password: formValue.password || undefined,
      identificationType: formValue.identificationType,
      identificationNumber: Number(formValue.identificationNumber),
      birthDate: formValue.birthDate || '',
      // Usamos la fecha formateada
      researchLayer: formValue.researchLayer,
      role: formValue.role
    };
  }

  private updateUserData(updateData: any): void {
    if (!this.currentUserId) {
      this.errorMessage = 'No hay ID de usuario disponible';
      return;
    }

    this.isUpdating = true;
    this.errorMessage = '';

    this.adminService.updateUsuario(this.currentUserId, updateData).subscribe({
      next: (response) => {
        this.handleUpdateSuccess(response, updateData);
      },
      error: (err) => {
        this.handleUpdateError(err);
      }
    });
  }

  private handleUpdateSuccess(response: any, updateData: any): void {
    this.authService.updateUserData({
      username: updateData.username,
      firstName: updateData.firstName,
      lastName: updateData.lastName
    });
  
    Swal.fire({
      icon: 'success',
      title: 'Usuario actualizado',
      text: 'Los datos se actualizaron correctamente.',
      confirmButtonText: 'Aceptar'
    }).then(() => {
      // Asegurarse de que solo se emita una vez
      this.updateSuccess.emit(response);
      this.closeModal();
    });
  
    this.isUpdating = false;
  }

  private handleUpdateError(error: any): void {
    const message = error.error?.message || error.message || 'Error desconocido';
  
    this.errorMessage = 'Error al actualizar el usuario: ' + message;
    this.isUpdating = false;
  
    Swal.fire({
      icon: 'error',
      title: 'Error al actualizar',
      text: message,
      confirmButtonText: 'Cerrar'
    });
  
    console.error('Error updating user:', error);
  }
  

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  closeModal(): void {
    this.close.emit();
  }
}
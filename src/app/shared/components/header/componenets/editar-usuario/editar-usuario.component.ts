import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.component.html',
  styleUrls: ['./editar-usuario.component.css']
})
export class EditarUsuarioComponent implements OnInit {
  // Recibe los datos del usuario a editar desde el componente padre
  @Input() userData: any;
  
  // Eventos para cerrar el modal y notificar éxito en la actualización
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
    // Inicializa el formulario con validadores
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: [{ value: '', disabled: true }, Validators.required],
      password: [''],
      identificationType: ['', Validators.required],
      identificationNumber: ['', Validators.required],
      birthDate: ['', Validators.required],
      researchLayer: [''], // Campo opcional
      role: [{ value: '', disabled: true }] // Solo visualización
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();

    // Si se reciben datos por @Input, se usan directamente
    if (this.userData) {
      this.prepareFormData(this.userData);
      this.isLoading = false;
    } 
    // Si no, se intenta obtener los datos del usuario logueado
    else if (this.currentUserId) {
      this.loadUserData();
    } 
    else {
      this.errorMessage = 'No se pudo identificar al usuario';
      this.isLoading = false;
    }
  }

  // Carga los datos del usuario actual usando su email
  private loadUserData(): void {
    const email = this.authService.getUserEmail();
    if (!email) {
      this.errorMessage = 'No se pudo obtener el email del usuario';
      this.isLoading = false;
      return;
    }

    this.authService.obtenerUsuarioPorEmail(email).subscribe({
      next: (response) => {
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

  // Asigna los valores del usuario al formulario
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

  // Se ejecuta al hacer submit del formulario
  onSubmit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    const formData = this.getFormData();
    this.updateUserData(formData);
  }

  // Extrae los datos del formulario, incluyendo campos deshabilitados
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
      researchLayer: formValue.researchLayer,
      role: formValue.role
    };
  }

  // Envía la petición de actualización al backend
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

  // Maneja el caso exitoso de actualización
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
      this.updateSuccess.emit(response);
      this.closeModal();
    });

    this.isUpdating = false;
  }

  // Maneja los errores en la actualización
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

  // Marca todos los campos del formulario como "tocados" para mostrar errores
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Cierra el modal manualmente
  onClose(): void {
    this.close.emit();
  }

  // Alterna la visibilidad del campo de contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Cierra el modal desde la lógica de éxito
  closeModal(): void {
    this.close.emit();
  }
}

import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';  // Importar las clases necesarias

@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent {
  @Output() closeForm = new EventEmitter<void>();

  // Crear el formulario reactivo con validaciones
  usuarioForm: FormGroup;

  constructor() {
    this.usuarioForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      tipoDocumento: new FormControl('', [Validators.required]),
      numeroDocumento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fechaNacimiento: new FormControl('', [Validators.required]),
      rol: new FormControl('', [Validators.required]),
      capaInvestigacion: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
  }

  // Método para manejar el submit del formulario
  onRegister() {
    if (this.usuarioForm.valid) {
      console.log('Usuario registrado:', this.usuarioForm.value);
      // Aquí puedes agregar la lógica para enviar los datos al backend
      // Ejemplo: this.usuarioService.registrarUsuario(this.usuarioForm.value).subscribe(...);

      // Emitir el evento para cerrar el formulario después del registro
      this.closeForm.emit();

      // Limpiar el formulario después del registro
      this.usuarioForm.reset();
    } else {
      console.log('Formulario no válido');
    }
  }

  // Método para obtener los errores de un campo
  getErrorMessage(controlName: string): string {
    const control = this.usuarioForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('pattern')) {
      return 'El formato no es válido';
    }
    if (control?.hasError('email')) {
      return 'El correo no es válido';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }
}

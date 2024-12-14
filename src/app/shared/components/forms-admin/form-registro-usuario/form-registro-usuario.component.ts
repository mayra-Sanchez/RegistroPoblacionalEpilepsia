import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent {
  @Output() closeForm = new EventEmitter<void>();

  // Modelo de datos para el formulario
  usuario = {
    nombre: '',
    apellido: '',
    tipoDocumento: '',
    numeroDocumento: '',
    fechaNacimiento: '',
    rol: '',
    capaInvestigacion: '',
    email: '',
    password: ''
  };

  // Método para manejar el submit del formulario
  onRegister() {
    console.log('Usuario registrado:', this.usuario);

    // Aquí puedes agregar la lógica para enviar los datos al backend
    // Ejemplo: this.usuarioService.registrarUsuario(this.usuario).subscribe(...);

    // Emitir el evento para cerrar el formulario después del registro
    this.closeForm.emit();

    // Limpiar el formulario después del registro
    this.usuario = {
      nombre: '',
      apellido: '',
      tipoDocumento: '',
      numeroDocumento: '',
      fechaNacimiento: '',
      rol: '',
      capaInvestigacion: '',
      email: '',
      password: ''
    };
  }
}

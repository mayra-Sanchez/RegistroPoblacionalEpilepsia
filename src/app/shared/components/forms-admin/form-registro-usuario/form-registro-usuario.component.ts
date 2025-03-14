import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';

@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent {
  @Output() closeForm = new EventEmitter<void>();

  usuarioForm: FormGroup;

  constructor(private consolaAdministradorService: ConsolaAdministradorService) {
    this.usuarioForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      tipoDocumento: new FormControl('', [Validators.required]),
      numeroDocumento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fechaNacimiento: new FormControl('', [Validators.required]),
      rol: new FormControl('', [Validators.required]),
      capaInvestigacion: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  onRegister() {
    if (this.usuarioForm.valid) {
      const usuarioData = {
        username: `${this.usuarioForm.value.nombre}${this.usuarioForm.value.apellido}`,
        firstName: this.usuarioForm.value.nombre,
        lastName: this.usuarioForm.value.apellido,
        email: this.usuarioForm.value.email,
        password: this.usuarioForm.value.password,
        identificationType: this.usuarioForm.value.tipoDocumento,
        identificationNumber: this.usuarioForm.value.numeroDocumento,
        birthDate: this.usuarioForm.value.fechaNacimiento,
        researchLayer: this.usuarioForm.value.capaInvestigacion,
        role: this.usuarioForm.value.rol
      };

      this.consolaAdministradorService.crearUsuario(usuarioData).subscribe(
        (response) => {
          console.log('Usuario creado correctamente:', response);
          this.closeForm.emit();
          this.usuarioForm.reset();
        },
        (error) => {
          console.error('Error al crear el usuario:', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }
}

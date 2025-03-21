import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent implements OnInit {
  @Output() closeForm = new EventEmitter<void>();

  usuarioForm: FormGroup;
  capas: any[] = [];

  constructor(private consolaAdministradorService: ConsolaAdministradorService) {
    this.usuarioForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      tipoDocumento: new FormControl('', [Validators.required]),
      numeroDocumento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fechaNacimiento: new FormControl('', [Validators.required]),
      rol: new FormControl('', [Validators.required]),
      username: new FormControl('', [Validators.required]),
      capaInvestigacion: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  ngOnInit(): void {
    this.obtenerCapas();
  }

  obtenerCapas() {
    this.consolaAdministradorService.getAllLayers().subscribe(
      (capas) => {
        this.capas = capas;
        console.log('Capas obtenidas:', this.capas);
      },
      (error) => {
        console.error('Error al obtener capas:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las capas de investigación.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    );
  }

  onRegister() {
    if (this.usuarioForm.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, complete todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Generar username sin espacios y en minúsculas
    const username = (this.usuarioForm.value.nombre + this.usuarioForm.value.apellido)
      .replace(/\s+/g, '')
      .toLowerCase();

    const usuarioData = {
      firstName: this.usuarioForm.value.nombre,
      lastName: this.usuarioForm.value.apellido,
      email: this.usuarioForm.value.email,
      username: this.usuarioForm.value.username,
      password: this.usuarioForm.value.password,
      identificationType: this.usuarioForm.value.tipoDocumento,
      identificationNumber: Number(this.usuarioForm.value.numeroDocumento),
      birthDate: this.usuarioForm.value.fechaNacimiento,
      researchLayer: this.usuarioForm.value.capaInvestigacion,
      role: this.usuarioForm.value.rol
    };

    console.log('Datos enviados para crear usuario:', JSON.stringify(usuarioData, null, 2));

    Swal.fire({
      title: '¿Registrar usuario?',
      text: '¿Estás seguro de registrar este usuario?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consolaAdministradorService.crearUsuario(usuarioData).subscribe(
          (response) => {
            console.log('Usuario creado correctamente:', response);
            Swal.fire({
              title: '¡Registro exitoso! 🎉',
              html: `
                <div style="text-align: center;">
                  <p>El usuario ha sido registrado correctamente.</p>
                  <img src="https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" 
                    alt="Éxito" style="width: 150px; margin-top: 10px;">
                </div>
              `,
              icon: 'success',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#3085d6',
              background: '#f1f8ff',
              timer: 5000,
              timerProgressBar: true
            });
            this.usuarioForm.reset();
            this.closeForm.emit();
          },
          (error) => {
            console.error('Error al crear el usuario:', error);
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al registrar el usuario.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        );
      }
    });
  }

  campoEsValido(campo: string): boolean {
    const control = this.usuarioForm.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}

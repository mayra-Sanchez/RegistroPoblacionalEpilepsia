import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';

@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent implements OnInit {
  @Output() closeForm = new EventEmitter<void>();

  usuarioForm: FormGroup;
  // Lista de capas para el select. Asegúrate de que la API devuelva objetos con { id, nombreCapa }
  capas: any[] = [];

  constructor(private consolaAdministradorService: ConsolaAdministradorService) {
    this.usuarioForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      tipoDocumento: new FormControl('', [Validators.required]),
      numeroDocumento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fechaNacimiento: new FormControl('', [Validators.required]),
      rol: new FormControl('', [Validators.required]),
      // Este control almacenará el id de la capa seleccionada
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
        // Se asume que cada capa tiene 'id' y 'nombreCapa'
        this.capas = capas;
        console.log('Capas obtenidas:', this.capas);
      },
      (error) => {
        console.error('Error al obtener capas:', error);
      }
    );
  }

  onRegister() {
    if (this.usuarioForm.valid) {
      // Generar username sin espacios y en minúsculas
      const username = (this.usuarioForm.value.nombre + this.usuarioForm.value.apellido)
                         .replace(/\s+/g, '')
                         .toLowerCase();

      const usuarioData = {
        firstName: this.usuarioForm.value.nombre,
        lastName: this.usuarioForm.value.apellido,
        email: this.usuarioForm.value.email,
        username: username,
        password: this.usuarioForm.value.password,
        identificationType: this.usuarioForm.value.tipoDocumento,
        identificationNumber: Number(this.usuarioForm.value.numeroDocumento),
        // Se espera que el input de tipo "date" devuelva un valor en formato ISO (ej. "2016-05-03")
        birthDate: this.usuarioForm.value.fechaNacimiento,
        // Enviar el id de la capa seleccionada
        researchLayer: this.usuarioForm.value.capaInvestigacion,
        role: this.usuarioForm.value.rol
      };

      // Mostrar en consola el payload que se enviará
      console.log('Datos enviados para crear usuario:', JSON.stringify(usuarioData, null, 2));

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

  campoEsValido(campo: string): boolean {
    const control = this.usuarioForm.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}

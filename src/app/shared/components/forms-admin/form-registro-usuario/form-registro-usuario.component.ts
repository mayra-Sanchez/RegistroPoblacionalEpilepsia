import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import Swal from 'sweetalert2';

/**
 * El componente FormRegistroUsuarioComponent es un formulario Angular diseñado para registrar nuevos usuarios. Este componente se integra con el 
 * servicio ConsolaAdministradorService para enviar los datos al backend y notificar al componente padre cuando se ha creado un usuario.
 */
@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent implements OnInit {
  /** Evento
   * Se emite cuando se crea un usuario exitosamente.
   */
  @Output() usuarioCreada = new EventEmitter<void>();
  usuarioForm: FormGroup;

  //Almacena la lista de capas de investigación obtenidas del backend.
  capas: any[] = [];

  constructor(private consolaAdministradorService: ConsolaAdministradorService) {
    // Formularia reactivo
    this.usuarioForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      tipoDocumento: new FormControl('', [Validators.required]),
      numeroDocumento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fechaNacimiento: new FormControl('', [Validators.required]),
      rol: new FormControl('', [Validators.required]),
      username: new FormControl({ value: '', disabled: true }),
      capaInvestigacion: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }
 
  // Se ejecuta al inicializar el componente. Carga las capas de investigación desde el backend.
  ngOnInit(): void {
    this.obtenerCapas();
  }

  /** Métodos del Formulario
   * Obtiene las capas de investigación desde el backend.
   */
  obtenerCapas() {
    this.consolaAdministradorService.getAllLayers().subscribe(
      (capas) => {
        this.capas = capas;
      },
      (error) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las capas de investigación.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    );
  }

  /** Métodos del Formulario
   * Genera un nombre de usuario único basado en el nombre, apellido y fecha de nacimiento.
   */
  generarUsername(nombre: string, apellido: string, fechaNacimiento: string): string {
    // Remover espacios y convertir a minúsculas
    const nombreLimpiado = nombre.trim().toLowerCase();
    const apellidoLimpiado = apellido.trim().toLowerCase();
    
    // Extraer los dos últimos dígitos del año de nacimiento
    const yearDigits = fechaNacimiento ? fechaNacimiento.slice(2, 4) : '';
  
    // Generar un número aleatorio de 100 a 999 para mayor unicidad
    const randomNum = Math.floor(100 + Math.random() * 900);
  
    // Concatenar solo letras y números permitidos
    return `${nombreLimpiado.charAt(0)}${apellidoLimpiado}${yearDigits}${randomNum}`.replace(/[^a-z0-9]/g, '');
  }
  
  /** Métodos del Formulario
   * Valida el formulario y envía los datos al backend para registrar un nuevo usuario.
   */
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

    // Generar username único
    const username = this.generarUsername(
      this.usuarioForm.value.nombre,
      this.usuarioForm.value.apellido,
      this.usuarioForm.value.fechaNacimiento
    );
    
    this.usuarioForm.patchValue({ username });

    const usuarioData = {
      firstName: this.usuarioForm.value.nombre,
      lastName: this.usuarioForm.value.apellido,
      email: this.usuarioForm.value.email,
      username: username,
      password: this.usuarioForm.value.password,
      identificationType: this.usuarioForm.value.tipoDocumento,
      identificationNumber: Number(this.usuarioForm.value.numeroDocumento),
      birthDate: this.usuarioForm.value.fechaNacimiento,
      researchLayer: this.usuarioForm.value.capaInvestigacion,
      role: this.usuarioForm.value.rol
    };

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
          () => {
            Swal.fire({
              title: '¡Registro exitoso! 🎉',
              text: 'El usuario ha sido registrado correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.usuarioForm.reset();
            this.usuarioCreada.emit();
          },
          () => {
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

  /** Métodos del Formulario
   * Verifica si un campo del formulario es inválido y ha sido tocado.
   */
  campoEsValido(campo: string): boolean {
    const control = this.usuarioForm.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}
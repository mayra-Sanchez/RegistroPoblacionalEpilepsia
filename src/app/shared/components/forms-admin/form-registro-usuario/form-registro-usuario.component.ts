/**
 * Componente para el registro de nuevos usuarios en la aplicación.
 * 
 * Este componente proporciona un formulario reactivo con validaciones para registrar
 * nuevos usuarios, incluyendo información personal, credenciales y asignación de roles.
 * Maneja la generación automática de username, validaciones y comunicación con el backend.
 */
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent implements OnInit {
  /**
   * EventEmitter para notificar cuando se crea un usuario exitosamente
   */
  @Output() usuarioCreada = new EventEmitter<void>();

  /**
   * EventEmitter para notificar cuando se cancela el registro
   */
  @Output() cancelar = new EventEmitter<void>();

  /**
   * Formulario reactivo para el registro de usuarios
   */
  usuarioForm: FormGroup;

  /**
   * Lista de capas disponibles para asignar al usuario
   */
  capas: any[] = [];

  /**
   * Control para mostrar/ocultar la contraseña
   */
  showPassword: boolean = false;

  /**
   * Roles disponibles para asignar a los usuarios con sus descripciones
   */
  roles = [
    {
      valor: 'Admin',
      label: 'Administrador',
      descripcion: 'Administrador: puede gestionar usuarios, capas y variables.'
    },
    {
      valor: 'Researcher',
      label: 'Investigador',
      descripcion: 'Investigador: puede investigar datos clínicos de una capa.'
    },
    {
      valor: 'Doctor',
      label: 'Personal de salud',
      descripcion: 'Personal de salud: puede registrar pacientes y ver reportes.'
    },
    {
      valor: 'SuperAdmin',
      label: 'Super administrador',
      descripcion: 'SuperAdmin: administración completa del sistema.'
    }
  ];

  constructor(private consolaAdministradorService: ConsolaAdministradorService) {
    // Inicialización del formulario con controles y validaciones
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

    // Suscripciones para generar el username automáticamente cuando cambian los campos relevantes
    this.usuarioForm.get('nombre')?.valueChanges.subscribe(() => this.generateUsernameIfPossible());
    this.usuarioForm.get('apellido')?.valueChanges.subscribe(() => this.generateUsernameIfPossible());
    this.usuarioForm.get('fechaNacimiento')?.valueChanges.subscribe(() => this.generateUsernameIfPossible());
  }

  /**
   * Método del ciclo de vida OnInit
   * Obtiene las capas disponibles al inicializar el componente
   */
  ngOnInit(): void {
    this.obtenerCapas();
  }

  /**
   * Alterna la visibilidad de la contraseña en el campo correspondiente
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Genera un username automáticamente si los campos requeridos están completos
   */
  private generateUsernameIfPossible(): void {
    const nombre = this.usuarioForm.get('nombre')?.value;
    const apellido = this.usuarioForm.get('apellido')?.value;
    const fechaNacimiento = this.usuarioForm.get('fechaNacimiento')?.value;

    if (nombre && apellido && fechaNacimiento) {
      const username = this.generarUsername(nombre, apellido, fechaNacimiento);
      this.usuarioForm.get('username')?.setValue(username);
    }
  }

  /**
   * Obtiene las capas disponibles desde el servicio
   */
  obtenerCapas() {
    this.consolaAdministradorService.getAllLayers().subscribe(
      (capas) => {
        this.capas = capas.map(capa => ({
          id: capa.id,
          nombreCapa: capa.layerName || capa.nombreCapa
        }));
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

  /**
   * Genera un username basado en el nombre, apellido y fecha de nacimiento
   * @param nombre Nombre del usuario
   * @param apellido Apellido del usuario
   * @param fechaNacimiento Fecha de nacimiento del usuario
   * @returns Username generado automáticamente
   */
  generarUsername(nombre: string, apellido: string, fechaNacimiento: string): string {
    // Normaliza el texto eliminando acentos y caracteres especiales
    const normalize = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const nombreLimpiado = normalize(nombre.trim());
    const apellidoLimpiado = normalize(apellido.trim());
    const yearDigits = fechaNacimiento ? fechaNacimiento.slice(2, 4) : '';
    const randomNum = Math.floor(100 + Math.random() * 900);

    return `${nombreLimpiado.charAt(0)}${apellidoLimpiado}${yearDigits}${randomNum}`;
  }

  /**
   * Maneja el envío del formulario de registro
   */
  onRegister() {
    // Validar si el formulario es inválido
    if (this.usuarioForm.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, complete todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Generar username final con los datos actuales
    const username = this.generarUsername(
      this.usuarioForm.value.nombre,
      this.usuarioForm.value.apellido,
      this.usuarioForm.value.fechaNacimiento
    );

    // Actualizar el valor del username en el formulario
    this.usuarioForm.patchValue({ username });

    // Preparar los datos para enviar al servicio
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

    // Mostrar confirmación antes de registrar
    Swal.fire({
      title: '¿Registrar usuario?',
      text: '¿Estás seguro de registrar este usuario?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Llamar al servicio para registrar el usuario
        this.consolaAdministradorService.crearUsuario(usuarioData).subscribe(
          () => {
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Registro exitoso! 🎉',
              text: 'El usuario ha sido registrado correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            // Resetear formulario y emitir evento
            this.usuarioForm.reset();
            this.usuarioCreada.emit();
          },
          (error) => {
            console.error('Error al registrar usuario:', error);

            // Procesar diferentes tipos de errores para mostrar mensajes adecuados
            let mensaje = 'Hubo un problema inesperado al registrar el usuario.';

            if (error?.error?.message) {
              mensaje = error.error.message;
            } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
              mensaje = error.error.errors
                .map((e: any) => e.msg || e.message || 'Error desconocido')
                .join('\n');
            } else if (error?.message) {
              mensaje = error.message;
            }

            // Mostrar mensaje de error
            Swal.fire({
              title: 'Error al registrar',
              text: mensaje,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        );
      }
    });
  }

  /**
   * Maneja la acción de cancelar el registro
   */
  onCancel() {
    Swal.fire({
      title: '¿Cancelar registro?',
      text: '¿Estás seguro de que deseas cancelar el registro?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cancelar.emit();
      }
    });
  }

  /**
   * Verifica si un campo del formulario es inválido y ha sido tocado
   * @param campo Nombre del campo a validar
   * @returns true si el campo es inválido y ha sido tocado, false en caso contrario
   */
  campoEsValido(campo: string): boolean {
    const control = this.usuarioForm.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}
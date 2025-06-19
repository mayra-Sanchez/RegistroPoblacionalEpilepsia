import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import Swal from 'sweetalert2';

/**
 * Componente para el registro de nuevos usuarios
 * 
 * @remarks
 * Este componente proporciona un formulario completo para el registro de usuarios,
 * incluyendo validación, generación automática de username y confirmación mediante SweetAlert2.
 * Se integra con el servicio `ConsolaAdministradorService` para enviar los datos al backend.
 * 
 * @example
 * ```html
 * <app-form-registro-usuario (usuarioCreada)="actualizarListaUsuarios()"></app-form-registro-usuario>
 * ```
 */
@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent implements OnInit {
  /**
   * EventEmitter que notifica al componente padre cuando se crea un usuario exitosamente
   */
  @Output() usuarioCreada = new EventEmitter<void>();

  /**
   * FormGroup que contiene todos los controles del formulario de registro
   */
  usuarioForm: FormGroup;

  /**
   * Lista de capas de investigación disponibles para asignar al usuario
   */
  capas: any[] = [];

  /**
   * Controla la visibilidad del campo de contraseña
   */
  showPassword: boolean = false;

  /**
   * Constructor del componente
   * @param consolaAdministradorService Servicio para interactuar con la API de administración
   */
  constructor(private consolaAdministradorService: ConsolaAdministradorService) {
    // Inicialización del formulario con validaciones
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

    // Suscripciones para generar el username automáticamente
    this.usuarioForm.get('nombre')?.valueChanges.subscribe(() => this.generateUsernameIfPossible());
    this.usuarioForm.get('apellido')?.valueChanges.subscribe(() => this.generateUsernameIfPossible());
    this.usuarioForm.get('fechaNacimiento')?.valueChanges.subscribe(() => this.generateUsernameIfPossible());
  }

  /**
   * Método del ciclo de vida OnInit
   * Obtiene las capas de investigación al inicializar el componente
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
   * Genera un username automáticamente si se tienen los datos necesarios
   * @private
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
   * Obtiene las capas de investigación desde el backend
   * 
   * @remarks
   * Realiza una llamada al servicio `ConsolaAdministradorService` para obtener
   * la lista de capas disponibles y las almacena en la propiedad `capas`.
   * Muestra alertas en caso de éxito o error usando SweetAlert2.
   */
  obtenerCapas() {
    this.consolaAdministradorService.getAllLayers().subscribe(
      (capas) => {
        console.log('Capas recibidas:', capas);
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
   * Genera un nombre de usuario único basado en los datos personales
   * 
   * @param nombre - Primer nombre del usuario
   * @param apellido - Apellido del usuario
   * @param fechaNacimiento - Fecha de nacimiento en formato string
   * @returns Username generado con el formato: primera letra del nombre + apellido + 2 dígitos del año + número aleatorio
   * 
   * @example
   * ```typescript
   * generarUsername('Juan', 'Pérez', '1990-05-15');
   * // Retorna: jperez90742
   * ```
   */
  generarUsername(nombre: string, apellido: string, fechaNacimiento: string): string {
    const normalize = (str: string) =>
      str
        .normalize('NFD') // Decompose accented characters (e.g., á → a + combining mark)
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (e.g., á → a, ñ → n)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric characters (e.g., -)

    const nombreLimpiado = normalize(nombre.trim());
    const apellidoLimpiado = normalize(apellido.trim());
    const yearDigits = fechaNacimiento ? fechaNacimiento.slice(2, 4) : '';
    const randomNum = Math.floor(100 + Math.random() * 900);

    return `${nombreLimpiado.charAt(0)}${apellidoLimpiado}${yearDigits}${randomNum}`;
  }

  /**
   * Maneja el envío del formulario de registro
   * 
   * @remarks
   * Valida el formulario, muestra una confirmación con SweetAlert2 y, si es confirmado,
   * envía los datos al backend mediante el servicio `ConsolaAdministradorService`.
   * Emite el evento `usuarioCreada` y resetea el formulario en caso de éxito.
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

  /**
   * Verifica si un campo del formulario es inválido y ha sido tocado
   * 
   * @param campo - Nombre del campo a validar
   * @returns `true` si el campo es inválido y ha sido tocado, `false` en caso contrario
   */
  campoEsValido(campo: string): boolean {
    const control = this.usuarioForm.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}
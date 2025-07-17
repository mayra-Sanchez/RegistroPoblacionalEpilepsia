/**
 * Componente para el registro de nuevas capas en la aplicación.
 * 
 * Este componente proporciona un formulario reactivo con validaciones para registrar
 * nuevas capas, incluyendo información del jefe de capa. Maneja el envío de datos,
 * validaciones, confirmaciones y retroalimentación al usuario.
 */
import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-registro-capas',
  templateUrl: './form-registro-capas.component.html',
  styleUrls: ['./form-registro-capas.component.css']
})
export class FormRegistroCapasComponent implements OnInit, OnDestroy {

  /**
   * Formulario reactivo para el registro de capas
   */
  form!: FormGroup;

  /**
   * EventEmitter para notificar cuando se cancela el registro
   */
  @Output() cancelar = new EventEmitter<void>();

  /**
   * Suscripción para manejar la llamada al servicio de registro
   */
  private capasSubscription: Subscription = Subscription.EMPTY;

  /**
   * Constructor del componente
   * @param fb Servicio FormBuilder para crear formularios reactivos
   * @param consolaAdministradorService Servicio para interactuar con la API de administración
   * @param dialog Servicio para manejar diálogos modales (aunque no se usa directamente en este componente)
   */
  constructor(
    private fb: FormBuilder,
    private consolaAdministradorService: ConsolaAdministradorService,
    private dialog: MatDialog
  ) { }

  /**
   * Inicializa el componente creando el formulario con sus controles y validaciones
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      // Nombre de la capa con validación de requerido y mínimo 3 caracteres
      layerName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],

      // Descripción de la capa con validación de requerido y mínimo 5 caracteres
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],


      // Grupo anidado para la información del jefe de capa
      layerBoss: this.fb.group({
        // ID con valor por defecto 1
        id: [1],

        // Nombre del jefe con validación de requerido y mínimo 3 caracteres
        name: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
        ]],


        // Número de identificación con validación de requerido y mínimo 5 caracteres
        identificationNumber: ['', [
          Validators.required,
          Validators.minLength(5),
          Validators.pattern(/^[0-9]+$/)
        ]],

      }),
    });
  }

  /**
   * Limpia las suscripciones al destruir el componente para evitar memory leaks
   */
  ngOnDestroy(): void {
    if (this.capasSubscription) {
      this.capasSubscription.unsubscribe();
    }
  }

  /**
   * Método para registrar una nueva capa
   * 
   * Valida el formulario y, si es válido, muestra confirmación antes de proceder con el registro.
   * Si el formulario es inválido, marca todos los controles como touched y muestra alerta.
   */
  registrarCapa(): void {
    // Validar si el formulario es inválido
    if (this.form.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, completa todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      this.form.markAllAsTouched();
      return;
    }

    // Preparar los datos del formulario, recortando espacios en blanco
    const capaData = {
      layerName: this.form.value.layerName?.trim(),
      description: this.form.value.description?.trim(),
      layerBoss: {
        id: this.form.value.layerBoss?.id || 0,
        name: this.form.value.layerBoss?.name?.trim(),
        identificationNumber: this.form.value.layerBoss?.identificationNumber?.trim(),
      },
    };

    // Mostrar diálogo de confirmación antes de registrar
    Swal.fire({
      title: '¿Confirmar registro?',
      text: '¿Estás seguro de registrar esta capa?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarRegistro(capaData);
      }
    });
  }

  /**
   * Procesa el registro de la capa llamando al servicio correspondiente
   * @param capaData Objeto con los datos de la capa a registrar
   */
  private procesarRegistro(capaData: any): void {
    this.capasSubscription = this.consolaAdministradorService.registrarCapa(capaData).subscribe({
      next: () => this.mostrarExito(),
      error: (error) => this.mostrarError(error)
    });
  }

  /**
   * Muestra alerta de éxito cuando el registro es exitoso
   */
  private mostrarExito(): void {
    Swal.fire({
      title: '¡Registro exitoso! 🎉',
      html: `
        <div style="text-align: center;">
          <p>La capa ha sido registrada correctamente.</p>
          <img src="https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif" 
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
    this.form.reset();
  }

  /**
   * Maneja la acción de cancelar el registro
   * Muestra confirmación antes de emitir el evento de cancelación
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
   * Muestra alerta de error personalizada según el tipo de error recibido
   * @param error Objeto de error recibido del servicio
   */
  private mostrarError(error: any): void {
    console.error('Error al registrar capa:', error);

    let mensaje = 'Hubo un problema inesperado al registrar la capa.';

    if (error?.error?.message) {
      mensaje = error.error.message;
    } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
      mensaje = error.error.errors
        .map((e: any) => e.msg || e.message || 'Error desconocido')
        .join('\n');
    } else if (error?.message) {
      mensaje = error.message;
    }

    Swal.fire({
      title: 'Error al registrar',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }

}
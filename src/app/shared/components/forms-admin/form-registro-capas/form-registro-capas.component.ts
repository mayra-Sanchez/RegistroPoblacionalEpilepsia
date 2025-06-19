import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

/**
 * Componente para el registro de capas de investigación
 * 
 * @remarks
 * Este componente proporciona un formulario completo para registrar nuevas capas de investigación,
 * incluyendo validaciones, confirmación mediante diálogos y manejo de errores. Implementa:
 * - Formularios reactivos con validación en tiempo real
 * - Confirmación de acciones con SweetAlert2
 * - Manejo adecuado de suscripciones para prevenir memory leaks
 * - Retroalimentación visual para el usuario
 * 
 * @example
 * ```html
 * <!-- Uso básico del componente -->
 * <app-form-registro-capas></app-form-registro-capas>
 * ```
 */
@Component({
  selector: 'app-form-registro-capas',
  templateUrl: './form-registro-capas.component.html',
  styleUrls: ['./form-registro-capas.component.css']
})
export class FormRegistroCapasComponent implements OnInit, OnDestroy {
  /**
   * Formulario reactivo para el registro de capas
   * @type {FormGroup}
   * @property {FormControl} layerName - Nombre de la capa (requerido, mínimo 3 caracteres)
   * @property {FormControl} description - Descripción de la capa (requerido, mínimo 5 caracteres)
   * @property {FormGroup} layerBoss - Grupo de controles para el jefe de capa
   * @property {FormControl} layerBoss.id - ID del jefe (valor por defecto: 1)
   * @property {FormControl} layerBoss.name - Nombre del jefe (requerido, mínimo 3 caracteres)
   * @property {FormControl} layerBoss.identificationNumber - Número de identificación (requerido, mínimo 5 caracteres)
   */
  form!: FormGroup;

  /**
   * Suscripción al servicio de registro de capas
   * @private
   * @type {Subscription}
   */
  private capasSubscription: Subscription = Subscription.EMPTY;

  /**
   * Constructor del componente
   * @param {FormBuilder} fb - Servicio para construir formularios reactivos
   * @param {ConsolaAdministradorService} consolaAdministradorService - Servicio para operaciones administrativas
   * @param {MatDialog} dialog - Servicio para manejar diálogos modales
   */
  constructor(
    private fb: FormBuilder,
    private consolaAdministradorService: ConsolaAdministradorService,
    private dialog: MatDialog
  ) { }

  /**
   * Inicialización del componente
   * @remarks
   * Configura el formulario con sus controles y validaciones correspondientes
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      layerName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      layerBoss: this.fb.group({
        id: [1],
        name: ['', [Validators.required, Validators.minLength(3)]],
        identificationNumber: ['', [Validators.required, Validators.minLength(5)]],
      }),
    });
  }

  /**
   * Limpieza del componente
   * @remarks
   * Cancela la suscripción activa para prevenir memory leaks
   */
  ngOnDestroy(): void {
    if (this.capasSubscription) {
      this.capasSubscription.unsubscribe();
    }
  }

  /**
   * Maneja el registro de una nueva capa de investigación
   * @remarks
   * Realiza las siguientes acciones:
   * 1. Valida el formulario
   * 2. Muestra diálogo de confirmación
   * 3. Envía los datos al servidor
   * 4. Maneja la respuesta/errores
   * 5. Proporciona retroalimentación al usuario
   */
  registrarCapa(): void {
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

    const capaData = {
      layerName: this.form.value.layerName?.trim(),
      description: this.form.value.description?.trim(),
      layerBoss: {
        id: this.form.value.layerBoss?.id || 0,
        name: this.form.value.layerBoss?.name?.trim(),
        identificationNumber: this.form.value.layerBoss?.identificationNumber?.trim(),
      },
    };

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
   * Procesa el registro de la capa con el servidor
   * @private
   * @param {Object} capaData - Datos de la capa a registrar
   */
  private procesarRegistro(capaData: any): void {
    this.capasSubscription = this.consolaAdministradorService.registrarCapa(capaData).subscribe({
      next: () => this.mostrarExito(),
      error: (error) => this.mostrarError(error)
    });
  }

  /**
   * Muestra mensaje de éxito en el registro
   * @private
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
   * Muestra mensaje de error personalizado
   * @private
   * @param {any} error - Objeto de error recibido del servidor
   */
  private mostrarError(error: any): void {
    let errorMessage = 'Ocurrió un problema al registrar la capa.';

    if (error.error && typeof error.error === 'string') {
      if (error.error.includes('ya existe')) {
        errorMessage = 'El nombre de la capa ya existe. Por favor, elija otro.';
      } else if (error.error.includes('demasiado largo')) {
        errorMessage = 'Algunos campos exceden la longitud máxima permitida.';
      } else if (error.error.includes('inválido')) {
        errorMessage = 'Datos proporcionados no son válidos.';
      }
    }

    Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#d33'
    });
  }
}
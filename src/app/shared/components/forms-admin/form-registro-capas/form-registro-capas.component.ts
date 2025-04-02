import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

/**
 * Componente para el formulario de registro de capas de investigación
 * 
 * Este componente maneja la creación de nuevas capas de investigación con validación de datos,
 * confirmación de usuario y retroalimentación visual. Implementa OnInit para inicialización
 * y OnDestroy para limpieza de suscripciones.
 * 
 * @example
 * <app-form-registro-capas></app-form-registro-capas>
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
   * @param {FormBuilder} fb Servicio para construir formularios reactivos
   * @param {ConsolaAdministradorService} consolaAdministradorService Servicio para operaciones de administración
   * @param {MatDialog} dialog Servicio para manejo de diálogos modales
   */
  constructor(
    private fb: FormBuilder,
    private consolaAdministradorService: ConsolaAdministradorService,
    private dialog: MatDialog
  ) { }

  /**
   * Método del ciclo de vida Angular para inicialización
   * Configura el formulario con validaciones
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
   * Método del ciclo de vida Angular para destrucción
   * Cancela la suscripción activa para prevenir memory leaks
   */
  ngOnDestroy(): void {
    if (this.capasSubscription) {
      this.capasSubscription.unsubscribe();
    }
  }
 
  /**
   * Maneja el registro de una nueva capa de investigación
   * Valida el formulario, muestra confirmación y procesa la solicitud
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
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.capasSubscription = this.consolaAdministradorService.registrarCapa(capaData).subscribe({
          next: () => {
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
          },
          error: (error) => {
            let errorMessage = 'Ocurrió un problema al registrar la capa.';

            if (error.error && typeof error.error === 'string') {
              if (error.error.includes('ya existe')) {
                errorMessage = 'El nombre de la capa ya existe.';
              } else if (error.error.includes('demasiado largo')) {
                errorMessage = 'Algunos campos exceden la longitud máxima permitida.';
              }
            }

            Swal.fire({
              title: 'Error',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }
}
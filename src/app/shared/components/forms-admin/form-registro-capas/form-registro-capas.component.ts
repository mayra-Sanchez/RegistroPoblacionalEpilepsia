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
  isSubmitting: boolean = false;
  
  /**
   * Controla si se ha validado el formulario antes de proceder al registro
   */
  formularioValidado: boolean = false;

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
        email: ['', [Validators.required, Validators.email]],

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
   * Método para validar el formulario antes del registro
   * Muestra confirmación y marca el formulario como validado
   */
  validarFormulario(): void {
    if (this.form.invalid) {
      Swal.fire({
        title: 'Formulario incompleto',
        html: `
          <p>Por favor, completa todos los campos requeridos correctamente antes de continuar.</p>
          <div class="warning-box" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin-top: 10px;">
            <i class="fas fa-exclamation-triangle" style="color: #856404;"></i>
            <strong style="color: #856404;"> Importante:</strong> 
            <span style="color: #856404;">El jefe de capa debe ser usuario registrado en la aplicación.</span>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      this.form.markAllAsTouched();
      return;
    }

    // Mostrar resumen de la información antes de proceder
    const formData = this.form.value;
    
    Swal.fire({
      title: '¿Confirmar datos?',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Nombre de la capa:</strong><br>${formData.layerName}</p>
          <p><strong>Descripción:</strong><br>${formData.description}</p>
          <p><strong>Jefe de capa:</strong><br>${formData.layerBoss.name}</p>
          <p><strong>Email:</strong><br>${formData.layerBoss.email}</p>
          <p><strong>N° Identificación:</strong><br>${formData.layerBoss.identificationNumber}</p>
        </div>
        <br>
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;">
          <i class="fas fa-exclamation-triangle" style="color: #856404;"></i>
          <strong style="color: #856404;"> Verificación requerida:</strong> 
          <span style="color: #856404;">El jefe de capa debe ser usuario registrado en la aplicación (se valida con el número de identificación).</span>
        </div>
        <p style="color: #d33; font-weight: bold;">
          ⚠️ Una vez creada, no se podrá editar algunos campos cómo el nombre de la capa.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, los datos son correctos',
      cancelButtonText: 'Revisar nuevamente',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      width: 600
    }).then((result) => {
      if (result.isConfirmed) {
        this.formularioValidado = true;
        Swal.fire({
          title: '¡Validación exitosa!',
          text: 'El formulario ha sido validado correctamente. Ahora puedes proceder con el registro.',
          icon: 'success',
          confirmButtonText: 'Continuar',
          timer: 3000,
          timerProgressBar: true
        });
      }
    });
  }

  /**
   * Método para registrar una nueva capa
   * 
   * Verifica que el formulario haya sido validado antes de proceder con el registro.
   * Si no está validado, muestra alerta y reinicia el proceso.
   */
  registrarCapa(): void {
    // Verificar si el formulario ha sido validado
    if (!this.formularioValidado) {
      Swal.fire({
        title: 'Validación requerida',
        html: `
          <p>Debes validar el formulario primero antes de proceder con el registro.</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;">
            <i class="fas fa-exclamation-triangle" style="color: #856404;"></i>
            <strong style="color: #856404;"> Recordatorio:</strong> 
            <span style="color: #856404;">El jefe de capa debe ser usuario registrado en la aplicación.</span>
          </div>
          <p style="color: #d33; font-weight: bold;">
            ⚠️ Por favor, haz clic en "Validar Formulario" para confirmar que los datos son correctos.
          </p>
        `,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        // Reiniciar el estado de validación
        this.formularioValidado = false;
      });
      return;
    }

    // Prevenir múltiples envíos simultáneos
    if (this.isSubmitting) {
      return;
    }

    if (this.form.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        html: `
          <p>El formulario ha cambiado y ya no es válido. Por favor, valida nuevamente.</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;">
            <i class="fas fa-exclamation-triangle" style="color: #856404;"></i>
            <strong style="color: #856404;"> Importante:</strong> 
            <span style="color: #856404;">Verifica que el jefe de capa sea usuario registrado.</span>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      this.formularioValidado = false;
      this.form.markAllAsTouched();
      return;
    }

    const capaData = {
      layerName: this.form.value.layerName?.trim(),
      description: this.form.value.description?.trim(),
      layerBoss: {
        id: this.form.value.layerBoss?.id || 0,
        name: this.form.value.layerBoss?.name?.trim(),
        email: this.form.value.layerBoss?.email?.trim(),
        identificationNumber: this.form.value.layerBoss?.identificationNumber?.trim(),
      },
    };

    // Confirmación final antes del registro
    Swal.fire({
      title: '¿Proceder con el registro?',
      html: `
        <p>Estás a punto de registrar la capa en el sistema.</p>
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;">
          <i class="fas fa-exclamation-triangle" style="color: #856404;"></i>
          <strong style="color: #856404;"> Verificación final:</strong> 
          <span style="color: #856404;">Se validará que el jefe de capa sea usuario registrado mediante el número de identificación.</span>
        </div>
        <p style="color: #d33; font-weight: bold;">
          ⚠️ Esta acción no se puede deshacer.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSubmitting = true;
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
      error: (error) => this.mostrarError(error),
      complete: () => {
        this.isSubmitting = false;
        this.formularioValidado = false; // Resetear validación después del registro
      }
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
        <p>La capa ha sido registrada correctamente en el sistema.</p>
        <p><strong>Jefe de capa verificado exitosamente.</strong></p>
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
    }).then(() => {
      // Resetear formulario después de que el usuario cierre la alerta
      this.resetearFormulario();
    });
  }

  /**
   * Resetea el formulario completamente
   */
  private resetearFormulario(): void {
    this.form.reset({
      layerBoss: { id: 1 } // Mantener el ID por defecto
    });

    // Resetear el estado de validación
    this.formularioValidado = false;
    this.form.markAsPristine();
    this.form.markAsUntouched();

    // Forzar actualización de la vista
    setTimeout(() => {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.setErrors(null);
      });
    }, 0);
  }

  /**
   * Maneja la acción de cancelar el registro
   * Muestra confirmación antes de emitir el evento de cancelación
   */
  onCancel(): void {
    // Si hay un envío en proceso, prevenir cancelación accidental
    if (this.isSubmitting) {
      Swal.fire({
        title: 'Registro en proceso',
        text: 'Por favor espera a que termine el registro actual.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Si el formulario tiene cambios sin guardar o está validado
    if (this.form.dirty || this.formularioValidado) {
      Swal.fire({
        title: '¿Cancelar registro?',
        html: `
          <p>Tienes cambios sin guardar ${this.formularioValidado ? 'y el formulario ya fue validado' : ''}.</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;">
            <i class="fas fa-info-circle" style="color: #856404;"></i>
            <span style="color: #856404;">Recuerda que el jefe de capa debe ser usuario registrado.</span>
          </div>
          <p>¿Estás seguro de que deseas cancelar?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      }).then((result) => {
        if (result.isConfirmed) {
          this.formularioValidado = false;
          this.cancelar.emit();
        }
      });
    } else {
      // Si no hay cambios, cancelar directamente
      this.formularioValidado = false;
      this.cancelar.emit();
    }
  }

  /**
   * Muestra alerta de error personalizada según el tipo de error recibido
   * @param error Objeto de error recibido del servicio
   */
  private mostrarError(error: any): void {
    this.isSubmitting = false;
    this.formularioValidado = false; // Resetear validación en caso de error
    console.error('Error al registrar capa:', error);

    let mensaje = 'Hubo un problema inesperado al registrar la capa.';
    let titulo = 'Error al registrar';

    // Manejar errores específicos de validación del jefe de capa
    if (error?.error?.message?.includes('jefe') || error?.error?.message?.includes('usuario') || 
        error?.error?.message?.includes('identificación') || error?.error?.message?.includes('registrado')) {
      titulo = 'Error: Jefe de capa no encontrado';
      mensaje = 'El jefe de capa debe ser un usuario registrado en la aplicación. Verifique el número de identificación.';
    } else if (error?.error?.message) {
      mensaje = error.error.message;
    } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
      mensaje = error.error.errors
        .map((e: any) => e.msg || e.message || 'Error desconocido')
        .join('\n');
    } else if (error?.message) {
      mensaje = error.message;
    }

    Swal.fire({
      title: titulo,
      html: `
        <p>${mensaje}</p>
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 10px; margin: 10px 0;">
          <i class="fas fa-exclamation-circle" style="color: #721c24;"></i>
          <strong style="color: #721c24;"> Solución:</strong> 
          <span style="color: #721c24;">Asegúrese de que el jefe de capa esté registrado como usuario en la aplicación con el número de identificación proporcionado.</span>
        </div>
      `,
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Verifica si se puede habilitar el botón de registro
   */
  puedeRegistrar(): boolean {
    return this.formularioValidado && !this.isSubmitting;
  }

  /**
   * Verifica si se puede habilitar el botón de validación
   */
  puedeValidar(): boolean {
    return this.form.valid && !this.isSubmitting && !this.formularioValidado;
  }
}
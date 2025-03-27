import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/**
 * Componente de formulario para la captura de información del paciente
 * 
 * Este componente proporciona un formulario reactivo completo para registrar los datos
 * demográficos, clínicos y sociales de un paciente, con validaciones integradas.
 * Emite los datos validados cuando se avanza al siguiente paso.
 * 
 * @example
 * <app-paciente-form 
 *   (next)="handlePatientData($event)">
 * </app-paciente-form>
 */
@Component({
  selector: 'app-paciente-form',
  templateUrl: './paciente-form.component.html',
  styleUrls: ['./paciente-form.component.css']
})
export class PacienteFormComponent {
  /**
   * Evento emitido cuando el formulario es válido y se avanza al siguiente paso
   * 
   * @event
   * @type {any} - Emite el valor completo del formulario cuando es válido
   */
  @Output() next = new EventEmitter<any>();

  /**
 * Opciones predefinidas para el estado de crisis del paciente
 */
  estadosCrisis = [
    'Activa',
    'Remisión',
    'Estable',
    'Crítica',
    'Recuperado'
  ];

  /**
   * Grupo de formulario reactivo que contiene todos los controles y validaciones
   */
  form: FormGroup;

  /**
   * Constructor del componente
   * 
   * @param fb - Servicio FormBuilder para crear el formulario reactivo
   */
  constructor(private fb: FormBuilder) {
    this.form = this.createForm();
  }

  /**
   * Crea y configura el formulario reactivo con todos sus controles y validaciones
   * 
   * @returns FormGroup completamente configurado
   * 
   * @remarks
   * El formulario contiene campos para:
   * - Datos básicos de identificación
   * - Información de contacto
   * - Datos demográficos
   * - Información clínica inicial
   */
  private createForm(): FormGroup {
    return this.fb.group({
      /**
       * Nombre completo del paciente
       * @validations Requerido
       */
      name: ['', Validators.required],

      /**
       * Tipo de documento de identificación
       * @validations Requerido
       */
      identificationType: ['', Validators.required],

      /**
       * Número de identificación
       * @validations 
       * - Requerido
       * - Solo números (expresión regular ^[0-9]+$)
       */
      identificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],

      /**
       * Sexo biológico
       * @validations Requerido
       */
      sex: ['', Validators.required],

      /**
       * Fecha de nacimiento
       * @validations Requerido
       * @format Date
       */
      birthDate: ['', Validators.required],

      /**
       * Correo electrónico
       * @validations 
       * - Requerido
       * - Formato de email válido
       */
      email: ['', [Validators.required, Validators.email]],

      /**
       * Número de teléfono
       * @validations 
       * - Requerido
       * - Solo números (expresión regular ^[0-9]+$)
       */
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],

      /**
       * Fecha de fallecimiento (opcional)
       * @format Date
       */
      deathDate: [''],

      /**
       * Nivel socioeconómico
       * @validations Requerido
       */
      economicStatus: ['', Validators.required],

      /**
       * Nivel educativo
       * @validations Requerido
       */
      educationLevel: ['', Validators.required],

      /**
       * Estado civil
       * @validations Requerido
       */
      maritalStatus: ['', Validators.required],

      /**
       * Ciudad de origen
       * @validations Requerido
       */
      hometown: ['', Validators.required],

      /**
       * Ciudad de residencia actual
       * @validations Requerido
       */
      currentCity: ['', Validators.required],

      /**
       * Fecha de primera crisis
       * @validations Requerido
       * @format Date
       */
      firstCrisisDate: ['', Validators.required],

      /**
       * Estado actual de la crisis
       * @validations Requerido
       */
      crisisStatus: ['', Validators.required],

      /**
       * Indicador si el paciente tiene cuidador
       * @default false
       */
      tieneCuidador: [false]
    });
  }

  private formatDate(dateValue: any): string {
    if (!dateValue) return '';
  
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
  
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
  }

  private prepareFormData(formValue: any): any {
    // Clona el objeto para no modificar el original
    const preparedData = { ...formValue };
  
    // Formatea las fechas
    preparedData.birthDate = this.formatDate(formValue.birthDate);
    preparedData.deathDate = this.formatDate(formValue.deathDate);
    preparedData.firstCrisisDate = this.formatDate(formValue.firstCrisisDate);
  
    return preparedData;
  }

  /**
   * Maneja el envío del formulario
   * 
   * @remarks
   * Si el formulario es válido:
   * - Emite el valor completo del formulario a través del EventEmitter 'next'
   * 
   * Si el formulario no es válido:
   * - Marca todos los campos como "touched" para mostrar mensajes de validación
   */
onSubmit(): void {
  if (this.form.valid) {
    // Clona y formatea los valores del formulario
    const formData = this.prepareFormData(this.form.value);
    this.next.emit(formData);
  } else {
    this.markFormGroupTouched(this.form);
  }
}

  /**
   * Método recursivo para marcar todos los controles de un FormGroup como "touched"
   * 
   * @param formGroup - El FormGroup cuyos controles se marcarán como touched
   * 
   * @remarks
   * Este método recorre todos los controles del FormGroup y sus sub-grupos (si existen)
   * marcándolos como touched para activar la visualización de errores de validación
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
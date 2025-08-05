import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/**
 * Componente de formulario para la captura de información del cuidador
 * 
 * Este componente proporciona un formulario reactivo para registrar los datos básicos
 * de un cuidador, con validaciones integradas. Puede recibir datos iniciales y emitir
 * los datos validados en un formato específico.
 * 
 * @example
 * <app-cuidador-form 
 *   [initialData]="caregiverData"
 *   (next)="handleNext($event)"
 *   (prev)="handlePrev()">
 * </app-cuidador-form>
 */
@Component({
  selector: 'app-cuidador-form',
  templateUrl: './cuidador-form.component.html',
  styleUrls: ['./cuidador-form.component.css']
})
export class CuidadorFormComponent {
  /**
   * Datos iniciales para poblar el formulario
   * 
   * @remarks
   * Si se proporciona, los campos del formulario se inicializarán con estos valores.
   * Debe coincidir con la estructura del formulario.
   */
  @Input() initialData: any;

  /**
   * Evento emitido cuando el formulario es válido y se avanza al siguiente paso
   * 
   * @event
   * @type {any} - Datos del formulario transformados
   */
  @Output() next = new EventEmitter<any>();

  /**
   * Evento emitido cuando se solicita volver al paso anterior
   * 
   * @event
   */
  @Output() prev = new EventEmitter<void>();

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
    this.form = this.fb.group({
      /**
       * Nombre completo del cuidador
       * @validations Requerido
       */
      caregiverName: ['', Validators.required],

      /**
       * Tipo de documento de identificación
       * @validations Requerido
       */
      caregiverIdentificationType: ['', Validators.required],

      /**
       * Número de identificación
       * @validations 
       * - Requerido
       * - Solo números (expresión regular ^[0-9]+$)
       */
      caregiverIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],

      /**
       * Edad del cuidador
       * @validations 
       * - Requerido
       * - Mínimo 18 años
       */
      caregiverAge: ['', [Validators.required, Validators.min(18)]],

      /**
       * Nivel educativo del cuidador
       * @validations Requerido
       */
      caregiverEducationLevel: ['', Validators.required],

      /**
       * Ocupación del cuidador
       * @validations Requerido
       */
      caregiverOccupation: ['', Validators.required]
    });
  }

  /**
   * Método del ciclo de vida de Angular que se ejecuta al inicializar el componente
   * 
   * @remarks
   * Si hay datos iniciales (initialData), puebla el formulario con estos valores
   */
  ngOnInit(): void {
    if (this.initialData && Object.keys(this.initialData).length > 0) {
      console.log('Datos iniciales del cuidador:', this.initialData); // Para depuración

      const transformedData = {
        caregiverName: this.initialData.name || '',
        caregiverIdentificationType: this.initialData.identificationType || '',
        caregiverIdentificationNumber: this.initialData.identificationNumber || '',
        caregiverAge: this.initialData.age || '',
        caregiverEducationLevel: this.initialData.educationLevel || '',
        caregiverOccupation: this.initialData.occupation || ''
      };

      this.form.patchValue(transformedData);
    }
  }

  /**
   * Maneja el envío del formulario
   * 
   * @remarks
   * Si el formulario es válido:
   * 1. Transforma los datos del formulario a un formato específico
   * 2. Emite los datos transformados a través del EventEmitter 'next'
   * 
   * Si el formulario no es válido:
   * 1. Marca todos los campos como "touched" para mostrar mensajes de validación
   */
  onSubmit(): void {
    if (this.form.valid) {
      const formData = this.form.value;

      const transformedData = {
        name: formData.caregiverName,
        identificationType: formData.caregiverIdentificationType,
        identificationNumber: formData.caregiverIdentificationNumber,
        age: formData.caregiverAge,
        educationLevel: formData.caregiverEducationLevel,
        occupation: formData.caregiverOccupation
      };

      this.next.emit(transformedData);
    } else {
      this.form.markAllAsTouched();
    }
  }

  /**
   * Maneja el evento de clic en el botón "Anterior"
   * 
   * @remarks
   * Emite el evento 'prev' para indicar que se debe navegar al paso anterior
   */
  onPrevious(): void {
    this.prev.emit();
  }
}
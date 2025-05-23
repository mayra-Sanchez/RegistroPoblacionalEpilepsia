import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Interfaz para definir la estructura del formulario del paciente
 */
export interface PacienteFormData {
  name: string;
  identificationType: string;
  identificationNumber: string;
  sex: string;
  birthDate: string;
  email: string;
  phoneNumber: string;
  deathDate?: string;
  economicStatus: string;
  educationLevel: string;
  maritalStatus: string;
  hometown: string;
  currentCity: string;
  firstCrisisDate: string;
  crisisStatus: string;
  tieneCuidador: boolean;
}

/**
 * Validador personalizado para evitar fechas futuras
 * 
 * @returns ValidatorFn
 */
function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const date = new Date(control.value);
    return date > new Date() ? { futureDate: true } : null;
  };
}

/**
 * Componente de formulario para la captura de información del paciente
 * 
 * Este componente proporciona un formulario reactivo completo para registrar los datos
 * demográficos, clínicos y sociales de un paciente, con validaciones integradas.
 * Emite los datos validados cuando se avanza al siguiente paso.
 * 
 * @example
 * <app-paciente-form (next)="handlePatientData($event)"></app-paciente-form>
 */
@Component({
  selector: 'app-paciente-form',
  templateUrl: './paciente-form.component.html',
  styleUrls: ['./paciente-form.component.css']
})
export class PacienteFormComponent {
  /**
   * Evento emitido cuando el formulario es válido y se avanza al siguiente paso
   */
  @Output() next = new EventEmitter<PacienteFormData>();

  /**
   * Opciones predefinidas para el estado de crisis del paciente
   */
  estadosCrisis = ['Activa', 'Remisión', 'Estable', 'Crítica', 'Recuperado'];

  /**
   * Grupo de formulario reactivo
   */
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.createForm();
  }

  /**
   * Crea y configura el formulario reactivo con validaciones
   * 
   * @returns FormGroup
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      identificationType: ['', Validators.required],
      identificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      sex: ['', Validators.required],
      birthDate: ['', [Validators.required, noFutureDateValidator()]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      deathDate: [''],
      economicStatus: ['', Validators.required],
      educationLevel: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      hometown: ['', Validators.required],
      currentCity: ['', Validators.required],
      firstCrisisDate: ['', Validators.required],
      crisisStatus: ['', Validators.required],
      tieneCuidador: [false]
    });
  }

  /**
   * Formatea una fecha a 'dd-mm-yyyy'
   * 
   * @param dateValue - Fecha en cualquier formato compatible con Date
   * @returns string formateado o vacío
   */
  private formatDate(dateValue: any): string {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Prepara y formatea los datos del formulario para ser emitidos
   * 
   * @param formValue - Valor original del formulario
   * @returns Objeto formateado
   */
  private prepareFormData(formValue: any): PacienteFormData {
    const preparedData = { ...formValue };
    preparedData.birthDate = this.formatDate(formValue.birthDate);
    preparedData.deathDate = this.formatDate(formValue.deathDate);
    preparedData.firstCrisisDate = this.formatDate(formValue.firstCrisisDate);
    return preparedData;
  }

  /**
   * Maneja el envío del formulario
   * 
   * - Emite los datos si el formulario es válido.
   * - Marca todos los campos como tocados si no es válido.
   */
  onSubmit(): void {
    if (this.form.valid) {
      const formData = this.prepareFormData(this.form.value);
      this.next.emit(formData);
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  /**
   * Marca todos los campos del formulario como "touched"
   * para activar los mensajes de validación
   * 
   * @param formGroup - FormGroup a marcar
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

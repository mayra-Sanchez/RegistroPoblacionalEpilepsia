import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Register } from 'src/app/modules/consola-registro/interfaces';
import { ConsolaRegistroService } from 'src/app/services/consola-registro.service';
import Swal from 'sweetalert2';
import { switchMap, throwError, catchError } from 'rxjs';
import { parseToIsoDate } from 'src/app/utils/date-utils';

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
 * Interfaz para mensajes de búsqueda
 */
interface SearchMessage {
  type: 'info' | 'success' | 'error';
  text: string;
}

/**
 * Validador personalizado para evitar fechas futuras
 * 
 * @returns ValidatorFn
 */
function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const date = new Date(control.value); // Formato yyyy-MM-dd
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
   * ID de la capa de investigación para validar pacientes duplicados
   */
  @Input() researchLayerId: string = '';

  /**
   * Opciones predefinidas para el estado de crisis del paciente
   */
  estadosCrisis = ['Activa', 'Remisión', 'Estable', 'Crítica', 'Recuperado'];

  /**
   * Mensaje de estado para la búsqueda de pacientes
   */
  searchMessage: SearchMessage | null = null;

  /**
   * Temporizador para el debounce de búsqueda
   */
  private searchDebounceTimer: any;

  /**
   * Grupo de formulario reactivo
   */
  form: FormGroup;

  /**
   * Indica si se está realizando una búsqueda
   */
  isSearching = false;

  /**
   * Indica si el paciente tiene cuidador
   */
  tieneCuidador: boolean = false;

  /**
   * Datos del cuidador si existe
   */
  cuidadorData: any = null;

  /**
   * Datos clínicos del paciente
   */
  clinicalData: any = null;

  /**
   * Constructor del componente
   * 
   * @param fb Servicio FormBuilder para crear formularios reactivos
   * @param consolaService Servicio para interactuar con la consola de registro
   */
  constructor(
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService
  ) {
    this.form = this.createForm();
    this.setupIdentificationNumberListener();
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
   * Configura el listener para cambios en el número de identificación
   */
  private setupIdentificationNumberListener(): void {
    this.form.get('identificationNumber')?.valueChanges.subscribe(value => {
      if (value && value.length >= 6) {
        this.searchPatient(value);
      }
    });
  }

  /**
   * Dispara manualmente la búsqueda de un paciente
   */
  triggerSearch(): void {
    const identificationNumber = this.form.get('identificationNumber')?.value;
    if (!identificationNumber || identificationNumber.length < 6) {
      this.searchMessage = {
        type: 'error',
        text: 'El número de documento debe tener al menos 6 dígitos'
      };
      return;
    }

    this.searchPatient(identificationNumber);
  }

  /**
   * Busca un paciente por número de identificación
   * 
   * @param identificationNumber Número de identificación del paciente a buscar
   */
  searchPatient(identificationNumber: string): void {
    this.isSearching = true;
    this.searchMessage = null;

    // Clear previous debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      if (!this.researchLayerId) {
        this.isSearching = false;
        this.searchMessage = {
          type: 'error',
          text: 'No se ha especificado la capa de investigación'
        };
        return;
      }

      this.consolaService.obtenerRegistrosPorCapa(this.researchLayerId).pipe(
        switchMap((response: { registers: Register[] }) => {
          const existsInCurrentLayer = response.registers?.some(register =>
            register.patientIdentificationNumber === Number(identificationNumber)
          );

          if (existsInCurrentLayer) {
            return throwError(() => new Error('PATIENT_EXISTS_IN_LAYER'));
          }

          return this.consolaService.obtenerRegistrosPorPaciente(Number(identificationNumber));
        }),
        catchError(error => {
          if (error.status === 404 || (error.error && error.error.message === 'No registers found')) {
            return this.consolaService.obtenerRegistrosPorPaciente(Number(identificationNumber));
          }
          return throwError(() => error);
        })
      ).subscribe({
        next: (response: { registers: Register[] }) => {
          this.isSearching = false;

          if (response.registers && response.registers.length > 0) {
            this.searchMessage = {
              type: 'success',
              text: 'Paciente encontrado en el sistema. Datos cargados automáticamente.'
            };
            this.loadPatientData(response.registers[0]);
          } else {
            this.searchMessage = {
              type: 'info',
              text: 'Paciente no encontrado. Puede continuar con el registro.'
            };
          }
        },
        error: (error) => {
          this.isSearching = false;

          if (error.message === 'PATIENT_EXISTS_IN_LAYER') {
            this.searchMessage = {
              type: 'error',
              text: 'Este paciente ya está registrado en la capa actual'
            };
            this.form.get('identificationNumber')?.reset();
          } else {
            this.searchMessage = {
              type: 'error',
              text: error.error?.message || 'Error al buscar el paciente'
            };
          }
        }
      });
    }, 500); // Debounce de 500ms
  }

  /**
   * Carga los datos de un paciente encontrado en el formulario
   * 
   * @param register Registro del paciente encontrado
   */
  private loadPatientData(register: Register): void {
    const patientData = register.patientBasicInfo;
    const caregiverData = register.caregiver;
    const hasCaregiver = !!caregiverData || (patientData as any).hasCaregiver || false;

    this.form.patchValue({
      name: patientData.name,
      identificationType: register.patientIdentificationType,
      identificationNumber: register.patientIdentificationNumber,
      sex: patientData.sex,
      birthDate: parseToIsoDate(patientData.birthDate),
      email: patientData.email,
      phoneNumber: patientData.phoneNumber,
      deathDate: parseToIsoDate(patientData.deathDate),
      economicStatus: patientData.economicStatus,
      educationLevel: patientData.educationLevel,
      maritalStatus: patientData.maritalStatus,
      hometown: patientData.hometown,
      currentCity: patientData.currentCity,
      firstCrisisDate: parseToIsoDate(patientData.firstCrisisDate),
      crisisStatus: patientData.crisisStatus,
      tieneCuidador: hasCaregiver
    });

    if (caregiverData) {
      this.cuidadorData = {
        name: caregiverData.name,
        identificationType: caregiverData.identificationType,
        identificationNumber: caregiverData.identificationNumber,
        age: caregiverData.age,
        educationLevel: caregiverData.educationLevel,
        occupation: caregiverData.occupation
      };
    }

    Object.keys(patientData).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.markAsDirty();
      }
    });
  }

  /**
   * Maneja el envío del formulario
   * 
   * - Emite los datos si el formulario es válido.
   * - Marca todos los campos como tocados si no es válido.
   */
  onSubmit(): void {
    if (this.form.valid) {
      const formData = {
        ...this.form.value,
        cuidadorData: this.cuidadorData // Incluir los datos del cuidador
      };
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
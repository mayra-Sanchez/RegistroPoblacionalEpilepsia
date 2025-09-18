import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ConsolaRegistroService } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';
import { Variable } from '../../interfaces';
import Swal from 'sweetalert2';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-registro-paciente',
  templateUrl: './registro-paciente.component.html',
  styleUrls: ['./registro-paciente.component.css']
})
export class RegistroPacienteComponent implements OnInit, OnDestroy {
  @Input() researchLayerId: string = '';
  @Input() researchLayerName: string = '';
  @Output() registroGuardado = new EventEmitter<void>();

  registroForm: FormGroup;
  loading: boolean = false;
  hasCaregiver: boolean = false;
  loadingVariables: boolean = false;
  variablesDeCapa: Variable[] = [];
  currentSection: number = 0;

  private destroy$ = new Subject<void>();

  tiposIdentificacion = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro Civil' }
  ];

  sexos = [
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' }
  ];

  estadosCiviles = [
    { value: 'Soltero', label: 'Soltero/a' },
    { value: 'Casado', label: 'Casado/a' },
    { value: 'Divorciado', label: 'Divorciado/a' },
    { value: 'Viudo', label: 'Viudo/a' },
    { value: 'Unión Libre', label: 'Unión Libre' }
  ];

  nivelesEducacion = [
    { value: 'Primaria', label: 'Primaria' },
    { value: 'Secundaria', label: 'Secundaria' },
    { value: 'Técnico', label: 'Técnico' },
    { value: 'Universitario', label: 'Universitario' },
    { value: 'Posgrado', label: 'Posgrado' },
    { value: 'Ninguno', label: 'Ninguno' }
  ];

  nivelesEconomicos = [
    { value: 'Bajo', label: 'Bajo' },
    { value: 'Medio Bajo', label: 'Medio Bajo' },
    { value: 'Medio', label: 'Medio' },
    { value: 'Medio Alto', label: 'Medio Alto' },
    { value: 'Alto', label: 'Alto' }
  ];

  estadosCrisis = [
    { value: 'Activa', label: 'Activa' },
    { value: 'Remisión', label: 'Remisión' },
    { value: 'Controlada', label: 'Controlada' },
    { value: 'Crónica', label: 'Crónica' }
  ];

  constructor(
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService,
    private authService: AuthService
  ) {
    this.registroForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadVariablesDeCapa();

    // Actualizar edad cuando cambie birthdate (soporta input type="date" y strings)
    const birthControl = this.registroForm.get('patient.birthdate');
    birthControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onBirthDateChange());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      patientIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      patientIdentificationType: ['CC', Validators.required],

      patient: this.fb.group({
        name: ['', Validators.required],
        sex: ['', Validators.required],
        birthdate: ['', Validators.required],
        age: [{ value: '', disabled: true }],
        email: ['', [Validators.email]],
        phoneNumber: [''],
        deathDate: [''],
        economicStatus: [''],
        educationLevel: [''],
        maritalStatus: [''],
        hometown: [''],
        currentCity: [''],
        firstCrisisDate: [''],
        crisisStatus: ['']
      }),

      caregiver: this.fb.group({
        name: [''],
        identificationType: ['CC'],
        identificationNumber: [''],
        age: [''],
        educationLevel: [''],
        occupation: ['']
      }),

      variables: this.fb.array([])
    });
  }

  loadVariablesDeCapa(): void {
    if (!this.researchLayerId) {
      console.warn('No research layer ID provided');
      return;
    }

    this.loadingVariables = true;
    this.variablesDeCapa = [];

    this.consolaService.obtenerVariablesPorCapa(this.researchLayerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (variables) => {
          this.variablesDeCapa = variables.filter(v => v.isEnabled);
          this.initializeVariables();
          this.loadingVariables = false;
        },
        error: (err) => {
          console.error('Error loading variables:', err);
          this.loadingVariables = false;
          Swal.fire('Error', 'No se pudieron cargar las variables de la capa', 'error');
        }
      });
  }

  initializeVariables(): void {
    const variablesArray = this.registroForm.get('variables') as FormArray;
    variablesArray.clear();

    this.variablesDeCapa.forEach(variable => {
      const isVariableRequired = variable.isRequired ?? false;
      const variableName = variable.name || variable.variableName || 'Variable sin nombre';
      const validators = isVariableRequired ? [Validators.required] : [];

      variablesArray.push(this.fb.group({
        variableId: [variable.id],
        variableName: [variableName],
        value: ['', validators],
        type: [variable.type],
        isRequired: [isVariableRequired]
      }));
    });
  }

  get variables(): FormArray {
    return this.registroForm.get('variables') as FormArray;
  }

  changeSection(sectionIndex: number): void {
    this.currentSection = sectionIndex;
  }

  nextSection(): void {
    if (this.validateCurrentSection()) {
      const maxSections = this.variables.length > 0 ? 4 : 3;
      if (this.currentSection < maxSections) {
        this.currentSection++;
      }
    }
  }

  prevSection(): void {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  validateCurrentSection(): boolean {
    switch (this.currentSection) {
      case 0:
        const idType = this.registroForm.get('patientIdentificationType');
        const idNumber = this.registroForm.get('patientIdentificationNumber');

        if (idType?.invalid || idNumber?.invalid) {
          this.markFieldsAsTouched([idType, idNumber]);
          Swal.fire('Error', 'Por favor complete los campos de identificación correctamente', 'error');
          return false;
        }
        break;

      case 1:
        const name = this.registroForm.get('patient.name');
        const sex = this.registroForm.get('patient.sex');
        const birthdate = this.registroForm.get('patient.birthdate');

        if (name?.invalid || sex?.invalid || birthdate?.invalid) {
          this.markFieldsAsTouched([name, sex, birthdate]);
          Swal.fire('Error', 'Por favor complete los campos requeridos de información personal', 'error');
          return false;
        }
        break;
    }

    return true;
  }

  markFieldsAsTouched(fields: any[]): void {
    fields.forEach(field => {
      if (field) {
        field.markAsTouched();
      }
    });
  }

  onBirthDateChange(): void {
    const birthDate = this.registroForm.get('patient.birthdate')?.value;
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();

      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      this.registroForm.get('patient.age')?.setValue(age);
    }
  }

  toggleCaregiver(): void {
    this.hasCaregiver = !this.hasCaregiver;
    if (!this.hasCaregiver) {
      this.registroForm.get('caregiver')?.reset();
    }
  }

  private getBackendIdentificationType(type: string): string {
    switch (type) {
      case 'CC': return 'Cédula de Ciudadanía';
      case 'TI': return 'Tarjeta de Identidad';
      case 'CE': return 'Cédula de Extranjería';
      case 'PA': return 'Pasaporte';
      case 'RC': return 'Registro Civil';
      default: return type;
    }
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.markFormGroupTouched(this.registroForm);
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    const formValue = this.registroForm.getRawValue();

    console.log('📋 VALOR COMPLETO DEL FORMULARIO:', formValue);

    const backendIdentificationType = this.getBackendIdentificationType(formValue.patientIdentificationType);

    // Preparar las variables con conversión de tipos
    const variablesInfo = formValue.variables.map((v: any) => {
      const converted = this.convertValueForApi(v.value, v.type);
      console.log(`📊 Variable: ${v.variableName}, Value: ${v.value} -> ${converted.value}, Type: ${converted.type}`);

      return {
        id: v.variableId,
        name: v.variableName,
        value: converted.value,
        type: converted.type
      };
    });

    const registerRequest: any = {
      registerInfo: {
        researchLayerId: this.researchLayerId,
        researchLayerName: this.researchLayerName,
        variablesInfo: variablesInfo
      },
      patientIdentificationNumber: Number(formValue.patientIdentificationNumber),
      patientIdentificationType: backendIdentificationType,
      patient: {
        name: formValue.patient.name,
        sex: formValue.patient.sex,
        birthdate: this.formatDateForBackend(formValue.patient.birthdate),
        age: Number(formValue.patient.age),
        email: formValue.patient.email || '',
        phoneNumber: formValue.patient.phoneNumber || '',
        deathDate: this.formatDateForBackend(formValue.patient.deathDate),
        economicStatus: formValue.patient.economicStatus || '',
        educationLevel: formValue.patient.educationLevel || '',
        maritalStatus: formValue.patient.maritalStatus || '',
        hometown: formValue.patient.hometown || '',
        currentCity: formValue.patient.currentCity || '',
        firstCrisisDate: this.formatDateForBackend(formValue.patient.firstCrisisDate),
        crisisStatus: formValue.patient.crisisStatus || ''
      }
    };

    console.log('📦 REQUEST ANTES DE CUIDADOR:', registerRequest);

    if (this.hasCaregiver && formValue.caregiver?.name) {
      registerRequest.caregiver = {
        name: formValue.caregiver.name,
        identificationType: this.getBackendIdentificationType(formValue.caregiver.identificationType),
        identificationNumber: Number(formValue.caregiver.identificationNumber) || 0,
        age: Number(formValue.caregiver.age) || 0,
        educationLevel: formValue.caregiver.educationLevel || '',
        occupation: formValue.caregiver.occupation || ''
      };

      console.log('👥 INFO CUIDADOR:', registerRequest.caregiver);
    }

    // DEBUG: Mostrar el request completo
    console.log('🚀 REQUEST FINAL COMPLETO:', JSON.stringify(registerRequest, null, 2));

    // DEBUG: Mostrar específicamente las fechas
    console.log('📅 FECHAS ENVIADAS:');
    console.log(' - birthdate:', registerRequest.patient.birthdate);
    console.log(' - deathDate:', registerRequest.patient.deathDate);
    console.log(' - firstCrisisDate:', registerRequest.patient.firstCrisisDate);

    if (!this.validateRequest(registerRequest)) {
      Swal.fire('Error', 'Datos inválidos en el formulario. Por favor revise los campos.', 'error');
      this.loading = false;
      return;
    }

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      Swal.fire('Error', 'No se pudo obtener el email del usuario', 'error');
      this.loading = false;
      return;
    }

    console.log('📧 USER EMAIL:', userEmail);

    this.consolaService.saveRegister(userEmail, registerRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ RESPUESTA EXITOSA:', response);
          Swal.fire('Éxito', 'Registro guardado correctamente', 'success');
          this.registroForm.reset();
          this.initializeVariables();
          this.hasCaregiver = false;
          this.currentSection = 0;
          this.registroGuardado.emit();
        },
        error: (error) => {
          console.error('❌ ERROR AL GUARDAR:', error);

          // Mostrar mensaje de error más detallado
          let errorMessage = 'No se pudo guardar el registro';
          if (error.message.includes('Error 500')) {
            errorMessage = 'Error interno del servidor. Por favor contacte al administrador.';
          } else if (error.error && typeof error.error === 'object') {
            errorMessage = error.error.message || JSON.stringify(error.error);
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status === 400) {
            errorMessage = 'Datos inválidos enviados al servidor. Por favor verifique los campos.';
          }

          Swal.fire('Error', errorMessage, 'error');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }
  // En tu componente TypeScript
  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'Entero': 'Entero',
      'Real': 'Decimal',
      'Texto': 'Texto',
      'Fecha': 'Fecha',
      'Lógico': 'Sí/No'
    };
    return typeLabels[type] || type;
  }

  getTypeDescription(type: string): string {
    const typeDescriptions: { [key: string]: string } = {
      'Entero': 'Número entero sin decimales',
      'Real': 'Número con decimales',
      'Texto': 'Texto libre',
      'Fecha': 'Fecha en formato AAAA-MM-DD',
      'Lógico': 'Valor verdadero o falso'
    };
    return typeDescriptions[type] || '';
  }

  getErrorMessage(variable: FormGroup): string {
    const control = variable.get('value');
    if (control?.errors?.['required']) {
      return 'Este campo es requerido';
    }
    if (control?.errors?.['min']) {
      return `El valor mínimo es ${control.errors['min'].min}`;
    }
    if (control?.errors?.['max']) {
      return `El valor máximo es ${control.errors['max'].max}`;
    }
    return 'Valor inválido';
  }

  validateNumber(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;

    // Permitir: números (0-9), backspace, delete, tab, flechas
    if (charCode > 31 && (charCode < 48 || charCode > 57) &&
      charCode !== 8 && charCode !== 9 && charCode !== 37 && charCode !== 39) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  validateDecimal(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    const value = (event.target as HTMLInputElement).value;

    // Permitir: números (0-9), punto decimal, backspace, delete, tab, flechas
    if (charCode === 46) { // Punto decimal
      if (value.includes('.')) {
        event.preventDefault(); // Evitar múltiples puntos
        return false;
      }
      return true;
    }

    if (charCode > 31 && (charCode < 48 || charCode > 57) &&
      charCode !== 8 && charCode !== 9 && charCode !== 37 && charCode !== 39) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onCheckboxChange(variable: FormGroup, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    variable.get('value')?.setValue(isChecked);

    // Forzar la actualización de la vista
    variable.get('value')?.updateValueAndValidity();
  }

  private validateRequest(request: any): boolean {
    console.log('🔍 VALIDANDO REQUEST:');

    const dateFields = ['birthdate', 'deathDate', 'firstCrisisDate'];
    for (const field of dateFields) {
      if (request.patient[field] && !/^\d{2}-\d{2}-\d{4}$/.test(request.patient[field])) {
        console.error(`❌ Invalid date format for ${field}:`, request.patient[field]);
        return false;
      }
    }

    // Resto de la validación...
    if (isNaN(request.patientIdentificationNumber)) {
      console.error('❌ Invalid patient identification number');
      return false;
    }

    if (isNaN(request.patient.age)) {
      console.error('❌ Invalid patient age');
      return false;
    }

    for (const variable of request.registerInfo.variablesInfo) {
      if (variable.type === 'Number' && variable.value !== null && isNaN(variable.value)) {
        console.error(`❌ Invalid numeric value for variable:`, variable);
        return false;
      }
      // Validar fechas en variables
      if (variable.type === 'String' && variable.value && /^\d{2}-\d{2}-\d{4}$/.test(variable.value)) {
        const [day, month, year] = variable.value.split('-');
        const date = new Date(`${year}-${month}-${day}`);
        if (isNaN(date.getTime())) {
          console.error(`❌ Invalid date value for variable:`, variable);
          return false;
        }
      }
    }

    console.log('✅ Request validation passed');
    return true;
  }

  private formatDateForBackend(dateValue: any): string | null {
    if (!dateValue) return null;

    try {
      // Si ya está en formato dd-MM-yyyy, devolverlo tal cual
      if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
        return dateValue;
      }

      // Si ya está en formato yyyy-MM-dd (desde input type="date"), convertirlo
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split('-');
        return `${day}-${month}-${year}`;
      }

      let date: Date;

      if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) return null;

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch {
      return null;
    }
  }

  private convertValueForApi(value: any, originalType: string): { value: any, type: string } {
    if (value === null || value === undefined || value === '') {
      return { value: null, type: 'String' };
    }

    let finalValue: any;
    let finalType: string;

    switch (originalType) {
      case 'Entero': // Entero → Number
        finalValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
        if (isNaN(finalValue)) return { value: null, type: 'String' };
        finalType = 'Number';
        break;

      case 'Real': // Real → Number (con decimales)
        finalValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(finalValue)) return { value: null, type: 'String' };
        finalType = 'Number';
        break;

      case 'Fecha': // Fecha → String en formato dd-MM-yyyy
        finalValue = this.formatDateForBackend(value);
        finalType = 'String';
        break;

      case 'Lógico':
        if (typeof value === 'string') {
          finalValue = value.toLowerCase() === 'true' || value === '1';
        } else {
          finalValue = !!value;
        }
        finalType = 'String'; // o 'Boolean' si backend soporta
        break;

      case 'Texto': // Texto → String
      default:
        finalValue = String(value);
        finalType = 'String';
        break;
    }

    return { value: finalValue, type: finalType };
  }

  get variablesFormGroups(): FormGroup[] {
    return (this.registroForm.get('variables') as FormArray).controls as FormGroup[];
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  onCancel(): void {
    if (this.registroForm.dirty) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, continuar editando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.registroForm.reset();
          this.initializeVariables();
          this.hasCaregiver = false;
          this.currentSection = 0;
        }
      });
    }
  }
}
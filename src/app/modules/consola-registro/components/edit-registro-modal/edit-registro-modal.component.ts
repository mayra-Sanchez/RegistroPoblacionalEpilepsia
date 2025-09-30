import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Services
import { ConsolaRegistroService } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';

// Interfaces
import { Variable, Register, RegisterRequest, RegisterPatient, RegisterCaregiver, RegisterVariable } from '../../interfaces';

/**
 * Componente modal para editar registros de pacientes
 * Maneja la edición de información personal, datos del cuidador y variables de investigación
 */
@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent implements OnInit, OnDestroy {
  //#region Propiedades del Formulario y Estado
  /** FormGroup principal del formulario de edición */
  editForm: FormGroup;

  /** Indica si se está cargando o guardando */
  loading: boolean = false;

  /** Sección actual del formulario (para navegación por pasos) */
  currentSection: number = 0;

  /** Indica si el paciente tiene cuidador */
  hasCaregiver: boolean = false;

  /** Lista de variables de la capa de investigación */
  variablesDeCapa: Variable[] = [];
  variablesReadOnly: boolean = true;

  /** Subject para manejar la desuscripción de observables */
  private destroy$ = new Subject<void>();
  //#endregion

  //#region Opciones Predefinidas para Selects
  /** Tipos de identificación disponibles */
  tiposIdentificacion = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro Civil' }
  ];

  /** Opciones de género */
  sexos = [
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' }
  ];

  /** Estados civiles disponibles */
  estadosCiviles = [
    { value: 'Soltero', label: 'Soltero/a' },
    { value: 'Casado', label: 'Casado/a' },
    { value: 'Divorciado', label: 'Divorciado/a' },
    { value: 'Viudo', label: 'Viudo/a' },
    { value: 'Unión Libre', label: 'Unión Libre' }
  ];

  /** Niveles de educación */
  nivelesEducacion = [
    { value: 'Primaria', label: 'Primaria' },
    { value: 'Secundaria', label: 'Secundaria' },
    { value: 'Técnico', label: 'Técnico' },
    { value: 'Universitario', label: 'Universitario' },
    { value: 'Posgrado', label: 'Posgrado' },
    { value: 'Ninguno', label: 'Ninguno' }
  ];

  /** Niveles económicos */
  nivelesEconomicos = [
    { value: 'Bajo', label: 'Bajo' },
    { value: 'Medio Bajo', label: 'Medio Bajo' },
    { value: 'Medio', label: 'Medio' },
    { value: 'Medio Alto', label: 'Medio Alto' },
    { value: 'Alto', label: 'Alto' }
  ];

  /** Estados de crisis médica */
  estadosCrisis = [
    { value: 'Activa', label: 'Activa' },
    { value: 'Remisión', label: 'Remisión' },
    { value: 'Controlada', label: 'Controlada' },
    { value: 'Crónica', label: 'Crónica' }
  ];

  /** Ocupaciones disponibles */
  ocupaciones = [
    'Ama de casa',
    'Estudiante',
    'Jubilado/Pensionado',
    'Desempleado',
    'Agricultor',
    'Comerciante',
    'Empleado público',
    'Empleado privado',
    'Empresario',
    'Profesional independiente',
    'Técnico',
    'Obrero',
    'Conductor',
    'Docente',
    'Sanitario',
    'Fuerzas armadas',
    'Otro'
  ];
  //#endregion

  //#region Constructor e Inicialización
  /**
   * Constructor del componente modal
   * @param fb FormBuilder para crear formularios reactivos
   * @param consolaService Servicio de consola de registro
   * @param authService Servicio de autenticación
   * @param dialogRef Referencia al modal dialog
   * @param data Datos inyectados que contienen el registro y variables
   */
  constructor(
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<EditRegistroModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { registro: Register, variables: Variable[] }
  ) {
    this.editForm = this.createForm();
    this.variablesDeCapa = data.variables || [];
  }

  /**
   * Inicialización del componente
   * Configura el formulario con los datos del registro recibido
   */
  ngOnInit(): void {
    console.log('🎯 Modal de edición iniciado');
    console.log('📦 Datos recibidos:', this.data);

    if (!this.data?.registro) {
      console.error('❌ No se recibió registro para editar');
      this.showErrorAndClose('No se pudieron cargar los datos del registro');
      return;
    }

    if (!this.data.variables || this.data.variables.length === 0) {
      console.warn('⚠️ No se recibieron variables de la capa');
    }

    this.editForm = this.createForm();

    this.initializeFormWithData();

    this.disableVariables();

    const birthControl = this.editForm.get('patient.birthDate');
    birthControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onBirthDateChange());
  }

  /**
  * Deshabilita todos los controles de variables (modo solo lectura)
  */
  disableVariables(): void {
    this.variablesReadOnly = true;
    const variablesArray = this.editForm.get('variables') as FormArray;

    variablesArray.controls.forEach(control => {
      const valueControl = control.get('value');
      if (valueControl) {
        valueControl.disable({ onlySelf: true, emitEvent: false });
      }
    });
  }

  /**
   * Habilita todos los controles de variables (modo edición)
   */
  enableVariables(): void {
    this.variablesReadOnly = false;
    const variablesArray = this.editForm.get('variables') as FormArray;

    variablesArray.controls.forEach(control => {
      const valueControl = control.get('value');
      if (valueControl) {
        valueControl.enable({ onlySelf: true, emitEvent: false });
      }
    });
  }

  /**
   * Alterna entre modo edición y solo lectura para las variables
   */
  toggleVariablesEdit(): void {
    if (this.variablesReadOnly) {
      this.enableVariables();
    } else {
      this.disableVariables();
    }
  }

  /**
   * Limpieza al destruir el componente
   * Desuscribe todos los observables
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Creación e Inicialización del Formulario
  /**
   * Crea la estructura base del formulario reactivo
   * @returns FormGroup configurado con validadores
   */
  createForm(): FormGroup {
    return this.fb.group({
      patientIdentificationNumber: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]],
      patientIdentificationType: [{ value: 'CC', disabled: true }, Validators.required],

      patient: this.fb.group({
        name: ['', Validators.required],
        sex: ['', Validators.required],
        birthDate: ['', Validators.required],
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

  /**
   * Inicializa el formulario con los datos del registro
   */
  initializeFormWithData(): void {
    const registro = this.data.registro;

    if (!registro) {
      this.showErrorAndClose('No se pudieron cargar los datos del registro');
      return;
    }

    this.loadIdentificationData(registro);

    this.loadPatientData(registro);

    this.loadCaregiverData(registro);

    this.initializeVariablesWithData(registro);
  }

  /**
   * Carga los datos de identificación del registro al formulario
   * @param registro Registro con los datos a cargar
   */
  private loadIdentificationData(registro: Register): void {
    this.editForm.patchValue({
      patientIdentificationNumber: registro.patientIdentificationNumber || '',
      patientIdentificationType: this.getShortIdentificationType(registro.patientIdentificationType) || 'CC',
    });
  }

  /**
   * Carga los datos del paciente al formulario
   * @param registro Registro con los datos del paciente
   */
  private loadPatientData(registro: Register): void {
    const patientData = registro.patientBasicInfo;
    if (patientData) {
      const patientGroup = this.editForm.get('patient') as FormGroup;
      if (patientGroup) {
        patientGroup.patchValue({
          name: patientData.name || '',
          sex: patientData.sex || '',
          birthDate: this.formatDateForInput(patientData.birthDate),
          age: patientData.age || '',
          email: patientData.email || '',
          phoneNumber: patientData.phoneNumber || '',
          deathDate: this.formatDateForInput(patientData.deathDate),
          economicStatus: patientData.economicStatus || '',
          educationLevel: patientData.educationLevel || '',
          maritalStatus: patientData.maritalStatus || '',
          hometown: patientData.hometown || '',
          currentCity: patientData.currentCity || '',
          firstCrisisDate: this.formatDateForInput(patientData.firstCrisisDate),
          crisisStatus: patientData.crisisStatus || ''
        });

      }
    }
  }


  /**
   * Carga los datos del cuidador al formulario si existen
   * @param registro Registro con los datos del cuidador
   */
  private loadCaregiverData(registro: Register): void {
    if (registro.caregiver && registro.caregiver.name) {
      this.hasCaregiver = true;
      console.log('👥 Datos del cuidador:', registro.caregiver);

      const caregiverGroup = this.editForm.get('caregiver') as FormGroup;
      if (caregiverGroup) {
        caregiverGroup.patchValue({
          name: registro.caregiver.name || '',
          identificationType: this.getShortIdentificationType(registro.caregiver.identificationType) || 'CC',
          identificationNumber: registro.caregiver.identificationNumber || '',
          age: registro.caregiver.age || '',
          educationLevel: registro.caregiver.educationLevel || '',
          occupation: registro.caregiver.occupation || ''
        });
      }
    }
  }

  initializeVariablesWithData(registro: Register): void {
    const variablesArray = this.editForm.get('variables') as FormArray;
    variablesArray.clear();

    const registroVariables = this.getVariablesFromRegister(registro);

    this.variablesDeCapa.forEach(capaVariable => {
      const variableData = this.findMatchingVariable(capaVariable, registroVariables);
      this.createVariableControl(variablesArray, capaVariable, variableData ? [variableData] : []);
    });

  }

  /**
   * Crea un control de formulario para una variable específica
   * @param variablesArray Array de formulario para las variables
   * @param variable Definición de la variable de la capa
   * @param registroVariables Variables con valores del registro
   */
  private createVariableControl(variablesArray: FormArray, variable: Variable, registroVariables: any[]): void {
    const variableData = registroVariables.find(v =>
      v.variableId === variable.id ||
      v.variableName === variable.name ||
      v.name === variable.name
    );

    const isVariableRequired = variable.isRequired ?? false;
    const variableName = variable.name || variable.variableName || 'Variable sin nombre';

    const variableType = this.getVariableType(variableData, variable);

    const validators = isVariableRequired ? [Validators.required] : [];

    const variableValue = this.extractVariableValue(variableData, variableType);

    const variableGroup = this.fb.group({
      variableId: [variable.id],
      variableName: [variableName],
      value: [variableValue, validators],
      type: [variableType],
      isRequired: [isVariableRequired],
      originalType: [variableType]
    });

    variablesArray.push(variableGroup);
  }

  /**
 * Encuentra la variable correspondiente en los datos del registro
 * @param capaVariable Variable de la capa
 * @param registroVariables Variables del registro
 * @returns Variable del registro que coincide
 */
  private findMatchingVariable(capaVariable: Variable, registroVariables: any[]): any {
    const matches = registroVariables.filter(v =>
      v.variableId === capaVariable.id ||
      v.variableName === capaVariable.name ||
      v.variableName === capaVariable.variableName ||
      (capaVariable.name && v.name === capaVariable.name)
    );

    if (matches.length > 0) {
      return matches[0];
    }

    return null;
  }

  /**
   * Extrae el valor de una variable desde los datos del registro
   * @param variableData Datos de la variable del registro
   * @param variableType Tipo de variable (para forzar el correcto)
   * @returns Valor formateado como string
   */
  private extractVariableValue(variableData: any, variableType?: string): string {
    if (!variableData) {
      return '';
    }

    const finalType = variableType || this.getVariableType(variableData);

    let rawValue: any;

    if (variableData.value !== undefined && variableData.value !== null) {
      rawValue = variableData.value;
    } else if (variableData.valueAsString !== undefined && variableData.valueAsString !== null) {
      rawValue = variableData.valueAsString;
    } else if (variableData.valueAsNumber !== undefined && variableData.valueAsNumber !== null) {
      rawValue = variableData.valueAsNumber;
    } else {
      return '';
    }

    if (finalType === 'Fecha') {
      const formattedDate = this.formatDateForInput(rawValue);
      return formattedDate;
    }

    const result = rawValue.toString();
    return result;
  }
  //#endregion

  //#region Métodos de Utilidad para Datos
  /**
   * Obtiene las variables del registro de forma compatible con diferentes estructuras
   * @param registro Registro del que extraer las variables
   * @returns Array de variables
   */
  private getVariablesFromRegister(registro: Register): any[] {
    if (registro.registerInfo && registro.registerInfo.length > 0) {
      const mainInfo = registro.registerInfo[0];
      if (mainInfo.variablesInfo && mainInfo.variablesInfo.length > 0) {
        return mainInfo.variablesInfo;
      }
    }

    if (registro.variablesRegister && registro.variablesRegister.length > 0) {
      return registro.variablesRegister;
    }

    if ((registro as any).variablesInfo) {
      return (registro as any).variablesInfo;
    }

    return [];
  }

  /**
   * Convierte el tipo de identificación completo al formato abreviado
   * @param fullType Tipo de identificación completo
   * @returns Tipo abreviado o 'CC' por defecto
   */
  private getShortIdentificationType(fullType: string): string {
    if (!fullType) return 'CC';

    const typeMap: { [key: string]: string } = {
      'Cédula de Ciudadanía': 'CC',
      'Tarjeta de Identidad': 'TI',
      'Cédula de Extranjería': 'CE',
      'Pasaporte': 'PA',
      'Registro Civil': 'RC'
    };

    return typeMap[fullType] || fullType;
  }

  /**
 * Obtiene el tipo de variable de forma segura desde diferentes estructuras
 * @param variableData Datos de la variable
 * @param variableDefinition Definición de la variable de la capa (opcional)
 * @returns Tipo de variable
 */
  private getVariableType(variableData: any, variableDefinition?: Variable): string {
    if (variableDefinition?.type) {
      return variableDefinition.type;
    }

    if (variableData?.type) {
      return variableData.type;
    }

    if (variableData?.variableType) {
      return variableData.variableType;
    }

    return 'Texto';
  }

  /**
   * Convierte el tipo de identificación al formato del backend
   * @param type Tipo abreviado
   * @returns Tipo completo para el backend
   */
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

  /**
   * Formatea una fecha para el input type="date" (YYYY-MM-DD)
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada o string vacío
   */
  private formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';

    try {
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      if (typeof dateValue === 'string') {
        const formats = [
          /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/, // DD/MM/YYYY o DD-MM-YYYY
          /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/  // YYYY/MM/DD o YYYY-MM-DD
        ];

        for (const format of formats) {
          const match = dateValue.match(format);
          if (match) {
            if (format === formats[0]) {
              const [, day, month, year] = match;
              return `${year}-${month}-${day}`;
            } else {
              return dateValue.replace(/[\/]/g, '-');
            }
          }
        }
      }

      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error formateando fecha:', error, dateValue);
    }

    return '';
  }

  /**
   * Formatea una fecha para el backend (YYYY-MM-DD)
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada o null
   */
  private formatDateForBackend(dateValue: any): string | null {
    if (!dateValue) return null;

    try {
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }
  //#endregion

  //#region Métodos de Navegación y Validación
  /**
   * Cambia a una sección específica del formulario
   * @param sectionIndex Índice de la sección a mostrar
   */
  changeSection(sectionIndex: number): void {
    this.currentSection = sectionIndex;
  }

  /**
   * Navega a la siguiente sección del formulario
   */
  nextSection(): void {
    if (this.validateCurrentSection()) {
      const maxSections = this.variables.length > 0 ? 3 : 2;
      if (this.currentSection < maxSections) {
        this.currentSection++;
      }
    }
  }

  /**
   * Navega a la sección anterior del formulario
   */
  prevSection(): void {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  /**
   * Valida la sección actual antes de permitir la navegación
   * @returns true si la sección es válida
   */
  validateCurrentSection(): boolean {
    switch (this.currentSection) {
      case 1:
        const name = this.editForm.get('patient.name');
        const sex = this.editForm.get('patient.sex');
        const birthDate = this.editForm.get('patient.birthDate');

        if (name?.invalid || sex?.invalid || birthDate?.invalid) {
          this.markFieldsAsTouched([name, sex, birthDate]);
          Swal.fire('Error', 'Por favor complete los campos requeridos de información personal', 'error');
          return false;
        }
        break;
    }
    return true;
  }

  /**
   * Marca campos como touched para mostrar errores de validación
   * @param fields Array de campos a marcar como touched
   */
  markFieldsAsTouched(fields: any[]): void {
    fields.forEach(field => {
      if (field) {
        field.markAsTouched();
      }
    });
  }

  /**
   * Maneja el cambio en la fecha de nacimiento para calcular la edad automáticamente
   */
  onBirthDateChange(): void {
    const birthDate = this.editForm.get('patient.birthDate')?.value;
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();

      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      this.editForm.get('patient.age')?.setValue(age);
    }
  }

  /**
   * Alterna la visibilidad de la sección de cuidador
   */
  toggleCaregiver(): void {
    this.hasCaregiver = !this.hasCaregiver;
    if (!this.hasCaregiver) {
      this.editForm.get('caregiver')?.reset();
    }
  }
  //#endregion

  //#region Métodos de Envío y Procesamiento
  /**
   * Maneja el envío del formulario de edición
   */
  async onSubmit(): Promise<void> {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;

    try {
      const formValue = this.editForm.getRawValue();

      const registerRequest = this.prepareUpdateRequest(formValue);


      const userEmail = this.authService.getUserEmail();
      if (!userEmail) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      if (!this.data.registro.registerId) {
        throw new Error('No se pudo identificar el registro a actualizar');
      }


      const response = await this.consolaService.updateRegister(
        this.data.registro.registerId,
        userEmail,
        registerRequest
      ).pipe(takeUntil(this.destroy$)).toPromise();


      Swal.fire('Éxito', 'Registro actualizado correctamente', 'success');
      this.dialogRef.close(true);

    } catch (error: any) {
      this.handleUpdateError(error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Prepara el request para la actualización según la interfaz RegisterRequest
   * @param formValue Valores del formulario
   * @returns Objeto estructurado para la API
   */
  private prepareUpdateRequest(formValue: any): any {
    const backendIdentificationType = this.getBackendIdentificationType(formValue.patientIdentificationType);

    const variablesInfo: any[] = formValue.variables.map((v: any) => {
      const converted = this.convertValueForApi(v.value, v.type);
      return {
        id: v.variableId,
        name: v.variableName,
        value: converted.value,
        type: converted.finalType || v.type
      };
    });

    const researchLayerId = this.data.registro.registerInfo?.[0]?.researchLayerId || '';
    const researchLayerName = this.data.registro.registerInfo?.[0]?.researchLayerName || '';

    let caregiverData: any;
    if (this.hasCaregiver && formValue.caregiver?.name) {
      caregiverData = {
        name: formValue.caregiver.name,
        identificationType: this.getBackendIdentificationType(formValue.caregiver.identificationType),
        identificationNumber: Number(formValue.caregiver.identificationNumber) || 0,
        age: Number(formValue.caregiver.age) || 0,
        educationLevel: formValue.caregiver.educationLevel || '',
        occupation: formValue.caregiver.occupation || ''
      };
    }

    const firstCrisisDate = this.formatDateForBackend(formValue.patient.firstCrisisDate) || '';

    const registerRequest = {
      registerInfo: {
        researchLayerId: researchLayerId,
        researchLayerName: researchLayerName,
        variablesInfo: variablesInfo
      },
      patientIdentificationNumber: Number(formValue.patientIdentificationNumber),
      patientIdentificationType: backendIdentificationType,
      patient: {
        name: formValue.patient.name,
        sex: formValue.patient.sex,
        birthDate: this.formatDateForBackend(formValue.patient.birthDate) || '',
        age: Number(formValue.patient.age) || 0,
        email: formValue.patient.email || '',
        phoneNumber: formValue.patient.phoneNumber || '',
        deathDate: this.formatDateForBackend(formValue.patient.deathDate) || '',
        economicStatus: formValue.patient.economicStatus || '',
        educationLevel: formValue.patient.educationLevel || '',
        maritalStatus: formValue.patient.maritalStatus || '',
        hometown: formValue.patient.hometown || '',
        currentCity: formValue.patient.currentCity || '',
        firstCrisisDate: firstCrisisDate,
        crisisStatus: formValue.patient.crisisStatus || ''
      },
      ...(caregiverData && { caregiver: caregiverData })
    };

    return registerRequest;
  }

  /**
   * Convierte valores del formulario al tipo esperado por la API
   * @param value Valor a convertir
   * @param originalType Tipo original de la variable
   * @returns Objeto con valor convertido y tipo final
   */
  private convertValueForApi(value: any, originalType: string): { value: any, finalType: string } {
    if (value === null || value === undefined || value === '') {
      return { value: null, finalType: 'String' };
    }

    let finalValue: any;
    let finalType: string;

    switch (originalType) {
      case 'Entero':
        finalValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
        finalType = 'Number';
        break;
      case 'Real':
        finalValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        finalType = 'Number';
        break;
      case 'Fecha':
        finalValue = this.formatDateForBackend(value) || value;
        finalType = 'String';
        break;
      case 'Lógico':
        finalValue = typeof value === 'string' ? value.toLowerCase() === 'true' || value === '1' : !!value;
        finalType = 'String';
        break;
      default:
        finalValue = String(value);
        finalType = 'String';
        break;
    }

    return { value: finalValue, finalType: finalType };
  }

  /**
   * Maneja errores durante la actualización del registro
   * @param error Error capturado
   */
  private handleUpdateError(error: any): void {
    if (error.error) {
      console.error('📋 Error body:', error.error);
    }
    if (error.status) {
      console.error('🔧 Error status:', error.status);
    }

    let errorMessage = 'No se pudo actualizar el registro';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    Swal.fire('Error', errorMessage, 'error');
  }
  //#endregion

  //#region Métodos de Validación y Utilidades de UI
  /**
   * Marca recursivamente todos los controles de un FormGroup como touched
   * @param formGroup Grupo de formulario a marcar
   */
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

  /**
   * Valida entrada de teclado para campos numéricos
   * @param event Evento de teclado
   * @returns true si la tecla es válida
   */
  validateNumber(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) &&
      charCode !== 8 && charCode !== 9 && charCode !== 37 && charCode !== 39) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Valida entrada de teclado para campos decimales
   * @param event Evento de teclado
   * @returns true si la tecla es válida
   */
  validateDecimal(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    const value = (event.target as HTMLInputElement).value;

    if (charCode === 46) {
      if (value.includes('.')) {
        event.preventDefault();
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

  /**
   * Maneja cambios en checkboxes para variables lógicas
   * @param variable Grupo de formulario de la variable
   * @param event Evento de cambio del checkbox
   */
  onCheckboxChange(variable: FormGroup, event: MatCheckboxChange): void {
    const control = this.getVariableControl(variable, 'value');
    control.setValue(event.checked);
    control.updateValueAndValidity();
  }
  //#endregion

  //#region Getters y Métodos de Acceso
  /**
   * Obtiene el FormArray de variables
   */
  get variables(): FormArray {
    return this.editForm.get('variables') as FormArray;
  }

  /**
   * Obtiene los grupos de formulario de las variables
   */
  get variablesFormGroups(): FormGroup[] {
    return this.variables.controls.filter(control => control instanceof FormGroup) as FormGroup[];
  }

  /**
   * Obtiene un control específico de una variable
   * @param variable Grupo de formulario de la variable
   * @param controlName Nombre del control
   * @returns FormControl solicitado
   */
  getVariableControl(variable: FormGroup, controlName: string): FormControl {
    const control = variable.get(controlName);
    if (control instanceof FormControl) {
      return control;
    }
    throw new Error(`El control '${controlName}' no existe o no es un FormControl`);
  }

  /**
   * Obtiene la etiqueta descriptiva para un tipo de variable
   * @param type Tipo de variable
   * @returns Etiqueta descriptiva
   */
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

  /**
   * Obtiene la descripción para un tipo de variable
   * @param type Tipo de variable
   * @returns Descripción del tipo
   */
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

  /**
   * Obtiene el mensaje de error para una variable
   * @param variable Grupo de formulario de la variable
   * @returns Mensaje de error
   */
  getErrorMessage(variable: FormGroup): string {
    const control = variable.get('value');
    if (control?.errors?.['required']) {
      return 'Este campo es requerido';
    }
    return 'Valor inválido';
  }
  //#endregion

  //#region Métodos de Cierre y Manejo de Modal
  /**
   * Maneja el cierre del modal con confirmación si hay cambios sin guardar
   */
  onCancel(): void {
    if (this.editForm.dirty) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'No, continuar editando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.dialogRef.close(false);
        }
      });
    } else {
      this.dialogRef.close(false);
    }
  }

  /**
   * Muestra un error y cierra el modal
   * @param message Mensaje de error a mostrar
   */
  private showErrorAndClose(message: string): void {
    Swal.fire('Error', message, 'error');
    this.dialogRef.close();
  }
  //#endregion

  //#region Métodos de Utilidad para Validación de Formulario
  /**
   * Verifica si el formulario es válido
   */
  get isFormValid(): boolean {
    return this.editForm.valid;
  }

  /**
   * Verifica si la sección actual es válida
   */
  get isCurrentSectionValid(): boolean {
    switch (this.currentSection) {
      case 0:
        const patientGroup = this.editForm.get('patient') as FormGroup;
        return patientGroup?.valid || false;
      case 1:
        return true;
      case 2:
        return this.variables.valid;
      default:
        return false;
    }
  }

  /**
   * Verifica si hay variables requeridas sin completar
   */
  get hasRequiredVariablesIncomplete(): boolean {
    return this.variablesFormGroups.some(variable => {
      const isRequired = variable.get('isRequired')?.value;
      const value = variable.get('value')?.value;
      return isRequired && (!value || value.toString().trim() === '');
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  //#region Métodos para mostrar información del paciente en el header
  /**
   * Obtiene el nombre del paciente para mostrar en el header
   * @returns Nombre del paciente o texto por defecto
   */
  getPatientDisplayName(): string {
    const patientName = this.editForm.get('patient.name')?.value;
    const identification = this.editForm.get('patientIdentificationNumber')?.value;

    if (patientName && patientName.trim()) {
      return patientName;
    } else if (identification) {
      return `Documento ${identification}`;
    } else {
      return 'Paciente';
    }
  }

  /**
   * Obtiene la identificación completa del paciente
   * @returns Identificación formateada
   */
  getPatientIdentification(): string {
    const identificationType = this.editForm.get('patientIdentificationType')?.value;
    const identificationNumber = this.editForm.get('patientIdentificationNumber')?.value;

    if (identificationType && identificationNumber) {
      const typeLabel = this.tiposIdentificacion.find(t => t.value === identificationType)?.label || identificationType;
      return `${typeLabel}: ${identificationNumber}`;
    } else if (identificationNumber) {
      return identificationNumber;
    } else {
      return 'No especificado';
    }
  }
  //#endregion
}
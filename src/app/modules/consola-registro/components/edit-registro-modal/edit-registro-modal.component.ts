import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
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
 * 
 * Este componente maneja la edición completa de registros médicos incluyendo:
 * - Información personal del paciente
 * - Datos del cuidador (opcional)
 * - Variables de investigación de la capa
 * 
 * @component
 * @selector app-edit-registro-modal
 * @example
 * // Uso en template:
 * <app-edit-registro-modal></app-edit-registro-modal>
 */
@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent implements OnInit, OnDestroy {
  
  //#region Propiedades del Formulario y Estado
  
  /**
   * FormGroup principal que contiene todos los controles del formulario de edición
   * @type {FormGroup}
   */
  editForm: FormGroup;

  /**
   * Indica si la sección de cuidador está expandida o colapsada
   * @type {boolean}
   */
  caregiverExpanded: boolean = false;

  /**
   * Indica si se está realizando una operación de carga o guardado
   * @type {boolean}
   */
  loading: boolean = false;

  /**
   * Sección actual del formulario para navegación por pasos
   * 0: Información personal, 1: Cuidador, 2: Variables
   * @type {number}
   */
  currentSection: number = 0;

  /**
   * Indica si el paciente tiene cuidador asignado
   * @type {boolean}
   */
  hasCaregiver: boolean = false;

  /**
   * Lista de variables de investigación obtenidas de la capa
   * @type {Variable[]}
   */
  variablesDeCapa: Variable[] = [];

  /**
   * Indica si las variables están en modo solo lectura
   * @type {boolean}
   */
  variablesReadOnly: boolean = true;

  /**
   * Filtro actual aplicado a la lista de variables
   * @type {string}
   */
  currentFilter: string = 'all';

  /**
   * Opciones disponibles para filtrar variables
   * @type {Array<{value: string, label: string}>}
   */
  filterOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'required', label: 'Requeridas' }
  ];

  /**
   * Tipos de selección disponibles para variables con opciones
   * @type {Array<{value: string, label: string}>}
   */
  selectionTypes = [
    { value: 'single', label: 'Selección única' },
    { value: 'multiple', label: 'Selección múltiple' }
  ];

  /**
   * Mapa que almacena el tipo de selección por variable ID
   * @private
   * @type {Map<string, string>}
   */
  private selectionTypeMap = new Map<string, string>();

  /**
   * Subject para manejar la desuscripción de observables y prevenir memory leaks
   * @private
   * @type {Subject<void>}
   */
  private destroy$ = new Subject<void>();

  //#endregion

  //#region Opciones Predefinidas para Selects

  /**
   * Tipos de identificación disponibles para paciente y cuidador
   * @type {Array<{value: string, label: string}>}
   */
  tiposIdentificacion = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro Civil' }
  ];

  /**
   * Opciones de género para el paciente
   * @type {Array<{value: string, label: string}>}
   */
  sexos = [
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' }
  ];

  /**
   * Estados civiles disponibles para el paciente
   * @type {Array<{value: string, label: string}>}
   */
  estadosCiviles = [
    { value: 'Soltero', label: 'Soltero/a' },
    { value: 'Casado', label: 'Casado/a' },
    { value: 'Divorciado', label: 'Divorciado/a' },
    { value: 'Viudo', label: 'Viudo/a' },
    { value: 'Unión Libre', label: 'Unión Libre' }
  ];

  /**
   * Niveles de educación para paciente y cuidador
   * @type {Array<{value: string, label: string}>}
   */
  nivelesEducacion = [
    { value: 'Primaria', label: 'Primaria' },
    { value: 'Secundaria', label: 'Secundaria' },
    { value: 'Técnico', label: 'Técnico' },
    { value: 'Universitario', label: 'Universitario' },
    { value: 'Posgrado', label: 'Posgrado' },
    { value: 'Ninguno', label: 'Ninguno' }
  ];

  /**
   * Niveles económicos para clasificación del paciente
   * @type {Array<{value: string, label: string}>}
   */
  nivelesEconomicos = [
    { value: 'Bajo', label: 'Bajo' },
    { value: 'Medio Bajo', label: 'Medio Bajo' },
    { value: 'Medio', label: 'Medio' },
    { value: 'Medio Alto', label: 'Medio Alto' },
    { value: 'Alto', label: 'Alto' }
  ];

  /**
   * Estados de crisis médica para el paciente
   * @type {Array<{value: string, label: string}>}
   */
  estadosCrisis = [
    { value: 'Activa', label: 'Activa' },
    { value: 'Remisión', label: 'Remisión' },
    { value: 'Controlada', label: 'Controlada' },
    { value: 'Crónica', label: 'Crónica' }
  ];

  /**
   * Ocupaciones disponibles para el cuidador
   * @type {string[]}
   */
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
   * Constructor del componente modal de edición
   * @constructor
   * @param {FormBuilder} fb - Servicio para crear formularios reactivos
   * @param {ConsolaRegistroService} consolaService - Servicio para operaciones de registro
   * @param {AuthService} authService - Servicio de autenticación
   * @param {MatDialogRef<EditRegistroModalComponent>} dialogRef - Referencia al diálogo modal
   * @param {Object} data - Datos inyectados que contienen el registro y variables
   * @param {Register} data.registro - Registro a editar
   * @param {Variable[]} data.variables - Variables de la capa de investigación
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
   * Inicialización del componente después de que Angular muestra las vistas
   * @method
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

    // Inicializar tipos de selección después de cargar datos
    setTimeout(() => {
      this.initializeSelectionTypes();
    }, 100);

    // Suscribirse a cambios en la fecha de nacimiento para calcular edad automáticamente
    const birthControl = this.editForm.get('patient.birthDate');
    birthControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onBirthDateChange());
  }

  /**
   * Limpieza de recursos al destruir el componente
   * Desuscribe todos los observables para prevenir memory leaks
   * @method
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //#endregion

  //#region Gestión de Variables (Lectura/Edición)

  /**
   * Deshabilita todos los controles de variables (modo solo lectura)
   * @method
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
   * @method
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
   * @method
   */
  toggleVariablesEdit(): void {
    this.variablesReadOnly = !this.variablesReadOnly;
    const variablesArray = this.editForm.get('variables') as FormArray;

    variablesArray.controls.forEach(control => {
      const valueControl = control.get('value');
      if (valueControl) {
        if (this.variablesReadOnly) {
          valueControl.disable({ onlySelf: true, emitEvent: false });
        } else {
          valueControl.enable({ onlySelf: true, emitEvent: false });
        }
      }
    });
  }

  //#endregion

  //#region Creación e Inicialización del Formulario

  /**
   * Crea la estructura base del formulario reactivo con validaciones
   * @private
   * @returns {FormGroup} FormGroup configurado con todos los controles y validadores
   */
  private createForm(): FormGroup {
    return this.fb.group({
      // Información de identificación del paciente (solo lectura)
      patientIdentificationNumber: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]],
      patientIdentificationType: [{ value: 'CC', disabled: true }, Validators.required],

      // Grupo de información personal del paciente
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

      // Grupo de información del cuidador (opcional)
      caregiver: this.fb.group({
        name: [''],
        identificationType: ['CC'],
        identificationNumber: [''],
        age: [''],
        educationLevel: [''],
        occupation: ['']
      }),

      // Array de variables de investigación
      variables: this.fb.array([])
    });
  }

  /**
   * Inicializa el formulario con los datos del registro existente
   * @private
   * @method
   */
  private initializeFormWithData(): void {
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
   * @private
   * @param {Register} registro - Registro con los datos a cargar
   */
  private loadIdentificationData(registro: Register): void {
    this.editForm.patchValue({
      patientIdentificationNumber: registro.patientIdentificationNumber || '',
      patientIdentificationType: this.getShortIdentificationType(registro.patientIdentificationType) || 'CC',
    });
  }

  /**
   * Carga los datos del paciente al formulario
   * @private
   * @param {Register} registro - Registro con los datos del paciente
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
   * @private
   * @param {Register} registro - Registro con los datos del cuidador
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

  /**
   * Inicializa las variables con datos existentes del registro
   * @private
   * @param {Register} registro - Registro con las variables a cargar
   */
  private initializeVariablesWithData(registro: Register): void {
    const variablesArray = this.editForm.get('variables') as FormArray;
    variablesArray.clear();

    const registroVariables = this.getVariablesFromRegister(registro);

    this.variablesDeCapa.forEach(capaVariable => {
      const variableData = this.findMatchingVariable(capaVariable, registroVariables);
      this.createVariableControl(variablesArray, capaVariable, variableData);
    });
  }

  /**
   * Inicializa los tipos de selección para variables con opciones
   * @private
   * @method
   */
  private initializeSelectionTypes(): void {
    this.variablesFormGroups.forEach(variable => {
      if (this.hasOptions(variable)) {
        const currentValue = variable.get('value')?.value;
        const variableId = variable.get('variableId')?.value;

        // Si el valor actual es un array, establecer como múltiple
        if (Array.isArray(currentValue)) {
          this.selectionTypeMap.set(variableId, 'multiple');
        } else {
          this.selectionTypeMap.set(variableId, 'single');
        }
      }
    });
  }

  //#endregion

  //#region Métodos de Utilidad para Datos

  /**
   * Obtiene las variables del registro de forma compatible con diferentes estructuras
   * @private
   * @param {Register} registro - Registro del que extraer las variables
   * @returns {any[]} Array de variables del registro
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
   * Encuentra la variable correspondiente en los datos del registro
   * @private
   * @param {Variable} capaVariable - Variable de la capa
   * @param {any[]} registroVariables - Variables del registro
   * @returns {any} Variable del registro que coincide
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
   * Crea un control de variable en el FormArray
   * @private
   * @param {FormArray} variablesArray - Array donde agregar el control
   * @param {Variable} variable - Variable de la capa
   * @param {any} registroVariable - Datos existentes de la variable
   */
  private createVariableControl(variablesArray: FormArray, variable: Variable, registroVariable: any): void {
    const isVariableRequired = variable.isRequired ?? false;
    const variableName = variable.variableName || 'Variable sin nombre';
    const variableType = variable.type || 'Texto';

    // Determinar el valor inicial
    let variableValue: any = '';
    if (registroVariable) {
      variableValue = this.extractVariableValue(registroVariable, variableType);
    }

    const variableGroup = this.fb.group({
      variableId: [variable.id],
      variableName: [variableName],
      description: [variable.description || ''],
      type: [variableType],
      options: [variable.options || []],
      isRequired: [isVariableRequired],
      value: [variableValue, isVariableRequired ? [Validators.required] : []]
    });

    variablesArray.push(variableGroup);

    // Inicialización del tipo de selección
    if (variable.options && variable.options.length > 0) {
      const initialValue = variableGroup.get('value')?.value;
      const selectionType = Array.isArray(initialValue) ? 'multiple' : 'single';
      this.setSelectionType(variableGroup, selectionType);
    }
  }

  /**
   * Extrae el valor de una variable desde los datos del registro
   * Maneja correctamente arrays para selección múltiple
   * @private
   * @param {any} variableData - Datos de la variable del registro
   * @param {string} [variableType] - Tipo de la variable
   * @returns {any} Valor extraído y formateado
   */
  private extractVariableValue(variableData: any, variableType?: string): any {
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

    // Manejo especial para selección múltiple
    if (typeof rawValue === 'string' && rawValue.includes(',')) {
      const valuesArray = rawValue.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (valuesArray.length > 1) {
        return valuesArray;
      } else if (valuesArray.length === 1) {
        return valuesArray[0];
      }
    }

    // Para fechas, formatear correctamente
    if (finalType === 'Fecha') {
      return this.formatDateForInput(rawValue);
    }

    // Para valores booleanos
    if (finalType === 'Lógico') {
      if (typeof rawValue === 'string') {
        return rawValue.toLowerCase() === 'true' || rawValue === '1';
      }
      return Boolean(rawValue);
    }

    return rawValue.toString();
  }

  //#endregion

  //#region Métodos de Conversión y Formateo

  /**
   * Convierte el tipo de identificación completo al formato abreviado
   * @private
   * @param {string} fullType - Tipo de identificación completo
   * @returns {string} Tipo abreviado o 'CC' por defecto
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
   * Convierte el tipo de identificación al formato del backend
   * @private
   * @param {string} type - Tipo abreviado
   * @returns {string} Tipo completo para el backend
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
   * @private
   * @param {any} dateValue - Valor de fecha a formatear
   * @returns {string} Fecha formateada o string vacío
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
   * Formatea fecha para backend (YYYY-MM-DD)
   * @private
   * @param {any} dateValue - Valor de fecha a formatear
   * @returns {string | null} Fecha formateada o null
   */
  private formatDateForBackend(dateValue: any): string | null {
    if (!dateValue) return null;

    try {
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
        const [day, month, year] = dateValue.split('-');
        return `${year}-${month}-${day}`;
      }

      if (typeof dateValue === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        const [day, month, year] = dateValue.split('/');
        return `${year}-${month}-${day}`;
      }

      let date: Date;

      if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) {
        console.warn('⚠️ Fecha inválida no pudo ser formateada:', dateValue);
        return null;
      }

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      return null;
    }
  }

  //#endregion

  //#region Métodos de Navegación y Validación

  /**
   * Cambia a una sección específica del formulario
   * @method
   * @param {number} sectionIndex - Índice de la sección a mostrar
   */
  changeSection(sectionIndex: number): void {
    this.currentSection = sectionIndex;
  }

  /**
   * Navega a la siguiente sección del formulario
   * @method
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
   * @method
   */
  prevSection(): void {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  /**
   * Valida la sección actual antes de permitir la navegación
   * @private
   * @returns {boolean} true si la sección es válida
   */
  private validateCurrentSection(): boolean {
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
   * @private
   * @param {any[]} fields - Array de campos a marcar como touched
   */
  private markFieldsAsTouched(fields: any[]): void {
    fields.forEach(field => {
      if (field) {
        field.markAsTouched();
      }
    });
  }

  /**
   * Maneja el cambio en la fecha de nacimiento para calcular la edad automáticamente
   * @method
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
   * @method
   */
  toggleCaregiver(): void {
    this.hasCaregiver = !this.hasCaregiver;
    if (!this.hasCaregiver) {
      this.editForm.get('caregiver')?.reset();
    }
  }

  /**
   * Alterna entre expandir/colapsar la sección de cuidador
   * @method
   */
  toggleCaregiverSection(): void {
    this.caregiverExpanded = !this.caregiverExpanded;
  }

  //#endregion

  //#region Métodos de Envío y Procesamiento

  /**
   * Maneja el envío del formulario de edición
   * @async
   * @method
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
      console.log('📝 Form values:', formValue);

      const registerRequest = this.prepareUpdateRequest(formValue);
      console.log('🚀 Request to send:', JSON.stringify(registerRequest, null, 2));

      const userEmail = this.authService.getUserEmail();
      if (!userEmail) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      if (!this.data.registro.registerId) {
        throw new Error('No se pudo identificar el registro a actualizar');
      }

      console.log('📤 Sending update request...');
      console.log('🔗 Register ID:', this.data.registro.registerId);
      console.log('👤 User Email:', userEmail);

      const response = await this.consolaService.updateRegister(
        this.data.registro.registerId,
        userEmail,
        registerRequest
      ).pipe(takeUntil(this.destroy$)).toPromise();

      console.log('✅ Update successful:', response);
      Swal.fire('Éxito', 'Registro actualizado correctamente', 'success');
      this.dialogRef.close(true);

    } catch (error: any) {
      console.error('❌ Update error details:', error);
      console.error('❌ Error status:', error.status);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error body:', error.error);

      this.handleUpdateError(error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Prepara el request para la actualización según la interfaz RegisterRequest
   * @private
   * @param {any} formValue - Valores del formulario
   * @returns {any} Objeto estructurado para la API
   */
  private prepareUpdateRequest(formValue: any): any {
    const backendIdentificationType = this.getBackendIdentificationType(formValue.patientIdentificationType);

    // Preparar variablesInfo
    const variablesInfo = this.variables.controls.map((v: AbstractControl) => {
      const variableGroup = v as FormGroup;
      const originalType = variableGroup.get('type')?.value;
      const originalValue = variableGroup.get('value')?.value;
      const converted = this.convertValueForApi(originalValue, originalType);

      return {
        id: variableGroup.get('variableId')?.value,
        name: variableGroup.get('variableName')?.value,
        type: converted.type,
        value: converted.value
      };
    }).filter(v => v.value !== null && v.value !== undefined && v.value !== '');

    // Obtener researchLayerId y researchLayerName del registro original
    const researchLayerId = this.data.registro.registerInfo?.[0]?.researchLayerId || '';
    const researchLayerName = this.data.registro.registerInfo?.[0]?.researchLayerName || '';

    // Preparar datos del paciente
    const patientData: any = {
      name: formValue.patient.name?.trim() || '',
      sex: formValue.patient.sex || '',
      birthDate: this.formatDateForBackend(formValue.patient.birthDate) || '',
      age: Number(formValue.patient.age) || 0,
      email: formValue.patient.email?.trim() || '',
      phoneNumber: formValue.patient.phoneNumber?.trim() || '',
      deathDate: this.formatDateForBackend(formValue.patient.deathDate) || null,
      economicStatus: formValue.patient.economicStatus?.trim() || '',
      educationLevel: formValue.patient.educationLevel?.trim() || '',
      maritalStatus: formValue.patient.maritalStatus?.trim() || '',
      hometown: formValue.patient.hometown?.trim() || '',
      currentCity: formValue.patient.currentCity?.trim() || '',
      firstCrisisDate: this.formatDateForBackend(formValue.patient.firstCrisisDate) || '',
      crisisStatus: formValue.patient.crisisStatus?.trim() || ''
    };

    // Limpiar campos vacíos
    Object.keys(patientData).forEach(key => {
      if (patientData[key] === '' || patientData[key] === null) {
        patientData[key] = null;
      }
    });

    // Preparar datos del cuidador si existe
    let caregiverData: any = null;
    if (this.hasCaregiver && formValue.caregiver?.name?.trim()) {
      caregiverData = {
        name: formValue.caregiver.name.trim(),
        identificationType: this.getBackendIdentificationType(formValue.caregiver.identificationType) || 'CC',
        identificationNumber: Number(formValue.caregiver.identificationNumber) || 0,
        age: Number(formValue.caregiver.age) || 0,
        educationLevel: formValue.caregiver.educationLevel?.trim() || '',
        occupation: formValue.caregiver.occupation?.trim() || ''
      };

      // Limpiar campos vacíos del cuidador
      Object.keys(caregiverData).forEach(key => {
        if (caregiverData[key] === '' || caregiverData[key] === null) {
          caregiverData[key] = null;
        }
      });
    }

    // Construir el request base
    const registerRequest: any = {
      registerInfo: {
        researchLayerId: researchLayerId,
        researchLayerName: researchLayerName,
        variablesInfo: variablesInfo
      },
      patientIdentificationNumber: Number(formValue.patientIdentificationNumber),
      patientIdentificationType: backendIdentificationType,
      patient: patientData
    };

    // Solo agregar caregiver si existe y tiene datos válidos
    if (caregiverData && caregiverData.name) {
      registerRequest.caregiver = caregiverData;
    }

    console.log('📤 Request para actualizar:', JSON.stringify(registerRequest, null, 2));
    return registerRequest;
  }

  /**
   * Maneja errores durante la actualización del registro
   * @private
   * @param {any} error - Error capturado
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

  //#region Métodos de Conversión de Valores para API

  /**
   * Convierte valores para la API según el tipo de variable
   * @private
   * @param {any} value - Valor a convertir
   * @param {string} originalType - Tipo original de la variable
   * @returns {{value: any, type: string}} Objeto con valor convertido y tipo
   */
  private convertValueForApi(value: any, originalType: string): { value: any, type: string } {
    // Si es array, usar conversión especial para arrays
    if (Array.isArray(value)) {
      return this.convertArrayValueForApi(value, originalType);
    }

    // Si no es array, usar conversión normal
    return this.convertSingleValueForApi(value, originalType);
  }

  /**
   * Convierte valores de array para la API
   * @private
   * @param {any} value - Valor array a convertir
   * @param {string} originalType - Tipo original de la variable
   * @returns {{value: any, type: string}} Objeto con valor convertido y tipo
   */
  private convertArrayValueForApi(value: any, originalType: string): { value: any, type: string } {
    if (Array.isArray(value)) {
      // Para arrays, unir con coma y espacio
      const stringValue = value.join(', ');
      return { value: stringValue, type: 'String' };
    }

    // Si no es array, usar conversión normal
    return this.convertSingleValueForApi(value, originalType);
  }

  /**
   * Convierte valores simples para la API
   * @private
   * @param {any} value - Valor simple a convertir
   * @param {string} originalType - Tipo original de la variable
   * @returns {{value: any, type: string}} Objeto con valor convertido y tipo
   */
  private convertSingleValueForApi(value: any, originalType: string): { value: any, type: string } {
    if (value === null || value === undefined || value === '') {
      return { value: null, type: 'String' };
    }

    let finalValue: any;
    let finalType: string;

    try {
      switch (originalType) {
        case 'Entero':
          finalValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
          finalType = isNaN(finalValue) ? 'String' : 'Number';
          if (isNaN(finalValue)) finalValue = String(value);
          break;

        case 'Real':
          finalValue = typeof value === 'string' ? parseFloat(value) : Number(value);
          finalType = isNaN(finalValue) ? 'String' : 'Number';
          if (isNaN(finalValue)) finalValue = String(value);
          break;

        case 'Fecha':
          finalValue = this.formatDateForBackend(value);
          finalType = 'String';
          break;

        case 'Lógico':
          if (typeof value === 'string') {
            finalValue = value.toLowerCase() === 'true' || value === '1' ? 'true' : 'false';
          } else {
            finalValue = value ? 'true' : 'false';
          }
          finalType = 'String';
          break;

        case 'Texto':
        default:
          finalValue = String(value);
          finalType = 'String';
          break;
      }
    } catch (error) {
      console.error('Error converting value:', error, { value, originalType });
      finalValue = String(value);
      finalType = 'String';
    }

    return { value: finalValue, type: finalType };
  }

  //#endregion

  //#region Métodos de Validación y Utilidades de UI

  /**
   * Marca recursivamente todos los controles de un FormGroup como touched
   * @private
   * @param {FormGroup} formGroup - Grupo de formulario a marcar
   */
   public markFormGroupTouched(formGroup: FormGroup): void {
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
   * @method
   * @param {KeyboardEvent} event - Evento de teclado
   * @returns {boolean} true si la tecla es válida
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
   * @method
   * @param {KeyboardEvent} event - Evento de teclado
   * @returns {boolean} true si la tecla es válida
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
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @param {MatCheckboxChange} event - Evento de cambio del checkbox
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
   * @getter
   * @returns {FormArray} FormArray de variables
   */
  get variables(): FormArray {
    return this.editForm.get('variables') as FormArray;
  }

  /**
   * Obtiene los grupos de formulario de las variables
   * @getter
   * @returns {FormGroup[]} Array de FormGroups de variables
   */
  get variablesFormGroups(): FormGroup[] {
    return this.variables.controls.filter(control => control instanceof FormGroup) as FormGroup[];
  }

  /**
   * Obtiene un control específico de una variable
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @param {string} controlName - Nombre del control
   * @returns {FormControl} FormControl solicitado
   * @throws {Error} Si el control no existe o no es un FormControl
   */
  getVariableControl(variable: FormGroup, controlName: string): FormControl {
    const control = variable.get(controlName);
    if (control instanceof FormControl) {
      return control;
    }
    throw new Error(`El control '${controlName}' no existe o no es un FormControl`);
  }

  /**
   * Obtiene el número de variables completadas
   * @getter
   * @returns {number} Número de variables completadas
   */
  get completedCount(): number {
    return this.variablesFormGroups.filter(v => this.isCompleted(v)).length;
  }

  /**
   * Obtiene el número total de variables
   * @getter
   * @returns {number} Número total de variables
   */
  get totalCount(): number {
    return this.variablesFormGroups.length;
  }

  /**
   * Verifica si el formulario es válido
   * @getter
   * @returns {boolean} true si el formulario es válido
   */
  get isFormValid(): boolean {
    return this.editForm.valid;
  }

  /**
   * Verifica si la sección actual es válida
   * @getter
   * @returns {boolean} true si la sección actual es válida
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
   * @getter
   * @returns {boolean} true si hay variables requeridas incompletas
   */
  get hasRequiredVariablesIncomplete(): boolean {
    return this.variablesFormGroups.some(variable => {
      const isRequired = variable.get('isRequired')?.value;
      const value = variable.get('value')?.value;
      return isRequired && (!value || value.toString().trim() === '');
    });
  }

  //#endregion

  //#region Métodos para Variables (Getters Seguros)

  /**
   * Obtiene el nombre de una variable de forma segura
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {string} Nombre de la variable o texto por defecto
   */
  getVariableName(variable: FormGroup): string {
    return variable?.get('variableName')?.value || 'Variable sin nombre';
  }

  /**
   * Obtiene el tipo de una variable de forma segura
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {string} Tipo de la variable o 'Texto' por defecto
   */
  getVariableType(variable: FormGroup): string {
    return variable?.get('type')?.value || 'Texto';
  }

  /**
   * Obtiene la descripción de una variable de forma segura
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {string} Descripción de la variable o string vacío
   */
  getVariableDescription(variable: FormGroup): string {
    return variable?.get('description')?.value || '';
  }

  /**
   * Verifica si una variable es requerida de forma segura
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {boolean} true si la variable es requerida
   */
  isVariableRequired(variable: FormGroup): boolean {
    return !!variable?.get('isRequired')?.value;
  }

  /**
   * Verifica si una variable tiene opciones de forma segura
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {boolean} true si la variable tiene opciones
   */
  hasOptions(variable: FormGroup): boolean {
    const options = variable?.get('options')?.value;
    return Array.isArray(options) && options.length > 0;
  }

  /**
   * Obtiene las opciones de una variable de forma segura
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {any[]} Array de opciones o array vacío
   */
  getSafeOptions(variable: FormGroup): any[] {
    return variable?.get('options')?.value || [];
  }

  /**
   * Obtiene el número de opciones de una variable
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {number} Número de opciones
   */
  getOptionsCount(variable: FormGroup): number {
    const options = this.getSafeOptions(variable);
    return options.length;
  }

  /**
   * Obtiene el tipo de selección de una variable
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {string} Tipo de selección ('single' o 'multiple')
   */
  getSelectionType(variable: FormGroup): string {
    const variableId = variable?.get('variableId')?.value;
    return variableId ? this.selectionTypeMap.get(variableId) || 'single' : 'single';
  }

  /**
   * Establece el tipo de selección para una variable
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @param {string} selectionType - Tipo de selección ('single' o 'multiple')
   */
  setSelectionType(variable: FormGroup, selectionType: string): void {
    const variableId = variable?.get('variableId')?.value;
    if (variableId) {
      this.selectionTypeMap.set(variableId, selectionType);
      console.log(`🔧 Tipo de selección cambiado para variable ${variableId}: ${selectionType}`);
    }
  }

  /**
   * Obtiene las opciones seleccionadas de forma segura
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {string[]} Array de opciones seleccionadas
   */
  getSafeSelectedOptions(variable: FormGroup): string[] {
    const value = variable?.get('value')?.value;
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }

  /**
   * Obtiene el número de opciones seleccionadas
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {number} Número de opciones seleccionadas
   */
  getSelectedOptionsCount(variable: FormGroup): number {
    const selected = this.getSafeSelectedOptions(variable);
    return selected.length;
  }

  /**
   * Obtiene el texto para checkboxes de variables lógicas
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {string} 'Sí' o 'No' según el valor
   */
  getCheckboxText(variable: FormGroup): string {
    const value = variable?.get('value')?.value;
    return value ? 'Sí' : 'No';
  }

  /**
   * Verifica si una variable es inválida
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {boolean} true si la variable es inválida y ha sido tocada
   */
  isVariableInvalid(variable: FormGroup): boolean {
    const control = variable?.get('value');
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Verifica si una variable es válida y tiene valor
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {boolean} true si la variable es válida y tiene valor
   */
  isVariableValidAndHasValue(variable: FormGroup): boolean {
    const control = variable?.get('value');
    return !!(control?.valid && control?.value);
  }

  //#endregion

  //#region Métodos para Selección Múltiple

  /**
   * Verifica si una opción está seleccionada en una variable
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @param {string} option - Opción a verificar
   * @returns {boolean} true si la opción está seleccionada
   */
  isOptionSelected(variable: FormGroup, option: string): boolean {
    const currentValue = variable?.get('value')?.value;
    if (Array.isArray(currentValue)) {
      return currentValue.includes(option);
    }
    return currentValue === option;
  }

  /**
   * Maneja el cambio en selección múltiple
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @param {string} option - Opción que cambió
   * @param {any} event - Evento del checkbox
   */
  onMultipleSelectionChange(variable: FormGroup, option: string, event: any): void {
    if (this.variablesReadOnly) return;

    const currentValue = variable?.get('value')?.value || [];
    let newValue: string[];

    if (event.target.checked) {
      newValue = Array.isArray(currentValue)
        ? [...currentValue, option]
        : [option];
    } else {
      newValue = Array.isArray(currentValue)
        ? currentValue.filter((item: string) => item !== option)
        : [];
    }

    variable?.get('value')?.setValue(newValue);
    variable?.get('value')?.updateValueAndValidity();
  }

  /**
   * Maneja el cambio en el tipo de selección
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @param {any} event - Evento del select
   */
  onSelectionTypeChange(variable: FormGroup, event: any): void {
    if (this.variablesReadOnly) return;

    const newType = event.target.value;
    const currentValue = variable?.get('value')?.value;

    // Preservar los valores al cambiar de tipo
    if (newType === 'single') {
      // Cambiando de múltiple a única
      if (Array.isArray(currentValue) && currentValue.length > 0) {
        // Tomar el primer valor seleccionado
        variable?.get('value')?.setValue(currentValue[0]);
      } else if (Array.isArray(currentValue) && currentValue.length === 0) {
        // Si no hay valores seleccionados, limpiar
        variable?.get('value')?.setValue('');
      }
      // Si ya es un valor único, mantenerlo
    } else {
      // Cambiando de única a múltiple
      if (currentValue && currentValue !== '' && !Array.isArray(currentValue)) {
        // Convertir el valor único a array
        variable?.get('value')?.setValue([currentValue]);
      } else if (!currentValue || currentValue === '') {
        // Si no hay valor, inicializar como array vacío
        variable?.get('value')?.setValue([]);
      }
      // Si ya es array, mantenerlo
    }

    this.setSelectionType(variable, newType);
  }

  //#endregion

  //#region Métodos para Filtros y Búsqueda

  /**
   * Obtiene las variables filtradas según el filtro actual
   * @method
   * @returns {FormGroup[]} Array de variables filtradas
   */
  getFilteredVariables(): FormGroup[] {
    if (!this.variablesFormGroups || this.variablesFormGroups.length === 0) {
      return [];
    }

    switch (this.currentFilter) {
      case 'completed':
        return this.variablesFormGroups.filter(v => this.isCompleted(v));
      case 'pending':
        return this.variablesFormGroups.filter(v => !this.isCompleted(v));
      case 'required':
        return this.variablesFormGroups.filter(v => v?.get('isRequired')?.value);
      default:
        return this.variablesFormGroups;
    }
  }

  /**
   * Verifica si una variable está completada
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {boolean} true si la variable está completada
   */
  isCompleted(variable: FormGroup): boolean {
    const value = variable?.get('value')?.value;
    return value !== null && value !== undefined && value !== '' &&
      !(Array.isArray(value) && value.length === 0);
  }

  //#endregion

  //#region Métodos de Utilidad para UI

  /**
   * Obtiene la etiqueta para un tipo de variable
   * @method
   * @param {string} type - Tipo de variable
   * @returns {string} Etiqueta legible para el tipo
   */
  getTypeLabel(type: string): string {
    if (!type) return 'Texto';

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
   * @method
   * @param {string} type - Tipo de variable
   * @returns {string} Descripción del tipo
   */
  getTypeDescription(type: string): string {
    if (!type) return '';

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
   * @method
   * @param {FormGroup} variable - Grupo de formulario de la variable
   * @returns {string} Mensaje de error
   */
  getErrorMessage(variable: FormGroup): string {
    const control = variable?.get('value');
    if (control?.errors?.['required']) {
      return 'Este campo es requerido';
    }
    return 'Valor inválido';
  }

  /**
   * Obtiene la clase CSS para un tipo de variable
   * @method
   * @param {string} type - Tipo de variable
   * @returns {string} Clase CSS
   */
  getTypeClass(type: string): string {
    return type || 'Texto';
  }

  //#endregion

  //#region Métodos para Información del Paciente en Header

  /**
   * Obtiene el nombre del paciente para mostrar en el header
   * @method
   * @returns {string} Nombre del paciente o texto por defecto
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
   * @method
   * @returns {string} Identificación formateada
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

  //#region Métodos de Cierre y Manejo de Modal

  /**
   * Maneja el cierre del modal con confirmación si hay cambios sin guardar
   * @method
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
   * Maneja el cierre simple del modal
   * @method
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Muestra un error y cierra el modal
   * @private
   * @param {string} message - Mensaje de error a mostrar
   */
  private showErrorAndClose(message: string): void {
    Swal.fire('Error', message, 'error');
    this.dialogRef.close();
  }

  //#endregion

}
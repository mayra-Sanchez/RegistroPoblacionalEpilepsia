import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ConsolaRegistroService } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';
import { Variable } from '../../interfaces';
import Swal from 'sweetalert2';
import { Subject, takeUntil } from 'rxjs';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';

/**
 * Componente para el registro de pacientes en el sistema
 * Incluye formulario multi-sección con validaciones y manejo de consentimiento informado
 */
@Component({
  selector: 'app-registro-paciente',
  templateUrl: './registro-paciente.component.html',
  styleUrls: ['./registro-paciente.component.css']
})
export class RegistroPacienteComponent implements OnInit, OnDestroy {
  // Inputs para recibir datos de la capa de investigación
  @Input() researchLayerId: string = '';
  @Input() researchLayerName: string = '';

  // Output para emitir evento cuando se guarda un registro
  @Output() registroGuardado = new EventEmitter<void>();

  // Formulario reactivo para el registro
  registroForm: FormGroup;

  // Estados de carga y control de UI
  loading: boolean = false;
  loadingVariables: boolean = false;
  hasCaregiver: boolean = false;
  currentSection: number = 0;

  // Variables para manejo de archivos de consentimiento
  consentimientoFile: File | null = null;
  consentimientoSubido: boolean = false;
  isDraggingOver: boolean = false;

  // Almacenamiento de variables de la capa de investigación
  variablesDeCapa: Variable[] = [];

  // Subject para manejo de suscripciones y evitar memory leaks
  private destroy$ = new Subject<void>();

  // Opciones predefinidas para los selects del formulario
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

  selectionTypes = [
    { value: 'single', label: 'Selección Única' },
    { value: 'multiple', label: 'Selección Múltiple' }
  ];

  filterOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'pending', label: 'Pendientes' }
  ];

  currentFilter = 'all';

  /**
   * Constructor del componente
   * @param fb Servicio FormBuilder para crear formularios reactivos
   * @param consolaService Servicio para operaciones de registro
   * @param authService Servicio de autenticación
   * @param consentimiento Servicio para subir archivos de consentimiento
   */
  constructor(
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService,
    private authService: AuthService,
    private consentimiento: SignatureUploadService
  ) {
    this.registroForm = this.createForm();
  }

  /**
   * Inicialización del componente
   * Carga variables de la capa y configura observables
   */
  ngOnInit(): void {
    this.loadVariablesDeCapa();

    // Actualizar edad cuando cambie birthdate (soporta input type="date" y strings)
    const birthControl = this.registroForm.get('patient.birthDate');
    birthControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onBirthDateChange());
  }

  /**
   * Limpieza al destruir el componente
   * Cancela todas las suscripciones activas
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea la estructura del formulario reactivo con validaciones
   * @returns FormGroup configurado con todos los campos necesarios
   */
  createForm(): FormGroup {
    return this.fb.group({
      patientIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      patientIdentificationType: ['CC', Validators.required],

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

      variables: this.fb.array([]),

      hasConsentimiento: [false],
      consentimientoFile: [null]
    });
  }

  /**
   * Carga las variables asociadas a la capa de investigación
   * Solo carga las variables que estén habilitadas
   */
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

  /**
   * Inicializa el FormArray de variables dinámicas basado en las variables de la capa
   */
  initializeVariables(): void {
    const variablesArray = this.registroForm.get('variables') as FormArray;
    variablesArray.clear();

    this.variablesDeCapa.forEach(variable => {
      const isVariableRequired = variable.isRequired ?? false;
      const variableName = variable.name || variable.variableName || 'Variable sin nombre';

      // Configurar validadores según el tipo de variable
      let validators = isVariableRequired ? [Validators.required] : [];
      let initialValue: any = '';

      // Configurar valor inicial y validadores según el tipo
      if (variable.hasOptions) {
        // Para variables con opciones, el valor inicial depende del tipo de selección
        initialValue = variable.selectionType === 'multiple' ? [] : '';
      } else {
        // Para variables sin opciones, valor inicial según tipo de dato
        switch (variable.type) {
          case 'Entero':
          case 'Real':
            initialValue = null;
            break;
          case 'Lógico':
            initialValue = false;
            break;
          default:
            initialValue = '';
        }
      }
      variablesArray.push(this.fb.group({
        variableId: [variable.id],
        variableName: [variableName],
        value: [initialValue, validators],
        type: [variable.type],
        isRequired: [isVariableRequired],
        hasOptions: [variable.hasOptions || false],
        options: [variable.options || []],
        selectionType: [variable.selectionType || 'single'],
        description: [variable.description || '']
      }));
    });
  }

  /**
   * Getter para acceder al FormArray de variables
   * @returns FormArray con las variables del formulario
   */
  get variables(): FormArray {
    return this.registroForm.get('variables') as FormArray;
  }

  /**
   * Getter para obtener los grupos de formulario de variables
   * @returns Array de FormGroups que representan cada variable
   */
  get variablesFormGroups(): FormGroup[] {
    return (this.registroForm.get('variables') as FormArray).controls as FormGroup[];
  }

  /**
   * Cambia la sección actual del formulario
   * @param sectionIndex Índice de la sección a mostrar
   */
  changeSection(sectionIndex: number): void {
    this.currentSection = sectionIndex;
  }

  /**
   * Avanza a la siguiente sección del formulario si la actual es válida
   */
  nextSection(): void {
    if (this.validateCurrentSection()) {
      const maxSections = this.variables.length > 0 ? 5 : 4; // Ahora 6 secciones en total (0-5)
      if (this.currentSection < maxSections) {
        this.currentSection++;
      }
    }
  }

  /**
   * Retrocede a la sección anterior del formulario
   */
  prevSection(): void {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  /**
   * Valida la sección actual del formulario
   * @returns boolean indicando si la sección es válida
   */
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
        const birthDate = this.registroForm.get('patient.birthDate');

        if (name?.invalid || sex?.invalid || birthDate?.invalid) {
          this.markFieldsAsTouched([name, sex, birthDate]);
          Swal.fire('Error', 'Por favor complete los campos requeridos de información personal', 'error');
          return false;
        }
        break;

      case 3: // Validación para la sección de consentimiento
        const hasConsentimiento = this.registroForm.get('hasConsentimiento')?.value;

        if (hasConsentimiento && !this.consentimientoFile) {
          Swal.fire('Error', 'Debe subir el consentimiento informado', 'error');
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * Marca los campos como "touched" para mostrar errores de validación
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
   * Maneja el cambio en la fecha de nacimiento y calcula la edad automáticamente
   */
  onBirthDateChange(): void {
    const birthDate = this.registroForm.get('patient.birthDate')?.value;
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

  /**
   * Alterna la visibilidad de la sección de cuidador
   */
  toggleCaregiver(): void {
    this.hasCaregiver = !this.hasCaregiver;
    if (!this.hasCaregiver) {
      this.registroForm.get('caregiver')?.reset();
    }
  }

  /**
   * Convierte el tipo de identificación abreviado al formato completo para el backend
   * @param type Tipo de identificación abreviado
   * @returns Tipo de identificación completo
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
   * Maneja el envío del formulario con todas las validaciones
   */
  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.markFormGroupTouched(this.registroForm);
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    // Validar consentimiento si es requerido
    const hasConsentimiento = this.registroForm.get('hasConsentimiento')?.value;
    if (hasConsentimiento && !this.consentimientoFile) {
      Swal.fire('Error', 'Debe subir el consentimiento informado', 'error');
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
        birthDate: this.formatDateForBackend(formValue.patient.birthDate),
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
    console.log(' - birthdate:', registerRequest.patient.birthDate);
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

    try {
      // 1. Primero guardar el registro del paciente
      const response = await this.consolaService.saveRegister(userEmail, registerRequest)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      console.log('✅ REGISTRO GUARDADO:', response);

      // 2. Si hay consentimiento, subirlo
      if (hasConsentimiento && this.consentimientoFile) {
        await this.subirConsentimiento();
      }

      // 3. Mostrar éxito
      Swal.fire('Éxito', 'Registro y consentimiento guardados correctamente', 'success');
      this.resetForm();

    } catch (error: any) {
      console.error('❌ ERROR AL GUARDAR:', error);

      // Mostrar mensaje de error más detallado
      let errorMessage = 'No se pudo guardar el registro';
      if (error.message && error.message.includes('Error 500')) {
        errorMessage = 'Error interno del servidor. Por favor contacte al administrador.';
      } else if (error.error && typeof error.error === 'object') {
        errorMessage = error.error.message || JSON.stringify(error.error);
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.status === 400) {
        errorMessage = 'Datos inválidos enviados al servidor. Por favor verifique los campos.';
      }

      Swal.fire('Error', errorMessage, 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Sube el archivo de consentimiento informado al servidor
   */
  private async subirConsentimiento(): Promise<void> {
    if (!this.consentimientoFile) return;

    try {
      const idNumber = this.registroForm.get('patientIdentificationNumber')?.value;

      if (!idNumber) {
        console.error('❌ No se puede subir consentimiento: número de identificación no definido');
        return;
      }

      const patientId = Number(idNumber);
      if (isNaN(patientId)) {
        console.error('❌ Número de identificación inválido:', idNumber);
        Swal.fire('Error', 'El número de identificación no es válido', 'error');
        return;
      }

      // ✅ CORRECTO: Pasar directamente el File al servicio
      await this.consentimiento.uploadConsentFile(patientId, this.consentimientoFile)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      console.log('✅ CONSENTIMIENTO SUBIDO CORRECTAMENTE');
    } catch (error) {
      console.error('❌ ERROR AL SUBIR CONSENTIMIENTO:', error);
      Swal.fire('Advertencia', 'El registro se guardó pero hubo un error al subir el consentimiento', 'warning');
    }
  }

  /**
   * Resetea el formulario a su estado inicial
   */
  private resetForm(): void {
    this.registroForm.reset();
    this.initializeVariables();
    this.hasCaregiver = false;
    this.consentimientoFile = null;
    this.consentimientoSubido = false;
    this.currentSection = 0;
    this.registroGuardado.emit();
  }

  /**
   * Obtiene la etiqueta descriptiva para un tipo de variable
   * @param type Tipo de variable
   * @returns Etiqueta descriptiva del tipo
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
   * @returns Mensaje de error correspondiente
   */
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

  /**
   * Valida que solo se ingresen números en un campo
   * @param event Evento de teclado
   * @returns boolean indicando si la tecla es válida
   */
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

  /**
   * Valida que solo se ingresen números decimales en un campo
   * @param event Evento de teclado
   * @returns boolean indicando si la tecla es válida
   */
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

  /**
   * Maneja el cambio en un checkbox de variable lógica
   * @param variable Grupo de formulario de la variable
   * @param event Evento de cambio
   */
  onCheckboxChange(variable: FormGroup, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    variable.get('value')?.setValue(isChecked);

    // Forzar la actualización de la vista
    variable.get('value')?.updateValueAndValidity();
  }

  /**
   * Valida la estructura del request antes de enviarlo al servidor
   * @param request Objeto request a validar
   * @returns boolean indicando si el request es válido
   */
  private validateRequest(request: any): boolean {
    console.log('🔍 VALIDANDO REQUEST:');

    const dateFields = ['birthDate', 'deathDate', 'firstCrisisDate']; // birthDate en lugar de birthdate
    for (const field of dateFields) {
      if (request.patient[field] && !/^\d{4}-\d{2}-\d{2}$/.test(request.patient[field])) { // Validar formato YYYY-MM-DD
        console.error(`❌ Invalid date format for ${field}:`, request.patient[field]);
        return false;
      }
    }

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

  /**
   * Formatea una fecha para el backend (formato YYYY-MM-DD)
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada o null si es inválida
   */
  private formatDateForBackend(dateValue: any): string | null {
    if (!dateValue) return null;

    try {
      // Si ya está en formato yyyy-MM-dd (desde input type="date"), devolverlo tal cual
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      // Si está en formato dd-MM-yyyy, convertirlo a yyyy-MM-dd
      if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
        const [day, month, year] = dateValue.split('-');
        return `${year}-${month}-${day}`;
      }

      let date: Date;

      if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) return null;

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }

  /**
   * Maneja el cambio en selecciones múltiples
   * @param variable Grupo de formulario de la variable
   * @param optionValue Valor de la opción
   * @param event Evento de cambio
   */
  onMultipleSelectionChange(variable: FormGroup, optionValue: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentValue: string[] = variable.get('value')?.value || [];

    if (isChecked) {
      // Agregar opción si no existe
      if (!currentValue.includes(optionValue)) {
        variable.get('value')?.setValue([...currentValue, optionValue]);
      }
    } else {
      // Remover opción si existe
      variable.get('value')?.setValue(currentValue.filter(v => v !== optionValue));
    }

    // Forzar actualización del control
    variable.get('value')?.updateValueAndValidity();
  }


  /**
   * Verifica si una opción está seleccionada en selección múltiple
   * @param variable Grupo de formulario de la variable
   * @param optionValue Valor de la opción
   * @returns boolean indicando si está seleccionada
   */
  isOptionSelected(variable: FormGroup, optionValue: string): boolean {
    const currentValue: string[] = variable.get('value')?.value || [];
    return currentValue.includes(optionValue);
  }

  /**
   * Maneja el cambio en el tipo de selección para una variable
   * @param variable Grupo de formulario de la variable
   * @param event Evento de cambio
   */
  onSelectionTypeChange(variable: FormGroup, event: Event): void {
    const selectionType = (event.target as HTMLSelectElement).value;
    variable.get('selectionType')?.setValue(selectionType);

    if (selectionType === 'multiple') {
      variable.get('value')?.setValue([]);
    } else {
      variable.get('value')?.setValue('');
    }
  }

  /**
   * Marca todos los campos de un FormGroup como "touched"
   * @param formGroup FormGroup a marcar
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
   * Maneja la cancelación del formulario con confirmación
   */
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

  /**
   * Maneja la selección de archivo de consentimiento
   * @param event Evento de selección de archivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  /**
   * Elimina el archivo de consentimiento seleccionado
   */
  removeFile(): void {
    this.consentimientoFile = null;
    this.registroForm.patchValue({ consentimientoFile: null });
    this.consentimientoSubido = false;
  }

  /**
   * Maneja el cambio en el toggle de consentimiento
   */
  onConsentimientoToggle(): void {
    if (!this.registroForm.get('hasConsentimiento')?.value) {
      this.removeFile();
    }
  }

  /**
   * Maneja el evento de arrastrar sobre la zona de drop
   * @param event Evento de drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  /**
   * Maneja el evento de salir de la zona de drop
   */
  onDragLeave(): void {
    this.isDraggingOver = false;
  }

  /**
   * Maneja el evento de soltar archivo en la zona de drop
   * @param event Evento de drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  /**
   * Procesa un archivo validando tipo y tamaño
   * @param file Archivo a procesar
   */
  private processFile(file: File): void {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire('Error', 'Solo se permiten archivos PDF, JPEG o PNG', 'error');
      return;
    }

    // Validar tamaño (reducir a 2MB para evitar errores 413)
    const maxSize = 2 * 1024 * 1024; // 2MB (más conservador)
    if (file.size > maxSize) {
      Swal.fire('Error', `El archivo no puede ser mayor a 2MB. Tamaño actual: ${this.getFileSize(file.size)}`, 'error');
      return;
    }

    this.consentimientoFile = file;
    this.consentimientoSubido = true;

    Swal.fire('Éxito', 'Archivo cargado correctamente', 'success');
  }

  /**
   * Formatea el tamaño de archivo para mostrarlo de forma legible
   * @param size Tamaño en bytes
   * @returns Cadena con el tamaño formateado
   */
  getFileSize(size: number): string {
    if (size < 1024) {
      return size + ' bytes';
    } else if (size < 1048576) {
      return (size / 1024).toFixed(1) + ' KB';
    } else {
      return (size / 1048576).toFixed(1) + ' MB';
    }
  }


  /**
    * Convierte el valor de una variable al tipo esperado por el API
    * @param value Valor a convertir
    * @param originalType Tipo original de la variable
    * @returns Objeto con el valor convertido y su tipo
    */
  private convertValueForApi(value: any, originalType: string): { value: any, type: string } {
    if (value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0)) {
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
        finalType = 'String';
        break;

      case 'Texto': // Texto → String
      default:
        // Si es array (selección múltiple), convertir a string separado por comas
        if (Array.isArray(value)) {
          finalValue = value.join(', ');
        } else {
          finalValue = String(value);
        }
        finalType = 'String';
        break;
    }

    return { value: finalValue, type: finalType };
  }

  /**
 * Retorna si una variable está completada
 */
  isCompleted(variable: FormGroup): boolean {
    const value = variable.get('value')?.value;
    return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
  }

  /**
   * Devuelve las variables según el filtro actual
   */
  getFilteredVariables(): FormGroup[] {
    if (this.currentFilter === 'completed') {
      return this.variablesFormGroups.filter(v => this.isCompleted(v));
    }
    if (this.currentFilter === 'pending') {
      return this.variablesFormGroups.filter(v => !this.isCompleted(v));
    }
    return this.variablesFormGroups; // all
  }

  /**
   * Contadores para mostrar progreso
   */
  get completedCount(): number {
    return this.variablesFormGroups.filter(v => this.isCompleted(v)).length;
  }

  get totalCount(): number {
    return this.variablesFormGroups.length;
  }
}
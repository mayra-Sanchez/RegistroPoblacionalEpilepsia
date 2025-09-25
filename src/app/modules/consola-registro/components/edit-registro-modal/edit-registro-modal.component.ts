import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConsolaRegistroService } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';
import { Variable, Register, RegisterRequest, RegisterPatient, RegisterCaregiver, RegisterVariable } from '../../interfaces';
import Swal from 'sweetalert2';
import { Subject, takeUntil } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent implements OnInit, OnDestroy {
  editForm: FormGroup;
  loading: boolean = false;
  currentSection: number = 0;
  hasCaregiver: boolean = false;
  variablesDeCapa: Variable[] = [];
  private destroy$ = new Subject<void>();

  // Opciones predefinidas
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

  // En EditRegistroModalComponent - modificar el ngOnInit
  ngOnInit(): void {
    console.log('🎯 Modal de edición iniciado');
    console.log('📦 Datos recibidos:', this.data);

    if (!this.data.registro) {
      console.error('❌ No se recibió registro para editar');
      Swal.fire('Error', 'No se pudieron cargar los datos del registro', 'error');
      this.dialogRef.close();
      return;
    }

    console.log('📦 Registro recibido:', this.data.registro);
    console.log('🔧 Variables de capa:', this.variablesDeCapa);

    // ✅ Primero crear el formulario con estructura vacía
    this.editForm = this.createForm();

    // ✅ Luego inicializar con datos
    this.initializeFormWithData();

    const birthControl = this.editForm.get('patient.birthDate');
    birthControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onBirthDateChange());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      patientIdentificationNumber: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]],
      patientIdentificationType: [{ value: 'CC', disabled: true }, Validators.required],

      // ✅ Asegurar que el grupo 'patient' esté correctamente definido
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
      Swal.fire('Error', 'No se pudieron cargar los datos del registro', 'error');
      this.dialogRef.close();
      return;
    }

    console.log('📋 Inicializando formulario con registro:', registro);

    // ✅ Verificar que el formulario esté creado
    if (!this.editForm) {
      console.error('❌ El formulario no está inicializado');
      return;
    }

    // ✅ Verificar que el grupo 'patient' exista
    const patientGroup = this.editForm.get('patient') as FormGroup;
    if (!patientGroup) {
      console.error('❌ No se encontró el grupo patient en el formulario');
      return;
    }

    // Datos básicos de identificación
    this.editForm.patchValue({
      patientIdentificationNumber: registro.patientIdentificationNumber || '',
      patientIdentificationType: this.getShortIdentificationType(registro.patientIdentificationType) || 'CC',
    });

    // Datos del paciente
    const patientData = registro.patientBasicInfo;
    if (patientData) {
      console.log('👤 Datos del paciente:', patientData);

      // ✅ Usar patchValue en el grupo patient específicamente
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

    // Datos del cuidador
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

    // Inicializar variables
    this.initializeVariablesWithData(registro);
  }

  /**
   * Inicializa las variables con los datos del registro
   */
  initializeVariablesWithData(registro: Register): void {
    const variablesArray = this.editForm.get('variables') as FormArray;
    variablesArray.clear();

    console.log('🔍 Buscando variables en el registro...');

    // Obtener variables del registro
    const registroVariables = this.getVariablesFromRegister(registro);
    console.log('📊 Variables encontradas en registro:', registroVariables);

    this.variablesDeCapa.forEach(variable => {
      // Buscar la variable en los datos del registro
      const variableData = registroVariables.find(v =>
        v.variableId === variable.id ||
        v.variableName === variable.name ||
        v.name === variable.name
      );

      const isVariableRequired = variable.isRequired ?? false;
      const variableName = variable.name || variable.variableName || 'Variable sin nombre';
      const validators = isVariableRequired ? [Validators.required] : [];

      // Obtener el valor de la variable
      let variableValue = '';
      if (variableData) {
        console.log(`📝 Procesando variable: ${variableName}`, variableData);

        // Manejar diferentes estructuras de datos
        if (variableData.value !== undefined && variableData.value !== null) {
          variableValue = variableData.value.toString();
        } else if (variableData.valueAsString !== undefined && variableData.valueAsString !== null) {
          variableValue = variableData.valueAsString.toString();
        } else if (variableData.valueAsNumber !== undefined && variableData.valueAsNumber !== null) {
          variableValue = variableData.valueAsNumber.toString();
        }
      }

      console.log(`✅ Variable ${variableName}: valor = ${variableValue}`);

      variablesArray.push(this.fb.group({
        variableId: [variable.id],
        variableName: [variableName],
        value: [variableValue, validators],
        type: [variable.type],
        isRequired: [isVariableRequired]
      }));
    });

    console.log('🎯 Variables inicializadas en formulario:', variablesArray.value);
  }

  /**
   * Obtiene las variables del registro de forma compatible
   */
  private getVariablesFromRegister(registro: Register): any[] {
    // Primero intentar con registerInfo[0].variablesInfo (estructura GET)
    if (registro.registerInfo && registro.registerInfo.length > 0) {
      const mainInfo = registro.registerInfo[0];
      if ((mainInfo as any).variablesInfo) {
        return (mainInfo as any).variablesInfo;
      }
    }

    // Luego intentar con variablesRegister (estructura alternativa)
    if (registro.variablesRegister) {
      return registro.variablesRegister;
    }

    // Finalmente, si el registro tiene variables directamente
    if ((registro as any).variablesInfo) {
      return (registro as any).variablesInfo;
    }

    return [];
  }

  /**
   * Convierte el tipo de identificación completo al formato abreviado
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

    return typeMap[fullType] || fullType; // Si no está en el mapa, devolver el original
  }

  /**
   * Formatea una fecha para el input type="date" (YYYY-MM-DD)
   */
  private formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';

    try {
      // Si ya está en formato YYYY-MM-DD
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      // Si está en formato DD-MM-YYYY, convertirlo
      if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
        const [day, month, year] = dateValue.split('-');
        return `${year}-${month}-${day}`;
      }

      // Para objetos Date o strings ISO
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error formateando fecha:', error);
    }

    return '';
  }

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

  toggleCaregiver(): void {
    this.hasCaregiver = !this.hasCaregiver;
    if (!this.hasCaregiver) {
      this.editForm.get('caregiver')?.reset();
    }
  }

  changeSection(sectionIndex: number): void {
    this.currentSection = sectionIndex;
  }

  nextSection(): void {
    if (this.validateCurrentSection()) {
      const maxSections = this.variables.length > 0 ? 3 : 2;
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

  markFieldsAsTouched(fields: any[]): void {
    fields.forEach(field => {
      if (field) {
        field.markAsTouched();
      }
    });
  }

  /**
   * Convierte el tipo de identificación al formato del backend
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
      console.log('📝 Valores del formulario:', formValue);

      const registerRequest = this.prepareUpdateRequest(formValue);

      console.log('🎯 Request estructurado:', registerRequest);
      console.log('✅ Campo birthDate en request:', registerRequest.patient.birthDate);

      const userEmail = this.authService.getUserEmail();
      if (!userEmail) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      if (!this.data.registro.registerId) {
        throw new Error('No se pudo identificar el registro a actualizar');
      }

      console.log('🔧 Enviando actualización...');
      console.log('🆔 Register ID:', this.data.registro.registerId);
      console.log('📧 User Email:', userEmail);

      const response = await this.consolaService.updateRegister(
        this.data.registro.registerId,
        userEmail,
        registerRequest
      ).pipe(takeUntil(this.destroy$)).toPromise();

      console.log('✅ Respuesta del servidor:', response);

      Swal.fire('Éxito', 'Registro actualizado correctamente', 'success');
      this.dialogRef.close(true);

    } catch (error: any) {
      console.error('❌ Error completo al actualizar:', error);

      // Log detallado del error
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
    } finally {
      this.loading = false;
    }
  }

  /**
   * Prepara el request para la actualización según la interfaz RegisterRequest
   */
  private prepareUpdateRequest(formValue: any): any {
    const backendIdentificationType = this.getBackendIdentificationType(formValue.patientIdentificationType);

    // Preparar variables según la interfaz RegisterVariable
    const variablesInfo: any[] = formValue.variables.map((v: any) => {
      const converted = this.convertValueForApi(v.value, v.type);
      return {
        id: v.variableId,
        name: v.variableName,
        value: converted.value,
        type: converted.finalType || v.type
      };
    });

    // Obtener información de la capa de investigación
    const researchLayerId = this.data.registro.registerInfo?.[0]?.researchLayerId || '';
    const researchLayerName = this.data.registro.registerInfo?.[0]?.researchLayerName || '';

    // ✅ Preparar datos del cuidador si existen
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

    // ✅ Asegurar que firstCrisisDate nunca sea null - usar string vacío si es null
    const firstCrisisDate = this.formatDateForBackend(formValue.patient.firstCrisisDate) || '';

    // ✅ Crear el objeto completo de una vez
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
        birthDate: this.formatDateForBackend(formValue.patient.birthDate) || '', // ✅ Evitar null
        age: Number(formValue.patient.age) || 0,
        email: formValue.patient.email || '',
        phoneNumber: formValue.patient.phoneNumber || '',
        deathDate: this.formatDateForBackend(formValue.patient.deathDate) || '', // ✅ Evitar null
        economicStatus: formValue.patient.economicStatus || '',
        educationLevel: formValue.patient.educationLevel || '',
        maritalStatus: formValue.patient.maritalStatus || '',
        hometown: formValue.patient.hometown || '',
        currentCity: formValue.patient.currentCity || '',
        firstCrisisDate: firstCrisisDate, // ✅ Ya asegurado que no es null
        crisisStatus: formValue.patient.crisisStatus || ''
      },
      ...(caregiverData && { caregiver: caregiverData }) // ✅ Spread condicional
    };

    console.log('📤 Request final para actualización:', JSON.stringify(registerRequest, null, 2));
    return registerRequest;
  }

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
        finalValue = this.formatDateForBackend(value);
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

  // Métodos de utilidad para el template
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
    return 'Valor inválido';
  }

  validateNumber(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
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

  onCheckboxChange(variable: FormGroup, event: MatCheckboxChange): void {
    const control = this.getVariableControl(variable, 'value');
    control.setValue(event.checked);
    control.updateValueAndValidity();
  }

  get variables(): FormArray {
    return this.editForm.get('variables') as FormArray;
  }

  get variablesFormGroups(): FormGroup[] {
    return this.variables.controls.filter(control => control instanceof FormGroup) as FormGroup[];
  }

  getVariableControl(variable: FormGroup, controlName: string): FormControl {
    const control = variable.get(controlName);
    if (control instanceof FormControl) {
      return control;
    }
    throw new Error(`El control '${controlName}' no existe o no es un FormControl`);
  }
}
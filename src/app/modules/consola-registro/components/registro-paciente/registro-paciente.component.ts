import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ConsolaRegistroService, RegisterRequest, ValidatePatientResponse } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';
import { Variable } from '../../interfaces';
import Swal from 'sweetalert2';
import { Subject, takeUntil } from 'rxjs';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';

/**
 * Componente para el registro de pacientes en el sistema
 * 
 * Este componente proporciona un formulario multi-sección completo para:
 * - Validación de pacientes existentes
 * - Registro de nueva información del paciente
 * - Gestión de cuidadores (opcional)
 * - Captura de variables de investigación
 * - Subida de consentimientos informados
 * 
 * Maneja tres casos principales:
 * - CASE1: Paciente existe en la misma capa (actualización)
 * - CASE2: Paciente existe en otra capa (mover registro)
 * - CASE3: Paciente nuevo (creación)
 * 
 * @example
 * <app-registro-paciente
 *   [researchLayerId]="selectedLayerId"
 *   [researchLayerName]="selectedLayerName"
 *   (registroGuardado)="onRegistroGuardado()">
 * </app-registro-paciente>
 */
@Component({
  selector: 'app-registro-paciente',
  templateUrl: './registro-paciente.component.html',
  styleUrls: ['./registro-paciente.component.css']
})
export class RegistroPacienteComponent implements OnInit, OnDestroy {

  // ============================
  // INPUTS Y OUTPUTS
  // ============================

  /** ID de la capa de investigación donde se registrará el paciente */
  @Input() researchLayerId: string = '';

  /** Nombre de la capa de investigación para mostrar */
  @Input() researchLayerName: string = '';

  /** Evento emitido cuando se guarda exitosamente un registro */
  @Output() registroGuardado = new EventEmitter<void>();

  // ============================
  // PROPIEDADES DEL FORMULARIO
  // ============================

  /** Formulario reactivo principal para el registro */
  registroForm: FormGroup;

  /** Array de variables de investigación de la capa */
  variablesDeCapa: Variable[] = [];

  // ============================
  // ESTADOS DE UI Y CARGA
  // ============================

  /** Indica si se está procesando una operación */
  loading: boolean = false;

  /** Indica si se están cargando las variables */
  loadingVariables: boolean = false;

  /** Indica si el paciente tiene cuidador */
  hasCaregiver: boolean = false;

  /** Sección actual del formulario multi-paso */
  currentSection: number = 0;

  /** Indica si se está validando un paciente */
  validatingPatient: boolean = false;

  /** Filtro actual para las variables */
  currentFilter: string = 'all';

  /** Indica si hay arrastre de archivo sobre la zona de drop */
  isDraggingOver: boolean = false;

  // ============================
  // VALIDACIÓN Y MENSAJES
  // ============================

  /** Mensaje de validación actual */
  validationMessage: string | null = null;

  /** Estado de la validación */
  validationStatus: 'success' | 'warning' | 'error' | null = null;

  /** Flag que indica el caso de validación */
  validationFlag: 'CASE1' | 'CASE2' | 'CASE3' | null = null;

  /** Respuesta de la última validación de paciente */
  lastValidationResponse: ValidatePatientResponse | null = null;

  // ============================
  // GESTIÓN DE ARCHIVOS
  // ============================

  /** Archivo de consentimiento seleccionado */
  consentimientoFile: File | null = null;

  /** Indica si el consentimiento fue subido */
  consentimientoSubido: boolean = false;

  // ============================
  // OPCIONES PREDEFINIDAS
  // ============================

  /** Tipos de identificación disponibles */
  readonly tiposIdentificacion = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro Civil' }
  ];

  /** Opciones de género */
  readonly sexos = [
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' }
  ];

  /** Estados civiles disponibles */
  readonly estadosCiviles = [
    { value: 'Soltero', label: 'Soltero/a' },
    { value: 'Casado', label: 'Casado/a' },
    { value: 'Divorciado', label: 'Divorciado/a' },
    { value: 'Viudo', label: 'Viudo/a' },
    { value: 'Unión Libre', label: 'Unión Libre' }
  ];

  /** Niveles de educación */
  readonly nivelesEducacion = [
    { value: 'Primaria', label: 'Primaria' },
    { value: 'Secundaria', label: 'Secundaria' },
    { value: 'Técnico', label: 'Técnico' },
    { value: 'Universitario', label: 'Universitario' },
    { value: 'Posgrado', label: 'Posgrado' },
    { value: 'Ninguno', label: 'Ninguno' }
  ];

  /** Niveles económicos */
  readonly nivelesEconomicos = [
    { value: 'Bajo', label: 'Bajo' },
    { value: 'Medio Bajo', label: 'Medio Bajo' },
    { value: 'Medio', label: 'Medio' },
    { value: 'Medio Alto', label: 'Medio Alto' },
    { value: 'Alto', label: 'Alto' }
  ];

  /** Estados de crisis médica */
  readonly estadosCrisis = [
    { value: 'Activa', label: 'Activa' },
    { value: 'Remisión', label: 'Remisión' },
    { value: 'Controlada', label: 'Controlada' },
    { value: 'Crónica', label: 'Crónica' }
  ];

  /** Ocupaciones disponibles */
  readonly ocupaciones = [
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

  /** Tipos de selección para variables */
  readonly selectionTypes = [
    { value: 'single', label: 'Selección Única' },
    { value: 'multiple', label: 'Selección Múltiple' }
  ];

  /** Opciones de filtrado para variables */
  readonly filterOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'pending', label: 'Pendientes' }
  ];

  // ============================
  // GESTIÓN DE SUSCRIPCIONES
  // ============================

  /** Subject para manejar la desuscripción de observables */
  private destroy$ = new Subject<void>();

  // ============================
  // CONSTRUCTOR
  // ============================

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

  // ============================
  // MÉTODOS DEL CICLO DE VIDA
  // ============================

  /**
   * Inicialización del componente
   * - Carga variables de la capa
   * - Configura observables para cambios en fecha de nacimiento
   */
  ngOnInit(): void {
    this.loadVariablesDeCapa();

    const birthControl = this.registroForm.get('patient.birthDate');
    birthControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onBirthDateChange());

    this.consolaService.dataChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 COMPONENTE: Notificación de cambio de datos recibida');
      });
  }

  /**
   * Limpieza al destruir el componente
   * - Cancela todas las suscripciones activas
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================
  // CREACIÓN E INICIALIZACIÓN DEL FORMULARIO
  // ============================

  /**
   * Crea la estructura del formulario reactivo con validaciones
   * @returns FormGroup configurado con todos los campos necesarios
   */
  private createForm(): FormGroup {
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
  private loadVariablesDeCapa(): void {
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
  private initializeVariables(): void {
    const variablesArray = this.registroForm.get('variables') as FormArray;
    variablesArray.clear();

    this.variablesDeCapa.forEach(variable => {
      const isVariableRequired = variable.isRequired ?? false;
      const variableName = variable.name || variable.variableName || 'Variable sin nombre';

      let validators = isVariableRequired ? [Validators.required] : [];
      let initialValue: any = '';

      if (variable.hasOptions) {
        initialValue = variable.selectionType === 'multiple' ? [] : '';
      } else {
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

  // ============================
  // GETTERS PARA ACCESO A CONTROLES
  // ============================

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

  // ============================
  // NAVEGACIÓN DEL FORMULARIO
  // ============================

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
  private validateCurrentSection(): boolean {
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

      case 3:
        const hasConsentimiento = this.registroForm.get('hasConsentimiento')?.value;

        if (hasConsentimiento && !this.consentimientoFile) {
          Swal.fire('Error', 'Debe subir el consentimiento informado', 'error');
          return false;
        }
        break;
    }

    return true;
  }

  // ============================
  // MÉTODOS DE VALIDACIÓN
  // ============================

  /**
   * Valida un paciente existente en el sistema
   * Determina si el paciente es nuevo, existe en la misma capa o en otra capa
   */
  validarPaciente(): void {
    const numero = this.registroForm.get('patientIdentificationNumber')?.value;
    const tipo = this.registroForm.get('patientIdentificationType')?.value;
    this.validatingPatient = true;

    if (!tipo || !numero) {
      this.validationMessage = 'Debe ingresar tipo y número de identificación';
      this.validationStatus = 'error';
      this.validationFlag = null;
      this.validatingPatient = false;
      return;
    }

    const patientIdNumber = parseInt(numero, 10);
    if (isNaN(patientIdNumber)) {
      this.validationMessage = 'El número de identificación debe ser válido';
      this.validationStatus = 'error';
      this.validationFlag = null;
      this.validatingPatient = false;
      return;
    }

    const idNumberControl = this.registroForm.get('patientIdentificationNumber');
    if (idNumberControl) {
      idNumberControl.disable();
    }

    this.consolaService.validarPaciente(patientIdNumber, this.researchLayerId)
      .subscribe({
        next: (res) => {
          this.validatingPatient = false;
          this.lastValidationResponse = res;

          if (idNumberControl) {
            idNumberControl.enable();
          }

          if (res.action === 'patient_already_exist_in_layer') {
            this.handleCase1(res);
          } else if (res.action === 'patient_doesnt_exist_in_layer') {
            this.handleCase2(res);
          } else if (res.action === 'patient_doesnt_exist') {
            this.handleCase3();
          }
        },
        error: (error) => {
          this.validatingPatient = false;

          if (idNumberControl) {
            idNumberControl.enable();
          }

          this.validationMessage = 'Error al validar paciente';
          this.validationStatus = 'error';
          this.validationFlag = null;
          console.error('Error validating patient:', error);
        }
      });
  }

  /**
   * Maneja el CASE1: Paciente existe en la misma capa
   * @param res Respuesta de validación
   */
  private handleCase1(res: ValidatePatientResponse): void {
    this.validationMessage = 'El paciente ya existe en esta capa (duplicado) puede continuar pero se actualizará el registro';
    this.validationStatus = 'warning';
    this.validationFlag = 'CASE1';

    this.registroForm.patchValue({
      patient: res.patientBasicInfo,
      caregiver: res.caregiver
    });

    this.cargarVariablesExistentes(res);
  }

  /**
   * Maneja el CASE2: Paciente existe en otra capa
   * @param res Respuesta de validación
   */
  private handleCase2(res: ValidatePatientResponse): void {
    this.validationMessage = 'El paciente ya tiene un registro en otra capa';
    this.validationStatus = 'warning';
    this.validationFlag = 'CASE2';

    this.registroForm.patchValue({
      patient: res.patientBasicInfo,
      caregiver: res.caregiver
    });

    this.calcularEdadDesdeFechaNacimiento();
  }

  /**
   * Maneja el CASE3: Paciente nuevo
   */
  private handleCase3(): void {
    this.validationMessage = 'Paciente nuevo, puede registrarse';
    this.validationStatus = 'success';
    this.validationFlag = 'CASE3';

    this.registroForm.get('patient')?.reset();
    this.registroForm.get('caregiver')?.reset();
    this.initializeVariables();
  }

  // ============================
  // ENVÍO DEL FORMULARIO
  // ============================


  /**
   * Maneja el envío del formulario con todas las validaciones
   * Incluye confirmación mediante resumen antes del guardado final
   */
  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.validationMessage = 'Complete todos los campos requeridos';
      this.validationStatus = 'error';
      this.markFormGroupTouched(this.registroForm);

      Swal.fire({
        title: 'Formulario Incompleto',
        text: 'Por favor complete todos los campos requeridos antes de continuar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.validationFlag) {
      this.validationMessage = 'Debe validar el paciente antes de guardar';
      this.validationStatus = 'warning';

      Swal.fire({
        title: 'Paciente No Validado',
        text: 'Por favor valide el paciente antes de proceder con el guardado',
        icon: 'warning',
        confirmButtonText: 'Validar Ahora'
      }).then((result) => {
        if (result.isConfirmed) {
          this.currentSection = 0;
        }
      });
      return;
    }

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      this.validationMessage = 'No se pudo obtener el email del usuario autenticado';
      this.validationStatus = 'error';

      Swal.fire('Error', 'No se pudo verificar su identidad. Por favor inicie sesión nuevamente.', 'error');
      return;
    }

    try {
      const confirmado = await this.mostrarResumenGuardado();

      if (!confirmado) {
        console.log('Usuario canceló el guardado después de revisar el resumen');
        return;
      }

      this.loading = true;
      const registerRequest = this.prepareRegisterRequest();

      console.log('📤 DATOS ENVIADOS PARA GUARDADO:', {
        caso: this.validationFlag,
        registerId: this.lastValidationResponse?.registerId,
        userEmail: userEmail,
        requestBody: registerRequest
      });

      if (this.validationFlag === 'CASE1' && this.lastValidationResponse?.registerId) {
        await this.executeCase1(userEmail, registerRequest);
      } else if (this.validationFlag === 'CASE2' && this.lastValidationResponse?.registerId) {
        await this.executeCase2(userEmail, registerRequest);
      } else if (this.validationFlag === 'CASE3') {
        await this.executeCase3(userEmail, registerRequest);
      } else {
        throw new Error('Estado de validación inválido');
      }

    } catch (error) {
      this.loading = false;
      console.error('Error en el proceso de guardado:', error);
      Swal.fire('Error', 'Ocurrió un error durante el proceso de guardado', 'error');
    }
  }

  /**
   * Prepara el objeto RegisterRequest para enviar al servidor
   * Incluye formateo de variables y fechas para todos los casos
   * @returns RegisterRequest estructurado
   */
  private prepareRegisterRequest(): RegisterRequest {
    const variablesInfo = this.variables.controls.map((v: any) => {
      const originalType = v.get('type')?.value;
      const originalValue = v.get('value')?.value;
      const converted = this.convertValueForApi(originalValue, originalType);

      return {
        id: v.get('variableId')?.value,
        name: v.get('variableName')?.value,
        type: converted.type,
        value: converted.value
      };
    });

    const patientData = this.registroForm.get('patient')?.value || {};
    const caregiverData = this.hasCaregiver ? (this.registroForm.get('caregiver')?.value || {}) : undefined;

    const patientIdentificationNumber = Number(this.registroForm.get('patientIdentificationNumber')?.value);

    const formattedPatientData = {
      ...patientData,
      birthDate: patientData.birthDate ? this.formatDateForBackend(patientData.birthDate) : null,
      deathDate: patientData.deathDate ? this.formatDateForBackend(patientData.deathDate) : null,
      firstCrisisDate: patientData.firstCrisisDate ? this.formatDateForBackend(patientData.firstCrisisDate) : null
    };

    let formattedCaregiverData = undefined;
    if (caregiverData && Object.keys(caregiverData).length > 0) {
      formattedCaregiverData = {
        ...caregiverData,
        identificationNumber: Number(caregiverData.identificationNumber) || 0,
        age: Number(caregiverData.age) || 0
      };
    }

    return {
      registerInfo: {
        researchLayerId: this.researchLayerId,
        researchLayerName: this.researchLayerName,
        variablesInfo: variablesInfo
      },
      patientIdentificationNumber: patientIdentificationNumber,
      patientIdentificationType: this.registroForm.get('patientIdentificationType')?.value,
      patient: formattedPatientData,
      caregiver: formattedCaregiverData
    };
  }

  /**
   * Ejecuta el CASE1: Actualizar registro en la misma capa
   * Incluye formateo completo de variables y fechas
   */
  private async executeCase1(userEmail: string, registerRequest: RegisterRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.consolaService.updateRegister(this.lastValidationResponse!.registerId!, userEmail, registerRequest)
        .subscribe({
          next: async () => {
            try {
              if (this.consentimientoFile) {
                await this.subirConsentimiento();
              }

              this.consolaService.notifyDataChanged();
              await this.handleSuccess('Registro actualizado correctamente en la capa actual');
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error: (error) => {
            this.loading = false;
            this.validationMessage = 'Error al actualizar el registro';
            this.validationStatus = 'error';
            Swal.fire('Error', 'Error al actualizar el registro: ' + (error.error?.message || error.message), 'error');
            reject(error);
          }
        });
    });
  }

  /**
   * Ejecuta el CASE2: Mover registro a nueva capa
   * Incluye formateo completo de variables y fechas
   */
  private async executeCase2(userEmail: string, registerRequest: RegisterRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.consolaService.updateRegister(this.lastValidationResponse!.registerId!, userEmail, registerRequest)
        .subscribe({
          next: async (response) => {
            try {
              this.validationMessage = 'Paciente movido correctamente a esta capa';
              this.validationStatus = 'success';

              if (this.consentimientoFile) {
                await this.subirConsentimiento();
              }

              this.consolaService.notifyDataChanged();

              Swal.fire('Éxito', 'Paciente movido correctamente a esta capa', 'success');

              this.verificarRegistroEnNuevaCapa(registerRequest.patientIdentificationNumber);

              this.resetForm();
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error: (error) => {
            this.loading = false;
            this.validationMessage = 'Error al mover el paciente a esta capa';
            this.validationStatus = 'error';
            Swal.fire('Error', 'Error al mover el paciente a esta capa: ' + (error.error?.message || error.message), 'error');
            reject(error);
          }
        });
    });
  }

  /**
   * Ejecuta el CASE3: Crear nuevo registro
   * Incluye formateo completo de variables y fechas
   */
  private async executeCase3(userEmail: string, registerRequest: RegisterRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.consolaService.saveRegister(userEmail, registerRequest)
        .subscribe({
          next: async () => {
            try {
              if (this.consentimientoFile) {
                await this.subirConsentimiento();
              }

              this.consolaService.notifyDataChanged();
              await this.handleSuccess('Registro creado correctamente');
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error: (error) => {
            this.loading = false;
            this.validationMessage = 'Error al guardar el registro';
            this.validationStatus = 'error';
            Swal.fire('Error', 'Error al guardar el registro: ' + (error.error?.message || error.message), 'error');
            reject(error);
          }
        });
    });
  }

  /**
   * Maneja el éxito de una operación de guardado
   * @param message Mensaje de éxito a mostrar
   */
  private async handleSuccess(message: string): Promise<void> {
    this.validationMessage = message;
    this.validationStatus = 'success';

    this.registroGuardado.emit();

    await Swal.fire({
      title: '¡Éxito!',
      text: message,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      timer: 3000
    });

    this.resetForm();
    this.loading = false;
  }
  // ============================
  // MÉTODOS DE UTILIDAD
  // ============================

  /**
   * Maneja el cambio en la fecha de nacimiento y calcula la edad automáticamente
   */
  onBirthDateChange(): void {
    const birthDate = this.registroForm.get('patient.birthDate')?.value;
    this.calcularYEstablecerEdad(birthDate);
  }

  /**
   * Calcula y establece la edad basada en la fecha de nacimiento
   * @param birthDate Fecha de nacimiento
   */
  private calcularYEstablecerEdad(birthDate: string): void {
    if (birthDate) {
      try {
        const today = new Date();
        const birth = new Date(birthDate);

        if (isNaN(birth.getTime())) {
          console.warn('⚠️ Fecha de nacimiento inválida:', birthDate);
          this.registroForm.get('patient.age')?.setValue('');
          return;
        }

        let age = today.getFullYear() - birth.getFullYear();

        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }

        if (age >= 0 && age <= 150) {
          this.registroForm.get('patient.age')?.setValue(age);
          console.log('✅ Edad calculada:', age, 'a partir de fecha:', birthDate);
        } else {
          console.warn('⚠️ Edad calculada fuera de rango:', age);
          this.registroForm.get('patient.age')?.setValue('');
        }
      } catch (error) {
        console.error('❌ Error calculando edad:', error);
        this.registroForm.get('patient.age')?.setValue('');
      }
    } else {
      this.registroForm.get('patient.age')?.setValue('');
    }
  }

  /**
   * Calcula la edad automáticamente a partir de la fecha de nacimiento
   */
  private calcularEdadDesdeFechaNacimiento(): void {
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
    } else {
      console.warn('⚠️ No se pudo calcular la edad: fecha de nacimiento no disponible');
    }
  }

  /**
   * Carga las variables existentes cuando el paciente ya está registrado en la capa
   */
  private cargarVariablesExistentes(res: any): void {
    try {
      if (res.registerInfo && res.registerInfo.length > 0 && res.registerInfo[0].variablesInfo) {
        const variablesInfo = res.registerInfo[0].variablesInfo;
        const variablesArray = this.registroForm.get('variables') as FormArray;

        variablesArray.controls.forEach((variableControl: AbstractControl) => {
          const variableGroup = variableControl as FormGroup;
          const variableId = variableGroup.get('variableId')?.value;

          const variableExistente = variablesInfo.find((v: any) => v.variableId === variableId);

          if (variableExistente) {
            let valor: any;

            if (variableExistente.variableType === 'String') {
              valor = variableExistente.valueAsString;
            } else if (variableExistente.variableType === 'Number') {
              valor = variableExistente.valueAsNumber;
            } else {
              valor = variableExistente.valueAsString || variableExistente.valueAsNumber;
            }

            if (valor !== null && valor !== undefined) {
              variableGroup.get('value')?.setValue(valor);
            }
          }
        });

      } else {
        console.warn('⚠️ No se encontraron variables en la respuesta del servidor');
      }

      const birthDate = this.registroForm.get('patient.birthDate')?.value;
      this.calcularYEstablecerEdad(birthDate);

    } catch (error) {
      console.error('❌ Error cargando variables existentes:', error);
    }
  }

  // ============================
  // MÉTODOS DE CONVERSIÓN DE DATOS
  // ============================

  /**
   * Convierte el valor de una variable al tipo esperado por el API
   * Maneja todos los tipos de variables: Entero, Real, Texto, Fecha, Lógico
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

    try {
      switch (originalType) {
        case 'Entero':
          if (Array.isArray(value)) {
            const stringValue = value.join(', ');
            finalValue = stringValue;
            finalType = 'String';
          } else {
            finalValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
            finalType = isNaN(finalValue) ? 'String' : 'Number';
            if (isNaN(finalValue)) finalValue = String(value);
          }
          break;

        case 'Real':
          if (Array.isArray(value)) {
            finalValue = value.join(', ');
            finalType = 'String';
          } else {
            finalValue = typeof value === 'string' ? parseFloat(value) : Number(value);
            finalType = isNaN(finalValue) ? 'String' : 'Number';
            if (isNaN(finalValue)) finalValue = String(value);
          }
          break;

        case 'Fecha':
          if (Array.isArray(value)) {
            finalValue = value.join(', ');
            finalType = 'String';
          } else {
            finalValue = this.formatDateForBackend(value);
            finalType = 'String';
          }
          break;

        case 'Lógico':
          if (Array.isArray(value)) {
            finalValue = value.join(', ');
            finalType = 'String';
          } else if (typeof value === 'string') {
            finalValue = value.toLowerCase() === 'true' || value === '1' ? 'true' : 'false';
            finalType = 'String';
          } else {
            finalValue = value ? 'true' : 'false';
            finalType = 'String';
          }
          break;

        case 'Texto':
        default:
          if (Array.isArray(value)) {
            finalValue = value.join(', ');
          } else {
            finalValue = String(value);
          }
          finalType = 'String';
          break;
      }
    } catch (error) {
      console.error('Error converting value:', error, { value, originalType });
      finalValue = String(value);
      finalType = 'String';
    }

    if (finalValue === undefined) {
      finalValue = null;
    }

    return { value: finalValue, type: finalType };
  }

  /**
   * Formatea una fecha para el backend (formato YYYY-MM-DD)
   * Maneja múltiples formatos de entrada
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada o null si es inválida
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

  // ============================
  // MÉTODOS DE GESTIÓN DE ARCHIVOS
  // ============================

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

      await this.consentimiento.uploadConsentFile(patientId, this.consentimientoFile)
        .pipe(takeUntil(this.destroy$))
        .toPromise();
    } catch (error) {
      Swal.fire('Advertencia', 'El registro se guardó pero hubo un error al subir el consentimiento', 'warning');
    }
  }

  // ============================
  // MÉTODOS DE INTERACCIÓN DE USUARIO
  // ============================

  /**
   * Alterna la visibilidad de la sección de cuidador
   */
  toggleCaregiver(): void {
    this.hasCaregiver = !this.hasCaregiver;
    if (!this.hasCaregiver) {
      const caregiverGroup = this.registroForm.get('caregiver') as FormGroup;
      caregiverGroup.patchValue({
        name: '',
        identificationType: 'CC',
        identificationNumber: '',
        age: '',
        educationLevel: '',
        occupation: ''
      });

      caregiverGroup.markAsPristine();
      caregiverGroup.markAsUntouched();
    }
  }

  /**
   * Maneja el cambio en un checkbox de variable lógica
   * @param variable Grupo de formulario de la variable
   * @param event Evento de cambio
   */
  onCheckboxChange(variable: FormGroup, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    variable.get('value')?.setValue(isChecked);

    variable.get('value')?.updateValueAndValidity();
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
      if (!currentValue.includes(optionValue)) {
        variable.get('value')?.setValue([...currentValue, optionValue]);
      }
    } else {
      variable.get('value')?.setValue(currentValue.filter(v => v !== optionValue));
    }

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
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire('Error', 'Solo se permiten archivos PDF, JPEG o PNG', 'error');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB (más conservador)
    if (file.size > maxSize) {
      Swal.fire('Error', `El archivo no puede ser mayor a 2MB. Tamaño actual: ${this.getFileSize(file.size)}`, 'error');
      return;
    }

    this.consentimientoFile = file;
    this.consentimientoSubido = true;

    Swal.fire('Éxito', 'Archivo cargado correctamente', 'success');
  }

  // ============================
  // MÉTODOS DE VALIDACIÓN DE ENTRADA
  // ============================

  /**
   * Valida que solo se ingresen números en un campo
   * @param event Evento de teclado
   * @returns boolean indicando si la tecla es válida
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
   * Valida que solo se ingresen números decimales en un campo
   * @param event Evento de teclado
   * @returns boolean indicando si la tecla es válida
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

  // ============================
  // MÉTODOS DE UTILIDAD DE UI
  // ============================

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

  // ============================
  // MÉTODOS DE RESET Y LIMPIEZA
  // ============================

  /**
   * Resetea el formulario a su estado inicial
   */
  private resetForm(): void {

    this.registroForm.reset({
      patientIdentificationType: 'CC',
      patientIdentificationNumber: ''
    });

    this.initializeVariables();

    this.hasCaregiver = false;
    this.consentimientoFile = null;
    this.consentimientoSubido = false;
    this.currentSection = 0;

    this.validationMessage = null;
    this.validationStatus = null;
    this.validationFlag = null;
    this.lastValidationResponse = null;

    this.registroGuardado.emit();

    console.log('✅ Formulario reseteado completamente');
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

  // ============================
  // MÉTODOS DE VERIFICACIÓN
  // ============================

  /**
   * Verifica que el registro se haya creado en la nueva capa
   */
  private verificarRegistroEnNuevaCapa(patientIdentificationNumber: number): void {
    setTimeout(() => {
      console.log('🔍 Verificando registro en nueva capa...', {
        patientId: patientIdentificationNumber,
        nuevaCapaId: this.researchLayerId
      });

      this.consolaService.getActualRegisterByPatient(patientIdentificationNumber, this.researchLayerId)
        .subscribe({
          next: (registro) => {
            if (registro) {
              Swal.fire({
                title: 'Verificación exitosa',
                text: `El paciente ${patientIdentificationNumber} fue registrado correctamente en la capa ${this.researchLayerName}`,
                icon: 'success',
                timer: 4000,
                showConfirmButton: true
              });
            } else {
              Swal.fire({
                title: 'Advertencia',
                text: `El registro se procesó pero no se pudo verificar en la base de datos. Esto puede ser normal si el sistema está procesando la solicitud.`,
                icon: 'warning',
                timer: 5000,
                showConfirmButton: true
              });
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error en verificación',
              text: 'No se pudo verificar el registro debido a un error de conexión',
              icon: 'error',
              timer: 4000,
              showConfirmButton: true
            });
          }
        });
    }, 3000);
  }

  // ============================
  // MÉTODOS AUXILIARES
  // ============================

  /**
   * Marca los campos como "touched" para mostrar errores de validación
   * @param fields Array de campos a marcar como touched
   */
  private markFieldsAsTouched(fields: any[]): void {
    fields.forEach(field => {
      if (field) {
        field.markAsTouched();
      }
    });
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
   * Muestra un resumen de confirmación antes de guardar el registro
   * @returns Promise que se resuelve si el usuario confirma
   */
  private async mostrarResumenGuardado(): Promise<boolean> {
    const registerRequest = this.prepareRegisterRequest();
    const resumenHTML = this.generarHTMLResumen(registerRequest);

    // Crear estilos inline para asegurar que se apliquen
    const inlineStyles = `
    <style>
      .resumen-container {
        max-height: 60vh;
        overflow-y: auto;
        padding: 20px;
        background: #f8f9fa;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .resumen-header {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 20px;
        background: white;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .patient-avatar { font-size: 3em; color: #3498db; }
      .patient-main-info h3 { margin: 0 0 5px 0; color: #2c3e50; font-size: 1.4em; font-weight: 600; }
      .patient-id { margin: 0; color: #6c757d; font-size: 0.9em; }
      .case-badge { padding: 8px 16px; border-radius: 20px; font-size: 0.8em; font-weight: 600; margin-left: auto; }
      .case-case1 { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
      .case-case2 { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
      .case-case3 { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
      .info-card { background: white; border-radius: 12px; padding: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e9ecef; }
      .card-header { display: flex; align-items: center; gap: 10px; padding: 15px 20px; border-bottom: 1px solid #f1f3f4; background: #f8f9fa; border-radius: 12px 12px 0 0; }
      .card-header i { color: #3498db; font-size: 1.1em; width: 20px; text-align: center; }
      .card-header h4 { margin: 0; color: #2c3e50; font-size: 1em; font-weight: 600; }
      .card-content { padding: 20px; }
      .info-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f8f9fa; }
      .info-item:last-child { border-bottom: none; }
      .info-item label { font-weight: 600; color: #495057; font-size: 0.9em; min-width: 120px; }
      .info-item span { color: #6c757d; text-align: right; flex: 1; }
      .consentimiento-status { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 8px; font-weight: 600; margin-bottom: 10px; }
      .has-consent { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      .no-consent { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      .file-info { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; font-size: 0.9em; border: 1px dashed #dee2e6; }
      .variables-list { display: flex; flex-direction: column; gap: 8px; }
      .variable-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db; }
      .var-name { font-weight: 600; color: #495057; font-size: 0.9em; }
      .var-value { color: #6c757d; font-size: 0.9em; background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e9ecef; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .layer-name { color: #28a745; font-weight: 600; background: #d4edda; padding: 4px 8px; border-radius: 4px; border: 1px solid #c3e6cb; }
      @media (max-width: 768px) {
        .info-grid { grid-template-columns: 1fr; }
        .resumen-header { flex-direction: column; text-align: center; gap: 10px; }
        .case-badge { margin-left: 0; margin-top: 10px; }
      }
    </style>
  `;

    const htmlCompleto = inlineStyles + resumenHTML;

    const result = await Swal.fire({
      title: 'Revisión Final del Registro',
      html: htmlCompleto,
      icon: 'info' as any,
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar registro',
      cancelButtonText: 'No, revisar nuevamente',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      width: '700px',
      customClass: {
        popup: 'resumen-modal-popup',
        title: 'resumen-modal-title',
        htmlContainer: 'resumen-modal-html',
        actions: 'resumen-modal-actions',
        confirmButton: 'resumen-modal-confirm',
        cancelButton: 'resumen-modal-cancel'
      },
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });

    return result.isConfirmed;
  }

  /**
   * Genera el HTML para el resumen del registro
   * @param registerRequest Datos del registro a guardar
   * @returns String con el HTML formateado
   */
  private generarHTMLResumen(registerRequest: RegisterRequest): string {
    const patient = registerRequest.patient;
    const caregiver = registerRequest.caregiver;
    const variables = registerRequest.registerInfo.variablesInfo;
    const variablesCompletadas = variables.filter(v => v.value !== null && v.value !== '' && v.value !== undefined);

    let html = `
    <div class="resumen-container">
      <!-- Header con información principal -->
      <div class="resumen-header">
        <div class="patient-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="patient-main-info">
          <h3>${patient.name || 'Nombre no especificado'}</h3>
          <p class="patient-id">${this.getTipoIdentificacionLabel(registerRequest.patientIdentificationType)}: ${registerRequest.patientIdentificationNumber}</p>
        </div>
        <div class="case-badge case-${this.validationFlag?.toLowerCase()}">
          ${this.getCaseDescription()}
        </div>
      </div>

      <!-- Información básica en cards -->
      <div class="info-grid">
        <!-- Información Personal -->
        <div class="info-card">
          <div class="card-header">
            <i class="fas fa-user"></i>
            <h4>Información Personal</h4>
          </div>
          <div class="card-content">
            <div class="info-item">
              <label>Nombre:</label>
              <span>${patient.name || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Sexo:</label>
              <span>${patient.sex || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Fecha Nacimiento:</label>
              <span>${this.formatDateForDisplay(patient.birthDate) || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Edad:</label>
              <span>${this.registroForm.get('patient.age')?.value || 'No calculada'}</span>
            </div>
          </div>
        </div>

        <!-- Información de Contacto -->
        <div class="info-card">
          <div class="card-header">
            <i class="fas fa-address-book"></i>
            <h4>Información de Contacto</h4>
          </div>
          <div class="card-content">
            <div class="info-item">
              <label>Email:</label>
              <span>${patient.email || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Teléfono:</label>
              <span>${patient.phoneNumber || 'No especificado'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Información Socioeconómica -->
      <div class="info-grid">
        <div class="info-card">
          <div class="card-header">
            <i class="fas fa-chart-line"></i>
            <h4>Información Socioeconómica</h4>
          </div>
          <div class="card-content">
            <div class="info-item">
              <label>Nivel Económico:</label>
              <span>${patient.economicStatus || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Nivel Educación:</label>
              <span>${patient.educationLevel || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Estado Civil:</label>
              <span>${patient.maritalStatus || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="card-header">
            <i class="fas fa-map-marker-alt"></i>
            <h4>Información Geográfica</h4>
          </div>
          <div class="card-content">
            <div class="info-item">
              <label>Ciudad Origen:</label>
              <span>${patient.hometown || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Ciudad Actual:</label>
              <span>${patient.currentCity || 'No especificado'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Información Médica -->
      <div class="info-card">
        <div class="card-header">
          <i class="fas fa-heartbeat"></i>
          <h4>Información Médica</h4>
        </div>
        <div class="card-content">
          <div class="info-grid">
            <div>
              <div class="info-item">
                <label>Estado Crisis:</label>
                <span>${patient.crisisStatus || 'No especificado'}</span>
              </div>
              <div class="info-item">
                <label>Primera Crisis:</label>
                <span>${this.formatDateForDisplay(patient.firstCrisisDate) || 'No especificado'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <label>Fecha Fallecimiento:</label>
                <span>${this.formatDateForDisplay(patient.deathDate) || 'No especificado'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cuidador -->
      ${this.hasCaregiver && caregiver ? `
      <div class="info-card">
        <div class="card-header">
          <i class="fas fa-hands-helping"></i>
          <h4>Información del Cuidador</h4>
        </div>
        <div class="card-content">
          <div class="info-grid">
            <div>
              <div class="info-item">
                <label>Nombre:</label>
                <span>${caregiver.name || 'No especificado'}</span>
              </div>
              <div class="info-item">
                <label>Tipo ID:</label>
                <span>${this.getTipoIdentificacionLabel(caregiver.identificationType) || 'No especificado'}</span>
              </div>
              <div class="info-item">
                <label>Número ID:</label>
                <span>${caregiver.identificationNumber || 'No especificado'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <label>Edad:</label>
                <span>${caregiver.age || 'No especificado'}</span>
              </div>
              <div class="info-item">
                <label>Nivel Educación:</label>
                <span>${caregiver.educationLevel || 'No especificado'}</span>
              </div>
              <div class="info-item">
                <label>Ocupación:</label>
                <span>${caregiver.occupation || 'No especificado'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Consentimiento Informado -->
      <div class="info-card consentimiento-card">
        <div class="card-header">
          <i class="fas fa-file-signature"></i>
          <h4>Consentimiento Informado</h4>
        </div>
        <div class="card-content">
          <div class="consentimiento-status ${this.registroForm.get('hasConsentimiento')?.value ? 'has-consent' : 'no-consent'}">
            <i class="fas ${this.registroForm.get('hasConsentimiento')?.value ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            <span>${this.registroForm.get('hasConsentimiento')?.value ? 'SÍ requiere consentimiento' : 'NO requiere consentimiento'}</span>
          </div>
          ${this.consentimientoFile ? `
          <div class="file-info">
            <i class="fas fa-file"></i>
            <span class="file-name">${this.consentimientoFile.name}</span>
            <span class="file-size">(${this.getFileSize(this.consentimientoFile.size)})</span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Variables de Investigación -->
      ${variablesCompletadas.length > 0 ? `
      <div class="info-card variables-card">
        <div class="card-header">
          <i class="fas fa-list"></i>
          <h4>Variables de Investigación</h4>
          <span class="variables-count">${variablesCompletadas.length} de ${variables.length}</span>
        </div>
        <div class="card-content">
          <div class="variables-list">
            ${variablesCompletadas.map(v => `
            <div class="variable-item">
              <span class="var-name">${v.name}:</span>
              <span class="var-value">${this.truncateValue(v.value)}</span>
            </div>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Información de la Capa -->
      <div class="info-card layer-card">
        <div class="card-header">
          <i class="fas fa-layer-group"></i>
          <h4>Información de la Capa</h4>
        </div>
        <div class="card-content">
          <div class="info-item">
            <label>Capa destino:</label>
            <span class="layer-name">${this.researchLayerName}</span>
          </div>
          <div class="info-item">
            <label>ID Capa:</label>
            <span class="layer-id">${this.researchLayerId}</span>
          </div>
        </div>
      </div>

      <!-- Resumen de validación -->
      <div class="info-card validation-card">
        <div class="card-header">
          <i class="fas fa-info-circle"></i>
          <h4>Resumen de Validación</h4>
        </div>
        <div class="card-content">
          <div class="info-item">
            <label>Estado:</label>
            <span class="validation-status ${this.validationStatus}">
              ${this.validationMessage || 'No validado'}
            </span>
          </div>
          <div class="info-item">
            <label>Campos completados:</label>
            <span>
              ${this.getCompletedFieldsCount()} de ${this.getTotalFieldsCount()} campos
            </span>
          </div>
        </div>
      </div>
    </div>
  `;

    return html;
  }

  /**
   * Obtiene el número de campos completados en el formulario
   */
  private getCompletedFieldsCount(): number {
    let completed = 0;
    const formValue = this.registroForm.value;

    // Campos básicos
    if (formValue.patientIdentificationNumber) completed++;
    if (formValue.patientIdentificationType) completed++;

    // Campos del paciente
    const patient = formValue.patient || {};
    if (patient.name) completed++;
    if (patient.sex) completed++;
    if (patient.birthDate) completed++;
    if (patient.email) completed++;
    if (patient.phoneNumber) completed++;
    if (patient.economicStatus) completed++;
    if (patient.educationLevel) completed++;
    if (patient.maritalStatus) completed++;
    if (patient.hometown) completed++;
    if (patient.currentCity) completed++;
    if (patient.firstCrisisDate) completed++;
    if (patient.crisisStatus) completed++;
    if (patient.deathDate) completed++;

    // Campos del cuidador si está activo
    if (this.hasCaregiver) {
      const caregiver = formValue.caregiver || {};
      if (caregiver.name) completed++;
      if (caregiver.identificationNumber) completed++;
      if (caregiver.age) completed++;
      if (caregiver.educationLevel) completed++;
      if (caregiver.occupation) completed++;
    }

    // Variables completadas
    completed += this.completedCount;

    return completed;
  }

  /**
   * Obtiene el número total de campos en el formulario
   */
  private getTotalFieldsCount(): number {
    let total = 2; // patientIdentificationNumber y patientIdentificationType

    // Campos del paciente
    total += 13; // Todos los campos del paciente

    // Campos del cuidador si está activo
    if (this.hasCaregiver) {
      total += 5; // Campos del cuidador
    }

    // Variables
    total += this.totalCount;

    return total;
  }

  /**
   * Obtiene la descripción del caso de validación
   * @returns Descripción del caso
   */
  private getCaseDescription(): string {
    switch (this.validationFlag) {
      case 'CASE1':
        return 'Actualizar registro en capa actual';
      case 'CASE2':
        return 'Mover registro a nueva capa';
      case 'CASE3':
        return 'Crear nuevo registro';
      default:
        return 'No validado';
    }
  }

  /**
   * Obtiene la etiqueta del tipo de identificación
   * @param tipo Tipo de identificación
   * @returns Etiqueta descriptiva
   */
  private getTipoIdentificacionLabel(tipo: string): string {
    const tipoObj = this.tiposIdentificacion.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  }

  /**
   * Formatea una fecha para mostrar en el resumen
   * @param dateString Fecha en formato string
   * @returns Fecha formateada
   */
  private formatDateForDisplay(dateString: string | null): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Trunca valores largos para el preview
   * @param value Valor a truncar
   * @returns Valor truncado
   */
  private truncateValue(value: any): string {
    const str = String(value);
    return str.length > 30 ? str.substring(0, 30) + '...' : str;
  }
}
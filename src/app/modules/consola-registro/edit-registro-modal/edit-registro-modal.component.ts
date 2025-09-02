import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConsolaRegistroService } from 'src/app/services/consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import { Register, VariableInfo, VariableInfoResponse } from '../interfaces';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Componente modal para editar registros de pacientes
 * Permite modificar información básica del paciente, variables médicas y datos del cuidador
 */
@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent {
  // Input que recibe el registro a editar desde el componente padre
  @Input() registro: Register | null = null;
  
  // Output para emitir evento cuando se cierra el modal
  @Output() close = new EventEmitter<void>();
  
  // Output para emitir evento cuando se actualiza un registro
  @Output() registroActualizado = new EventEmitter<Register>();
  
  // Output para emitir evento cuando se guardan cambios
  @Output() saveChanges = new EventEmitter<Register>();

  // Estado de carga durante la inicialización
  isLoading = false;
  
  // Estado de carga durante la actualización
  isUpdating = false;
  
  // Bandera para controlar si el formulario fue enviado
  formSubmitted = false;
  
  // Mensaje de error para mostrar al usuario
  errorMessage: string | null = null;
  
  // Mensaje de éxito para mostrar al usuario
  successMessage: string | null = null;
  
  // Pestaña activa en la interfaz de pestañas
  activeTab: string = 'paciente';

  // Opciones predefinidas para tipos de identificación
  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];
  
  // Opciones predefinidas para géneros
  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];
  
  // Opciones predefinidas para estados económicos
  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio alto' },
    { value: 'alto', label: 'Alto' }
  ];
  
  // Opciones predefinidas para niveles de educación
  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Posgrado' }
  ];
  
  // Opciones predefinidas para estados civiles
  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
    { value: 'union_libre', label: 'Unión libre' }
  ];
  
  // Opciones predefinidas para estados de crisis
  estadosCrisis = ['Activa', 'Remisión', 'Estable', 'Crítica', 'Recuperado'];

  /**
   * Constructor del componente
   * @param registroService Servicio para gestionar operaciones con registros
   * @param authService Servicio para autenticación y gestión de usuarios
   */
  constructor(
    private registroService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  /**
   * Convierte una respuesta de variable a VariableInfo estandarizado
   * @param v Objeto de variable con posibles formatos diferentes
   * @returns VariableInfo estandarizado
   */
  private mapResponseToInfo(v: any): VariableInfo {
    // Determina el valor de la variable desde diferentes propiedades posibles
    let value: any = '';
    if (v.value !== undefined && v.value !== null) value = v.value;
    else if (v.valueAsNumber !== undefined && v.valueAsNumber !== null) value = v.valueAsNumber;
    else if (v.valueAsString !== undefined && v.valueAsString !== null) value = v.valueAsString;

    // Determina el tipo de variable según el tipo recibido
    let type: string;
    switch (v.variableType?.toLowerCase()) {
      case 'numerico':
      case 'number':
        type = 'number';
        break;
      case 'texto':
      case 'text':
        type = 'text';
        break;
      case 'date':
        type = 'date';
        break;
      default:
        type = 'text';
    }

    // Retorna el objeto estandarizado
    return {
      variableId: v.variableId,
      variableName: v.variableName,
      variableType: type,
      variableValue: value,
      unit: v.unit || null,
      referenceRange: v.referenceRange || null,
      lastUpdate: v.lastUpdate || null
    };
  }

  /**
   * Hook de inicialización del componente
   * Procesa los datos del registro recibido para estandarizar las variables
   */
  ngOnInit(): void {
    if (this.registro?.registerInfo) {
      // Mapea cada capa del registro para estandarizar las variables
      this.registro.registerInfo = this.registro.registerInfo.map(layer => {
        const mappedVariables: VariableInfo[] = (layer.variablesInfo || []).map((v: VariableInfoResponse) => {
          return this.mapResponseToInfo(v);
        });

        return {
          ...layer,
          variablesInfo: mappedVariables
        };
      });
    }

    console.log('Registro recibido en EditModal:', this.registro);
  }

  /**
   * Cierra el modal emitiendo el evento correspondiente
   */
  closeModal() {
    this.close.emit();
  }

  /**
   * Emite evento para guardar cambios
   */
  onSave() {
    if (this.registro) {
      this.saveChanges.emit(this.registro);
    }
  }

  /**
   * Cambia la pestaña activa en la interfaz
   * @param tab Nombre de la pestaña a activar
   */
  changeTab(tab: string) {
    this.activeTab = tab;
  }

  /**
   * Obtiene todas las variables aplanadas de todas las capas del registro
   * @returns Array de VariableInfo con todas las variables
   */
  get flattenedVariables(): VariableInfo[] {
    if (!this.registro?.registerInfo) return [];

    return this.registro.registerInfo.flatMap(layer => {
      return (layer.variablesInfo || []).map((v: VariableInfoResponse | VariableInfo) => {
        // Si ya es VariableInfo, lo retorna directamente
        if ((v as VariableInfo).variableValue !== undefined) {
          return v as VariableInfo;
        }
        // Si no, lo convierte a VariableInfo
        return this.mapResponseToInfo(v as VariableInfoResponse);
      });
    });
  }

  /**
   * Actualiza el valor de una variable cuando cambia en la interfaz
   * @param variable Variable a actualizar
   * @param event Evento del cambio en el input
   */
  updateVariableValue(variable: VariableInfo, event: any) {
    if (!this.registro || !this.registro.registerInfo) return;

    const variableInfos = this.registro.registerInfo
      .flatMap(layer => layer.variablesInfo) as VariableInfo[];

    const index = variableInfos.findIndex(v => v.variableId === variable.variableId);
    if (index !== -1) {
      let newValue = event.target.value;

      // Valida y convierte valores numéricos
      if (variable.variableType === 'number') {
        if (isNaN(Number(newValue))) {
          this.showErrorAlert('Por favor, ingrese un número válido');
          return;
        }
        newValue = Number(newValue);
      } else {
        newValue = String(newValue);
      }

      variableInfos[index].variableValue = newValue;
    }
  }

  /**
   * Maneja el envío del formulario de edición
   * Valida los datos y realiza la actualización del registro
   */
  onSubmit() {
    if (!this.registro || !this.registro.registerId) {
      this.showErrorAlert('Datos del registro no válidos');
      return;
    }

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      this.showErrorAlert('No se pudo obtener el email del usuario');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Calcula la edad si hay fecha de nacimiento
    if (this.registro.patientBasicInfo?.birthDate) {
      this.registro.patientBasicInfo.age = this.calculateAge(this.registro.patientBasicInfo.birthDate);
    }

    const updateData = this.prepareUpdateData();

    console.log('Payload que se enviará al API:', updateData);

    // Llama al servicio para actualizar el registro
    this.registroService.actualizarRegistro(
      this.registro.registerId,
      userEmail,
      updateData
    )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.showSuccessAlert('Registro actualizado correctamente');
          this.registroActualizado.emit(response);
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err: any) => {
          console.error('Error completo:', err);

          // Proporciona información detallada del error en consola
          if (err instanceof HttpErrorResponse) {
            console.group('Error HTTP Detallado');
            console.log('Status:', err.status);
            console.log('Status Text:', err.statusText);
            console.log('Headers:', err.headers);
            console.log('Body:', err.error);
            console.groupEnd();
          }

          // Construye mensaje de error para el usuario
          let errorMsg = 'Error al actualizar el registro';
          if (err.error?.message) {
            errorMsg = err.error.message;
          } else if (err.message) {
            errorMsg = err.message;
          }

          this.showErrorAlert(errorMsg);
        }
      });
  }

  /**
   * Muestra alerta de éxito con SweetAlert2
   * @param message Mensaje a mostrar
   */
  private showSuccessAlert(message: string): void {
    Swal.fire({
      title: 'Éxito!',
      text: message,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      timer: 2000,
      timerProgressBar: true
    });
  }

  /**
   * Muestra alerta de error con SweetAlert2
   * @param message Mensaje a mostrar
   */
  private showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }

  /**
   * Prepara los datos para enviar al API en la actualización
   * @returns Objeto con los datos estructurados para el API
   */
  private prepareUpdateData(): any {
    if (!this.registro) return null;

    const payload: any = {
      variables: this.prepareVariablesArray(),
      patientIdentificationNumber: this.registro.patientIdentificationNumber,
      patientIdentificationType: this.registro.patientIdentificationType,
      patient: {
        name: this.registro.patientBasicInfo?.name || '',
        sex: this.registro.patientBasicInfo?.sex || '',
        birthDate: this.formatDateForAPI(this.registro.patientBasicInfo?.birthDate),
        age: this.registro.patientBasicInfo?.age || 0,
        email: this.registro.patientBasicInfo?.email || '',
        phoneNumber: this.registro.patientBasicInfo?.phoneNumber || '',
        deathDate: this.formatDateForAPI(this.registro.patientBasicInfo?.deathDate),
        economicStatus: this.registro.patientBasicInfo?.economicStatus || '',
        educationLevel: this.registro.patientBasicInfo?.educationLevel || '',
        maritalStatus: this.registro.patientBasicInfo?.maritalStatus || '',
        hometown: this.registro.patientBasicInfo?.hometown || '',
        currentCity: this.registro.patientBasicInfo?.currentCity || '',
        firstCrisisDate: this.formatDateForAPI(this.registro.patientBasicInfo?.firstCrisisDate),
        crisisStatus: this.registro.patientBasicInfo?.crisisStatus || ''
      }
    };

    // Incluye datos del cuidador solo si existen
    if (this.registro.caregiver && this.hasCaregiverData(this.registro.caregiver)) {
      payload.caregiver = {
        name: this.registro.caregiver.name || '',
        identificationType: this.registro.caregiver.identificationType || '',
        identificationNumber: this.registro.caregiver.identificationNumber || 0,
        age: this.registro.caregiver.age || 0,
        educationLevel: this.registro.caregiver.educationLevel || '',
        occupation: this.registro.caregiver.occupation || ''
      };
    }

    // Incluye datos del profesional de salud si existen
    if (this.registro.healthProfessional) {
      payload.healthProfessional = {
        id: this.registro.healthProfessional.id || '',
        name: this.registro.healthProfessional.name || '',
        identificationNumber: this.registro.healthProfessional.identificationNumber || 0
      };
    }

    return this.cleanPayload(payload);
  }

  /**
   * Verifica si el objeto cuidador tiene datos válidos
   * @param caregiver Objeto cuidador a verificar
   * @returns true si tiene datos válidos, false en caso contrario
   */
  private hasCaregiverData(caregiver: any): boolean {
    if (!caregiver) return false;
    return Object.values(caregiver).some(
      (val: any) => val !== null && val !== undefined && val !== ''
    );
  }

  /**
   * Limpia un objeto eliminando propiedades vacías, nulas o undefined
   * @param obj Objeto a limpiar
   * @returns Objeto limpio sin propiedades vacías
   */
  private cleanPayload(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanPayload(item));
    }

    const cleaned: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        const cleanedValue = typeof value === 'object' ? this.cleanPayload(value) : value;
        if (typeof cleanedValue !== 'object' ||
          (Array.isArray(cleanedValue) && cleanedValue.length > 0) ||
          (Object.keys(cleanedValue).length > 0)) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }

  /**
   * Prepara el array de variables para enviar al API
   * @returns Array de variables estructuradas para el API
   */
  private prepareVariablesArray(): any[] {
    if (!this.registro?.registerInfo) return [];

    const layers = Object.values(this.registro.registerInfo) as {
      researchLayerId: string;
      researchLayerName?: string;
      variablesInfo: VariableInfo[];
    }[];

    return layers.flatMap(layer =>
      (layer.variablesInfo || []).map((v: VariableInfo) => ({
        id: v.variableId || '',
        variableName: v.variableName || '',
        value: this.parseVariableValue(v.variableValue, v.variableType) || '',
        type: v.variableType || 'string',
        researchLayerId: layer.researchLayerId || '',
        researchLayerName: layer.researchLayerName || ''
      }))
    );
  }

  /**
   * Parsea el valor de una variable según su tipo
   * @param value Valor a parsear
   * @param type Tipo de la variable
   * @returns Valor parseado según el tipo
   */
  private parseVariableValue(value: any, type: string): any {
    if (value === null || value === undefined) return '';

    if (type === 'date') {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      return '';
    }

    if (type === 'number') return Number(value) || 0;
    if (type === 'boolean') return Boolean(value);
    return String(value);
  }

  /**
   * Formatea una fecha para el API en formato YYYY-MM-DD
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada o null si no es válida
   */
  private formatDateForAPI(dateValue: any): string | null {
    if (!dateValue) return null;

    // Si ya está en el formato correcto
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // Si está en formato DD-MM-YYYY
    if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      const [day, month, year] = dateValue.split('-');
      return `${year}-${month}-${day}`;
    }

    // Intenta parsear como objeto Date
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Formato de fecha no reconocido:', dateValue);
    }

    return null;
  }

  /**
   * Calcula la edad a partir de una fecha de nacimiento
   * @param birthDate Fecha de nacimiento
   * @returns Edad calculada
   */
  public calculateAge(birthDate: string | null): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Prepara una fecha para mostrarla en un input type="date"
   * @param dateString Cadena de fecha a formatear
   * @returns Fecha en formato YYYY-MM-DD o cadena vacía si no es válida
   */
  prepareDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';

    // Si ya está en el formato correcto
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    // Si está en formato DD-MM-YYYY
    const [day, month, year] = dateString.split('-');
    if (day && month && year) {
      return `${year}-${month}-${day}`;
    }

    // Intenta parsear como objeto Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return '';
  }

  /**
   * Convierte una fecha del formato de input al formato de almacenamiento
   * @param dateString Fecha en formato YYYY-MM-DD
   * @returns Fecha en formato DD-MM-YYYY
   */
  convertToStorageFormat(dateString: string): string {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}-${month}-${year}`;
    }
    return dateString;
  }
}
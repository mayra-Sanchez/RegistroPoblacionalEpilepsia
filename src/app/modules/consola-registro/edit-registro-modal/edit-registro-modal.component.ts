import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConsolaRegistroService } from '../services/consola-registro.service';
import { Register, Variable } from '../interfaces';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

/**
 * Componente modal para editar registros de pacientes.
 * Permite la edición de información básica del paciente, variables de investigación,
 * información del cuidador y profesional de la salud.
 */
@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent {
  /** Registro a editar, recibido como input desde el componente padre */
  @Input() registro: Register | null = null;
  
  /** Función para cerrar el modal, proporcionada por el componente padre */
  @Input() closeModal!: () => void;
  
  /** EventEmitter para notificar cuando se ha actualizado un registro */
  @Output() registroActualizado = new EventEmitter<Register>();
  
  /** EventEmitter para notificar cuando se guardan los cambios */
  @Output() saveChanges = new EventEmitter<Register>();

  // Estados del componente
  isLoading = false;              // Indica si se está realizando una operación asíncrona
  errorMessage: string | null = null;    // Mensaje de error a mostrar
  successMessage: string | null = null;  // Mensaje de éxito a mostrar
  activeTab: string = 'paciente'; // Pestaña activa en la interfaz

  // Opciones para los selectores del formulario
  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];

  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio alto' },
    { value: 'alto', label: 'Alto' }
  ];

  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Posgrado' }
  ];

  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
    { value: 'union_libre', label: 'Unión libre' }
  ];

  estadosCrisis = ['Activa', 'Remisión', 'Estable', 'Crítica', 'Recuperado'];

  constructor(private registroService: ConsolaRegistroService) {}

  /**
   * Cambia la pestaña activa en la interfaz
   * @param tab - Nombre de la pestaña a activar ('paciente', 'variables', etc.)
   */
  changeTab(tab: string) {
    this.activeTab = tab;
  }

  /**
   * Maneja el envío del formulario de edición
   * Valida los datos, prepara el payload y realiza la llamada al servicio
   */
  onSubmit() {
    if (!this.registro || !this.registro.registerId) {
      this.showErrorAlert('Datos del registro no válidos');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Calcula la edad si hay fecha de nacimiento
    if (this.registro.patientBasicInfo?.birthDate) {
      this.registro.patientBasicInfo.age = this.calculateAge(this.registro.patientBasicInfo.birthDate);
    }

    // Prepara y limpia los datos para el envío
    const updateData = this.removeEmptyFields(this.prepareUpdateData());
    console.log('Enviando payload:', JSON.stringify(updateData, null, 2));

    // Llama al servicio para actualizar el registro
    this.registroService.actualizarRegistro(this.registro.registerId, updateData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.showSuccessAlert('Registro actualizado correctamente');
          this.registroActualizado.emit(response);
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          console.error('Error completo:', err);
          console.error('Detalles del error:', err.error);
          const errorMsg = this.getErrorMessage(err);
          this.showErrorAlert(errorMsg);
        }
      });
  }

  /**
   * Muestra una alerta de éxito con SweetAlert
   * @param message - Mensaje a mostrar
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
   * Muestra una alerta de error con SweetAlert
   * @param message - Mensaje a mostrar
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
   * Genera un mensaje de error legible a partir del objeto de error
   * @param err - Objeto de error recibido
   * @returns Mensaje de error formateado
   */
  private getErrorMessage(err: any): string {
    if (err.error?.errors) {
      return Object.values(err.error.errors).join(', ');
    }
    if (err.error?.message) {
      return err.error.message;
    }
    if (err.message) {
      return err.message;
    }
    return 'Error desconocido al actualizar el registro';
  }

  /**
   * Prepara los datos para la actualización, estructurándolos según lo esperado por el API
   * @returns Objeto con los datos preparados para el envío
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
        birthdate: this.formatDateForAPI(this.registro.patientBasicInfo?.birthDate),
        age: this.registro.patientBasicInfo?.age || 0,
        email: this.registro.patientBasicInfo?.email || '',
        phoneNumber: this.registro.patientBasicInfo?.phoneNumber || '',
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
        name: this.registro.caregiver.name || null,
        identificationType: this.registro.caregiver.identificationType || null,
        identificationNumber: this.registro.caregiver.identificationNumber || null,
        age: this.registro.caregiver.age || null,
        educationLevel: this.registro.caregiver.educationLevel || null,
        occupation: this.registro.caregiver.occupation || null
      };
    }
  
    // Incluye datos del profesional de la salud si existen
    if (this.registro.healthProfessional) {
      payload.healthProfessional = {
        id: this.registro.healthProfessional.id || null,
        name: this.registro.healthProfessional.name || null,
        identificationNumber: this.registro.healthProfessional.identificationNumber || null
      };
    }
  
    return this.cleanPayload(payload);
  }

  /**
   * Verifica si hay datos válidos del cuidador
   * @param caregiver - Objeto con los datos del cuidador
   * @returns true si hay al menos un campo con datos válidos
   */
  private hasCaregiverData(caregiver: any): boolean {
    if (!caregiver) return false;
    
    return Object.values(caregiver).some(
      (val: any) => val !== null && val !== undefined && val !== ''
    );
  }
  
  /**
   * Limpia el payload eliminando campos vacíos, nulos o undefined
   * @param obj - Objeto a limpiar
   * @returns Objeto limpio sin campos vacíos
   */
  private cleanPayload(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
  
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanPayload(item));
    }
  
    const cleaned: { [key: string]: any } = {}; // Firma de índice explícita
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
   * Prepara el array de variables para el envío al API
   * @returns Array de variables formateadas
   */
  private prepareVariablesArray(): any[] {
    if (!this.registro?.variablesRegister) return [];

    return this.registro.variablesRegister.map(v => ({
      id: v.variableId || '',
      value: this.parseVariableValue(v.value, v.type),
      type: v.type || 'string',
      researchLayerId: v.researchLayerId || ''
    }));
  }

  /**
   * Parsea el valor de una variable según su tipo
   * @param value - Valor a parsear
   * @param type - Tipo de la variable (number, boolean, string)
   * @returns Valor parseado al tipo correspondiente
   */
  private parseVariableValue(value: any, type: string): any {
    if (value === null || value === undefined) return '';
    if (type === 'number') return Number(value) || 0;
    if (type === 'boolean') return Boolean(value);
    return String(value);
  }

  /**
   * Elimina campos vacíos, nulos o undefined de un objeto
   * @param obj - Objeto a limpiar
   * @returns Objeto sin campos vacíos
   */
  private removeEmptyFields(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyFields(item));
    }

    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => [k, typeof v === 'object' ? this.removeEmptyFields(v) : v])
    );
  }

  /**
   * Formatea una fecha para el API (formato DD-MM-YYYY)
   * @param dateValue - Fecha a formatear (puede ser string o Date)
   * @returns Fecha formateada o null si no es válida
   */
  private formatDateForAPI(dateValue: any): string | null {
    if (!dateValue) return null;
  
    if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      return dateValue;
    }
  
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateValue);
      return null;
    }
  
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
  }

  /**
   * Calcula la edad a partir de una fecha de nacimiento
   * @param birthDate - Fecha de nacimiento
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
   * Actualiza el valor de una variable en el registro
   * @param variable - Variable a actualizar
   * @param event - Evento del input con el nuevo valor
   */
  updateVariableValue(variable: Variable, event: any) {
    if (!this.registro) return;
    const index = this.registro.variablesRegister.findIndex(v => v.id === variable.id);
    if (index !== -1) {
      this.registro.variablesRegister[index].value = event.target.value;
    }
  }
}
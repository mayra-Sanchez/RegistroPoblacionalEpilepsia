import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConsolaRegistroService } from 'src/app/services/consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import { Register, Variable } from '../interfaces';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent {
  @Input() registro: Register | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() registroActualizado = new EventEmitter<Register>();
  @Output() saveChanges = new EventEmitter<Register>();

  // Estados del componente
  isLoading = false;
  isUpdating = false;
  formSubmitted = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  activeTab: string = 'paciente';

  // Opciones para selectores
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

  constructor(
    private registroService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  closeModal() {
    this.close.emit();
  }

  onSave() {
    if (this.registro) {
      this.saveChanges.emit(this.registro);
    }
  }

  changeTab(tab: string) {
    this.activeTab = tab;
  }

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

    // Calcular edad si hay fecha de nacimiento
    if (this.registro.patientBasicInfo?.birthDate) {
      this.registro.patientBasicInfo.age = this.calculateAge(this.registro.patientBasicInfo.birthDate);
    }

    // Prepara los datos para el envío
    const updateData = this.prepareUpdateData();

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
        error: (err) => {
          console.error('Error completo:', err);
          let errorMsg = 'Error al actualizar el registro';

          if (err.message?.includes('Sesión expirada')) {
            errorMsg = err.message;
            // Forzar logout después de mostrar el mensaje
            setTimeout(() => this.authService.logout(), 3000);
          } else if (err.error) {
            errorMsg = err.error.message || JSON.stringify(err.error);
          } else {
            errorMsg = err.message || errorMsg;
          }

          this.showErrorAlert(errorMsg);
        }
      });
  }


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

  private showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }


private prepareUpdateData(): any {
  if (!this.registro) return null;

  return {
    variables: this.registro.variablesRegister?.map(v => ({
      id: v.variableId,
      variableName: v.variableName,
      value: v.value,
      type: v.type,
      researchLayerId: v.researchLayerId,
      researchLayerName: v.researchLayerName
    })) || [],
    patientIdentificationNumber: this.registro.patientIdentificationNumber,
    patientIdentificationType: this.registro.patientIdentificationType,
    patient: {
      name: this.registro.patientBasicInfo?.name,
      sex: this.registro.patientBasicInfo?.sex,
      birthDate: this.formatDateForAPI(this.registro.patientBasicInfo?.birthDate),
      age: this.registro.patientBasicInfo?.age,
      email: this.registro.patientBasicInfo?.email,
      phoneNumber: this.registro.patientBasicInfo?.phoneNumber,
      deathDate: this.formatDateForAPI(this.registro.patientBasicInfo?.deathDate),
      economicStatus: this.registro.patientBasicInfo?.economicStatus,
      educationLevel: this.registro.patientBasicInfo?.educationLevel,
      maritalStatus: this.registro.patientBasicInfo?.maritalStatus,
      hometown: this.registro.patientBasicInfo?.hometown,
      currentCity: this.registro.patientBasicInfo?.currentCity,
      firstCrisisDate: this.formatDateForAPI(this.registro.patientBasicInfo?.firstCrisisDate),
      crisisStatus: this.registro.patientBasicInfo?.crisisStatus
    },
    ...(this.registro.caregiver && {
      caregiver: {
        name: this.registro.caregiver.name,
        identificationType: this.registro.caregiver.identificationType,
        identificationNumber: this.registro.caregiver.identificationNumber,
        age: this.registro.caregiver.age,
        educationLevel: this.registro.caregiver.educationLevel,
        occupation: this.registro.caregiver.occupation
      }
    }),
    ...(this.registro.healthProfessional && {
      healthProfessional: {
        id: this.registro.healthProfessional.id,
        name: this.registro.healthProfessional.name,
        identificationNumber: this.registro.healthProfessional.identificationNumber
      }
    })
  };
}


  private hasCaregiverData(caregiver: any): boolean {
    if (!caregiver) return false;
    return Object.values(caregiver).some(
      (val: any) => val !== null && val !== undefined && val !== ''
    );
  }

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

  private prepareVariablesArray(): any[] {
    if (!this.registro?.variablesRegister) return [];

    return this.registro.variablesRegister.map(v => ({
      id: v.variableId || '',
      value: this.parseVariableValue(v.value, v.type),
      type: v.type || 'string',
      researchLayerId: v.researchLayerId || ''
    }));
  }

  private parseVariableValue(value: any, type: string): any {
    if (value === null || value === undefined) return '';

    if (type === 'date') {
      // Si ya es string, lo dejamos así
      if (typeof value === 'string') return value;

      // Si es un Date válido
      if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split('T')[0]; // formato YYYY-MM-DD
      }

      return '';
    }

    if (type === 'number') return Number(value) || 0;
    if (type === 'boolean') return Boolean(value);

    return String(value);
  }


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

  private formatDateForAPI(dateValue: any): string | null {
    if (!dateValue) return null;

    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      const [day, month, year] = dateValue.split('-');
      return `${year}-${month}-${day}`;
    }

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

  updateVariableValue(variable: Variable, event: any) {
    if (!this.registro) return;

    const index = this.registro.variablesRegister.findIndex(v => v.id === variable.id);
    if (index !== -1) {
      let newValue = event.target.value;

      if (variable.type === 'number') {
        newValue = Number(newValue) || 0;
      } else if (variable.type === 'boolean') {
        newValue = Boolean(newValue);
      }

      this.registro.variablesRegister[index].value = newValue;
    }
  }

  prepareDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    const [day, month, year] = dateString.split('-');
    if (day && month && year) {
      return `${year}-${month}-${day}`;
    }

    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return '';
  }

  convertToStorageFormat(dateString: string): string {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}-${month}-${year}`;
    }
    return dateString;
  }

  parseDateIfNeeded(value: any, variableName: string): Date | string {
    if (!value) return 'No especificado';

    const nombreNormalizado = variableName.toLowerCase();
    const esFecha = nombreNormalizado.includes('fecha');

    if (esFecha && typeof value === 'string') {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }

    return value;
  }

  formatDate(value: any): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    // Devuelve en formato 'yyyy-MM-dd'
    return date.toISOString().split('T')[0];
  }

}
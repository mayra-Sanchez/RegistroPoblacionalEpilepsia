import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConsolaRegistroService } from '../services/consola-registro.service';
import { Register, Variable } from '../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent {
  @Input() registro: Register | null = null;
  @Input() closeModal!: () => void;
  @Output() registroActualizado = new EventEmitter<Register>();
  @Output() saveChanges = new EventEmitter<Register>();

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  activeTab: string = 'paciente';

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

  changeTab(tab: string) {
    this.activeTab = tab;
  }

  onSubmit() {
    if (!this.registro || !this.registro.registerId) {
      this.errorMessage = 'Datos del registro no válidos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.registro.patientBasicInfo?.birthDate) {
      this.registro.patientBasicInfo.age = this.calculateAge(this.registro.patientBasicInfo.birthDate);
    }

    const updateData = this.removeEmptyFields(this.prepareUpdateData());
    console.log('Enviando payload:', JSON.stringify(updateData, null, 2));

    this.registroService.actualizarRegistro(this.registro.registerId, updateData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Registro actualizado correctamente';
          this.registroActualizado.emit(response);
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          console.error('Error completo:', err);
          console.error('Detalles del error:', err.error);
          this.errorMessage = this.getErrorMessage(err);
        }
      });
  }

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
  
    // Manejo especial para caregiver - SOLO si existe y tiene datos
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
  
    // HealthProfessional es opcional
    if (this.registro.healthProfessional) {
      payload.healthProfessional = {
        id: this.registro.healthProfessional.id || null,
        name: this.registro.healthProfessional.name || null,
        identificationNumber: this.registro.healthProfessional.identificationNumber || null
      };
    }
  
    return this.cleanPayload(payload);
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
  
    // Si ya está en formato DD-MM-YYYY
    if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      return dateValue;
    }
  
    // Para objetos Date o strings en otros formatos
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateValue);
      return null;
    }
  
    // Formatea a DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
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
      this.registro.variablesRegister[index].value = event.target.value;
    }
  }
}
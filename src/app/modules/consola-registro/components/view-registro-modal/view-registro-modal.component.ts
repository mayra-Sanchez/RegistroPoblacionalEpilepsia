import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

/**
 * Interfaz para la información de variables del registro
 */
interface VariableInfo {
  variableId: string;
  variableName: string;
  variableType: string;
  valueAsString: string | null;
  valueAsNumber: number | null;
}

/**
 * Interfaz para la información del registro
 */
interface RegisterInfo {
  researchLayerId: string;
  researchLayerName: string;
  variablesInfo: VariableInfo[];
}

/**
 * Interfaz para la información básica del paciente
 */
interface PatientBasicInfo {
  name: string;
  sex: string;
  birthDate: string | null;
  age: number;
  email: string;
  phoneNumber: string;
  deathDate: string | null;
  economicStatus: string;
  educationLevel: string;
  maritalStatus: string;
  hometown: string;
  currentCity: string;
  firstCrisisDate: string;
  crisisStatus: string;
}

/**
 * Interfaz para la información del cuidador
 */
interface Caregiver {
  name: string;
  identificationType: string;
  identificationNumber: number;
  age: number;
  educationLevel: string;
  occupation: string;
}

/**
 * Interfaz principal para el registro completo
 */
interface Register {
  registerId?: string;
  patientIdentificationNumber?: number;
  patientIdentificationType?: string;
  registerInfo?: RegisterInfo[];
  patientBasicInfo?: PatientBasicInfo;
  caregiver?: Caregiver;
}

/**
 * Componente modal para visualizar registros de pacientes
 * Muestra información básica, variables de investigación y consentimiento informado
 */
@Component({
  selector: 'app-view-registro-modal',
  templateUrl: './view-registro-modal.component.html',
  styleUrls: ['./view-registro-modal.component.css']
})
export class ViewRegistroModalComponent {
  /** Registro actual que se está visualizando */
  registro: Register;
  
  /** Pestaña activa actualmente */
  activeTab: string = 'basic';
  
  /** Indica si existe consentimiento para este paciente */
  hasConsentimiento: boolean = false;
  
  /** Estado de carga del consentimiento */
  loadingConsentimiento: boolean = false;
  
  /** URL temporal para visualizar el consentimiento */
  consentimientoUrl: string | null = null;

  /**
   * Constructor del componente modal
   * @param dialogRef Referencia al diálogo de Material
   * @param data Datos inyectados que contienen el registro a visualizar
   * @param signatureUploadService Servicio para manejar la subida y descarga de consentimientos
   */
  constructor(
    public dialogRef: MatDialogRef<ViewRegistroModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { registro: Register },
    private signatureUploadService: SignatureUploadService
  ) {
    this.registro = data.registro || {};
    console.log('Datos recibidos en el modal:', this.registro);
    
    // Verificar si hay consentimiento al inicializar el modal
    this.checkConsentimiento();
  }

  /**
   * Cierra el modal
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Cambia la pestaña activa
   * @param tab Identificador de la pestaña a activar
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Si se activa la pestaña de consentimiento, verificar si hay documento
    if (tab === 'consentimiento') {
      this.checkConsentimiento();
    }
  }

  /**
   * Verifica si una pestaña está activa
   * @param tab Identificador de la pestaña a verificar
   * @returns boolean indicando si la pestaña está activa
   */
  isTabActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  /**
   * Formatea una fecha para mostrarla de manera legible
   * @param dateValue Valor de fecha a formatear
   * @returns Cadena con la fecha formateada o mensaje de no disponible
   */
  formatDate(dateValue: string | null): string {
    if (!dateValue) return 'No disponible';
    
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString('es-ES');
    } catch (e) {
      return 'No disponible';
    }
  }

  /**
   * Formatea el valor de una variable para mostrarlo
   * @param variable Información de la variable a formatear
   * @returns Valor formateado de la variable
   */
  formatVariableValue(variable: VariableInfo): string {
    if (!variable) return 'No definido';
    
    if (variable.valueAsNumber !== null && variable.valueAsNumber !== undefined) {
      return variable.valueAsNumber.toString();
    }
    if (variable.valueAsString !== null && variable.valueAsString !== undefined) {
      return variable.valueAsString;
    }
    return 'No definido';
  }

  /**
   * Verifica si el registro tiene información de cuidador
   * @returns boolean indicando si existe información de cuidador
   */
  hasCaregiver(): boolean {
    return !!this.registro.caregiver && Object.keys(this.registro.caregiver).length > 0;
  }

  /**
   * Obtiene la información principal del registro
   * @returns Información principal del registro o null si no existe
   */
  getMainRegisterInfo(): RegisterInfo | null {
    return this.registro.registerInfo && this.registro.registerInfo.length > 0 
      ? this.registro.registerInfo[0] 
      : null;
  }

  /**
   * Obtiene las variables de investigación del registro
   * @returns Array con las variables de investigación
   */
  getVariables(): VariableInfo[] {
    const mainInfo = this.getMainRegisterInfo();
    return mainInfo?.variablesInfo || [];
  }

  /**
   * Método seguro para obtener valores que pueden ser nulos o indefinidos
   * @param value Valor a verificar
   * @param defaultValue Valor por defecto si el valor es nulo o indefinido
   * @returns El valor original o el valor por defecto
   */
  getSafeValue(value: any, defaultValue: string = 'No disponible'): any {
    return value !== null && value !== undefined ? value : defaultValue;
  }

  /**
   * Verifica si existe consentimiento para este paciente
   */
  checkConsentimiento(): void {
    const patientId = this.registro.patientIdentificationNumber;
    if (!patientId) {
      this.hasConsentimiento = false;
      return;
    }

    this.loadingConsentimiento = true;
    
    this.signatureUploadService.downloadConsentFile(patientId).subscribe({
      next: (blob) => {
        // Si obtenemos un blob, significa que hay consentimiento
        if (blob && blob.size > 0) {
          this.hasConsentimiento = true;
          // Crear URL para visualización
          this.consentimientoUrl = URL.createObjectURL(blob);
        } else {
          this.hasConsentimiento = false;
        }
        this.loadingConsentimiento = false;
      },
      error: (error) => {
        console.error('Error al verificar consentimiento:', error);
        this.hasConsentimiento = false;
        this.loadingConsentimiento = false;
      }
    });
  }

  /**
   * Descarga el consentimiento informado del paciente
   */
  downloadConsentimiento(): void {
    const patientId = this.registro.patientIdentificationNumber;
    if (!patientId || !this.consentimientoUrl) return;

    this.loadingConsentimiento = true;
    
    this.signatureUploadService.downloadConsentFile(patientId).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          // Usar file-saver para descargar el archivo
          const patientName = this.registro.patientBasicInfo?.name || 'paciente';
          const fileName = `consentimiento_${patientName.replace(/\s+/g, '_')}.pdf`;
          
          saveAs(blob, fileName);
        } else {
          Swal.fire('Error', 'No se pudo descargar el consentimiento', 'error');
        }
        this.loadingConsentimiento = false;
      },
      error: (error) => {
        console.error('Error al descargar consentimiento:', error);
        Swal.fire('Error', 'No se pudo descargar el consentimiento', 'error');
        this.loadingConsentimiento = false;
      }
    });
  }

  /**
   * Abre el consentimiento en una nueva pestaña del navegador
   */
  viewConsentimiento(): void {
    if (this.consentimientoUrl) {
      window.open(this.consentimientoUrl, '_blank');
    }
  }
}
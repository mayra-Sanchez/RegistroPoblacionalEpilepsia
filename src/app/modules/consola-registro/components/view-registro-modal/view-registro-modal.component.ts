import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

/**
 * Interfaz para datos del historial (lo que realmente estás recibiendo)
 */
interface HistorialData {
  id: string;
  registerId: string;
  changedAt: string;
  changedBy: string;
  operation: string;
  patientIdentificationNumber: number;
  isResearchLayerGroup?: {
    researchLayerId: string;
    researchLayerName: string;
    variables: any[];
  };
  // Datos adicionales que podrían venir del registro completo
  patientBasicInfo?: any;
  caregiver?: any;
  registerInfo?: any[];
}

/**
 * Componente modal para visualizar registros de pacientes
 * Ahora maneja tanto registros completos como datos del historial
 */
@Component({
  selector: 'app-view-registro-modal',
  templateUrl: './view-registro-modal.component.html',
  styleUrls: ['./view-registro-modal.component.css']
})
export class ViewRegistroModalComponent {
  /** Datos que se están visualizando (pueden ser del historial o registro completo) */
  datos: any;

  /** Tipo de datos para saber cómo procesarlos */
  tipoDatos: 'historial' | 'registro-completo';

  /** Pestaña activa actualmente */
  activeTab: string = 'basic';

  /** Indica si existe consentimiento para este paciente */
  hasConsentimiento: boolean = false;

  /** Estado de carga del consentimiento */
  loadingConsentimiento: boolean = false;

  /** URL temporal para visualizar el consentimiento */
  consentimientoUrl: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ViewRegistroModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { registro: any }, // Cambiado a any para flexibilidad
    private signatureUploadService: SignatureUploadService
  ) {
    this.datos = data.registro || {};
    console.log('Datos recibidos en el modal:', this.datos);

    // Determinar el tipo de datos
    this.tipoDatos = this.determinarTipoDatos();

    // Verificar si hay consentimiento al inicializar el modal
    this.checkConsentimiento();
  }

  /**
   * Determina si los datos son del historial o registro completo
   */
  private determinarTipoDatos(): 'historial' | 'registro-completo' {
    // Si tiene changedAt y operation, es del historial
    if (this.datos.changedAt && this.datos.operation) {
      return 'historial';
    }
    // Si tiene patientBasicInfo completo, es registro completo
    if (this.datos.patientBasicInfo && this.datos.patientIdentificationNumber) {
      return 'registro-completo';
    }
    return 'historial'; // Por defecto
  }

  /**
   * Obtiene el número de identificación del paciente (común a ambos tipos)
   */
  getPatientId(): number | null {
    return this.datos.patientIdentificationNumber || null;
  }

  /**
   * Obtiene la información básica del paciente (adaptado para ambos tipos)
   */
  getPatientBasicInfo(): any {
    if (this.tipoDatos === 'registro-completo') {
      return this.datos.patientBasicInfo || {};
    } else {
      // Para historial, intentar obtener de _fullData o devolver objeto vacío
      return this.datos.patientBasicInfo || this.datos._fullData?.patientBasicInfo || {};
    }
  }

  /**
   * Obtiene las variables de investigación (adaptado para ambos tipos)
   */
  getVariables(): any[] {
    if (this.tipoDatos === 'registro-completo') {
      const mainInfo = this.datos.registerInfo && this.datos.registerInfo.length > 0
        ? this.datos.registerInfo[0]
        : null;
      return mainInfo?.variablesInfo || [];
    } else {
      // Para historial
      return this.datos.isResearchLayerGroup?.variables ||
        this.datos.variables ||
        this.datos._fullData?.isResearchLayerGroup?.variables || [];
    }
  }

  /**
   * Obtiene la información de la capa de investigación
   */
  getLayerInfo(): any {
    if (this.tipoDatos === 'registro-completo') {
      const mainInfo = this.datos.registerInfo && this.datos.registerInfo.length > 0
        ? this.datos.registerInfo[0]
        : null;
      return {
        researchLayerId: mainInfo?.researchLayerId,
        researchLayerName: mainInfo?.researchLayerName
      };
    } else {
      return {
        researchLayerId: this.datos.isResearchLayerGroup?.researchLayerId,
        researchLayerName: this.datos.isResearchLayerGroup?.researchLayerName
      };
    }
  }

  /**
   * Obtiene la información del cuidador
   */
  getCaregiver(): any {
    return this.datos.caregiver || this.datos._fullData?.caregiver || null;
  }

  // Los demás métodos se mantienen igual pero usan los getters anteriores
  onClose(): void {
    this.dialogRef.close();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'consentimiento') {
      this.checkConsentimiento();
    }
  }

  isTabActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  formatDate(dateValue: string | null): string {
    if (!dateValue) return 'No disponible';
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString('es-ES');
    } catch (e) {
      return 'No disponible';
    }
  }

  formatVariableValue(variable: any): string {
    if (!variable) return 'No definido';

    if (variable.valueAsNumber !== null && variable.valueAsNumber !== undefined) {
      return variable.valueAsNumber.toString();
    }
    if (variable.valueAsString !== null && variable.valueAsString !== undefined) {
      return variable.valueAsString;
    }
    if (variable.value !== null && variable.value !== undefined) {
      return variable.value.toString();
    }
    return 'No definido';
  }

  hasCaregiver(): boolean {
    const caregiver = this.getCaregiver();
    return !!caregiver && Object.keys(caregiver).length > 0;
  }

  getSafeValue(value: any, defaultValue: string = 'No disponible'): any {
    return value !== null && value !== undefined ? value : defaultValue;
  }

  /**
   * Verifica si existe consentimiento para este paciente
   */
  checkConsentimiento(): void {
    const patientId = this.getPatientId();
    if (!patientId) {
      this.hasConsentimiento = false;
      return;
    }

    this.loadingConsentimiento = true;

    this.signatureUploadService.downloadConsentFile(patientId).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          this.hasConsentimiento = true;
          this.consentimientoUrl = URL.createObjectURL(blob);
        } else {
          this.hasConsentimiento = false;
          this.consentimientoUrl = null;
        }
        this.loadingConsentimiento = false;
      },
      error: (error) => {
        console.error('Error al verificar consentimiento:', error);

        // Manejar específicamente el error 404 (archivo no encontrado)
        if (error.status === 404) {
          this.hasConsentimiento = false;
          this.consentimientoUrl = null;
          console.log(`No se encontró consentimiento para el paciente ${patientId}`);
        } else {
          // Para otros errores, podrías mostrar un mensaje al usuario
          console.error('Error inesperado al verificar consentimiento:', error);
        }

        this.loadingConsentimiento = false;
      }
    });
  }

  downloadConsentimiento(): void {
    const patientId = this.getPatientId();
    if (!patientId || !this.consentimientoUrl) return;

    this.loadingConsentimiento = true;

    this.signatureUploadService.downloadConsentFile(patientId).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          const patientInfo = this.getPatientBasicInfo();
          const patientName = patientInfo?.name || 'paciente';
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

  viewConsentimiento(): void {
    if (this.consentimientoUrl) {
      window.open(this.consentimientoUrl, '_blank');
    }
  }

  /**
   * Método para obtener el nombre de la variable (compatible con ambos formatos)
   */
  getVariableName(variable: any): string {
    return variable.variableName || variable.name || 'Variable sin nombre';
  }

  /**
   * Método para obtener el tipo de variable (compatible con ambos formatos)
   */
  getVariableType(variable: any): string {
    return variable.variableType || variable.type || 'Tipo no especificado';
  }

  /**
 * Verifica si el objeto de información básica del paciente está vacío
 */
  isPatientBasicInfoEmpty(): boolean {
    const basicInfo = this.getPatientBasicInfo();
    return !basicInfo || Object.keys(basicInfo).length === 0;
  }
}
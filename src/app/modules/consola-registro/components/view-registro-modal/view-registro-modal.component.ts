import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

/**
 * Componente modal para visualizar registros de pacientes
 * 
 * Este componente maneja la visualización de:
 * - Registros completos de pacientes
 * - Datos del historial de cambios
 * - Información de consentimientos
 * - Variables de investigación
 * 
 * @example
 * // Abrir modal desde otro componente
 * const dialogRef = this.dialog.open(ViewRegistroModalComponent, {
 *   data: { registro: patientRecord }
 * });
 */
@Component({
  selector: 'app-view-registro-modal',
  templateUrl: './view-registro-modal.component.html',
  styleUrls: ['./view-registro-modal.component.css']
})
export class ViewRegistroModalComponent {

  // ============================
  // PROPIEDADES DEL COMPONENTE
  // ============================

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

  // ============================
  // CONSTRUCTOR
  // ============================

  /**
   * Constructor del componente modal
   * @param dialogRef Referencia al modal dialog
   * @param data Datos inyectados que contienen el registro
   * @param signatureUploadService Servicio para manejo de consentimientos
   */
  constructor(
    public dialogRef: MatDialogRef<ViewRegistroModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { registro: any },
    private signatureUploadService: SignatureUploadService
  ) {
    this.datos = data.registro || {};
    this.tipoDatos = this.determinarTipoDatos();

    this.checkConsentimiento();
  }

  // ============================
  // MÉTODOS DE INICIALIZACIÓN
  // ============================

  /**
   * Determina si los datos son del historial o registro completo
   * @returns Tipo de datos identificado
   */
  private determinarTipoDatos(): 'historial' | 'registro-completo' {
    if (this.datos.changedAt && this.datos.operation) {
      return 'historial';
    }
    if (this.datos.patientBasicInfo && this.datos.patientIdentificationNumber) {
      return 'registro-completo';
    }
    return 'historial'; // Por defecto
  }

  // ============================
  // MÉTODOS DE OBTENCIÓN DE DATOS
  // ============================

  /**
   * Obtiene el número de identificación del paciente (común a ambos tipos)
   * @returns Número de identificación o null si no está disponible
   */
  getPatientId(): number | null {
    return this.datos.patientIdentificationNumber || null;
  }

  /**
   * Obtiene la información básica del paciente (adaptado para ambos tipos)
   * @returns Objeto con información básica del paciente
   */
  getPatientBasicInfo(): any {
    if (this.tipoDatos === 'registro-completo') {
      return this.datos.patientBasicInfo || {};
    } else {
      return this.datos.patientBasicInfo || this.datos._fullData?.patientBasicInfo || {};
    }
  }

  /**
   * Obtiene las variables de investigación (adaptado para ambos tipos)
   * @returns Array de variables de investigación
   */
  getVariables(): any[] {
    if (this.tipoDatos === 'registro-completo') {
      const mainInfo = this.datos.registerInfo && this.datos.registerInfo.length > 0
        ? this.datos.registerInfo[0]
        : null;
      return mainInfo?.variablesInfo || [];
    } else {
      return this.datos.isResearchLayerGroup?.variables ||
        this.datos.variables ||
        this.datos._fullData?.isResearchLayerGroup?.variables || [];
    }
  }

  /**
   * Obtiene la información de la capa de investigación
   * @returns Objeto con información de la capa
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
   * @returns Objeto con información del cuidador o null si no existe
   */
  getCaregiver(): any {
    return this.datos.caregiver || this.datos._fullData?.caregiver || null;
  }

  /**
   * Obtiene el nombre de la variable (compatible con ambos formatos)
   * @param variable Variable a obtener nombre
   * @returns Nombre de la variable
   */
  getVariableName(variable: any): string {
    return variable.variableName || variable.name || 'Variable sin nombre';
  }

  /**
   * Obtiene el tipo de variable (compatible con ambos formatos)
   * @param variable Variable a obtener tipo
   * @returns Tipo de variable
   */
  getVariableType(variable: any): string {
    return variable.variableType || variable.type || 'Tipo no especificado';
  }

  // ============================
  // MÉTODOS DE NAVEGACIÓN Y UI
  // ============================

  /**
   * Cierra el modal
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Establece la pestaña activa
   * @param tab Identificador de la pestaña a activar
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'consentimiento') {
      this.checkConsentimiento();
    }
  }

  /**
   * Verifica si una pestaña está activa
   * @param tab Identificador de la pestaña a verificar
   * @returns true si la pestaña está activa
   */
  isTabActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  // ============================
  // MÉTODOS DE FORMATEO DE DATOS
  // ============================

  /**
   * Formatea una fecha para mostrar en la interfaz
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada o mensaje de no disponible
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
   * Formatea el valor de una variable para mostrar
   * @param variable Variable a formatear
   * @returns Valor formateado de la variable
   */
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

  /**
   * Obtiene un valor seguro, evitando valores nulos o undefined
   * @param value Valor a verificar
   * @param defaultValue Valor por defecto (opcional)
   * @returns Valor seguro o valor por defecto
   */
  getSafeValue(value: any, defaultValue: string = 'No disponible'): any {
    return value !== null && value !== undefined ? value : defaultValue;
  }

  // ============================
  // MÉTODOS DE VALIDACIÓN
  // ============================

  /**
   * Verifica si existe información de cuidador
   * @returns true si existe información de cuidador
   */
  hasCaregiverData(): boolean {
    const caregiver = this.getCaregiver();
    return !!caregiver && Object.keys(caregiver).length > 0;
  }

  /**
   * Verifica si el objeto de información básica del paciente está vacío
   * @returns true si la información básica está vacía
   */
  isPatientBasicInfoEmpty(): boolean {
    const basicInfo = this.getPatientBasicInfo();
    return !basicInfo || Object.keys(basicInfo).length === 0;
  }

  // ============================
  // MÉTODOS DE GESTIÓN DE CONSENTIMIENTOS
  // ============================

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

        if (error.status === 404) {
          this.hasConsentimiento = false;
          this.consentimientoUrl = null;
        } else {
          console.error('Error inesperado al verificar consentimiento:', error);
        }

        this.loadingConsentimiento = false;
      }
    });
  }

  /**
   * Descarga el consentimiento del paciente
   */
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
        Swal.fire('Error', 'No se pudo descargar el consentimiento', 'error');
        this.loadingConsentimiento = false;
      }
    });
  }

  /**
   * Abre el consentimiento en una nueva pestaña
   */
  viewConsentimiento(): void {
    if (this.consentimientoUrl) {
      window.open(this.consentimientoUrl, '_blank');
    }
  }

  /**
   * Verifica si tiene cuidador o no
   */
  hasCaregiver(): boolean {
    const caregiver = this.getCaregiver();
    return !!caregiver && Object.keys(caregiver).length > 0;
  }
}
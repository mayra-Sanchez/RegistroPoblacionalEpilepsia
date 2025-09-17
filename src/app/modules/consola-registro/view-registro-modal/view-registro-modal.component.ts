import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Register, VariableInfoResponse } from '../interfaces';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
/**
 * Componente modal para visualización detallada de registros de pacientes
 * 
 * Este componente muestra todos los datos de un registro médico en un formato organizado,
 * convirtiendo códigos internos a etiquetas legibles y formateando adecuadamente los datos.
 * Además, permite visualizar y subir documentos de consentimiento firmados.
 * 
 * @example
 * <app-view-registro-modal 
 *   [registro]="registroSeleccionado"
 *   (close)="handleCloseModal()">
 * </app-view-registro-modal>
 */
@Component({
  selector: 'app-view-registro-modal',
  templateUrl: './view-registro-modal.component.html',
  styleUrls: ['./view-registro-modal.component.css'],
  providers: [DatePipe]  // Provee DatePipe para formateo de fechas
})
export class ViewRegistroModalComponent {
  //#region Inputs y Outputs

  /**
   * Registro médico a visualizar. Recibe todos los datos del paciente y su historial.
   * @type {Register | null}
   */
  @Input() registro: Register | null = null;

  /**
   * Evento emitido cuando el usuario solicita cerrar el modal
   * @type {EventEmitter<void>}
   */
  @Output() close = new EventEmitter<void>();

  /**
   * URL no segura del documento (para limpieza de memoria)
   * @private
   */
  private unsafeDocumentUrl: string | null = null;

  //#endregion

  //#region Opciones para selectores

  /**
   * Opciones para tipos de identificación con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];

  /**
   * Opciones para género con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  /**
   * Opciones para estado económico con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio alto' },
    { value: 'alto', label: 'Alto' }
  ];

  /**
   * Opciones para nivel educativo con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Posgrado' }
  ];

  /**
   * Opciones para estado civil con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
    { value: 'union_libre', label: 'Unión libre' }
  ];

  /**
   * Indica si se debe mostrar el visor de documentos
   * @type {boolean}
   */
  showDocument: boolean = false;

  /**
   * URL segura del documento para visualización
   * @type {SafeResourceUrl | null}
   */
  documentUrl: SafeResourceUrl | null = null;

  /**
   * Indica si se está cargando un documento
   * @type {boolean}
   */
  isLoadingDocument: boolean = false;

  /**
   * Mensaje de error al cargar documento
   * @type {string | null}
   */
  documentError: string | null = null;

  /**
   * Tipo de documento detectado (pdf, image, unknown)
   * @type {string}
   */
  documentType: string = '';

  /**
   * Indica si se debe mostrar el modal de subida
   * @type {boolean}
   */
  showUploadModal: boolean = false;

  /**
   * Archivo seleccionado para subir
   * @type {File | null}
   */
  selectedFile: File | null = null;

  /**
   * Indica si se está subiendo un archivo
   * @type {boolean}
   */
  isUploading: boolean = false;

  /**
   * Progreso de subida del archivo (0-100)
   * @type {number | null}
   */
  uploadProgress: number | null = null;

  /**
   * Mensaje de error al subir archivo
   * @type {string | null}
   */
  uploadError: string | null = null;
  currentLayerId: string | null = null;

  //#endregion

  //#region Constructor

  constructor(
    private datePipe: DatePipe,
    private signatureService: SignatureUploadService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const capaString = localStorage.getItem('capaInvestigacion');
    if (capaString) {
      try {
        const capa = JSON.parse(capaString);
        this.currentLayerId = capa.id;
      } catch (e) {
        console.error('Error parseando la capa del localStorage', e);
      }
    }
  }

  getLabel(options: { value: string; label: string }[], value: string | null | undefined): string {
    if (!value) return 'No especificado';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  hasCaregiverData(caregiver: any): boolean {
    if (!caregiver) return false;
    return Object.values(caregiver).some(val => val !== null && val !== undefined && val !== '');
  }

  closeModal() {
    this.close.emit();
  }

  formatVariableValue(nombre: string, valor: any, tipo?: string): string {
    if (!valor || valor === '') return 'No especificado';
    const nombreNormalizado = nombre.toLowerCase();
    const esFecha = nombreNormalizado.includes('fecha') || tipo === 'date';
    if (esFecha) {
      try {
        return this.datePipe.transform(valor, 'dd/MM/yyyy') || valor;
      } catch {
        return valor;
      }
    }
    return valor;
  }

  getCurrentLayerVariables(): Array<{ variableName: string; value: any; type: string }> {
    if (!this.currentLayerId || !this.registro) return [];

    const capaActual = this.registro.registerInfo.find(
      layer => layer.researchLayerId === this.currentLayerId
    );

    if (!capaActual || !capaActual.variablesInfo) return [];

    return capaActual.variablesInfo
      .map(v => {
        let value: any = null;

        switch (v.variableType.toLowerCase()) {
          case 'number':
            value = v.valueAsNumber;
            break;
          case 'string':
          case 'text':
          case 'date':
            value = v.valueAsString;
            break;
          default:
            value = v.valueAsString ?? v.valueAsNumber;
        }

        return {
          variableName: v.variableName,
          type: v.variableType,
          value
        };
      })
      .filter(v => v.value !== null && v.value !== undefined && v.value !== '');
  }



  /**
   * Abre el visor de documentos de consentimiento
   */
  viewConsentDocument(): void {
    const patientId = this.registro?.patientIdentificationNumber;

    if (!patientId) {
      this.documentError = 'No se pudo identificar al paciente';
      return;
    }

    const numericId = Number(patientId);
    if (isNaN(numericId)) {
      this.documentError = 'Número de documento inválido';
      return;
    }

    this.isLoadingDocument = true;
    this.documentError = null;
    this.showDocument = true;

    this.signatureService.downloadConsentFile(numericId).subscribe({
      next: (blob: Blob) => {
        this.determineDocumentType(blob);
        this.createDocumentUrl(blob);
        this.isLoadingDocument = false;
      },
      error: (err) => {
        console.error('Error al descargar el documento:', err);
        if (err.status === 404) {
          this.documentError = 'El paciente no tiene documento de consentimiento registrado';
        } else {
          this.documentError = 'Error al cargar el documento';
        }
        this.isLoadingDocument = false;
      }
    });
  }

  /**
   * Cierra el visor de documentos y limpia los recursos
   */
  closeDocumentView(): void {
    this.showDocument = false;
    this.cleanUpDocumentUrl();
  }

  /**
   * Abre el modal para subir un documento de consentimiento
   */
  openUploadModal(): void {
    this.showUploadModal = true;
    this.selectedFile = null;
  }

  /**
   * Cierra el modal de subida de documentos
   */
  closeUploadModal(): void {
    this.showUploadModal = false;
  }

  /**
   * Maneja la selección de un archivo para subir
   * @param event Evento de selección de archivo
   */
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  /**
   * Sube el documento de consentimiento seleccionado
   */
  async uploadConsent(): Promise<void> {
    if (!this.selectedFile || !this.registro?.patientIdentificationNumber) {
      Swal.fire('Error', 'Por favor seleccione un archivo', 'error');
      return;
    }

    const patientId = Number(this.registro.patientIdentificationNumber);
    if (isNaN(patientId)) {
      Swal.fire('Error', 'ID de paciente inválido', 'error');
      return;
    }

    this.isUploading = true;

    try {
      const response = await this.signatureService
        .uploadConsentFile(patientId, this.selectedFile)
        .toPromise();

      Swal.fire('Éxito', 'Documento subido correctamente', 'success');
      this.closeUploadModal();
      this.viewConsentDocument(); // Intenta ver el documento después de subirlo
    } catch (error: unknown) {
      console.error('Error completo:', error);

      let errorMessage = 'No se pudo subir el documento';

      if (error instanceof HttpErrorResponse) {
        errorMessage = error.error?.message || error.message || error.statusText;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Swal.fire('Error', errorMessage, 'error');
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Limpia la selección de archivo
   */
  clearFileSelection(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('consentFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  //#endregion

  //#region Métodos Privados

  /**
   * Formatea una fecha usando el DatePipe de Angular
   * @private
   * @param date Fecha a formatear
   * @returns Fecha formateada o 'No especificada' si es nula
   */
  private formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'No especificada';
    return this.datePipe.transform(date, 'mediumDate') || 'Fecha inválida';
  }

  /**
   * Determina el tipo de documento basado en su tipo MIME
   * @private
   * @param blob Blob del documento
   */
  private determineDocumentType(blob: Blob): void {
    if (blob.type.includes('pdf')) {
      this.documentType = 'pdf';
    } else if (blob.type.includes('image')) {
      this.documentType = 'image';
    } else {
      this.documentType = 'unknown';
    }
  }

  /**
   * Limpia la URL del documento y libera recursos
   * @private
   */
  private cleanUpDocumentUrl(): void {
    if (this.unsafeDocumentUrl) {
      URL.revokeObjectURL(this.unsafeDocumentUrl);
      this.unsafeDocumentUrl = null;
      this.documentUrl = null;
    }
  }

  /**
   * Crea una URL segura para visualizar el documento
   * @private
   * @param blob Blob del documento
   */
  private createDocumentUrl(blob: Blob): void {
    this.cleanUpDocumentUrl(); // Limpiar primero

    try {
      this.unsafeDocumentUrl = URL.createObjectURL(blob);
      this.documentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.unsafeDocumentUrl);
    } catch (error) {
      console.error('Error creating document URL:', error);
      this.documentError = 'Error al preparar el documento para visualización';
      this.cleanUpDocumentUrl();
    }
  }

  /**
   * Método del ciclo de vida para limpieza al destruir el componente
   */
  ngOnDestroy(): void {
    this.cleanUpDocumentUrl();
  }

  //#endregion
}
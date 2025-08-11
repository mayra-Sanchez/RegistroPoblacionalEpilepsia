import { Component, EventEmitter, Output, Input } from '@angular/core';
import Swal from 'sweetalert2';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Componente para la captura y subida de firmas digitales o documentos de consentimiento
 * 
 * Este componente proporciona:
 * - Selección de archivos (PDF, imágenes de firma, etc.)
 * - Validación básica de archivos
 * - Subida segura al servidor
 * - Manejo de estados y retroalimentación visual
 * 
 * @example
 * <!-- Uso básico -->
 * <app-signature-pad 
 *   [patientId]="paciente.id"
 *   (fileUploaded)="handleUploadSuccess($event)">
 * </app-signature-pad>
 */
@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-form.component.html',
  styleUrls: ['./signature-form.component.css']
})
export class SignaturePadComponent {
  /**
   * Evento emitido cuando un archivo se sube correctamente
   * @type {EventEmitter<boolean>}
   */
  @Output() fileUploaded = new EventEmitter<boolean>();

  /**
   * Indica si el paciente es nuevo (puede afectar el flujo de firma)
   * @type {boolean}
   */
  @Input() isNewPatient: boolean = false;

  /**
   * ID del paciente asociado al documento
   * @type {number | null}
   */
  @Input() patientId: number | null = null;

  /**
   * Archivo seleccionado para subir
   * @type {File | null}
   */
  selectedFile: File | null = null;

  /**
   * Indica si se está procesando la subida
   * @type {boolean}
   */
  isSaving = false;

  /**
   * Constructor del componente
   * @param signatureUploadService Servicio para manejo de subida de documentos
   */
  constructor(private signatureUploadService: SignatureUploadService) { }

  /**
   * Maneja la selección de archivos
   * @param event Evento de cambio del input file
   */
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  /**
   * Sube el documento de consentimiento al servidor
   * 
   * Este método:
   * 1. Valida que exista un archivo y un ID de paciente
   * 2. Muestra indicadores de carga
   * 3. Maneja la respuesta/error del servidor
   * 4. Emite eventos y notificaciones apropiadas
   * 
   * @throws {HttpErrorResponse} Errores de conexión o validación del servidor
   * @throws {Error} Errores inesperados durante el proceso
   */
  async uploadConsent(): Promise<void> {
    // Validación básica
    if (!this.selectedFile || !this.patientId) return;

    this.isSaving = true;

    try {
      // Intento de subida
      const response = await this.signatureUploadService
        .uploadConsentFile(this.patientId, this.selectedFile)
        .toPromise();
      
      // Notificación de éxito
      Swal.fire('Éxito', response as string, 'success');
      this.fileUploaded.emit(true);
    } catch (error: unknown) {
      console.error('Error completo:', error);
      
      // Manejo detallado de errores
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
      this.isSaving = false;
    }
  }

  /**
   * Limpia la selección actual de archivos
   * 
   * Restablece:
   * - La referencia al archivo seleccionado
   * - El valor del input file en el DOM
   */
  clearSelection(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('consentFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}
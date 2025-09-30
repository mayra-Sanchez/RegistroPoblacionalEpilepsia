import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';
import { ConsolaRegistroService } from 'src/app/services/register.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface PatientBasicInfo {
  name: string;
  sex: string;
  birthDate: string | null;
  age: number | null;
  email: string;
  phoneNumber: string;
  deathDate: string | null;
  economicStatus: string;
  educationLevel: string;
  maritalStatus: string;
  hometown: string;
  currentCity: string;
  firstCrisisDate: string | null;
  crisisStatus: string;
}

@Component({
  selector: 'app-upload-consentimiento',
  templateUrl: './upload-consentimiento.component.html',
  styleUrls: ['./upload-consentimiento.component.css']
})
export class UploadConsentimientoComponent implements OnInit {
  @Output() uploadComplete = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  patientIdentificationNumber: number | null = null;
  patientInfo: PatientBasicInfo | null = null;
  selectedFile: File | null = null;
  loadingPatients = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  isDragOver = false;
  showPatientNotFound = false;

  private searchSubject = new Subject<number>();

  constructor(
    private signatureUploadService: SignatureUploadService,
    private consolaService: ConsolaRegistroService
  ) { }

  ngOnInit() {
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(documentNumber => {
      this.searchPatient(documentNumber);
    });
  }

  onPatientSearch() {
    if (this.patientIdentificationNumber && this.patientIdentificationNumber.toString().length >= 4) {
      this.searchSubject.next(this.patientIdentificationNumber);
    } else {
      this.clearPatientInfo();
    }
  }

  searchPatient(documentNumber: number) {
    this.loadingPatients = true;
    this.showPatientNotFound = false;
    this.clearPatientInfo();
    this.clearMessages();

    // Obtener la capa de investigación del componente padre
    const researchLayerId = (this as any).researchLayerId ||
      (this as any).selectedLayerId ||
      localStorage.getItem('selectedLayerId');

    if (!researchLayerId) {
      this.loadingPatients = false;
      this.errorMessage = 'No hay una capa de investigación seleccionada. Por favor, seleccione una capa primero.';
      return;
    }

    this.consolaService.validarPaciente(documentNumber, researchLayerId)
      .subscribe({
        next: (response) => {
          this.loadingPatients = false;

          if (response.patientBasicInfo) {
            this.patientInfo = response.patientBasicInfo;
            this.showPatientNotFound = false;
          } else {
            this.showPatientNotFound = true;
            this.errorMessage = 'Paciente no encontrado en el sistema';
          }
        },
        error: (error) => {
          this.loadingPatients = false;
          this.showPatientNotFound = true;

          // Manejar diferentes tipos de errores
          if (error.status === 400) {
            this.errorMessage = 'Error de validación: ' + (error.message || 'El usuario no tiene acceso a esta capa de investigación');
          } else if (error.status === 404) {
            this.errorMessage = 'Paciente no encontrado en el sistema';
          } else {
            this.errorMessage = 'Error al buscar paciente: ' + (error.message || 'Intente nuevamente');
          }

          console.error('Error searching patient:', error);
        }
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.validateAndSetFile(file);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  validateAndSetFile(file: File) {
    this.clearMessages();

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Tipo de archivo no permitido. Use PDF, JPG, PNG o DOC.';
      return;
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      this.errorMessage = 'El archivo es demasiado grande. Máximo 10MB.';
      return;
    }

    this.selectedFile = file;
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.clearMessages();
  }

  onUpload() {
    if (!this.selectedFile || !this.patientIdentificationNumber) {
      this.errorMessage = 'Seleccione un paciente y un archivo';
      return;
    }

    this.uploading = true;
    this.clearMessages();

    this.signatureUploadService.uploadConsentFile(this.patientIdentificationNumber, this.selectedFile)
      .subscribe({
        next: (response) => {
          this.uploading = false;
          this.successMessage = 'Consentimiento subido exitosamente';

          // Emitir el resultado después de un breve delay
          setTimeout(() => {
            this.uploadComplete.emit({
              patientId: this.patientIdentificationNumber,
              patientName: this.patientInfo?.name,
              fileName: this.selectedFile?.name,
              response: response
            });
          }, 1500);
        },
        error: (error) => {
          this.uploading = false;
          console.error('Error uploading file:', error);
          this.errorMessage = this.getUploadErrorMessage(error);
        }
      });
  }

  onCancel() {
    this.cancel.emit();
  }

  getFileTypeText(fileType: string): string {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPG',
      'image/png': 'PNG',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
    };

    return typeMap[fileType] || fileType;
  }

  private getUploadErrorMessage(error: any): string {
    if (error.status === 413) {
      return 'El archivo es demasiado grande. El servidor rechazó la subida.';
    } else if (error.status === 415) {
      return 'Tipo de archivo no soportado por el servidor.';
    } else if (error.status === 404) {
      return 'Servicio de subida no disponible. Contacte al administrador.';
    } else {
      return 'Error al subir el archivo. Por favor, intente nuevamente.';
    }
  }

  private clearPatientInfo() {
    this.patientInfo = null;
    this.selectedFile = null;
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Métodos para verificar tipos de archivo
  isPdfFile(file: File): boolean {
    return file.type === 'application/pdf';
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isWordFile(file: File): boolean {
    return file.type.includes('word') ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
}
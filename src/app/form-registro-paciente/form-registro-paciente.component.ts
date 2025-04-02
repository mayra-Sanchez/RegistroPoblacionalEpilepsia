import { Component, OnInit } from '@angular/core';
import { ConsolaRegistroService } from '../modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements OnInit {
  pasoActual = 1;
  tieneCuidador = false;
  currentResearchLayerId: string = '';
  isSending = false;

  // Form data objects
  pacienteData: any = {};
  clinicalData: any[] = [];
  cuidadorData: any = {};
  profesionalData: any = {};

  constructor(
    private consolaService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserResearchLayer();
  }

  private loadUserResearchLayer(): void {
    const email = this.authService.getUserEmail();
    if (!email) {
      this.showErrorAlert('No se pudo obtener el email del usuario');
      return;
    }

    this.consolaService.obtenerUsuarioAutenticado(email).subscribe({
      next: (response) => {
        if (response?.[0]?.attributes?.researchLayerId?.[0]) {
          const researchLayerId = response[0].attributes.researchLayerId[0];
          this.verifyResearchLayerExists(researchLayerId);
        } else {
          this.showErrorAlert('Usuario no tiene asignada una capa de investigación');
        }
      },
      error: (err) => {
        console.error('Error al cargar usuario:', err);
        this.showErrorAlert('Error al cargar información del usuario');
      }
    });
  }

  private verifyResearchLayerExists(researchLayerId: string): void {
    this.consolaService.obtenerCapaPorId(researchLayerId).subscribe({
      next: (capa) => {
        if (capa && capa.id) {
          this.currentResearchLayerId = capa.id;
        } else {
          this.showErrorAlert('La capa de investigación no existe');
        }
      },
      error: (err) => {
        console.error('Error al verificar capa:', err);
        this.showErrorAlert('Error al verificar la capa de investigación');
      }
    });
  }

  // Form step handlers
  handlePacienteData(data: any): void {
    this.pacienteData = data;
    this.tieneCuidador = Boolean(data.tieneCuidador);
    this.siguientePaso();
  }

  handleClinicalData(data: any[]): void {
    this.clinicalData = data;
    this.siguientePaso();
  }

  handleCuidadorData(data: any): void {
    this.cuidadorData = data;
    this.siguientePaso();
  }

  handleProfesionalData(data: any): void {
    this.profesionalData = data;
    this.prepareAndSendData();
  }

  // Navigation
  siguientePaso(): void {
    this.pasoActual++;
  }

  pasoAnterior(): void {
    this.pasoActual--;
  }

  // Data preparation and submission
  private prepareAndSendData(): void {
    if (!this.validateBeforeSend()) {
      this.showErrorAlert('Por favor complete todos los campos requeridos');
      return;
    }

    Swal.fire({
      title: '¿Confirmar registro?',
      text: '¿Está seguro que desea registrar estos datos?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sendDataToServer();
      }
    });
  }

  private sendDataToServer(): void {
    const requestBody = this.buildRequestBody();
    const userEmail = this.authService.getUserEmail();

    // Handle case where userEmail is null
    if (!userEmail) {
      this.showErrorAlert('No se pudo obtener el email del usuario. Por favor inicie sesión nuevamente.');
      this.isSending = false;
      return;
    }

    Swal.fire({
      title: 'Registrando datos...',
      html: 'Por favor espere mientras procesamos su solicitud',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.isSending = true;
    this.consolaService.registrarRegistro(requestBody, userEmail).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => this.handleError(error)
    });
  }

  private buildRequestBody(): any {
    return {
      variables: this.clinicalData.map(item => ({
        id: item.id || this.generateUUID(),
        value: this.convertValue(item.value, item.type),
        type: item.type,
        researchLayerId: this.currentResearchLayerId
      })),
      patientIdentificationNumber: Number(this.pacienteData.identificationNumber),
      patientIdentificationType: this.pacienteData.identificationType || 'Cedula de ciudadania',
      patient: {
        name: this.pacienteData.name,
        sex: this.pacienteData.sex,
        birthDate: this.formatDateForAPI(this.pacienteData.birthDate),
        age: this.calculateAge(this.pacienteData.birthDate),
        email: this.pacienteData.email,
        phoneNumber: this.pacienteData.phoneNumber,
        deathDate: this.pacienteData.deathDate ? this.formatDateForAPI(this.pacienteData.deathDate) : null,
        economicStatus: this.pacienteData.economicStatus,
        educationLevel: this.pacienteData.educationLevel,
        maritalStatus: this.pacienteData.maritalStatus,
        hometown: this.pacienteData.hometown,
        currentCity: this.pacienteData.currentCity,
        firstCrisisDate: this.pacienteData.firstCrisisDate,
        crisisStatus: this.pacienteData.crisisStatus
      },
      caregiver: this.tieneCuidador ? {
        name: this.cuidadorData.name,
        identificationType: this.cuidadorData.identificationType,
        identificationNumber: Number(this.cuidadorData.identificationNumber),
        age: Number(this.cuidadorData.age),
        educationLevel: this.cuidadorData.educationLevel,
        occupation: this.cuidadorData.occupation
      } : null,
      healthProfessional: {
        id: this.profesionalData.healthProfessionalId,
        name: this.profesionalData.healthProfessionalName,
        identificationNumber: Number(this.profesionalData.healthProfessionalIdentificationNumber)
      }
    };
  }

  // Helper methods
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private formatDateForAPI(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private convertValue(value: any, type: string): any {
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return Boolean(value);
      case 'string': return String(value);
      default: return value;
    }
  }

  private calculateAge(birthdate: any): number {
    if (!birthdate) return 0;
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private validateBeforeSend(): boolean {
    const requiredFields = [
      this.pacienteData?.name,
      this.pacienteData?.identificationNumber,
      this.profesionalData?.healthProfessionalId,
      this.clinicalData?.length > 0
    ];

    if (requiredFields.some(field => !field)) {
      return false;
    }

    if (this.tieneCuidador) {
      const hasRequiredFields = this.cuidadorData?.name &&
        this.cuidadorData?.identificationNumber;
      if (!hasRequiredFields) {
        return false;
      }
    }

    return true;
  }

  // Response handlers
  private handleSuccess(response: any): void {
    this.isSending = false;
    Swal.fire({
      title: '¡Registro exitoso!',
      text: 'Los datos del paciente se han registrado correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      timer: 3000,
      timerProgressBar: true,
      willClose: () => {
        this.resetForm();
      }
    });
  }

  private handleError(error: any): void {
    this.isSending = false;
    Swal.close();

    let errorMessage = 'Ocurrió un error al registrar los datos';
    if (error.status === 400) {
      errorMessage = 'Datos inválidos. Verifique la información ingresada';
    } else if (error.status === 500) {
      errorMessage = 'Error del servidor. Intente nuevamente más tarde';
    }

    this.showErrorAlert(errorMessage);
    console.error('Error en el registro', error);
  }

  private resetForm(): void {
    this.pasoActual = 1;
    this.pacienteData = {};
    this.clinicalData = [];
    this.cuidadorData = {};
    this.profesionalData = {};
    this.tieneCuidador = false;
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }
}
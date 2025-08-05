// form-registro-paciente.component.ts
import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ConsolaRegistroService } from '../services/consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResearchLayer } from '../modules/consola-registro/interfaces';
import { lastValueFrom } from 'rxjs';
@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements OnInit, OnChanges {
  @Input() researchLayerId: string = '';
  pasoActual = 1;
  tieneCuidador = false;
  currentResearchLayerId: string = '';
  isSending = false;
  pacienteData: any = {};
  clinicalData: any[] = [];
  cuidadorData: any = {};
  profesionalData: any = {};
  userResearchLayers: string[] = []; // Store user's authorized layers

  constructor(
    private consolaService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    // Verificar rol primero
    if (!this.authService.hasRole('Doctor_client_role')) {
      this.showErrorAlert('Solo doctores pueden crear registros');
      return;
    }

    // Cargar capas
    await this.loadUserResearchLayer();

    // Validar capa seleccionada
    if (this.researchLayerId && !this.userResearchLayers.includes(this.researchLayerId)) {
      this.researchLayerId = this.userResearchLayers[0] || '';
    }

    this.loadClinicalDataFromLocalStorage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['researchLayerId'] && changes['researchLayerId'].currentValue) {
      const newLayerId = changes['researchLayerId'].currentValue;

      // Si aún no tenemos las capas del usuario, esperar a que se carguen
      if (this.userResearchLayers.length === 0) {
        console.log('Esperando carga de capas autorizadas...');
        const checkInterval = setInterval(() => {
          if (this.userResearchLayers.length > 0) {
            clearInterval(checkInterval);
            this.handleLayerChange(newLayerId);
          }
        }, 100);
      } else {
        this.handleLayerChange(newLayerId);
      }
    }
  }

  private handleLayerChange(newLayerId: string): void {
    if (this.userResearchLayers.includes(newLayerId)) {
      this.currentResearchLayerId = newLayerId;
      console.log('Capa cambiada correctamente a:', this.currentResearchLayerId);
      this.loadClinicalDataFromLocalStorage();
      this.resetForm(false);
    } else {
      console.warn('Usuario no tiene acceso a la capa:', newLayerId);
      if (this.userResearchLayers.length > 0) {
        this.currentResearchLayerId = this.userResearchLayers[0];
        console.log('Cambiando a capa por defecto:', this.currentResearchLayerId);
        this.loadClinicalDataFromLocalStorage();
        this.resetForm(false);
      }
    }
  }

  private loadUserResearchLayer(): Promise<void> {
    return new Promise((resolve) => {
      const email = this.authService.getUserEmail();
      if (!email) {
        this.showErrorAlert('No se pudo obtener el email del usuario');
        resolve();
        return;
      }

      const headers = new HttpHeaders({
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      this.consolaService.obtenerUsuarioAutenticado(email, headers).subscribe({
        next: (response) => {
          if (response?.[0]?.attributes?.researchLayerId?.length) {
            this.userResearchLayers = response[0].attributes.researchLayerId;
            console.log('Capas del usuario cargadas:', this.userResearchLayers);
            resolve();
          } else {
            this.showErrorAlert('Usuario no tiene asignada una capa de investigación');
            resolve();
          }
        },
        error: (err) => {
          console.error('Error al cargar usuario:', err);
          this.showErrorAlert('Error al cargar información del usuario');
          resolve();
        }
      });
    });
  }

  private verifyBackendPermissions(): void {
    if (!this.userResearchLayers.length) return;

    console.log('Verificando permisos en backend para capas:', this.userResearchLayers);

    this.userResearchLayers.forEach((layerId: string) => {
      this.consolaService.obtenerCapaPorId(layerId).subscribe({
        next: (capa: ResearchLayer) => {
          const tieneAcceso = !!capa?.id;
          console.log(`Verificación backend capa ${layerId}:`, tieneAcceso ? 'AUTORIZADO' : 'NO AUTORIZADO');

          if (!tieneAcceso) {
            // Eliminar capa no autorizada
            this.userResearchLayers = this.userResearchLayers.filter(id => id !== layerId);
            console.log('Capa eliminada por falta de autorización:', layerId);

            // Si era la capa actual, cambiar a la primera disponible
            if (this.currentResearchLayerId === layerId) {
              this.currentResearchLayerId = this.userResearchLayers[0] || '';
              console.log('Cambiando capa actual a:', this.currentResearchLayerId);
            }
          }
        },
        error: (err: any) => {
          console.error(`Error verificando capa ${layerId}:`, err);
        }
      });
    });
  }

  private validateResearchLayerId(): void {
    if (this.currentResearchLayerId && this.userResearchLayers.length > 0 && !this.userResearchLayers.includes(this.currentResearchLayerId)) {
      this.showErrorAlert('La capa de investigación seleccionada no está asignada a este usuario');
      this.currentResearchLayerId = this.userResearchLayers[0] || '';
      console.warn('FormRegistroPacienteComponent: Invalid researchLayerId, resetting to', this.currentResearchLayerId);
    }
  }

  private verifyResearchLayerExists(researchLayerId: string): void {
    if (!researchLayerId) {
      this.showErrorAlert('No se especificó una capa de investigación válida');
      return;
    }

    this.consolaService.obtenerCapaPorId(researchLayerId).subscribe({
      next: (capa) => {
        if (capa && capa.id) {
          this.currentResearchLayerId = capa.id;
          this.loadClinicalDataFromLocalStorage();
        } else {
          this.showErrorAlert('La capa de investigación no existe');
          this.currentResearchLayerId = this.userResearchLayers[0] || '';
        }
      },
      error: (err) => {
        console.error('Error al verificar capa:', err);
        this.showErrorAlert('Error al verificar la capa de investigación');
        this.currentResearchLayerId = this.userResearchLayers[0] || '';
      }
    });
  }



  private loadClinicalDataFromLocalStorage(): void {
    if (!this.currentResearchLayerId) {
      this.clinicalData = [];
      return;
    }
    const savedData = localStorage.getItem(`clinicalFormData_${this.currentResearchLayerId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('FormRegistroPacienteComponent: Loaded clinicalData from localStorage for layer', this.currentResearchLayerId, parsedData);
        this.clinicalData = parsedData.map((item: any) => ({
          id: item.id,
          value: item.valor,
          type: this.mapToBackendType(item.type),
          researchLayerId: this.currentResearchLayerId
        }));
      } catch (e) {
        console.error('FormRegistroPacienteComponent: Error parsing clinical data from localStorage:', e);
        this.clinicalData = [];
      }
    } else {
      this.clinicalData = [];
    }
  }

  private mapToBackendType(frontendType: string): string {
    const typeMap: Record<string, string> = {
      'Entero': 'number',
      'Decimal': 'number',
      'Texto': 'string',
      'Booleano': 'boolean',
      'Opciones': 'string',
      'OpcionesMúltiples': 'string[]',
      'Fecha': 'date'
    };
    return typeMap[frontendType] || 'string';
  }

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

  private async verifyLayerAccess(): Promise<boolean> {
    try {
      // Verificar acceso local
      if (!this.userResearchLayers.includes(this.currentResearchLayerId)) {
        return false;
      }

      // Verificar con backend
      return await lastValueFrom(
        this.consolaService.verifyLayerPermission(this.currentResearchLayerId)
      );
    } catch (error) {
      console.error('Error verificando capa:', error);
      return false;
    }
  }

  private async prepareAndSendData(): Promise<void> {
    if (!await this.verifyLayerAccess()) {
      this.showErrorAlert('Sin acceso a la capa seleccionada');
      return;
    }

    if (!this.validateBeforeSend()) {
      return;
    }

    this.sendDataToServer();
  }
  siguientePaso(): void {
    if (this.pasoActual === 2 && !this.tieneCuidador) {
      this.pasoActual = 3; // Skip caregiver step
    } else {
      this.pasoActual++;
    }
  }

  pasoAnterior(): void {
    if (this.pasoActual === 3 && !this.tieneCuidador) {
      this.pasoActual = 2; // Skip caregiver step
    } else {
      this.pasoActual--;
    }
  }
  // private forceRefreshPermissions(): void {
  //   this.authService.forceRefreshPermissions().subscribe({
  //     next: () => {
  //       this.loadUserResearchLayer(); // Recargar los permisos
  //     },
  //     error: (err) => {
  //       console.error('Error refrescando permisos:', err);
  //       this.showErrorAlert('Error al actualizar permisos. Por favor recarga la página.');
  //     }
  //   });
  // }
  private sendDataToServer(): void {
    // Verificación adicional por si el usuario modificó el frontend
    if (!this.authService.hasRole('Doctor_client_role')) {
      this.handlePermissionError();
      return;
    }

    const requestBody = this.buildRequestBody();
    const userEmail = this.authService.getUserEmail();

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
      error: (error) => {
        if (error.code === 'PERMISSION_DENIED' || error.status === 403) {
          this.handlePermissionError();
        } else {
          this.handleError(error);
        }
      }
    });
  }


  private handlePermissionError(): void {
    this.isSending = false;
    Swal.close();
    Swal.fire({
      title: 'Permiso denegado',
      text: 'Solo los usuarios con rol de Doctor pueden crear registros',
      icon: 'error',
      confirmButtonText: 'Entendido',
      willClose: () => {
        // Opcional: redirigir o resetear el formulario
        this.resetForm(true);
      }
    });
  }

  public buildRequestBody(): any {
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
    return d.toISOString().split('T')[0];
  }

  private convertValue(value: any, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === true;
      case 'string':
        return String(value);
      case 'date':
        if (!value) return null;
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        return null;
      default:
        return value;
    }
  }

  public calculateAge(birthdate: any): number {
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

  public validateBeforeSend(): boolean {
    // Verificar rol
    if (!this.authService.hasRole('Doctor_client_role')) {
      this.handlePermissionError();
      return false;
    }

    // Verificar capa
    if (!this.currentResearchLayerId || !this.userResearchLayers.includes(this.currentResearchLayerId)) {
      console.error('Intento de registro en capa no autorizada:', this.currentResearchLayerId);
      this.showErrorAlert('No tiene permisos para la capa seleccionada');
      return false;
    }

    // Verificar datos requeridos
    const requiredFields = [
      this.pacienteData?.name,
      this.pacienteData?.identificationNumber,
      this.profesionalData?.healthProfessionalId,
      this.clinicalData?.length > 0
    ];

    if (this.tieneCuidador) {
      const hasRequiredFields = this.cuidadorData?.name &&
        this.cuidadorData?.identificationNumber;
      if (!hasRequiredFields) {
        return false;
      }
    }

    return !requiredFields.some(field => !field);
  }

  private handleSuccess(response: any): void {
    this.isSending = false;
    localStorage.removeItem(`clinicalFormData_${this.currentResearchLayerId}`);
    Swal.fire({
      title: '¡Registro exitoso!',
      text: 'Los datos del paciente se han registrado correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      timer: 3000,
      timerProgressBar: true,
      willClose: () => {
        this.resetForm(true);
      }
    });
  }

  private handleError(error: any): void {
    this.isSending = false;
    Swal.close();

    let errorMessage = 'Ocurrió un error al registrar los datos';
    let technicalDetails = '';

    if (error.status === 400) {
      errorMessage = error.error?.message || 'Datos inválidos';
      technicalDetails = `Capa intentada: ${this.currentResearchLayerId} | Capas permitidas: ${this.userResearchLayers.join(', ')}`;
    } else if (error.status === 403) {
      errorMessage = 'Acceso denegado por el servidor';
      technicalDetails = `El backend rechazó explícitamente la capa ${this.currentResearchLayerId}`;
    }

    console.error('Detalles técnicos del error:', {
      error,
      currentLayer: this.currentResearchLayerId,
      userLayers: this.userResearchLayers,
      userEmail: this.authService.getUserEmail(),
      timestamp: new Date().toISOString()
    });

    // Mostrar al usuario un mensaje con opción para ver detalles
    Swal.fire({
      title: 'Error',
      html: `${errorMessage}<br><small id="techDetails" style="display:none">${technicalDetails}</small>`,
      icon: 'error',
      confirmButtonText: 'Entendido',
      showCancelButton: true,
      cancelButtonText: 'Detalles técnicos',
      allowOutsideClick: false
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Detalles del error',
          text: technicalDetails,
          icon: 'info'
        });
      }
    });
  }

  public resetForm(clearClinicalData: boolean = true): void {
    this.pasoActual = 1;
    this.pacienteData = {};
    if (clearClinicalData) {
      this.clinicalData = [];
    }
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
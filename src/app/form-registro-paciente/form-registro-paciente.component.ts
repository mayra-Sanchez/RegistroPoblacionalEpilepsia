import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ConsolaRegistroService } from '../services/consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResearchLayer } from '../modules/consola-registro/interfaces';
import { lastValueFrom } from 'rxjs';

/**
 * Componente para el formulario de registro de pacientes.
 * Maneja el proceso de registro en múltiples pasos y la interacción con la API.
 */
@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements OnInit, OnChanges {
  /** ID de la capa de investigación actual (input) */
  @Input() researchLayerId: string = '';
  
  /** Paso actual del formulario (1-4) */
  pasoActual = 1;
  
  /** Indica si el paciente tiene cuidador */
  tieneCuidador = false;
  
  /** ID de la capa de investigación actualmente seleccionada */
  currentResearchLayerId: string = '';
  
  /** Indica si se está enviando datos al servidor */
  isSending = false;
  
  /** Datos del paciente */
  pacienteData: any = {};
  
  /** Datos clínicos del paciente */
  clinicalData: any[] = [];
  
  /** Datos del cuidador (si aplica) */
  cuidadorData: any = {};
  
  /** Datos del profesional de salud */
  profesionalData: any = {};
  
  /** Lista de IDs de capas de investigación a las que tiene acceso el usuario */
  userResearchLayers: string[] = [];

  /**
   * Constructor del componente
   * @param consolaService Servicio para interactuar con la consola de registros
   * @param authService Servicio de autenticación y autorización
   */
  constructor(
    private consolaService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  /**
   * Inicialización del componente
   * Verifica permisos y carga las capas de investigación del usuario
   */
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

  /**
   * Maneja cambios en los inputs del componente
   * @param changes Objeto con los cambios detectados
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['researchLayerId'] && changes['researchLayerId'].currentValue) {
      const newLayerId = changes['researchLayerId'].currentValue;

      // Si aún no tenemos las capas del usuario, esperar a que se carguen
      if (this.userResearchLayers.length === 0) {
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

  /**
   * Maneja el cambio de capa de investigación
   * @param newLayerId ID de la nueva capa seleccionada
   */
  private handleLayerChange(newLayerId: string): void {
    if (this.userResearchLayers.includes(newLayerId)) {
      this.currentResearchLayerId = newLayerId;
      this.loadClinicalDataFromLocalStorage();
      this.resetForm(false);
    } else {
      if (this.userResearchLayers.length > 0) {
        this.currentResearchLayerId = this.userResearchLayers[0];
        this.loadClinicalDataFromLocalStorage();
        this.resetForm(false);
      }
    }
  }

  /**
   * Carga las capas de investigación a las que tiene acceso el usuario
   * @returns Promesa que se resuelve cuando se completa la carga
   */
  private loadUserResearchLayer(): Promise<void> {
    return new Promise((resolve) => {
      const email = this.authService.getUserEmail();
      if (!email) {
        this.showErrorAlert('No se pudo obtener el email del usuario');
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
            resolve();
          } else {
            this.showErrorAlert('Usuario no tiene asignada una capa de investigación');
            resolve();
          }
        },
        error: (err) => {
          this.showErrorAlert('Error al cargar información del usuario');
          resolve();
        }
      });
    });
  }

  /**
   * Carga los datos clínicos guardados en el localStorage
   */
  private loadClinicalDataFromLocalStorage(): void {
    if (!this.currentResearchLayerId) {
      this.clinicalData = [];
      return;
    }
    const savedData = localStorage.getItem(`clinicalFormData_${this.currentResearchLayerId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        this.clinicalData = parsedData.map((item: any) => ({
          id: item.id,
          value: item.valor,
          type: this.mapToBackendType(item.type),
          researchLayerId: this.currentResearchLayerId
        }));
      } catch (e) {
        this.clinicalData = [];
      }
    } else {
      this.clinicalData = [];
    }
  }

  /**
   * Mapea tipos de datos del frontend al backend
   * @param frontendType Tipo de dato en el frontend
   * @returns Tipo de dato correspondiente en el backend
   */
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

  /**
   * Maneja los datos del paciente recibidos del formulario
   * @param data Datos del paciente
   */
  handlePacienteData(data: any): void {
    this.pacienteData = data;
    this.tieneCuidador = Boolean(data.tieneCuidador);

    // Si hay datos de cuidador, guardarlos
    if (data.cuidadorData) {
      this.cuidadorData = data.cuidadorData;
    }

    this.siguientePaso();
  }

  /**
   * Maneja los datos clínicos recibidos del formulario
   * @param data Datos clínicos
   */
  handleClinicalData(data: any[]): void {
    this.clinicalData = data;
    this.siguientePaso();
  }

  /**
   * Maneja los datos del cuidador recibidos del formulario
   * @param data Datos del cuidador
   */
  handleCuidadorData(data: any): void {
    this.cuidadorData = data;
    this.siguientePaso();
  }

  /**
   * Maneja los datos del profesional recibidos del formulario
   * @param data Datos del profesional
   */
  handleProfesionalData(data: any): void {
    this.profesionalData = data;
    this.prepareAndSendData();
  }

  /**
   * Verifica el acceso del usuario a la capa de investigación actual
   * @returns Promesa que resuelve a true si tiene acceso, false en caso contrario
   */
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
      return false;
    }
  }

  /**
   * Prepara y envía los datos del formulario al servidor
   */
  private async prepareAndSendData(): Promise<void> {
    if (!await this.verifyLayerAccess()) {
      this.showErrorAlert('Sin acceso a la capa seleccionada');
      return;
    }

    const patientId = Number(this.pacienteData.identificationNumber);

    try {
      // Verificar si el paciente existe en ESTA capa específica
      const registrosEnCapa = await lastValueFrom(
        this.consolaService.obtenerRegistrosPorCapa(this.currentResearchLayerId)
      );

      const registroExistente = registrosEnCapa.registers.find(
        register => register.patientIdentificationNumber === patientId
      );

      if (!this.validateBeforeSend()) {
        return;
      }

      if (registroExistente) {
        // Verificar que el ID existe antes de actualizar
        if (!registroExistente.id) {
          this.showErrorAlert('El registro existente no tiene un ID válido');
          return;
        }
        // Si existe, preparar para actualización
        await this.handleUpdate(registroExistente.id);
      } else {
        // Si no existe, crear nuevo registro
        await this.handleCreate();
      }
    } catch (error) {
      this.showErrorAlert('Error al verificar el paciente. Por favor intente nuevamente.');
    }
  }

  /**
   * Envía los datos al servidor
   */
  private sendDataToServer(): void {
    if (!this.authService.hasRole('Doctor_client_role')) {
      this.handlePermissionError();
      return;
    }

    const email = this.authService.getUserEmail();
    if (!email) {
      this.showErrorAlert('No se pudo obtener el email del usuario');
      return;
    }

    const requestBody = this.buildRequestBody();

    Swal.fire({
      title: 'Registrando datos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.isSending = true;

    // Primero intentamos crear (POST)
    this.consolaService.registrarRegistro(requestBody, email).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => {
        if (error.status === 409) { // Conflicto - registro ya existe
          this.handleExistingRecord(requestBody, email, error);
        } else {
          this.handleError(error);
        }
      }
    });
  }

  /**
   * Maneja un registro existente intentando actualizarlo
   * @param requestBody Cuerpo de la petición
   * @param userEmail Email del usuario
   * @param error Error recibido
   */
  private handleExistingRecord(requestBody: any, userEmail: string, error: any): void {
    const patientId = Number(this.pacienteData.identificationNumber);

    // First try to get registerId from error response
    const registerId = error?.registerId || this.findExistingRegisterId(patientId);

    if (!registerId) {
      this.handleError(new Error('No se pudo obtener el ID del registro existente'));
      return;
    }

    this.consolaService.actualizarRegistro(registerId, userEmail, requestBody).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => this.handleError(error)
    });
  }

  /**
   * Busca el ID de un registro existente para un paciente
   * @param patientId ID del paciente
   * @returns Promesa que resuelve al ID del registro o undefined si no se encuentra
   */
  private async findExistingRegisterId(patientId: number): Promise<string | undefined> {
    try {
      const registrosEnCapa = await lastValueFrom(
        this.consolaService.obtenerRegistrosPorCapa(this.currentResearchLayerId)
      );
      const registroExistente = registrosEnCapa.registers.find(
        register => register.patientIdentificationNumber === patientId
      );
      return registroExistente?.id;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Maneja la creación de un nuevo registro
   */
  private async handleCreate(): Promise<void> {
    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      this.showErrorAlert('No se pudo obtener el email del usuario');
      return;
    }

    const requestBody = this.buildRequestBody();

    try {
      const response = await lastValueFrom(
        this.consolaService.registrarRegistro(requestBody, userEmail)
      );
      this.handleSuccess(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Maneja la actualización de un registro existente
   * @param registerId ID del registro a actualizar
   */
  private async handleUpdate(registerId: string): Promise<void> {
    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      this.showErrorAlert('No se pudo obtener el email del usuario');
      return;
    }

    const requestBody = this.buildRequestBody();

    Swal.fire({
      title: 'Actualizando datos...',
      text: 'Este paciente ya existe en la capa, actualizando información',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSending = true;
        Swal.fire({
          title: 'Actualizando...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.consolaService.actualizarRegistro(registerId, userEmail, requestBody).subscribe({
          next: (response) => this.handleSuccess(response),
          error: (error) => this.handleError(error)
        });
      }
    });
  }

  /**
   * Avanza al siguiente paso del formulario
   */
  siguientePaso(): void {
    if (this.pasoActual === 2 && !this.tieneCuidador) {
      this.pasoActual = 3; // Skip caregiver step
    } else {
      this.pasoActual++;
    }
  }

  /**
   * Retrocede al paso anterior del formulario
   */
  pasoAnterior(): void {
    if (this.pasoActual === 3 && !this.tieneCuidador) {
      this.pasoActual = 2; // Skip caregiver step
    } else {
      this.pasoActual--;
    }
  }

  /**
   * Maneja errores de permisos
   */
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

  /**
   * Construye el cuerpo de la petición para el servidor
   * @returns Objeto con los datos estructurados para enviar al servidor
   */
  public buildRequestBody(): any {
    const body: {
      variables: any[];
      patientIdentificationNumber: number;
      patientIdentificationType: string;
      patient: any;
      caregiver?: any;
      healthProfessional?: any;
    } = {
      variables: this.clinicalData.map(item => ({
        id: item.id || this.generateUUID(),
        variableName: item.variableName || '',
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
      }
    };

    if (this.tieneCuidador) {
      body.caregiver = {
        name: this.cuidadorData.name,
        identificationType: this.cuidadorData.identificationType,
        identificationNumber: Number(this.cuidadorData.identificationNumber),
        age: Number(this.cuidadorData.age),
        educationLevel: this.cuidadorData.educationLevel,
        occupation: this.cuidadorData.occupation
      };
    }

    if (this.profesionalData) {
      body.healthProfessional = {
        id: this.profesionalData.healthProfessionalId,
        name: this.profesionalData.healthProfessionalName,
        identificationNumber: Number(this.profesionalData.healthProfessionalIdentificationNumber)
      };
    }

    return body;
  }

  /**
   * Genera un UUID v4
   * @returns Cadena con el UUID generado
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Formatea una fecha para la API (YYYY-MM-DD)
   * @param date Fecha a formatear
   * @returns Cadena con la fecha formateada o cadena vacía si no hay fecha
   */
  private formatDateForAPI(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Convierte un valor al tipo especificado
   * @param value Valor a convertir
   * @param type Tipo al que convertir
   * @returns Valor convertido
   */
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

  /**
   * Calcula la edad a partir de una fecha de nacimiento
   * @param birthdate Fecha de nacimiento
   * @returns Edad calculada
   */
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

  /**
   * Valida los datos antes de enviarlos al servidor
   * @returns true si los datos son válidos, false en caso contrario
   */
  public validateBeforeSend(): boolean {
    // Verificar rol
    if (!this.authService.hasRole('Doctor_client_role')) {
      this.handlePermissionError();
      return false;
    }

    // Verificar capa
    if (!this.currentResearchLayerId || !this.userResearchLayers.includes(this.currentResearchLayerId)) {
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

  /**
   * Maneja el éxito en el envío de datos
   * @param response Respuesta del servidor
   */
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

  /**
   * Maneja errores en el envío de datos
   * @param error Error recibido
   */
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

  /**
   * Reinicia el formulario
   * @param clearClinicalData Indica si se deben limpiar los datos clínicos
   */
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

  /**
   * Muestra un mensaje de error
   * @param message Mensaje a mostrar
   */
  private showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { ConsolaRegistroService } from '../modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import Swal from 'sweetalert2';

/**
 * Componente para el registro de pacientes en un sistema médico.
 * Maneja un formulario multipaso que incluye:
 * 1. Datos personales del paciente
 * 2. Datos clínicos
 * 3. Datos del cuidador (opcional)
 * 4. Datos del profesional de salud
 * 
 * @example
 * <app-form-registro-paciente></app-form-registro-paciente>
 */
@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements OnInit {
  /** Paso actual del formulario (1-4) */
  pasoActual = 1;

  /** Indica si el paciente tiene cuidador asociado */
  tieneCuidador = false;

  /** ID de la capa de investigación asociada al usuario */
  currentResearchLayerId: string = '';

  /** Bandera que indica si se está enviando el formulario */
  isSending = false;

  // Objetos para almacenar los datos del formulario
  /** Almacena los datos personales del paciente */
  pacienteData: any = {};

  /** Almacena los datos clínicos del paciente */
  clinicalData: any[] = [];

  /** Almacena los datos del cuidador (si aplica) */
  cuidadorData: any = {};

  /** Almacena los datos del profesional de salud */
  profesionalData: any = {};


  /** Datos formateados para mostrar en la previsualización */
  previewData: any = {};

  /**
   * Constructor del componente
   * @param consolaService Servicio para operaciones de registro
   * @param authService Servicio de autenticación
   */
  constructor(
    private consolaService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  /**
   * Método del ciclo de vida de Angular que se ejecuta al inicializar el componente
   * Carga la capa de investigación asociada al usuario
   */
  ngOnInit(): void {
    this.loadUserResearchLayer();
  }

  /**
   * Carga la información del usuario autenticado para obtener su capa de investigación
   * @private
   */
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
          console.log('Capa cargada correctamente:', capa);
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

  // Métodos para manejar datos de los formularios hijos

  /**
   * Maneja los datos recibidos del formulario del paciente
   * @param data Datos del paciente
   */
  handlePacienteData(data: any): void {
    this.pacienteData = data;
    this.tieneCuidador = Boolean(data.tieneCuidador);
    this.siguientePaso();
  }

  /**
   * Maneja los datos clínicos recibidos
   * @param data Array con los datos clínicos
   */
  handleClinicalData(data: any[]): void {
    this.clinicalData = data;
    this.siguientePaso();
  }

  /**
   * Maneja los datos recibidos del formulario del cuidador
   * @param data Datos del cuidador
   */
  handleCuidadorData(data: any): void {
    console.log('Datos recibidos del cuidador:', data);
    this.cuidadorData = {
      name: data.name,
      identificationType: data.identificationType,
      identificationNumber: data.identificationNumber,
      age: data.age,
      educationLevel: data.educationLevel,
      occupation: data.occupation
    };
    this.siguientePaso();
  }

  /**
   * Maneja los datos recibidos del formulario del profesional
   * @param data Datos del profesional
   */
  handleProfesionalData(data: any): void {
    this.profesionalData = data;
    this.prepareAndSendData();
  }

  // Métodos de navegación

  /** Avanza al siguiente paso del formulario */
  siguientePaso(): void {
    this.pasoActual++;
  }

  /** Retrocede al paso anterior del formulario */
  pasoAnterior(): void {
    this.pasoActual--;
  }


  /**
   * Muestra diálogo de confirmación para registrar los datos
   */
  confirmRegistration(): void {

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

  /**
   * Cancela el registro y cierra el modal de previsualización
   */
  cancelRegistration(): void {
    Swal.fire({
      title: 'Registro cancelado',
      text: 'Puede seguir editando los datos antes de enviar',
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
  }

  // Métodos para preparar y enviar datos

  /**
   * Prepara los datos para el envío y muestra diálogo de confirmación
   * @private
   */
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

  /**
   * Envía los datos al servidor
   * @private
   */
  private sendDataToServer(): void {
    const requestBody = this.buildRequestBody();

    Swal.fire({
      title: 'Registrando datos...',
      html: 'Por favor espere mientras procesamos su solicitud',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.isSending = true;
    this.consolaService.registrarRegistro(requestBody).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => this.handleError(error)
    });
  }

  /**
   * Construye el objeto para la petición HTTP
   * @returns Objeto con los datos formateados para el servidor
   * @private
   */
  private buildRequestBody(): any {
    return {
      variables: this.clinicalData.map(item => ({
        id: item.id || 'generated-id',
        value: this.convertValue(item.value, item.type),
        type: item.type,
        researchLayerId: this.currentResearchLayerId
      })),
      patientIdentificationNumber: Number(this.pacienteData.identificationNumber),
      patientIdentificationType: this.pacienteData.identificationType || 'Cedula de ciudadania',
      patient: {
        name: this.pacienteData.name,
        sex: this.pacienteData.sex,
        birthDate: this.formatDate(this.pacienteData.birthDate),
        age: this.calculateAge(this.pacienteData.birthDate),
        email: this.pacienteData.email,
        phoneNumber: this.pacienteData.phoneNumber,
        deathDate: this.pacienteData.deathDate ? this.formatDate(this.pacienteData.deathDate) : null,
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

  /**
   * Maneja una respuesta exitosa del servidor
   * @param response Respuesta del servidor
   * @private
   */
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
    console.log('Registro exitoso', response);
  }

  /**
   * Maneja errores en la comunicación con el servidor
   * @param error Objeto de error
   * @private
   */
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

  /**
   * Muestra un diálogo de error
   * @param message Mensaje de error a mostrar
   * @private
   */
  private showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Reinicia el formulario a su estado inicial
   * @private
   */
  private resetForm(): void {
    this.pasoActual = 1;
    this.pacienteData = {};
    this.clinicalData = [];
    this.cuidadorData = {};
    this.profesionalData = {};
    this.tieneCuidador = false;
  }

  // Métodos auxiliares

  /**
   * Convierte un valor al tipo especificado
   * @param value Valor a convertir
   * @param type Tipo de conversión ('number', 'boolean', 'string')
   * @returns Valor convertido
   * @private
   */
  private convertValue(value: any, type: string): any {
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return Boolean(value);
      case 'string': return String(value);
      default: return value;
    }
  }

  /**
   * Valida que todos los campos requeridos estén completos antes de enviar
   * @returns true si todos los campos requeridos están completos, false en caso contrario
   * @private
   */
  private validateBeforeSend(): boolean {
    const requiredFields = [
      this.pacienteData?.name,
      this.pacienteData?.identificationNumber,
      this.profesionalData?.healthProfessionalId,
      this.clinicalData?.length > 0
    ];

    if (requiredFields.some(field => !field)) {
      console.error('Datos incompletos');
      return false;
    }

    if (this.tieneCuidador) {
      const hasRequiredFields = this.cuidadorData?.name &&
        this.cuidadorData?.identificationNumber;

      if (!hasRequiredFields) {
        console.error('Faltan datos del cuidador');
        return false;
      }
    }

    return true;
  }

  /**
   * Formatea una fecha al formato YYYY-MM-DD
   * @param date Fecha a formatear (puede ser string, Date, etc.)
   * @returns Fecha formateada como string o null si no se puede formatear
   * @private
   */
  private formatDate(date: any): string | null {
    if (!date) return null;

    try {
      const d = new Date(date);
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Error formateando fecha:', date, e);
      return null;
    }
  }

  /**
   * Calcula la edad a partir de una fecha de nacimiento
   * @param birthdate Fecha de nacimiento
   * @returns Edad calculada en años
   * @private
   */
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
}
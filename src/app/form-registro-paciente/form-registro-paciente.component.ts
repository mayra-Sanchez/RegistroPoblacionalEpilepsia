import { Component, OnInit } from '@angular/core';
import { ConsolaRegistroService } from '../modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';

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

  // Almacenamiento de datos
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
    if (!email) return;

    this.consolaService.obtenerUsuarioAutenticado(email).subscribe({
      next: (response) => {
        if (response?.[0]?.attributes?.researchLayerId?.[0]) {
          const nombreCapa = response[0].attributes.researchLayerId[0];
          this.loadResearchLayerId(nombreCapa);
        }
      },
      error: (err) => console.error('Error al cargar usuario:', err)
    });
  }

  private loadResearchLayerId(nombreCapa: string): void {
    this.consolaService.buscarCapaPorNombre(nombreCapa).subscribe({
      next: (capa) => {
        if (capa.id) {
          this.currentResearchLayerId = capa.id;
        }
      },
      error: (err) => console.error('Error al cargar capa:', err)
    });
  }

  // Métodos para manejar datos de los formularios hijos
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
    console.log('Datos recibidos del cuidador:', data);
    // Transformamos los datos para mantener consistencia
    this.cuidadorData = {
      name: data.caregiverName,
      identificationType: data.caregiverIdentificationType,
      identificationNumber: data.caregiverIdentificationNumber,
      age: data.caregiverAge,
      educationLevel: data.caregiverEducationLevel,
      occupation: data.caregiverOccupation
    };
    this.siguientePaso();
  }

  handleProfesionalData(data: any): void {
    this.profesionalData = data;
    this.prepareAndSendData();
  }

  // Navegación
  siguientePaso(): void {
    this.pasoActual++;
  }

  pasoAnterior(): void {
    this.pasoActual--;
  }

  // Preparar y enviar datos
  private prepareAndSendData(): void {
    if (!this.validateBeforeSend()) {
      console.error('Validación fallida. Datos incompletos');
      return;
    }

    const requestBody = this.buildRequestBody();
    console.log('Datos a enviar:', JSON.stringify(requestBody, null, 2));

    this.isSending = true;
    this.consolaService.registrarRegistro(requestBody).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => this.handleError(error)
    });
  }

  private buildRequestBody(): any {
    return {
      variables: this.clinicalData.map(item => ({
        id: item.id || 'generated-id', // Asegurar que siempre tenga id
        value: this.convertValue(item.value, item.type), // Convertir según el tipo
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

  // Métodos auxiliares mejorados
  private convertValue(value: any, type: string): any {
    switch(type) {
      case 'number': return Number(value);
      case 'boolean': return Boolean(value);
      case 'string': return String(value);
      default: return value;
    }
  }

  private validateBeforeSend(): boolean {
    const requiredFields = [
      this.pacienteData?.name,
      this.pacienteData?.identificationNumber,
      this.profesionalData?.healthProfessionalId,
      this.clinicalData?.length > 0
    ];

    if (requiredFields.some(field => !field)) {
      console.error('Datos incompletos:', {
        paciente: !!this.pacienteData,
        profesional: !!this.profesionalData,
        clinicalData: this.clinicalData?.length
      });
      return false;
    }

    if (this.tieneCuidador) {
      const requiredCaregiverFields = [
        this.cuidadorData?.name,             // Ahora validamos los nombres correctos
        this.cuidadorData?.identificationNumber
      ];
      
      if (requiredCaregiverFields.some(field => !field)) {
        console.error('Faltan datos del cuidador:', this.cuidadorData);
        return false;
      }
    }

    return true;
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    
    try {
      const d = new Date(date);
      // Formato YYYY-MM-DD que espera el backend
      return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Error formateando fecha:', date, e);
      return null;
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

  private handleSuccess(response: any): void {
    this.isSending = false;
    console.log('Registro exitoso', response);
    // Aquí puedes redirigir o mostrar mensaje de éxito
  }

  private handleError(error: any): void {
    this.isSending = false;
    console.error('Error en el registro', error);
    // Aquí puedes mostrar mensaje de error al usuario
  }
}
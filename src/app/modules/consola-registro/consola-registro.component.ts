import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaRegistroService } from './services/consola-registro.service';

interface ResearchLayer {
  id: string;
  layerName: string;
  description: string;
  layerBoss: {
    id: number;
    name: string;
    identificationNumber: string;
  };
}

interface UserResponse {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  attributes?: {
    role?: string[];
    researchLayerId?: string[];
    identificationNumber?: string[];
    identificationType?: string[];
    birthDate?: string[];
  };
}

interface Variable {
  id: string;
  researchLayerId: string;
  variableName: string;
  description: string;
  type: string;
  hasOptions: boolean;
  isEnabled: boolean;
  options: string[];
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-consola-registro',
  templateUrl: './consola-registro.component.html',
  styleUrls: ['./consola-registro.component.css']
})
export class ConsolaRegistroComponent implements OnInit {
  selectedTab: string = 'inicioDigitador';
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Variables de la capa
  variablesDeCapa: Variable[] = [];
  loadingVariables: boolean = false;

  // Datos del usuario
  userData: UserResponse | null = null;
  currentResearchLayer: ResearchLayer | null = null;

  // Propiedades para la vista con valores por defecto
  jefeInvestigacion: string = 'Cargando...';
  contactoInvestigacion: string = 'Cargando...';
  DescripcionInvestigacion: string = 'Cargando descripción...';

  // Estadísticas
  totalPacientes: number = 0;
  pacientesHoy: number = 0;
  registrosPendientes: number = 0;

  // Datos para registros recientes
  registrosRecientes: any[] = [];

  // Datos para la tabla de usuarios
  usuariosData: any[] = [];
  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'apellido', header: 'Apellido' },
    { field: 'documento', header: 'Número de documento' },
    { field: 'fechaRegistro', header: 'Fecha de último registro' },
    { field: 'registradoPor', header: 'Registrado por' }
  ];

  constructor(
    private authService: AuthService,
    private consolaService: ConsolaRegistroService
  ) { }

  ngOnInit() {
    this.loadUserData();
  }

  get username(): string {
    return this.userData ? `${this.userData.firstName} ${this.userData.lastName}` : 'Usuario';
  }

  get capaUsuario(): string {
    return this.currentResearchLayer?.layerName || 'No asignada';
  }

  get userRole(): string {
    return this.userData?.attributes?.role?.[0] || 'Usuario';
  }

  loadUserData() {
    this.isLoading = true;
    this.errorMessage = null;

    const email = this.authService.getUserEmail();
    if (!email) {
      this.handleError('No se pudo obtener el email del usuario');
      return;
    }

    this.consolaService.obtenerUsuarioAutenticado(email).subscribe({
      next: (response) => {
        if (!response?.[0]) {
          this.handleError('Respuesta del servicio inválida');
          return;
        }

        this.userData = response[0];
        this.loadCapaInvestigacion();

        if (this.userRole === 'Doctor') {
          this.loadDoctorData();
        }
      },
      error: (err) => this.handleError(err.message)
    });
  }

  loadCapaInvestigacion() {
    const nombreCapa = this.userData?.attributes?.researchLayerId?.[0];
    if (!nombreCapa) {
      this.isLoading = false;
      return;
    }

    this.consolaService.buscarCapaPorNombre(nombreCapa).subscribe({
      next: (capa) => {
        this.currentResearchLayer = capa;
        this.updateDatosCapa(capa);

        // Cargar variables después de obtener la capa
        if (capa.id) {
          this.loadVariablesDeCapa(capa.id);
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.handleError(err.message);
        this.setDefaultCapaValues();
      }
    });
  }

  loadVariablesDeCapa(researchLayerId: string) {
    this.loadingVariables = true;
    this.variablesDeCapa = [];

    this.consolaService.obtenerVariablesPorCapa(researchLayerId).subscribe({
      next: (variables) => {
        this.variablesDeCapa = variables.filter(v => v.isEnabled);
        this.loadingVariables = false;
      },
      error: (err) => {
        console.error('Error al cargar variables:', err);
        this.loadingVariables = false;
        this.mostrarErrorVariables('No se pudieron cargar las variables');
      }
    });
  }

  loadDoctorData() {
    // Valores de ejemplo - reemplazar con llamadas reales al backend
    this.totalPacientes = 124;
    this.pacientesHoy = 5;
    this.registrosPendientes = 3;

    this.registrosRecientes = [
      { nombre: 'Paciente 1', fecha: new Date(), completado: true },
      { nombre: 'Paciente 2', fecha: new Date(), completado: false },
      { nombre: 'Paciente 3', fecha: new Date(), completado: true }
    ];

    this.usuariosData = [
      { nombre: 'Juan', apellido: 'González', documento: '987654321', fechaRegistro: '01/10/2023', registradoPor: this.username },
      { nombre: 'María', apellido: 'López', documento: '123456789', fechaRegistro: '15/11/2023', registradoPor: this.username },
      { nombre: 'Pedro', apellido: 'Sánchez', documento: '112233445', fechaRegistro: '03/08/2023', registradoPor: this.username }
    ];
  }

  navigateTo(destination: string): void {
    switch (destination) {
      case 'registroPaciente':
        this.selectedTab = 'registroPaciente';
        break;
      case 'listadoPacientes':
        this.selectedTab = 'listadoPacientes';
        break;
      case 'consultaDatosDigitador':
        this.selectedTab = 'consultaDatosDigitador';
        break;
      case 'configuracion':
        console.log('Navegando a configuración');
        break;
      default:
        console.log(`Destino no reconocido: ${destination}`);
    }
  }

  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  handleView(row: any) {
    console.log('Ver', row);
  }

  handleEdit(row: any) {
    console.log('Editar', row);
  }

  private updateDatosCapa(capa: ResearchLayer) {
    this.DescripcionInvestigacion = capa.description || 'Descripción no disponible';
    this.jefeInvestigacion = capa.layerBoss?.name || 'Jefe no asignado';
    this.contactoInvestigacion = capa.layerBoss?.identificationNumber
      ? `${capa.layerBoss.identificationNumber}@investigacion.com`
      : 'contacto@investigacion.com';
  }

  private setDefaultCapaValues() {
    this.DescripcionInvestigacion = 'Información no disponible';
    this.jefeInvestigacion = 'No asignado';
    this.contactoInvestigacion = 'contacto@investigacion.com';
  }

  private handleError(message: string) {
    console.error(message);
    this.errorMessage = message;
    this.isLoading = false;
    this.setDefaultCapaValues();
  }

  private mostrarErrorVariables(mensaje: string) {
    // Puedes implementar notificación toast o similar
    console.error(mensaje);
    this.errorMessage = mensaje;
  }
}
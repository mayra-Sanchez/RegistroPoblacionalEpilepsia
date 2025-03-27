import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaRegistroService } from './services/consola-registro.service';
import { Variable, UserResponse, ResearchLayer, Register } from './interfaces';
import { ChangeDetectorRef } from '@angular/core';
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

  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  registros: Register[] = [];
  loadingRegistros: boolean = false;

  // Propiedades para la vista con valores por defecto
  jefeInvestigacion: string = 'Cargando...';
  contactoInvestigacion: string = 'Cargando...';
  DescripcionInvestigacion: string = 'Cargando descripción...';

  // Estadísticas
  totalPacientes: number = 0;
  pacientesHoy: number = 0;
  registrosPendientes: number = 0;

  showViewModal: boolean = false;
  showEditModal: boolean = false;
  selectedRegistro: Register | null = null;

  // Datos para registros recientes
  registrosRecientes: any[] = [];

  // Datos para la tabla de usuarios
  usuariosData: any[] = [];
  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'documento', header: 'Número de documento' },
    { field: 'fechaRegistro', header: 'Fecha de último registro' },
    { field: 'registradoPor', header: 'Registrado por' }
  ];

  constructor(
    private authService: AuthService,
    private consolaService: ConsolaRegistroService,
    private cdr: ChangeDetectorRef
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
    console.log('Nombre de capa a buscar:', nombreCapa); // Debug 1

    if (!nombreCapa) {
      console.warn('No se encontró nombre de capa en userData'); // Debug 2
      this.isLoading = false;
      return;
    }

    this.consolaService.buscarCapaPorNombre(nombreCapa).subscribe({
      next: (capa) => {
        console.log('Respuesta del servicio:', capa); // Debug 3
        this.currentResearchLayer = capa;
        this.updateDatosCapa(capa);

        if (capa.id) {
          this.loadVariablesDeCapa(capa.id);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar capa:', err); // Debug 4
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

  // Modifica el método loadDoctorData para usar loadRegistros
  loadDoctorData() {
    this.loadRegistros();

    // Mantén los valores de ejemplo para estadísticas o actualízalos con datos reales
    this.totalPacientes = 124;
    this.pacientesHoy = 5;
    this.registrosPendientes = 3;
  }

  // Agrega métodos para manejar la paginación
  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadRegistros(event.page, event.rows);
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

  // Métodos para manejar los modales
  handleView(row: any) {
    this.selectedRegistro = this.registros.find(r =>
      r.patientIdentificationNumber === row.documento) || null;
    this.showViewModal = true;
  }

  handleEdit(row: any) {
    const registroEncontrado = this.registros.find(r => 
      r.patientIdentificationNumber === row.documento);
    
    if (!registroEncontrado) {
      console.error('Registro no encontrado');
      return;
    }
  
    // Copia profunda del registro
    this.selectedRegistro = JSON.parse(JSON.stringify(registroEncontrado)) as Register;
    this.showEditModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedRegistro = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedRegistro = null;
  }

  onSaveChanges(updatedRegistro: Register) {
    if (!updatedRegistro.registerId) {
      console.error('No se puede actualizar: registerId es requerido');
      return;
    }
  
    this.consolaService.actualizarRegistro(
      updatedRegistro.registerId,
      updatedRegistro
    ).subscribe({
      next: () => {
        this.loadRegistros();
        this.closeEditModal();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
  }

  private updateDatosCapa(capa: ResearchLayer) {
    // Asignación con valores por defecto
    this.DescripcionInvestigacion = capa?.description || 'Descripción no disponible';
    this.jefeInvestigacion = capa?.layerBoss?.name || 'Jefe no asignado';

    const contactoBase = capa?.layerBoss?.identificationNumber;
    this.contactoInvestigacion = contactoBase
      ? `${contactoBase}@investigacion.com`
      : 'contacto@investigacion.com';

    // Detección de cambios segura
    try {
      this.cdr.detectChanges();
    } catch (e) {
      console.warn('Error en detección de cambios:', e);
    }
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

  loadRegistros(page: number = 0, size: number = 10, query: string = '') {
    this.loadingRegistros = true;

    this.consolaService.obtenerRegistros(page, size).subscribe({
      next: (response) => {
        this.registros = response.registers || [];
        this.usuariosData = this.mapearDatosUsuarios(this.registros);
        this.totalElements = response.totalElements || 0;
        this.loadingRegistros = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar registros:', err);
        this.usuariosData = [];
        this.totalElements = 0;
        this.loadingRegistros = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapearDatosUsuarios(registros: Register[]): any[] {
    return registros.map(registro => ({
      nombre: registro.patientBasicInfo?.name || 'No disponible',
      documento: registro.patientIdentificationNumber,
      fechaRegistro: new Date(registro.registerDate).toLocaleDateString(),
      registradoPor: registro.healthProfessional?.name || 'Desconocido'
    }));
  }
}
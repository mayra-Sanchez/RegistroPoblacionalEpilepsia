import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaRegistroService } from './services/consola-registro.service';
import { Variable, UserResponse, ResearchLayer, Register } from './interfaces';
import { ChangeDetectorRef } from '@angular/core';

/**
 * Componente principal de la consola de registro
 * 
 * Este componente gestiona la interfaz de usuario para el registro y consulta de datos
 * de pacientes en un contexto de investigación médica. Proporciona:
 * - Visualización de datos del usuario y su capa de investigación asignada
 * - Gestión de registros de pacientes con paginación
 * - Modales para ver/editar registros
 * - Estadísticas de registros
 * - Navegación entre diferentes vistas
 * 
 * @example
 * <app-consola-registro></app-consola-registro>
 */
@Component({
  selector: 'app-consola-registro',
  templateUrl: './consola-registro.component.html',
  styleUrls: ['./consola-registro.component.css']
})
export class ConsolaRegistroComponent implements OnInit {
  /**
   * Pestaña actualmente seleccionada
   * @default 'inicioDigitador'
   */
  selectedTab: string = 'inicioDigitador';

  /**
   * Indica si se está cargando información inicial
   */
  isLoading: boolean = true;

  /**
   * Mensaje de error para mostrar al usuario
   */
  errorMessage: string | null = null;

  /**
   * Listado de variables asociadas a la capa de investigación
   */
  variablesDeCapa: Variable[] = [];

  /**
   * Indica si se están cargando las variables
   */
  loadingVariables: boolean = false;

  /**
   * Datos del usuario autenticado
   */
  userData: UserResponse | null = null;

  /**
   * Capa de investigación asignada al usuario
   */
  currentResearchLayer: ResearchLayer | null = null;

  /**
   * Página actual en la paginación
   */
  currentPage: number = 0;

  /**
   * Tamaño de página para la paginación
   * @default 10
   */
  pageSize: number = 10;

  /**
   * Total de elementos disponibles
   */
  totalElements: number = 0;

  /**
   * Total de páginas disponibles
   */
  totalPages: number = 0;

  /**
   * Listado de registros de pacientes
   */
  registros: Register[] = [];

  /**
   * Indica si se están cargando los registros
   */
  loadingRegistros: boolean = false;

  /**
   * Nombre del jefe de investigación
   * @default 'Cargando...'
   */
  jefeInvestigacion: string = 'Cargando...';

  /**
   * Contacto de investigación
   * @default 'Cargando...'
   */
  contactoInvestigacion: string = 'Cargando...';

  /**
   * Descripción de la investigación
   * @default 'Cargando descripción...'
   */
  DescripcionInvestigacion: string = 'Cargando descripción...';

  /**
   * Total de pacientes registrados
   */
  totalPacientes: number = 0;

  /**
   * Pacientes registrados hoy
   */
  pacientesHoy: number = 0;

  /**
   * Registros pendientes de revisión
   */
  registrosPendientes: number = 0;

  /**
   * Controla la visibilidad del modal de visualización
   */
  showViewModal: boolean = false;

  /**
   * Controla la visibilidad del modal de edición
   */
  showEditModal: boolean = false;

  /**
   * Registro seleccionado para visualización/edición
   */
  selectedRegistro: Register | null = null;

  /**
   * Registros más recientes para el dashboard
   */
  registrosRecientes: any[] = [];

  /**
   * Datos para la tabla de usuarios
   */
  usuariosData: any[] = [];

  /**
   * Columnas para la tabla de usuarios
   */
  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'documento', header: 'Número de documento' },
    { field: 'fechaRegistro', header: 'Fecha de último registro' },
    { field: 'registradoPor', header: 'Registrado por' }
  ];

  /**
   * Constructor del componente
   * 
   * @param authService Servicio de autenticación
   * @param consolaService Servicio para operaciones de registro
   * @param cdr Servicio para detección de cambios
   */
  constructor(
    private authService: AuthService,
    private consolaService: ConsolaRegistroService,
    private cdr: ChangeDetectorRef
  ) { }

  /**
   * Método del ciclo de vida que se ejecuta al inicializar el componente
   */
  ngOnInit() {
    this.loadUserData();
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  get username(): string {
    return this.userData ? `${this.userData.firstName} ${this.userData.lastName}` : 'Usuario';
  }

  /**
   * Obtiene el nombre de la capa de investigación asignada
   */
  get capaUsuario(): string {
    return this.currentResearchLayer?.layerName || 'No asignada';
  }

  /**
   * Obtiene el rol del usuario
   */
  get userRole(): string {
    return this.userData?.attributes?.role?.[0] || 'Usuario';
  }

  /**
   * Carga los datos del usuario autenticado
   */
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

  /**
   * Carga la capa de investigación asignada al usuario
   */
  loadCapaInvestigacion() {
    const nombreCapa = this.userData?.attributes?.researchLayerId?.[0];

    if (!nombreCapa) {
      console.warn('No se encontró nombre de capa en userData');
      this.isLoading = false;
      return;
    }

    this.consolaService.buscarCapaPorNombre(nombreCapa).subscribe({
      next: (capa) => {
        this.currentResearchLayer = capa;
        this.updateDatosCapa(capa);

        if (capa.id) {
          this.loadVariablesDeCapa(capa.id);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar capa:', err);
        this.handleError(err.message);
        this.setDefaultCapaValues();
      }
    });
  }

  /**
   * Carga las variables asociadas a una capa de investigación
   * 
   * @param researchLayerId ID de la capa de investigación
   */
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

  /**
   * Carga los datos específicos para usuarios con rol Doctor
   */
  loadDoctorData() {
    this.loadRegistros();
  }

  /**
   * Maneja el cambio de página en la paginación
   * 
   * @param event Evento de cambio de página
   */
  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadRegistros(event.page, event.rows);
  }

  /**
   * Navega a una vista específica
   * 
   * @param destination Destino de la navegación
   */
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

  /**
   * Cambia la pestaña seleccionada
   * 
   * @param tab Nombre de la pestaña a seleccionar
   */
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  /**
   * Maneja la visualización de un registro
   * 
   * @param registro Registro a visualizar
   */
  handleView(registro: any) {
    if (registro.registerId) {
      this.selectedRegistro = registro;
    } 
    else {
      this.selectedRegistro = this.registros.find(r => 
        r.patientIdentificationNumber === registro.documento) || null;
    }
    
    if (this.selectedRegistro) {
      this.showViewModal = true;
    } else {
      console.error('Registro no encontrado');
    }
  }

  /**
   * Maneja la edición de un registro
   * 
   * @param row Fila con los datos del registro a editar
   */
  handleEdit(row: any) {
    const registroEncontrado = this.registros.find(r => 
      r.patientIdentificationNumber === row.documento);
    
    if (!registroEncontrado) {
      console.error('Registro no encontrado');
      return;
    }
  
    this.selectedRegistro = JSON.parse(JSON.stringify(registroEncontrado)) as Register;
    this.showEditModal = true;
  }

  /**
   * Cierra el modal de visualización
   */
  closeViewModal() {
    this.showViewModal = false;
    this.selectedRegistro = null;
  }

  /**
   * Cierra el modal de edición
   */
  closeEditModal() {
    this.showEditModal = false;
    this.selectedRegistro = null;
  }

  /**
   * Guarda los cambios realizados a un registro
   * 
   * @param updatedRegistro Registro con los cambios
   */
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

  /**
   * Carga los registros de pacientes con paginación
   * 
   * @param page Página a cargar
   * @param size Tamaño de la página
   * @param query Término de búsqueda (opcional)
   */
  loadRegistros(page: number = 0, size: number = 10, query: string = '') {
    this.loadingRegistros = true;
  
    this.consolaService.obtenerRegistros(page, size).subscribe({
      next: (response) => {
        this.registros = response.registers || [];
        this.usuariosData = this.mapearDatosUsuarios(this.registros);
        this.totalElements = response.totalElements || 0;
        
        this.totalPacientes = this.totalElements;
        
        this.actualizarRegistrosRecientes(this.registros);
        
        this.loadingRegistros = false;
        this.cdr.detectChanges();
        console.log("estos son lso registros, ", this.registros);
      },
      error: (err) => {
        console.error('Error al cargar registros:', err);
        this.usuariosData = [];
        this.registrosRecientes = [];
        this.totalElements = 0;
        this.totalPacientes = 0;
        this.pacientesHoy = 0;
        this.loadingRegistros = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualiza los datos de la capa de investigación en la vista
   * 
   * @param capa Datos de la capa de investigación
   */
  private updateDatosCapa(capa: ResearchLayer) {
    this.DescripcionInvestigacion = capa?.description || 'Descripción no disponible';
    this.jefeInvestigacion = capa?.layerBoss?.name || 'Jefe no asignado';

    try {
      this.cdr.detectChanges();
    } catch (e) {
      console.warn('Error en detección de cambios:', e);
    }
  }

  /**
   * Establece valores por defecto para los datos de la capa
   */
  private setDefaultCapaValues() {
    this.DescripcionInvestigacion = 'Información no disponible';
    this.jefeInvestigacion = 'No asignado';
    this.contactoInvestigacion = 'contacto@investigacion.com';
  }

  /**
   * Maneja errores durante la carga de datos
   * 
   * @param message Mensaje de error
   */
  private handleError(message: string) {
    console.error(message);
    this.errorMessage = message;
    this.isLoading = false;
    this.setDefaultCapaValues();
  }

  /**
   * Muestra errores relacionados con la carga de variables
   * 
   * @param mensaje Mensaje de error
   */
  private mostrarErrorVariables(mensaje: string) {
    console.error(mensaje);
    this.errorMessage = mensaje;
  }

  /**
   * Mapea los registros al formato necesario para la tabla de usuarios
   * 
   * @param registros Listado de registros
   * @returns Datos formateados para la tabla
   */
  private mapearDatosUsuarios(registros: Register[]): any[] {
    return registros.map(registro => ({
      nombre: registro.patientBasicInfo?.name || 'No disponible',
      documento: registro.patientIdentificationNumber,
      fechaRegistro: new Date(registro.registerDate).toLocaleDateString(),
      registradoPor: registro.healthProfessional?.name || 'Desconocido'
    }));
  }

  /**
   * Actualiza la lista de registros recientes
   * 
   * @param registros Listado completo de registros
   */
  private actualizarRegistrosRecientes(registros: Register[]): void {
    this.registrosRecientes = registros
      .sort((a, b) => new Date(b.registerDate).getTime() - new Date(a.registerDate).getTime())
      .slice(0, 5)
      .map(registro => ({
        ...registro,
        nombre: registro.patientBasicInfo?.name || 'Nombre no disponible',
        fecha: registro.registerDate,
        documento: registro.patientIdentificationNumber
      }));
  }
}
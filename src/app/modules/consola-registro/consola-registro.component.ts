import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaRegistroService } from './services/consola-registro.service';
import { Variable, UserResponse, ResearchLayer, Register } from './interfaces';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import Swal from 'sweetalert2';

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
  //#region Propiedades del Componente

  /**
   * Pestaña actualmente seleccionada en la interfaz
   * @default 'inicioDigitador'
   */
  selectedTab: string = 'inicioDigitador';

  /**
   * Indica si se está cargando información inicial
   * @type {boolean}
   */
  isLoading: boolean = true;

  /**
   * Mensaje de error para mostrar al usuario
   * @type {string | null}
   */
  errorMessage: string | null = null;

  /**
   * Listado de variables asociadas a la capa de investigación
   * @type {Variable[]}
   */
  variablesDeCapa: Variable[] = [];

  /**
   * Indica si se están cargando las variables
   * @type {boolean}
   */
  loadingVariables: boolean = false;

  /**
   * Datos del usuario autenticado
   * @type {UserResponse | null}
   */
  userData: UserResponse | null = null;

  /**
   * Capa de investigación asignada al usuario
   * @type {ResearchLayer | null}
   */
  currentResearchLayer: ResearchLayer | null = null;

  //#region Propiedades de Paginación

  /**
   * Página actual en la paginación
   * @type {number}
   * @default 0
   */
  currentPage: number = 0;

  /**
   * Tamaño de página para la paginación
   * @type {number}
   * @default 10
   */
  pageSize: number = 10;

  /**
   * Total de elementos disponibles
   * @type {number}
   */
  totalElements: number = 0;

  /**
   * Total de páginas disponibles
   * @type {number}
   */
  totalPages: number = 0;

  //#endregion

  /**
   * Listado de registros de pacientes
   * @type {Register[]}
   */
  registros: Register[] = [];

  /**
   * Indica si se están cargando los registros
   * @type {boolean}
   */
  loadingRegistros: boolean = false;

  /**
   * Nombre del jefe de investigación
   * @type {string}
   * @default 'Cargando...'
   */
  jefeInvestigacion: string = 'Cargando...';

  /**
   * Descripción de la investigación
   * @type {string}
   * @default 'Cargando descripción...'
   */
  DescripcionInvestigacion: string = 'Cargando descripción...';

  /**
   * Total de pacientes registrados
   * @type {number}
   */
  totalPacientes: number = 0;

  /**
   * Pacientes registrados hoy
   * @type {number}
   */
  pacientesHoy: number = 0;

  //#region Propiedades de Modales

  /**
   * Controla la visibilidad del modal de visualización
   * @type {boolean}
   */
  showViewModal: boolean = false;

  /**
   * Controla la visibilidad del modal de edición
   * @type {boolean}
   */
  showEditModal: boolean = false;

  /**
   * Registro seleccionado para visualización/edición
   * @type {Register | null}
   */
  selectedRegistro: Register | null = null;

  //#endregion

  /**
   * Registros más recientes para el dashboard
   * @type {any[]}
   */
  registrosRecientes: any[] = [];

  /**
   * Datos para la tabla de usuarios
   * @type {any[]}
   */
  usuariosData: any[] = [];

  /**
   * Controla la visibilidad del modal de búsqueda por profesional
   * @type {boolean}
   */
  showBuscarProfesionalModal = false;

  /**
   * Modo actual de búsqueda
   * @type {'default' | 'profesional' | 'paciente'}
   * @default 'default'
   */
  modoBusqueda: 'default' | 'profesional' | 'paciente' = 'default';

  /**
   * Identificación del profesional buscado
   * @type {string}
   */
  profesionalBuscado: string = '';

  /**
   * Controla la visibilidad del modal de búsqueda por paciente
   * @type {boolean}
   */
  showBuscarPacienteModal = false;

  /**
   * Identificación del paciente buscado
   * @type {string}
   */
  pacienteBuscado: string = '';

  /**
   * Columnas para la tabla de usuarios
   * @type {Array<{field: string, header: string}>}
   */
  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'documento', header: 'Número de documento' },
    { field: 'fechaRegistro', header: 'Fecha de último registro' },
    { field: 'registradoPor', header: 'Registrado por' }
  ];

  //#endregion

  //#region Constructor

  /**
   * Constructor del componente
   * @param authService Servicio de autenticación
   * @param consolaService Servicio para operaciones de registro
   * @param cdr Servicio para detección de cambios
   * @param ngZone Servicio para ejecutar código dentro de la zona Angular
   */
  constructor(
    private authService: AuthService,
    private consolaService: ConsolaRegistroService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    // Suscripción a cambios en los datos
    this.consolaService.dataChanged$.subscribe(() => {
      this.refreshData();
    });
  }

  //#endregion

  //#region Métodos del Ciclo de Vida

  /**
   * Método del ciclo de vida que se ejecuta al inicializar el componente
   * @async
   */
  async ngOnInit() {
    try {
      await this.loadUserData();
      await this.loadCapaInvestigacion();
      this.loadRegistros();
      this.refreshData();
    } catch (error) {
      this.handleError('Error al inicializar componente');
    }
  }

  //#endregion

  //#region Propiedades Computadas

  /**
   * Obtiene el nombre completo del usuario
   * @returns {string} Nombre completo o 'Usuario' si no hay datos
   */
  get username(): string {
    return this.userData ? `${this.userData.firstName} ${this.userData.lastName}` : 'Usuario';
  }

  /**
   * Obtiene el nombre de la capa de investigación asignada
   * @returns {string} Nombre de la capa o 'No asignada'
   */
  get capaUsuario(): string {
    return this.currentResearchLayer?.layerName || 'No asignada';
  }

  /**
   * Obtiene el rol del usuario
   * @returns {string} Rol del usuario o 'Usuario' por defecto
   */
  get userRole(): string {
    return this.userData?.attributes?.role?.[0] || 'Usuario';
  }

  //#endregion

  //#region Métodos de Carga de Datos

  /**
   * Carga los datos del usuario autenticado
   * @returns {Promise<void>} Promesa que se resuelve cuando se completó la carga
   */
  loadUserData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.errorMessage = null;
  
      const email = this.authService.getUserEmail();
      if (!email) {
        this.handleError('No se pudo obtener el email del usuario');
        reject('Email no disponible');
        return;
      }
  
      this.consolaService.obtenerUsuarioAutenticado(email).subscribe({
        next: (response) => {
          if (!response?.[0]) {
            this.handleError('Respuesta del servicio inválida');
            reject('Respuesta inválida');
            return;
          }
  
          this.userData = response[0];
          resolve();
        },
        error: (err) => {
          this.handleError(err.message);
          reject(err);
        }
      });
    });
  }

  /**
   * Carga la capa de investigación asignada al usuario
   * @returns {Promise<void>} Promesa que se resuelve cuando se completó la carga
   */
  loadCapaInvestigacion(): Promise<void> {
    return new Promise((resolve, reject) => {
      const researchLayerId = this.userData?.attributes?.researchLayerId?.[0];
  
      if (!researchLayerId) {
        console.warn('No se encontró ID de capa en userData');
        this.isLoading = false;
        this.setDefaultCapaValues();
        reject('No hay ID de capa');
        return;
      }
  
      this.consolaService.obtenerCapaPorId(researchLayerId).subscribe({
        next: (capa) => {
          if (!capa?.id) {
            console.warn('Capa sin ID recibida');
            reject('Capa inválida');
            return;
          }
  
          this.currentResearchLayer = capa;
          this.updateDatosCapa(capa);
          this.loadVariablesDeCapa(capa.id);
          this.isLoading = false;
          resolve();
        },
        error: (err) => {
          console.error('Error al cargar capa:', err);
          this.handleError(err.message);
          this.setDefaultCapaValues();
          reject(err);
        }
      });
    });
  }

  /**
   * Carga las variables asociadas a una capa de investigación
   * @param {string} researchLayerId ID de la capa de investigación
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
   * Carga los registros de pacientes con paginación
   * @param {number} [page=0] Página a cargar
   * @param {number} [size=10] Tamaño de la página
   * @param {string} [query=''] Término de búsqueda (opcional)
   */
  loadRegistros(page: number = 0, size: number = 10, query: string = '') {
    if (!this.currentResearchLayer?.id) {
      console.warn('No hay capa de investigación asignada - Intentando cargar...');
      
      this.loadCapaInvestigacion().then(() => {
        if (this.currentResearchLayer?.id) {
          this.loadRegistros(page, size, query);
        } else {
          this.resetRegistros();
          this.showErrorAlert('No se pudo asignar una capa de investigación');
        }
      }).catch(err => {
        this.resetRegistros();
        console.error('Error al cargar capa:', err);
      });
      
      return;
    }
  
    this.loadingRegistros = true;
  
    this.consolaService.obtenerRegistrosPorCapa(
      this.currentResearchLayer.id,
      page,
      size
    ).subscribe({
      next: (response) => this.procesarRespuestaRegistros(response),
      error: (err: any) => {
        console.error('Error al cargar registros:', err);
        this.resetRegistros();
        this.showErrorAlert('Error al cargar registros. Por favor intente nuevamente.');
      }
    });
  }

  /**
   * Carga registros filtrados por profesional
   * @param {number} healthProfessionalId ID del profesional
   * @param {number} [page=0] Página a cargar
   * @param {number} [size=10] Tamaño de la página
   */
  loadRegistrosPorProfesional(healthProfessionalId: number, page: number = 0, size: number = 10) {
    this.loadingRegistros = true;

    this.consolaService.obtenerRegistrosPorProfesional(healthProfessionalId, page, size)
      .subscribe({
        next: (response) => this.procesarRespuestaRegistros(response),
        error: (err) => {
          console.error('Error al cargar registros por profesional:', err);
          this.resetRegistros();
        }
      });
  }

  /**
   * Carga registros filtrados por paciente
   * @param {number} patientIdentificationNumber ID del paciente
   * @param {number} [page=0] Página a cargar
   * @param {number} [size=10] Tamaño de la página
   */
  loadRegistrosPorPaciente(patientIdentificationNumber: number, page: number = 0, size: number = 10) {
    this.loadingRegistros = true;
  
    this.consolaService.obtenerRegistrosPorPaciente(patientIdentificationNumber, page, size)
      .subscribe({
        next: (response) => this.procesarRespuestaRegistros(response),
        error: (err) => {
          console.error('Error al cargar registros por paciente:', err);
          this.resetRegistros();
        }
      });
  }

  //#endregion

  //#region Métodos de Navegación

  /**
   * Navega a una vista específica
   * @param {string} destination Destino de la navegación
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
   * @param {string} tab Nombre de la pestaña a seleccionar
   */
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  //#endregion

  //#region Métodos de Gestión de Registros

  /**
   * Maneja la visualización de un registro
   * @param {any} registro Puede ser un objeto completo Register o un item de la tabla/lista
   */
  handleView(registro: any): void {
    if (registro?._fullData) {
      this.selectedRegistro = registro._fullData;
    } else if (registro?.registerId) {
      this.selectedRegistro = registro;
    } else {
      const registroCompleto = this.registros.find(r =>
        r.patientIdentificationNumber === registro.documento ||
        r.registerId === registro.id
      );
      this.selectedRegistro = registroCompleto || registro;
    }

    this.showViewModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Maneja la edición de un registro
   * @param {any} row Fila con los datos del registro a editar
   */
  handleEdit(row: any): void {
    this.selectedRegistro = { ...row._fullData }; // Copia para edición
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Guarda los cambios realizados a un registro
   * @param {Register} updatedRegistro Registro con los cambios
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
        this.refreshData();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
  }

  //#endregion

  //#region Métodos de Modales

  /**
   * Cierra el modal de visualización
   */
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedRegistro = null;
    this.cdr.detectChanges();
  }

  /**
   * Cierra el modal de edición
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedRegistro = null;
    this.cdr.detectChanges();
  }

  /**
   * Abre el modal de búsqueda por profesional
   */
  abrirBusquedaPorProfesional() {
    this.showBuscarProfesionalModal = true;
  }

  /**
   * Cierra el modal de búsqueda por profesional
   */
  cerrarBusquedaPorProfesional() {
    this.showBuscarProfesionalModal = false;
  }

  /**
   * Realiza búsqueda por profesional
   * @param {number} identificacion ID del profesional
   */
  buscarPorProfesional(identificacion: number) {
    this.modoBusqueda = 'profesional';
    this.profesionalBuscado = identificacion.toString();
    this.loadRegistrosPorProfesional(identificacion);
    this.cerrarBusquedaPorProfesional();
  }

  /**
   * Abre el modal de búsqueda por paciente
   */
  abrirBusquedaPorPaciente() {
    this.showBuscarPacienteModal = true;
  }

  /**
   * Cierra el modal de búsqueda por paciente
   */
  cerrarBusquedaPorPaciente() {
    this.showBuscarPacienteModal = false;
  }

  /**
   * Realiza búsqueda por paciente
   * @param {number} identificacion ID del paciente
   */
  buscarPorPaciente(identificacion: number) {
    this.modoBusqueda = 'paciente';
    this.pacienteBuscado = identificacion.toString();
    this.loadRegistrosPorPaciente(identificacion);
    this.cerrarBusquedaPorPaciente();
  }

  //#endregion

  //#region Métodos de Utilidad

  /**
   * Refresca los datos de la tabla según la pestaña actual
   */
  refreshData(): void {
    switch (this.selectedTab) {
      case 'listadoPacientes':
      case 'consultaDatosDigitador':
        this.loadRegistros(this.currentPage, this.pageSize);
        break;
      case 'inicioDigitador':
        this.loadRegistros(0, 5);
        break;
      default:
        break;
    }
  }

  /**
   * Resetea la búsqueda a su estado por defecto
   */
  resetearBusqueda() {
    this.modoBusqueda = 'default';
    this.profesionalBuscado = '';
    this.pacienteBuscado = '';
    this.loadRegistros();
  }

  /**
   * Maneja el cambio de página en la paginación
   * @param {any} event Evento de cambio de página
   */
  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    
    if (this.modoBusqueda === 'profesional') {
      this.loadRegistrosPorProfesional(Number(this.profesionalBuscado), event.page, event.rows);
    } else if (this.modoBusqueda === 'paciente') {
      this.loadRegistrosPorPaciente(Number(this.pacienteBuscado), event.page, event.rows);
    } else {
      this.loadRegistros(event.page, event.rows);
    }
  }

  //#endregion

  //#region Métodos Privados

  /**
   * Procesa la respuesta de los registros y actualiza el estado del componente
   * @param {any} response Respuesta del servicio
   * @private
   */
  private procesarRespuestaRegistros(response: any): void {
    this.registros = response.registers || [];
  
    this.usuariosData = this.registros.map(registro => ({
      nombre: registro.patientBasicInfo?.name || 'No disponible',
      documento: registro.patientIdentificationNumber.toString(),
      fechaRegistro: registro.registerDate
        ? new Date(registro.registerDate).toLocaleDateString()
        : 'Fecha no disponible',
      registradoPor: registro.healthProfessional?.name || 'Desconocido',
      _fullData: registro
    }));
  
    this.currentPage = response.currentPage || 0;
    this.totalPages = response.totalPages || 0;
    this.totalElements = response.totalElements || 0;
    this.totalPacientes = this.totalElements;
  
    this.registrosRecientes = this.registros
      .sort((a, b) => new Date(b.registerDate).getTime() - new Date(a.registerDate).getTime())
      .slice(0, 3)
      .map(registro => ({
        nombre: registro.patientBasicInfo?.name || 'No disponible',
        documento: registro.patientIdentificationNumber.toString(),
        fecha: registro.registerDate,
        registradoPor: registro.healthProfessional?.name || 'Desconocido',
        _fullData: registro
      }));
  
    this.loadingRegistros = false;
    this.cdr.detectChanges();
  }

  /**
   * Actualiza los datos de la capa de investigación en la vista
   * @param {ResearchLayer} capa Datos de la capa de investigación
   * @private
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
   * @private
   */
  private setDefaultCapaValues() {
    this.DescripcionInvestigacion = 'Información no disponible';
    this.jefeInvestigacion = 'No asignado';
  }

  /**
   * Maneja errores durante la carga de datos
   * @param {string} message Mensaje de error
   * @private
   */
  private handleError(message: string) {
    console.error(message);
    this.errorMessage = message;
    this.isLoading = false;
    this.setDefaultCapaValues();
  }

  /**
   * Muestra errores relacionados con la carga de variables
   * @param {string} mensaje Mensaje de error
   * @private
   */
  private mostrarErrorVariables(mensaje: string) {
    console.error(mensaje);
    this.errorMessage = mensaje;
  }

  /**
   * Muestra un mensaje de error al usuario
   * @param {string} message Mensaje de error
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
   * Resetea los registros a su estado inicial
   * @private
   */
  private resetRegistros() {
    this.registros = [];
    this.usuariosData = [];
    this.registrosRecientes = [];
    this.totalElements = 0;
    this.loadingRegistros = false;
    this.cdr.detectChanges();
  }

  //#endregion
}
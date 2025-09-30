/**
 * Componente principal para la consola de registro de pacientes
 * 
 * Este componente gestiona la interfaz de usuario para el registro, consulta
 * y administración de pacientes dentro del sistema de investigación.
 * 
 * @author [Mayra Sanchez]
 * @version 1.0
 * @since 2025
 */

import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ConsolaRegistroService } from 'src/app/services/register.service';
import { AuthService } from 'src/app/services/auth.service';
import { Variable, UserResponse, ResearchLayer, Register, RegisterHistory, RegisterHistoryResponse } from './interfaces';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { catchError, forkJoin, of } from 'rxjs';
import { ViewRegistroModalComponent } from './components/view-registro-modal/view-registro-modal.component';
import { VersionamientoModalComponent } from './components/versionamiento-modal/versionamiento-modal.component';
import { EditRegistroModalComponent } from './components/edit-registro-modal/edit-registro-modal.component';

@Component({
  selector: 'app-consola-registro',
  templateUrl: './consola-registro.component.html',
  styleUrls: ['./consola-registro.component.css']
})
export class ConsolaRegistroComponent implements OnInit {
  //#region Propiedades del Componente

  /** Pestaña actualmente seleccionada en la interfaz */
  selectedTab: string = 'inicioDigitador';

  /** Indica si el componente está cargando datos iniciales */
  isLoading: boolean = true;

  /** Mensaje de error a mostrar en caso de fallo */
  errorMessage: string | null = null;

  /** Lista de variables disponibles para la capa de investigación actual */
  variablesDeCapa: Variable[] = [];

  /** Indica si las variables están siendo cargadas */
  loadingVariables: boolean = false;

  /** Datos del usuario autenticado */
  userData: UserResponse | null = null;

  /** Capa de investigación actualmente seleccionada */
  currentResearchLayer: ResearchLayer | null = null;

  /** Página actual en la paginación */
  currentPage: number = 0;

  /** Tamaño de página para la paginación */
  pageSize: number = 10;

  /** Total de elementos disponibles */
  totalElements: number = 0;

  /** Total de páginas disponibles */
  totalPages: number = 0;

  /** Lista de registros de pacientes */
  registros: Register[] = [];

  /** Indica si los registros están siendo cargados */
  loadingRegistros: boolean = false;

  /** Nombre del jefe de investigación de la capa actual */
  jefeInvestigacion: string = 'Cargando...';

  /** Descripción de la investigación actual */
  DescripcionInvestigacion: string = 'Cargando descripción...';

  /** Total de pacientes únicos registrados */
  totalPacientes: number = 0;

  /** Número de pacientes registrados hoy */
  pacientesHoy: number = 0;

  /** Controla la visibilidad del modal de edición */
  showEditModal: boolean = false;

  /** Variables para controlar el modal */
  showUploadConsentimientoModal: boolean = false;

  /** Registro seleccionado para edición */
  selectedRegistro: Register | null = null;

  /** Lista de registros recientes para el dashboard */
  registrosRecientes: any[] = [];

  /** Datos transformados para mostrar en la tabla de usuarios */
  usuariosData: any[] = [];

  /** Columnas configuradas para la tabla de usuarios */
  usuariosColumns = [
    { field: 'pacienteNombre', header: 'Paciente' },
    { field: 'documento', header: 'Documento' },
    { field: 'operacion', header: 'Operación' },
    { field: 'realizadoPor', header: 'Realizado por' },
    { field: 'fechaCambio', header: 'Fecha de cambio' },
    { field: 'capaInvestigacion', header: 'Capa de investigación' }
  ];

  /** ID de la capa de investigación seleccionada */
  selectedLayerId: string = '';

  /** Lista de capas de investigación disponibles para el usuario */
  availableLayers: ResearchLayer[] = [];

  /** Controla la visibilidad del modal de consentimiento informado */
  showConsentimientoModal = false;

  /** Paciente seleccionado para el consentimiento informado */
  selectedPaciente: any;

  /** Fecha de la última actualización de datos */
  lastUpdate: Date = new Date();

  //#endregion

  //#region Constructor

  /**
   * Constructor del componente
   * @param authService Servicio de autenticación
   * @param consolaService Servicio para operaciones de registro
   * @param cdr Servicio para detección de cambios
   * @param ngZone Servicio para ejecución en zona Angular
   * @param dialog Servicio para manejo de modales
   */
  constructor(
    private authService: AuthService,
    private consolaService: ConsolaRegistroService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog
  ) {
    // Suscripción a cambios de datos para refrescar automáticamente
    this.consolaService.dataChanged$.subscribe(() => {
      this.ngZone.run(() => this.refreshData());
    });
  }

  //#endregion

  //#region Métodos del Ciclo de Vida

  /**
   * Inicialización del componente
   * Carga los datos iniciales necesarios para el funcionamiento
   */
  async ngOnInit() {
    try {
      await this.loadUserData();
      await this.loadAvailableLayers();

      if (this.availableLayers.length === 0) {
        this.showErrorAlert('No tienes capas de investigación asignadas o no se pudieron cargar');
        this.selectedLayerId = '';
        return;
      }

      const savedLayerId = localStorage.getItem('selectedLayerId');
      let initialLayerId = this.availableLayers[0].id;

      if (savedLayerId && this.availableLayers.some(l => l.id === savedLayerId)) {
        initialLayerId = savedLayerId;
      }

      await this.loadCapaInvestigacion(initialLayerId);
      this.loadHistorial();
      this.loadVariablesDeCapa(initialLayerId);

    } catch (error) {
      this.selectedLayerId = '';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  //#endregion

  //#region Propiedades Computadas

  /**
   * Obtiene el nombre completo del usuario autenticado
   */
  get username(): string {
    return this.userData ? `${this.userData.firstName} ${this.userData.lastName}` : 'Usuario';
  }

  /**
   * Obtiene el nombre de la capa de investigación actual
   */
  get capaUsuario(): string {
    return this.currentResearchLayer?.layerName || 'No asignada';
  }

  /**
   * Obtiene el rol del usuario autenticado
   */
  get userRole(): string {
    return this.userData?.attributes?.role?.[0] || 'Usuario';
  }

  //#endregion

  //#region Métodos Públicos

  /**
   * Maneja el evento de registro guardado exitosamente
   * Actualiza los datos y muestra feedback al usuario
   */
  onRegistroGuardado(): void {
    this.refreshData();
    this.lastUpdate = new Date();

    Swal.fire({
      title: '¡Éxito!',
      text: 'Registro guardado correctamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  /**
   * Obtiene la clase CSS correspondiente a una operación específica
   * @param operacion Tipo de operación realizada
   * @returns Clase CSS para estilizar la operación
   */
  getOperacionClass(operacion: string): string {
    const clases: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'operation-created',
      'REGISTER_UPDATED': 'operation-updated',
      'UPDATE_RESEARCH_LAYER': 'operation-updated',
      'REGISTER_DELETED': 'operation-deleted',
      'CREATE_RESEARCH_LAYER': 'operation-created'
    };
    return clases[operacion] || 'operation-default';
  }

  /**
   * Maneja el cambio de capa de investigación
   * @param event Evento de cambio del select
   */
  onLayerChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const layerId = selectElement.value;

    if (!layerId) {
      this.handleError('No se seleccionó ninguna capa de investigación');
      const layerIds = this.userData?.attributes?.researchLayerId;
      this.selectedLayerId = layerIds && layerIds.length > 0 ? layerIds[0] : '';
      localStorage.setItem('selectedLayerId', this.selectedLayerId);
      this.cdr.detectChanges();
      return;
    }

    const layerIds = this.userData?.attributes?.researchLayerId;
    if (!layerIds?.includes(layerId)) {
      this.handleError('La capa seleccionada no está asignada a este usuario');
      this.selectedLayerId = layerIds && layerIds.length > 0 ? layerIds[0] : '';
      localStorage.setItem('selectedLayerId', this.selectedLayerId);
      this.cdr.detectChanges();
      return;
    }

    this.ngZone.run(() => {
      this.resetComponentState();
      this.selectedLayerId = layerId;
      localStorage.setItem('selectedLayerId', layerId);

      this.loadCapaInvestigacion(layerId)
        .then(() => {
          this.loadHistorial(0, 5);
          this.loadVariablesDeCapa(layerId);
          this.refreshData();

          const selectedLayer = this.availableLayers.find(l => l.id === layerId);
          if (selectedLayer) {
            Swal.fire({
              title: 'Capa cambiada',
              text: `Ahora estás trabajando en: ${selectedLayer.layerName}`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        })
        .catch(error => {
          this.handleError('Error al cambiar de capa de investigación');
          const layerIds = this.userData?.attributes?.researchLayerId;
          this.selectedLayerId = layerIds && layerIds.length > 0 ? layerIds[0] : '';
          localStorage.setItem('selectedLayerId', this.selectedLayerId);
          this.cdr.detectChanges();
        });
    });
  }

  /**
   * Navega a una vista específica dentro del componente
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
   * @param tab Nombre de la pestaña a seleccionar
   */
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  /**
   * Maneja la visualización de un registro específico
   * @param item Elemento del historial a visualizar
   */
  handleView(item: any): void {

    const patientId = item.patientIdentificationNumber ||
      item._fullData?.patientIdentificationNumber ||
      (item.documento && parseInt(item.documento));

    if (!patientId) {
      console.warn('No se puede identificar al paciente', item);
      Swal.fire({
        title: 'Información no disponible',
        text: 'No se puede identificar al paciente para cargar los datos',
        icon: 'warning',
        timer: 3000
      });
      return;
    }

    const researchLayerId = this.selectedLayerId;

    if (!researchLayerId) {
      Swal.fire({
        title: 'Error',
        text: 'No hay una capa de investigación seleccionada',
        icon: 'error',
        timer: 3000
      });
      return;
    }

    Swal.fire({
      title: 'Cargando información...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.consolaService.getActualRegisterByPatient(patientId, researchLayerId).subscribe({
      next: (registroActual) => {
        Swal.close();

        if (!registroActual) {
          this.mostrarModalConDatosHistorial(item);
          return;
        }

        this.abrirModalConDatosActuales(registroActual, item);
      },
      error: (error) => {
        console.error('Error al cargar datos actuales:', error);
        Swal.close();
        this.mostrarModalConDatosHistorial(item);
      }
    });
  }

  /**
   * Maneja la edición de un registro
   * @param item Elemento del historial a editar
   */
  handleEdit(item: any): void {
    console.log('🔄 Iniciando edición para:', item);

    const patientId = item.patientIdentificationNumber ||
      item._fullData?.patientIdentificationNumber ||
      (item.documento && parseInt(item.documento));

    if (!patientId) {
      Swal.fire({
        title: 'Error',
        text: 'No se puede identificar al paciente para editar',
        icon: 'error',
        timer: 3000
      });
      return;
    }

    if (!this.selectedLayerId) {
      Swal.fire({
        title: 'Error',
        text: 'No hay una capa de investigación seleccionada',
        icon: 'error',
        timer: 3000
      });
      return;
    }

    Swal.fire({
      title: 'Cargando datos...',
      text: 'Preparando formulario de edición',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.consolaService.getActualRegisterByPatient(patientId, this.selectedLayerId).subscribe({
      next: (registroActual) => {
        Swal.close();

        if (!registroActual) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los datos del paciente para editar',
            icon: 'error'
          });
          return;
        }

        this.abrirModalEdicion(registroActual);
      },
      error: (error) => {
        Swal.close();

        Swal.fire({
          title: 'Error',
          text: 'Error al cargar los datos del paciente: ' + (error.message || 'Error desconocido'),
          icon: 'error'
        });
      }
    });
  }

  /**
   * Abre el modal de edición con los datos del registro
   * @param registroActual Registro actual del paciente
   */
  private abrirModalEdicion(registroActual: Register): void {
    try {
      const dialogRef = this.dialog.open(EditRegistroModalComponent, {
        width: '95%',
        maxWidth: '1400px',
        data: {
          registro: registroActual,
          variables: this.variablesDeCapa
        },
        panelClass: 'custom-modal-container',
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          this.refreshData();

          Swal.fire({
            title: '¡Éxito!',
            text: 'Registro actualizado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          console.log('❌ Edición cancelada');
        }
      });

    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo abrir el formulario de edición',
        icon: 'error'
      });
    }
  }

  /**
   * Guarda los cambios realizados a un registro
   * @param updatedRegistro Registro con los cambios aplicados
   */
  onSaveChanges(updatedRegistro: Register) {
    if (!updatedRegistro.registerId) {
      console.error('No se puede actualizar: registerId es requerido');
      return;
    }

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      console.error('No se pudo obtener el email del usuario');
      return;
    }

    const updateData = this.transformRegisterToApiFormat(updatedRegistro);

    this.consolaService.updateRegister(
      updatedRegistro.registerId,
      userEmail,
      updateData
    ).subscribe({
      next: () => {
        this.loadHistorial();
        this.closeEditModal();
        this.refreshData();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
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
   * Refresca los datos de la tabla según la pestaña actual
   */
  refreshData(): void {
    if (!this.selectedLayerId) {
      console.warn('No research layer selected for refresh');
      return;
    }

    switch (this.selectedTab) {
      case 'listadoPacientes':
        this.loadHistorial(this.currentPage, this.pageSize);
        break;
      case 'consultaDatosDigitador':
        this.loadHistorial(this.currentPage, this.pageSize);
        break;
      case 'inicioDigitador':
        this.loadHistorial(0, 5);
        break;
      default:
        break;
    }

    this.loadVariablesDeCapa(this.selectedLayerId);
    this.lastUpdate = new Date();
  }

  /**
   * Maneja el cambio de página en la paginación
   * @param event Evento de cambio de página
   */
  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadHistorial(event.page, event.rows);
  }

  /**
   * Abre el modal de consentimiento informado
   */
  openConsentimientoModal() {
    this.showConsentimientoModal = true;
  }

  /**
   * Maneja el envío del consentimiento informado
   * @param consentimientoData Datos del consentimiento
   */
  handleSubmitConsentimiento(consentimientoData: any) {
    this.showConsentimientoModal = false;
  }

  /**
   * Cierra el modal de consentimiento informado
   */
  closeConsentimientoModal() {
    this.showConsentimientoModal = false;
  }

  //#endregion

  //#region Métodos Privados de Carga de Datos

  /**
   * Carga los datos del usuario autenticado
   * @returns Promise que se resuelve cuando se completan la carga
   */
  private loadUserData(): Promise<void> {
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
   * Carga las capas de investigación disponibles para el usuario
   * @returns Promise que se resuelve cuando se completan la carga
   */
  private loadAvailableLayers(): Promise<void> {
    return new Promise((resolve, reject) => {
      const layerIds = this.userData?.attributes?.researchLayerId || [];

      const validLayerIds = layerIds.filter(id =>
        id &&
        id !== 'none' &&
        id !== 'undefined' &&
        id !== 'null' &&
        id.trim() !== ''
      );

      if (validLayerIds.length === 0) {
        console.warn('No hay IDs de capa válidos para el usuario');
        this.availableLayers = [];
        resolve();
        return;
      }

      const layerRequests = validLayerIds.map(id =>
        this.consolaService.obtenerCapaPorId(id).pipe(
          catchError(error => {
            console.warn(`Error al cargar capa ${id}:`, error);
            return of(null);
          })
        )
      );

      forkJoin(layerRequests).subscribe({
        next: (layers) => {

          this.availableLayers = layers.filter(l => l !== null && l?.id) as ResearchLayer[];

          if (this.availableLayers.length === 0) {
            console.warn('No se pudieron cargar ninguna capa válida');
          }

          resolve();
        },
        error: (err) => {
          console.error('Error crítico al cargar capas:', err);
          this.availableLayers = [];
          reject(err);
        }
      });
    });
  }

  /**
   * Carga una capa de investigación específica por ID
   * @param researchLayerId ID de la capa a cargar
   * @returns Promise que se resuelve cuando se completa la carga
   */
  private async loadCapaInvestigacion(researchLayerId?: string): Promise<void> {
    try {
      if (!researchLayerId || researchLayerId === 'none' || researchLayerId === 'undefined') {
        throw new Error('ID de capa inválido proporcionado');
      }

      const userLayerIds = this.userData?.attributes?.researchLayerId || [];
      if (!userLayerIds.includes(researchLayerId)) {
        throw new Error(`Usuario no tiene acceso a la capa: ${researchLayerId}`);
      }

      this.isLoading = true;

      const capa = await this.consolaService.obtenerCapaPorId(researchLayerId).toPromise();

      if (!capa?.id) {
        throw new Error('La capa devuelta no tiene ID válido');
      }

      this.currentResearchLayer = capa;
      this.selectedLayerId = capa.id;
      localStorage.setItem('selectedLayerId', capa.id);
      this.updateDatosCapa(capa);

    } catch (error) {
      await this.fallbackToAlternativeLayer(researchLayerId);

      throw error;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Carga las variables asociadas a una capa de investigación
   * @param researchLayerId ID de la capa de investigación
   */
  private loadVariablesDeCapa(researchLayerId: string): void {
    if (!researchLayerId) {
      console.warn('loadVariablesDeCapa: No research layer ID provided');
      this.variablesDeCapa = [];
      this.loadingVariables = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingVariables = true;
    this.variablesDeCapa = [];

    this.consolaService.obtenerVariablesPorCapa(researchLayerId).subscribe({
      next: (variables) => {
        this.variablesDeCapa = variables.filter(v => v.isEnabled);
        this.loadingVariables = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingVariables = false;
        this.mostrarErrorVariables('No se pudieron cargar las variables');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Carga el historial de registros con paginación
   * @param page Página a cargar (por defecto 0)
   * @param size Tamaño de la página (por defecto 10)
   */
  loadHistorial(page: number = 0, size: number = 10): void {
    if (!this.selectedLayerId) {
      console.warn('loadHistorial: No research layer selected');
      return;
    }

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      this.handleError('No se pudo obtener el email del usuario');
      return;
    }

    this.loadingRegistros = true;
    this.currentPage = page;

    const actualSize = 1000;
    this.pageSize = actualSize;

    this.consolaService.getRegisterHistory(
      this.selectedLayerId,
      userEmail,
      page,
      actualSize,
      'changedAt',
      'DESC'
    ).subscribe({
      next: (response) => {
        this.procesarRespuestaHistorial(response);
        this.calcularEstadisticas(response);
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.loadingRegistros = false;
        this.showErrorAlert('Error al cargar el historial de cambios. Por favor intente nuevamente.');
        this.cdr.detectChanges();
      }
    });
  }

  //#endregion

  //#region Métodos Privados de Procesamiento

  /**
   * Procesa la respuesta del servicio de historial
   * @param response Respuesta del servicio
   */
  private procesarRespuestaHistorial(response: RegisterHistoryResponse): void {
    if (!response || !response.data) {
      console.warn('Respuesta de historial vacía o inválida');
      this.usuariosData = [];
      this.registrosRecientes = [];
      this.totalElements = 0;
      this.loadingRegistros = false;
      this.cdr.detectChanges();
      return;
    }

    this.usuariosData = response.data.map((item: RegisterHistory) => ({
      id: item.id,
      registerId: item.registerId,
      pacienteNombre: this.obtenerNombrePaciente(item),
      documento: item.patientIdentificationNumber?.toString() || 'No disponible',
      operacion: this.traducirOperacion(item.operation),
      operacionOriginal: item.operation,
      realizadoPor: item.changedBy || 'Desconocido',
      fechaCambio: this.formatDateForDisplay(item.changedAt),
      capaInvestigacion: item.isResearchLayerGroup?.researchLayerName || 'No disponible',
      variables: item.isResearchLayerGroup?.variables || [],
      _fullData: item
    }));

    this.registrosRecientes = response.data
      .slice(0, 5)
      .map((item: RegisterHistory) => ({
        id: item.id,
        registerId: item.registerId,
        pacienteNombre: this.obtenerNombrePaciente(item),
        documento: item.patientIdentificationNumber?.toString() || 'No disponible',
        operacion: this.traducirOperacion(item.operation),
        operacionOriginal: item.operation,
        realizadoPor: item.changedBy || 'Desconocido',
        fechaCambio: this.formatDateForDisplay(item.changedAt),
        capaInvestigacion: item.isResearchLayerGroup?.researchLayerName || 'No disponible',
        _fullData: item
      }));

    this.currentPage = response.currentPage || 0;
    this.totalPages = response.totalPages || 0;
    this.totalElements = response.totalElements || 0;
    this.loadingRegistros = false;

    console.log('Historial procesado:', {
      tabla: this.usuariosData.length,
      recientes: this.registrosRecientes.length
    });
    this.cdr.detectChanges();
  }

  /**
   * Calcula estadísticas basadas en el historial
   * @param response Respuesta del servicio de historial
   */
  private calcularEstadisticas(response: RegisterHistoryResponse): void {
    if (!response || !response.data) {
      this.totalPacientes = 0;
      this.pacientesHoy = 0;
      return;
    }

    const registrosCreados = response.data.filter(item =>
      item.operation === 'REGISTER_CREATED_SUCCESSFULL'
    );

    const pacientesUnicos = new Set(
      registrosCreados.map(item => item.patientIdentificationNumber)
    );
    this.totalPacientes = pacientesUnicos.size;

    this.calcularPacientesHoy(response.data);

    console.log('Estadísticas calculadas:', {
      totalRegistros: response.totalElements,
      registrosCreados: registrosCreados.length,
      pacientesUnicos: this.totalPacientes,
      pacientesHoy: this.pacientesHoy
    });
  }

  /**
   * Calcula el número de pacientes registrados hoy
   * @param historial Lista de elementos del historial
   */
  private calcularPacientesHoy(historial: RegisterHistory[]): void {
    if (!historial || historial.length === 0) {
      this.pacientesHoy = 0;
      return;
    }

    const hoy = new Date().toDateString();
    const pacientesHoySet = new Set();

    historial.forEach(item => {
      if (item.operation === 'REGISTER_CREATED_SUCCESSFULL') {
        const fechaCambio = new Date(item.changedAt).toDateString();
        if (fechaCambio === hoy) {
          pacientesHoySet.add(item.patientIdentificationNumber);
        }
      }
    });

    this.pacientesHoy = pacientesHoySet.size;
  }



  //#endregion

  //#region Métodos Privados de Utilidad

  /**
   * Traduce las operaciones del inglés al español
   * @param operation Operación a traducir
   * @returns Operación traducida
   */
  private traducirOperacion(operation: string): string {
    const traducciones: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'Registro creado',
      'UPDATE_RESEARCH_LAYER': 'Registro actualizado',
      'REGISTER_UPDATED': 'Registro actualizado',
      'REGISTER_DELETED': 'Registro eliminado',
      'CREATE_RESEARCH_LAYER': 'Capa creada'
    };
    return traducciones[operation] || operation;
  }

  /**
   * Obtiene el nombre del paciente buscando en registros cargados
   * @param item Elemento del historial
   * @returns Nombre del paciente o texto genérico
   */
  private obtenerNombrePaciente(item: RegisterHistory): string {
    // Si tienes registros cargados, buscar el nombre ahí
    const registroCompleto = this.registros.find(r =>
      r.patientIdentificationNumber === item.patientIdentificationNumber
    );

    if (registroCompleto?.patientBasicInfo?.name) {
      return registroCompleto.patientBasicInfo.name;
    }

    // Si no encontramos el nombre, mostrar un texto genérico
    return `Paciente (Doc: ${item.patientIdentificationNumber})`;
  }

  /**
   * Formatea una fecha para mostrar en la interfaz
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada como string
   */
  private formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return 'Fecha no disponible';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', dateValue, e);
      return 'Fecha no disponible';
    }
  }

  /**
   * Transforma un registro al formato esperado por la API
   * @param registro Registro a transformar
   * @returns Objeto en formato API
   */
  private transformRegisterToApiFormat(registro: Register): any {
    const variablesInfo = registro.variablesRegister?.map(v => ({
      id: v.variableId,
      name: v.variableName,
      value: v.value,
      type: v.type
    })) || [];

    const registerInfo = {
      researchLayerId: registro.registerInfo?.[0]?.researchLayerId || this.selectedLayerId,
      researchLayerName: registro.registerInfo?.[0]?.researchLayerName || this.currentResearchLayer?.layerName || '',
      variablesInfo: variablesInfo
    };

    const patient = {
      name: registro.patientBasicInfo?.name || '',
      sex: registro.patientBasicInfo?.sex || '',
      birthDate: this.formatDateForApi(registro.patientBasicInfo?.birthDate),
      age: registro.patientBasicInfo?.age || 0,
      email: registro.patientBasicInfo?.email || '',
      phoneNumber: registro.patientBasicInfo?.phoneNumber || '',
      deathDate: this.formatDateForApi(registro.patientBasicInfo?.deathDate),
      economicStatus: registro.patientBasicInfo?.economicStatus || '',
      educationLevel: registro.patientBasicInfo?.educationLevel || '',
      maritalStatus: registro.patientBasicInfo?.maritalStatus || '',
      hometown: registro.patientBasicInfo?.hometown || '',
      currentCity: registro.patientBasicInfo?.currentCity || '',
      firstCrisisDate: this.formatDateForApi(registro.patientBasicInfo?.firstCrisisDate),
      crisisStatus: registro.patientBasicInfo?.crisisStatus || ''
    };

    let caregiver;
    if (registro.caregiver) {
      caregiver = {
        name: registro.caregiver.name || '',
        identificationType: registro.caregiver.identificationType || '',
        identificationNumber: registro.caregiver.identificationNumber || 0,
        age: registro.caregiver.age || 0,
        educationLevel: registro.caregiver.educationLevel || '',
        occupation: registro.caregiver.occupation || ''
      };
    }

    return {
      registerInfo: registerInfo,
      patientIdentificationNumber: registro.patientIdentificationNumber,
      patientIdentificationType: registro.patientIdentificationType,
      patient: patient,
      ...(caregiver && { caregiver: caregiver })
    };
  }

  /**
   * Formatea una fecha para el formato de API (YYYY-MM-DD)
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada o null
   */
  private formatDateForApi(dateValue: any): string | null {
    if (!dateValue) return null;

    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Error al formatear fecha:', dateValue, e);
    }

    if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      const [day, month, year] = dateValue.split('-');
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  /**
   * Abre el modal con los datos actuales del paciente
   * @param registroActual Registro actual del paciente
   * @param itemHistorial Item del historial relacionado
   */
  private abrirModalConDatosActuales(registroActual: any, itemHistorial: any): void {
    try {
      const dialogRef = this.dialog.open(ViewRegistroModalComponent, {
        width: '95%',
        maxWidth: '1400px',
        data: {
          registro: registroActual,
          esDatoActual: true,
          itemHistorial: itemHistorial
        },
        panelClass: 'custom-modal-container',
        autoFocus: false,
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(() => {
        console.log('Modal de visualización cerrado');
      });

    } catch (error) {
      console.error('Error al abrir el modal:', error);
      this.mostrarModalConDatosHistorial(itemHistorial);
    }
  }

  /**
   * Método fallback para mostrar datos del historial cuando no se pueden cargar los actuales
   * @param item Item del historial a mostrar
   */
  private mostrarModalConDatosHistorial(item: any): void {
    Swal.fire({
      title: 'Información limitada',
      text: 'Mostrando datos del historial (no se pudieron cargar los datos actuales)',
      icon: 'info',
      timer: 2000
    });

    try {
      const dialogRef = this.dialog.open(ViewRegistroModalComponent, {
        width: '95%',
        maxWidth: '1400px',
        data: {
          registro: item._fullData,
          esDatoActual: false
        },
        panelClass: 'custom-modal-container',
        autoFocus: false,
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(() => {
        console.log('Modal de visualización cerrado');
      });

    } catch (error) {
      console.error('Error al abrir el modal con datos históricos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo abrir la visualización del registro',
        icon: 'error'
      });
    }
  }

  /**
   * Intenta recuperar una capa alternativa cuando falla la carga principal
   * @param failedLayerId ID de la capa que falló
   */
  private async fallbackToAlternativeLayer(failedLayerId?: string): Promise<void> {
    try {
      const alternativeLayer = this.availableLayers.find(layer =>
        layer.id !== failedLayerId && layer.id
      );

      if (alternativeLayer) {
        this.currentResearchLayer = alternativeLayer;
        this.selectedLayerId = alternativeLayer.id;
        localStorage.setItem('selectedLayerId', alternativeLayer.id);
        this.updateDatosCapa(alternativeLayer);
      } else if (this.availableLayers.length > 0) {
        const firstLayer = this.availableLayers[0];
        this.currentResearchLayer = firstLayer;
        this.selectedLayerId = firstLayer.id;
        localStorage.setItem('selectedLayerId', firstLayer.id);
        this.updateDatosCapa(firstLayer);
      } else {
        this.setDefaultCapaValues();
        this.selectedLayerId = '';
        throw new Error('No hay capas alternativas disponibles');
      }
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
      this.setDefaultCapaValues();
      this.selectedLayerId = '';
    }
  }


  /**
   * Resetea el estado del componente a los valores iniciales
   */
  private resetComponentState(): void {
    this.registros = [];
    this.usuariosData = [];
    this.registrosRecientes = [];
    this.variablesDeCapa = [];
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
    this.totalPacientes = 0;
    this.pacientesHoy = 0;
    this.currentResearchLayer = null;
    this.selectedRegistro = null;
    this.showEditModal = false;
    this.isLoading = true;
    this.loadingRegistros = false;
    this.loadingVariables = false;
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  /**
   * Actualiza los datos de la capa de investigación en la vista
   * @param capa Datos de la capa de investigación
   */
  private updateDatosCapa(capa: ResearchLayer) {
    this.DescripcionInvestigacion = capa?.description || 'Descripción no disponible';
    this.jefeInvestigacion = capa?.layerBoss?.name || 'Jefe no asignado';

    this.cdr.detectChanges();
  }

  /**
 * Abre el modal de versionamiento de registros
 */
  openVersionamientoModal(): void {
    if (!this.selectedLayerId) {
      this.showErrorAlert('Por favor selecciona una capa de investigación primero');
      return;
    }

    if (!this.selectedLayerId) {
      this.showErrorAlert('No hay una capa de investigación seleccionada');
      return;
    }

    const dialogRef = this.dialog.open(VersionamientoModalComponent, {
      width: '95%',
      maxWidth: '1400px',
      height: '90vh',
      panelClass: 'versionamiento-modal-container',
      autoFocus: false,
      disableClose: false,
      data: {
        researchLayerId: this.selectedLayerId,
        patientIdentificationNumber: undefined
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'search') {
        this.refreshData();
      }
    });
  }

  /**
   * Establece valores por defecto para los datos de la capa
   */
  private setDefaultCapaValues() {
    this.DescripcionInvestigacion = 'Información no disponible';
    this.jefeInvestigacion = 'No asignado';
  }

  /**
   * Maneja errores durante la carga de datos
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
   * @param mensaje Mensaje de error
   */
  private mostrarErrorVariables(mensaje: string) {
    console.error(mensaje);
    this.errorMessage = mensaje;
  }


  /**
   * Muestra una alerta de error usando SweetAlert2
   * @param message Mensaje de error a mostrar
   */
  private showErrorAlert(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    });
  }


  // Abrir modal de subir consentimiento
  openUploadConsentimientoModal(): void {
    this.showUploadConsentimientoModal = true;
  }

  // Cerrar modal de subir consentimiento
  closeUploadConsentimientoModal(): void {
    this.showUploadConsentimientoModal = false;
  }

  // Manejar cuando se complete la subida
  handleUploadComplete(result: any): void {
    console.log('Consentimiento subido exitosamente:', result);
    this.closeUploadConsentimientoModal();

    this.showSuccessMessage('Consentimiento subido exitosamente');
    this.refreshData();
  }

  /**
 * Muestra un mensaje de éxito usando SweetAlert2
 * @param message Mensaje de éxito a mostrar
 */
  private showSuccessMessage(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        title: '¡Éxito!',
        text: message,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    });
  }

  //#endregion
}
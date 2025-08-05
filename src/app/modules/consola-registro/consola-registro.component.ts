import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ConsolaRegistroService } from 'src/app/services/consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import { Variable, UserResponse, ResearchLayer, Register } from './interfaces';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-consola-registro',
  templateUrl: './consola-registro.component.html',
  styleUrls: ['./consola-registro.component.css']
})
export class ConsolaRegistroComponent implements OnInit {
  selectedTab: string = 'inicioDigitador';
  isLoading: boolean = true;
  errorMessage: string | null = null;
  variablesDeCapa: Variable[] = [];
  loadingVariables: boolean = false;
  userData: UserResponse | null = null;
  currentResearchLayer: ResearchLayer | null = null;
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  registros: Register[] = [];
  loadingRegistros: boolean = false;
  jefeInvestigacion: string = 'Cargando...';
  DescripcionInvestigacion: string = 'Cargando descripción...';
  totalPacientes: number = 0;
  pacientesHoy: number = 0;
  showViewModal: boolean = false;
  showEditModal: boolean = false;
  selectedRegistro: Register | null = null;
  registrosRecientes: any[] = [];
  usuariosData: any[] = [];
  showBuscarProfesionalModal = false;
  modoBusqueda: 'default' | 'profesional' | 'paciente' = 'default';
  profesionalBuscado: string = '';
  showBuscarPacienteModal = false;
  pacienteBuscado: string = '';
  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'documento', header: 'Número de documento' },
    { field: 'fechaRegistro', header: 'Fecha de último registro' },
    { field: 'registradoPor', header: 'Registrado por' }
  ];
  selectedLayerId: string = '';
  availableLayers: ResearchLayer[] = [];

  constructor(
    private authService: AuthService,
    private consolaService: ConsolaRegistroService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.consolaService.dataChanged$.subscribe(() => {
      this.ngZone.run(() => this.refreshData());
    });
  }

  async ngOnInit() {
    try {
      await this.loadUserData();
      await this.loadAvailableLayers();
      const savedLayerId = localStorage.getItem('selectedLayerId');
      if (this.availableLayers.length > 0) {
        const initialLayerId = savedLayerId && this.availableLayers.some(l => l.id === savedLayerId)
          ? savedLayerId
          : this.availableLayers[0].id;
        this.selectedLayerId = initialLayerId;
        await this.loadCapaInvestigacion(initialLayerId);
        this.loadRegistros();
        this.loadVariablesDeCapa(initialLayerId);
        this.refreshData();
      } else {
        this.selectedLayerId = '';
        this.showErrorAlert('No se encontraron capas de investigación disponibles');
      }
    } catch (error) {
      this.handleError('Error al inicializar componente');
      this.selectedLayerId = '';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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

  loadAvailableLayers(): Promise<void> {
    return new Promise((resolve, reject) => {
      const layerIds = this.userData?.attributes?.researchLayerId || [];
      if (!layerIds.length) {
        this.availableLayers = [];
        resolve();
        return;
      }

      const layerRequests = layerIds.map(id =>
        this.consolaService.obtenerCapaPorId(id).toPromise()
      );

      Promise.all(layerRequests)
        .then(layers => {
          this.availableLayers = layers.filter(l => l?.id) as ResearchLayer[];
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadCapaInvestigacion(researchLayerId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!researchLayerId) {
        const layerIds = this.userData?.attributes?.researchLayerId;
        if (layerIds && layerIds.length > 0) {
          researchLayerId = layerIds[0];
        } else {
          this.isLoading = false;
          this.setDefaultCapaValues();
          this.selectedLayerId = '';
          reject('No hay ID de capa');
          return;
        }
      }

      const layerIds = this.userData?.attributes?.researchLayerId;
      if (!layerIds?.includes(researchLayerId)) {
        console.warn('loadCapaInvestigacion: Selected layer not authorized:', researchLayerId);
        this.handleError('La capa seleccionada no está asignada a este usuario');
        this.selectedLayerId = layerIds && layerIds.length > 0 ? layerIds[0] : '';
        localStorage.setItem('selectedLayerId', this.selectedLayerId);
        reject('Capa no autorizada');
        return;
      }

      this.isLoading = true;
      this.consolaService.obtenerCapaPorId(researchLayerId).subscribe({
        next: (capa) => {
          if (!capa?.id) {
            console.warn('loadCapaInvestigacion: Capa sin ID recibida');
            this.isLoading = false;
            this.setDefaultCapaValues();
            this.selectedLayerId = layerIds && layerIds.length > 0 ? layerIds[0] : '';
            localStorage.setItem('selectedLayerId', this.selectedLayerId);
            reject('Capa inválida');
            return;
          }
          this.currentResearchLayer = capa;
          this.selectedLayerId = capa.id;
          localStorage.setItem('selectedLayerId', capa.id);
          this.updateDatosCapa(capa);
          this.isLoading = false;
          this.cdr.detectChanges();
          resolve();
        },
        error: (err) => {
          console.error('loadCapaInvestigacion: Error al cargar capa:', err);
          this.handleError('Error al cargar la capa de investigación');
          this.setDefaultCapaValues();
          this.selectedLayerId = layerIds && layerIds.length > 0 ? layerIds[0] : '';
          localStorage.setItem('selectedLayerId', this.selectedLayerId);
          this.isLoading = false;
          this.cdr.detectChanges();
          reject(err);
        }
      });
    });
  }

  loadVariablesDeCapa(researchLayerId: string): void {
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
      error: (err) => {
        this.loadingVariables = false;
        this.mostrarErrorVariables('No se pudieron cargar las variables');
        this.cdr.detectChanges();
      }
    });
  }

  loadRegistros(page: number = 0, size: number = 10): void {
    if (!this.selectedLayerId) {
      console.warn('loadRegistros: No research layer selected');
      this.handleError('No se ha seleccionado ninguna capa de investigación');
      this.resetRegistros();
      return;
    }

    this.loadingRegistros = true;
    this.currentPage = page;
    this.pageSize = size;

    this.consolaService.obtenerRegistrosPorCapa(
      this.selectedLayerId,
      page,
      size
    ).subscribe({
      next: (response) => {
        this.procesarRespuestaRegistros(response);
        },
      error: (err) => {
        this.resetRegistros();
        this.showErrorAlert('Error al cargar registros. Por favor intente nuevamente.');
      },
      complete: () => {
        this.loadingRegistros = false;
        this.cdr.detectChanges();
      }
    });
  }

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
          this.loadRegistros();
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
          console.error('onLayerChange: Error changing layer:', error);
          this.handleError('Error al cambiar de capa de investigación');
          const layerIds = this.userData?.attributes?.researchLayerId;
          this.selectedLayerId = layerIds && layerIds.length > 0 ? layerIds[0] : '';
          localStorage.setItem('selectedLayerId', this.selectedLayerId);
          this.cdr.detectChanges();
        });
    });
  }

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
    this.showViewModal = false;
    this.showEditModal = false;
    this.modoBusqueda = 'default';
    this.profesionalBuscado = '';
    this.pacienteBuscado = '';
    this.isLoading = true;
    this.loadingRegistros = false;
    this.loadingVariables = false;
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

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

  /**
   * Loads all available research layers for the current user
   */


  // New method to load initial layer
  async loadInitialLayer(): Promise<void> {
    // Try to get last selected layer from localStorage
    const savedLayerId = localStorage.getItem('selectedLayerId');

    if (savedLayerId && this.availableLayers.some(l => l.id === savedLayerId)) {
      this.selectedLayerId = savedLayerId;
    } else if (this.availableLayers.length > 0) {
      this.selectedLayerId = this.availableLayers[0].id;
    }

    if (this.selectedLayerId) {
      await this.loadCapaInvestigacion(this.selectedLayerId);
    }
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
        ('Navegando a configuración');
        break;
      default:
        (`Destino no reconocido: ${destination}`);
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

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      console.error('No se pudo obtener el email del usuario');
      return;
    }

    // Transformar el Register al formato esperado por la API
    const updateData = this.transformRegisterToApiFormat(updatedRegistro);

    this.consolaService.actualizarRegistro(
      updatedRegistro.registerId,
      userEmail,
      updateData
    ).subscribe({
      next: () => {
        this.loadRegistros();
        this.closeEditModal();
        this.refreshData();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
  }
  private transformRegisterToApiFormat(registro: Register): any {
    return {
      variables: registro.variablesRegister?.map(v => ({
        id: v.variableId,
        variableName: v.variableName,
        value: v.value,
        type: v.type,
        researchLayerId: v.researchLayerId,
        researchLayerName: v.researchLayerName
      })) || [],
      patientIdentificationNumber: registro.patientIdentificationNumber,
      patientIdentificationType: registro.patientIdentificationType,
      patient: {
        name: registro.patientBasicInfo?.name,
        sex: registro.patientBasicInfo?.sex,
        birthDate: this.formatDateForApi(registro.patientBasicInfo?.birthDate),
        age: registro.patientBasicInfo?.age,
        email: registro.patientBasicInfo?.email,
        phoneNumber: registro.patientBasicInfo?.phoneNumber,
        deathDate: this.formatDateForApi(registro.patientBasicInfo?.deathDate),
        economicStatus: registro.patientBasicInfo?.economicStatus,
        educationLevel: registro.patientBasicInfo?.educationLevel,
        maritalStatus: registro.patientBasicInfo?.maritalStatus,
        hometown: registro.patientBasicInfo?.hometown,
        currentCity: registro.patientBasicInfo?.currentCity,
        firstCrisisDate: this.formatDateForApi(registro.patientBasicInfo?.firstCrisisDate),
        crisisStatus: registro.patientBasicInfo?.crisisStatus
      },
      ...(registro.caregiver && {
        caregiver: {
          name: registro.caregiver.name,
          identificationType: registro.caregiver.identificationType,
          identificationNumber: registro.caregiver.identificationNumber,
          age: registro.caregiver.age,
          educationLevel: registro.caregiver.educationLevel,
          occupation: registro.caregiver.occupation
        }
      }),
      ...(registro.healthProfessional && {
        healthProfessional: {
          id: registro.healthProfessional.id,
          name: registro.healthProfessional.name,
          identificationNumber: registro.healthProfessional.identificationNumber
        }
      })
    };
  }
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

    return null;
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
    if (!this.selectedLayerId) {
      console.warn('No research layer selected for refresh');
      return;
    }

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

    // Always reload variables to ensure they match the selected layer
    this.loadVariablesDeCapa(this.selectedLayerId);
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
      fechaRegistro: registro.updateRegisterDate
        ? new Date(registro.updateRegisterDate).toLocaleDateString()
        : registro.registerDate
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
      .sort((a, b) => {
        const dateA = a.updateRegisterDate || a.registerDate;
        const dateB = b.updateRegisterDate || b.registerDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 3)
      .map(registro => ({
        nombre: registro.patientBasicInfo?.name || 'No disponible',
        documento: registro.patientIdentificationNumber.toString(),
        fecha: registro.updateRegisterDate || registro.registerDate,
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
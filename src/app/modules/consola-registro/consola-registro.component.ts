import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ConsolaRegistroService } from 'src/app/services/register.service';
import { AuthService } from 'src/app/services/auth.service';
import { Variable, UserResponse, ResearchLayer, Register } from './interfaces';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { ConsentimientoInformadoComponent } from './components/consentimiento-informado/consentimiento-informado.component';
import { catchError, forkJoin, of } from 'rxjs';
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
  showConsentimientoModal = false;
  selectedPaciente: any;
  constructor(
    private authService: AuthService,
    private consolaService: ConsolaRegistroService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog
  ) {
    this.consolaService.dataChanged$.subscribe(() => {
      this.ngZone.run(() => this.refreshData());
    });
  }

  async ngOnInit() {
    try {
      await this.loadUserData();

      // Debug: ver qué capas tiene el usuario
      console.log('User researchLayerId:', this.userData?.attributes?.researchLayerId);

      await this.loadAvailableLayers();

      if (this.availableLayers.length === 0) {
        this.showErrorAlert('No tienes capas de investigación asignadas o no se pudieron cargar');
        this.selectedLayerId = '';
        return;
      }

      const savedLayerId = localStorage.getItem('selectedLayerId');
      let initialLayerId = this.availableLayers[0].id;

      // Verificar si la capa guardada es válida
      if (savedLayerId && this.availableLayers.some(l => l.id === savedLayerId)) {
        initialLayerId = savedLayerId;
      }

      await this.loadCapaInvestigacion(initialLayerId);
      this.loadRegistros();
      this.loadVariablesDeCapa(initialLayerId);

    } catch (error) {
      console.error('Error en ngOnInit:', error);
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

      console.log('IDs de capa del usuario:', layerIds);

      // Filtrar IDs válidos
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
            return of(null); // Retornar null para manejar errores gracefulmente
          })
        )
      );

      forkJoin(layerRequests).subscribe({
        next: (layers) => {
          // Filtrar solo capas válidas
          this.availableLayers = layers.filter(l => l !== null && l?.id) as ResearchLayer[];

          console.log('Capas disponibles cargadas:', this.availableLayers);

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

  async loadCapaInvestigacion(researchLayerId?: string): Promise<void> {
    try {
      // Validar el ID de entrada
      if (!researchLayerId || researchLayerId === 'none' || researchLayerId === 'undefined') {
        throw new Error('ID de capa inválido proporcionado');
      }

      // Verificar que el usuario tenga permiso para esta capa
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
      console.error('Error en loadCapaInvestigacion:', error);

      // Intentar recuperación con una capa alternativa
      await this.fallbackToAlternativeLayer(researchLayerId);

      throw error; // Re-lanzar el error para manejo superior
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Nuevo método para fallback
  private async fallbackToAlternativeLayer(failedLayerId?: string): Promise<void> {
    try {
      // Buscar una capa alternativa que no sea la que falló
      const alternativeLayer = this.availableLayers.find(layer =>
        layer.id !== failedLayerId && layer.id
      );

      if (alternativeLayer) {
        console.log(`Fallback a capa alternativa: ${alternativeLayer.layerName}`);
        this.currentResearchLayer = alternativeLayer;
        this.selectedLayerId = alternativeLayer.id;
        localStorage.setItem('selectedLayerId', alternativeLayer.id);
        this.updateDatosCapa(alternativeLayer);
      } else if (this.availableLayers.length > 0) {
        // Usar la primera capa disponible
        const firstLayer = this.availableLayers[0];
        console.log(`Usando primera capa disponible: ${firstLayer.layerName}`);
        this.currentResearchLayer = firstLayer;
        this.selectedLayerId = firstLayer.id;
        localStorage.setItem('selectedLayerId', firstLayer.id);
        this.updateDatosCapa(firstLayer);
      } else {
        // No hay capas disponibles
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
        console.log('Variables recibidas:', variables); // ← Agrega esto para debuggear
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

    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      this.handleError('No se pudo obtener el email del usuario');
      this.resetRegistros();
      return;
    }

    this.loadingRegistros = true;
    this.currentPage = page;
    this.pageSize = size;

    console.log('Cargando registros con parámetros:', {
      researchLayerId: this.selectedLayerId,
      userEmail: userEmail,
      page: page,
      size: size
    });

    this.consolaService.obtenerRegistrosPorCapa(
      this.selectedLayerId,
      userEmail,
      undefined,
      page,
      size,
      'registerDate',
      'DESC'
    ).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        if (response === null) {
          console.warn('El servicio retornó null, inicializando registros vacíos');
          this.resetRegistros();
        } else {
          this.procesarRespuestaRegistros(response);
        }
      },
      error: (err) => {
        console.error('Error al cargar registros:', err);
        console.error('Error details:', err.error);
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
   * Carga registros filtrados por paciente
   * @param {number} patientIdentificationNumber ID del paciente
   * @param {number} [page=0] Página a cargar
   * @param {number} [size=10] Tamaño de la página
   */
  loadRegistrosPorPaciente(patientIdentificationNumber: number, page: number = 0, size: number = 10) {
    this.loadingRegistros = true;

    this.consolaService.obtenerRegistrosPorPaciente(
      patientIdentificationNumber,
      page,
      size,
      'registerDate', // sort
      'DESC' // sortDirection
    ).subscribe({
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

    this.consolaService.updateRegister(
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
    // Transformar las variables al formato correcto
    const variablesInfo = registro.variablesRegister?.map(v => ({
      id: v.variableId,
      name: v.variableName,  // Cambiado de variableName a name
      value: v.value,
      type: v.type
    })) || [];

    // Crear el objeto registerInfo en el formato correcto
    const registerInfo = {
      researchLayerId: registro.registerInfo?.[0]?.researchLayerId || this.selectedLayerId,
      researchLayerName: registro.registerInfo?.[0]?.researchLayerName || this.currentResearchLayer?.layerName || '',
      variablesInfo: variablesInfo
    };

    // Crear el objeto paciente en el formato correcto
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

    // Crear el objeto cuidador si existe
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

    // Retornar el objeto en el formato exacto que espera la API
    return {
      registerInfo: registerInfo,  // Objeto simple, no array
      patientIdentificationNumber: registro.patientIdentificationNumber,
      patientIdentificationType: registro.patientIdentificationType,
      patient: patient,
      ...(caregiver && { caregiver: caregiver }) // Incluir caregiver solo si existe
    };
  }

  private formatDateForApi(dateValue: any): string | null {
    if (!dateValue) return null;

    // Si ya está en formato yyyy-MM-dd, retornarlo directamente
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // Si es una fecha de JavaScript o string ISO
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Formato yyyy-MM-dd
      }
    } catch (e) {
      console.error('Error al formatear fecha:', dateValue, e);
    }

    // Si es un string con formato dd-MM-yyyy, convertirlo
    if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      const [day, month, year] = dateValue.split('-');
      return `${year}-${month}-${day}`;
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

    if (this.modoBusqueda === 'paciente') {
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
  /**
   * Procesa la respuesta de los registros y actualiza el estado del componente
   * @param {any} response Respuesta del servicio
   * @private
   */
  private procesarRespuestaRegistros(response: any): void {
    console.log('Procesando respuesta:', response);

    // Handle null or undefined response
    if (!response) {
      console.error('Respuesta nula recibida del servidor');
      this.resetRegistros();
      this.showErrorAlert('No se recibieron datos del servidor');
      return;
    }

    // La respuesta puede venir de diferentes formas, intentemos todas las posibilidades
    let registros = [];

    if (response.registers) {
      registros = response.registers;
    } else if (response.data) {
      registros = response.data;
    } else if (Array.isArray(response)) {
      registros = response;
    } else {
      console.warn('Formato de respuesta no reconocido:', response);
      this.resetRegistros();
      return;
    }

    this.registros = registros;
    console.log('Registros procesados:', this.registros.length);

    this.usuariosData = this.registros.map(registro => ({
      nombre: registro.patientBasicInfo?.name || 'No disponible',
      documento: registro.patientIdentificationNumber?.toString() || 'No disponible',
      fechaRegistro: this.formatDateForDisplay(registro.updateRegisterDate || registro.registerDate),
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

        // Verificar que las fechas no sean undefined antes de crear objetos Date
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 3)
      .map(registro => ({
        nombre: registro.patientBasicInfo?.name || 'No disponible',
        documento: registro.patientIdentificationNumber?.toString() || 'No disponible',
        fecha: registro.updateRegisterDate || registro.registerDate,
        registradoPor: registro.healthProfessional?.name || 'Desconocido',
        _fullData: registro
      }));

    this.loadingRegistros = false;
    this.cdr.detectChanges();
  }

  // Método auxiliar para formatear fechas para display
  private formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return 'Fecha no disponible';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error al formatear fecha:', dateValue, e);
      return 'Fecha no disponible';
    }
  }

  /**
   * Actualiza los datos de la capa de investigación en la vista
   * @param {ResearchLayer} capa Datos de la capa de investigación
   * @private
   */
  private updateDatosCapa(capa: ResearchLayer) {
    this.DescripcionInvestigacion = capa?.description || 'Descripción no disponible';
    this.jefeInvestigacion = capa?.layerBoss?.name || 'Jefe no asignado';

    // Debug info
    console.log('Capa cargada:', {
      nombre: capa.layerName,
      descripcion: this.DescripcionInvestigacion,
      jefe: this.jefeInvestigacion,
      jefeCompleto: capa.layerBoss
    });

    this.cdr.detectChanges();
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
    this.totalPages = 0;
    this.currentPage = 0;
    this.totalPacientes = 0;
    this.loadingRegistros = false;
    this.cdr.detectChanges();
  }

  // Método para abrir el modal de consentimiento
  openConsentimientoModal() {
    // Aquí deberías asignar el paciente seleccionado si es necesario
    // this.selectedPaciente = ...;
    this.showConsentimientoModal = true;
  }

  // Método para manejar el envío del consentimiento
  handleSubmitConsentimiento(consentimientoData: any) {
    // Lógica para guardar el consentimiento
    console.log('Consentimiento enviado:', consentimientoData);
    this.showConsentimientoModal = false;
  }

  // Método para cerrar el modal de consentimiento
  closeConsentimientoModal() {
    this.showConsentimientoModal = false;
  }

  //#endregion
}
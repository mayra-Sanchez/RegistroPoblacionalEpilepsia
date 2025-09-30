import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ConsolaAdministradorService } from '../../../../services/consola-administrador.service';
import { ConsolaRegistroService } from 'src/app/services/register.service';

/**
 * Componente para visualización detallada de elementos con soporte para múltiples tipos de vista
 * 
 * Este componente maneja la visualización de:
 * - Registros completos de pacientes
 * - Capas de investigación con sus variables asociadas
 * - Historial de operaciones y cambios
 * 
 * @example
 * <app-handle-view 
 *   [viewedItem]="selectedItem" 
 *   [viewType]="'historial'" 
 *   (closeModal)="onCloseModal()">
 * </app-handle-view>
 */
@Component({
  selector: 'app-handle-view',
  templateUrl: './handle-view.component.html',
  styleUrls: ['./handle-view.component.css']
})
export class HandleViewComponent implements OnInit, OnChanges {

  // INPUTS Y OUTPUTS
  // ================

  /** Elemento que se está visualizando (puede ser registro, capa, historial, etc.) */
  @Input() viewedItem: any;

  /** Tipo de vista a mostrar: 'historial', 'capa', 'registro', etc. */
  @Input() viewType: string = '';

  /** Evento emitido cuando se cierra el modal */
  @Output() closeModal = new EventEmitter<void>();

  // PROPIEDADES DEL COMPONENTE
  // ==========================

  /** Lista de capas de investigación disponibles */
  capas: any[] = [];

  /** Mapeo de IDs de capas a sus nombres para búsqueda rápida */
  capaMap: { [key: string]: string } = {};

  /** Variables asociadas a una capa específica */
  variablesAsociadas: any[] = [];

  /** Variables filtradas según término de búsqueda */
  filteredVariables: any[] = [];

  /** Variables paginadas para mostrar en la vista actual */
  paginatedVariables: any[] = [];

  /** Término de búsqueda para filtrar variables */
  searchTerm: string = '';

  /** Página actual en la paginación */
  currentPage: number = 1;

  /** Número de elementos por página */
  pageSize: number = 10;

  /** Número total de páginas */
  totalPages: number = 1;

  /** Pestaña activa en la interfaz */
  activeTab: string = 'basic';

  /** Registro completo cargado para el historial */
  registroCompleto: any = null;

  /** Estado de carga del registro completo */
  loadingRegistroCompleto: boolean = false;

  // DATOS DE CONFIGURACIÓN
  // ======================

  /** Tipos de identificación disponibles para pacientes */
  readonly tiposIdentificacion = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro Civil' }
  ];

  /** Géneros disponibles */
  readonly generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  /** Niveles de educación disponibles */
  readonly nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Postgrado' }
  ];

  /** Estados civiles disponibles */
  readonly estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' }
  ];

  /** Estados económicos disponibles */
  readonly estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio Bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio Alto' },
    { value: 'alto', label: 'Alto' }
  ];

  // CONSTRUCTOR
  // ===========

  /**
   * Constructor del componente
   * @param consolaService Servicio para operaciones de administración
   * @param registerService Servicio para operaciones de registro
   */
  constructor(
    private consolaService: ConsolaAdministradorService, 
    private registerService: ConsolaRegistroService
  ) { }

  // LIFECYCLE HOOKS
  // ===============

  /**
   * Inicialización del componente
   * Carga las capas disponibles al iniciar
   */
  ngOnInit(): void {
    this.cargarCapas();
  }

  /**
   * Maneja los cambios en las propiedades de entrada
   * @param changes Objeto con los cambios detectados
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewType']) {
      console.log('🎯 ViewType recibido:', this.viewType);
      console.log('📦 ViewedItem recibido:', this.viewedItem);
    }

    if (changes['viewedItem'] && this.viewedItem) {
      this.handleViewedItemChange();
    }
  }

  // MÉTODOS PRIVADOS - MANEJO DE CAMBIOS
  // ====================================

  /**
   * Maneja el cambio en el elemento visualizado según el tipo de vista
   * @private
   */
  private handleViewedItemChange(): void {
    switch (this.viewType) {
      case 'historial':
        this.loadRegistroCompleto();
        break;
      case 'capa':
        this.handleCapaView();
        break;
      default:
        console.log('Tipo de vista no manejado:', this.viewType);
    }
  }

  /**
   * Maneja la visualización de una capa específica
   * @private
   */
  private handleCapaView(): void {
    const capaId = this.viewedItem?.id || this.viewedItem?.capaId || this.viewedItem?.researchLayerId;
    if (capaId) {
      this.loadVariablesPorCapa(capaId);
    }
  }

  // MÉTODOS DE CARGA DE DATOS
  // =========================

  /**
   * Carga la información completa del registro para el historial
   */
  loadRegistroCompleto(): void {
    if (!this.viewedItem?.registerId) {
      console.warn('No hay registerId para cargar el registro completo');
      return;
    }

    const patientIdentificationNumber = this.viewedItem?.patientIdentificationNumber;
    const researchLayerId = this.viewedItem?.isResearchLayerGroup?.researchLayerId;

    if (!patientIdentificationNumber || !researchLayerId) {
      console.warn('Faltan datos necesarios para cargar el registro completo:', {
        patientIdentificationNumber,
        researchLayerId
      });
      return;
    }

    this.loadingRegistroCompleto = true;

    this.registerService.getActualRegisterByPatient(patientIdentificationNumber, researchLayerId).subscribe({
      next: (registro) => {
        this.registroCompleto = registro;
        this.loadingRegistroCompleto = false;
        console.log('✅ Registro completo cargado:', registro);
      },
      error: (err) => {
        console.error('Error al cargar registro completo:', err);
        this.registroCompleto = null;
        this.loadingRegistroCompleto = false;
      }
    });
  }

  /**
   * Carga las variables asociadas a una capa específica
   * @param capaId ID de la capa de investigación
   */
  loadVariablesPorCapa(capaId: string): void {
    if (!capaId) return;

    this.consolaService.obtenerVariablesPorCapa(capaId).subscribe({
      next: (variables) => {
        this.variablesAsociadas = variables;
        this.filteredVariables = [...variables];
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error al cargar variables de la capa:', err);
      }
    });
  }

  /**
   * Carga la lista de capas disponibles
   */
  cargarCapas(): void {
    this.consolaService.getAllLayers().subscribe({
      next: (data) => {
        this.capas = data.map(capa => ({ id: capa.id, nombreCapa: capa.layerName }));
        this.capaMap = this.capas.reduce((map, capa) => {
          map[capa.id] = capa.nombreCapa;
          return map;
        }, {});
      },
      error: (err) => console.error('Error al cargar capas:', err)
    });
  }

  // MÉTODOS DE FILTRADO Y PAGINACIÓN
  // ================================

  /**
   * Filtra las variables según el término de búsqueda
   */
  filterVariables(): void {
    if (!this.searchTerm) {
      this.filteredVariables = [...this.variablesAsociadas];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredVariables = this.variablesAsociadas.filter(variable =>
        variable.variableName.toLowerCase().includes(term) ||
        (variable.description && variable.description.toLowerCase().includes(term)) ||
        variable.type.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Actualiza la paginación basada en las variables filtradas
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVariables.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedVariables = this.filteredVariables.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * Avanza a la siguiente página
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Retrocede a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Maneja el cambio en el tamaño de página
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  // MÉTODOS DE OBTENCIÓN DE DATOS
  // =============================

  /**
   * Obtiene el tipo de identificación del paciente (compatible con ambos formatos)
   * @returns Tipo de identificación formateado
   */
  getPatientIdentificationType(): string {
    if (this.viewType === 'historial') {
      if (this.registroCompleto?.patientIdentificationType) {
        return this.registroCompleto.patientIdentificationType;
      }
      return this.viewedItem?.patientIdentificationType ||
        this.viewedItem?.detallesCompletos?.paciente?.tipoIdentificacion ||
        'No especificado';
    } else {
      return this.viewedItem?.patientIdentificationType || 'No especificado';
    }
  }

  /**
   * Obtiene los nombres de las capas a partir de sus IDs
   * @param capas Array de IDs de capas o string único
   * @returns Array de nombres de capas
   */
  getNombreCapas(capas: string[] | string): string[] {
    if (!Array.isArray(capas)) {
      capas = [capas];
    }
    return capas
      .map(id => this.capaMap[id] || 'Capa no encontrada')
      .filter(nombre => nombre !== 'Capa no encontrada');
  }

  /**
   * Obtiene el nombre de una capa específica
   * @param id ID de la capa
   * @returns Nombre de la capa o mensaje de error
   */
  getNombreCapa(id: string): string {
    if (!id) return 'Sin asignar';
    return this.capaMap[id] || `Capa (ID: ${id}) no encontrada`;
  }

  /**
   * Obtiene los IDs de capa del elemento visualizado
   * @returns Array de IDs de capa
   */
  getCapaIds(): string[] {
    if (this.viewedItem?.attributes?.researchLayerId) {
      return Array.isArray(this.viewedItem.attributes.researchLayerId)
        ? this.viewedItem.attributes.researchLayerId
        : [this.viewedItem.attributes.researchLayerId];
    }

    const raw = this.viewedItem?.researchLayerId || this.viewedItem?.capaRawValue;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }

  /**
   * Obtiene la información del paciente (compatible con historial y registro completo)
   * @returns Información del paciente
   */
  getPatientInfo(): any {
    if (this.viewType === 'historial') {
      return this.registroCompleto?.patientBasicInfo || {};
    } else {
      return this.viewedItem?.patientBasicInfo || {};
    }
  }

  /**
   * Obtiene las variables de investigación (compatible con ambos formatos)
   * @returns Array de variables
   */
  getVariables(): any[] {
    if (this.viewType === 'historial') {
      return this.viewedItem?.isResearchLayerGroup?.variables || [];
    } else {
      const mainInfo = this.viewedItem?.registerInfo && this.viewedItem.registerInfo.length > 0
        ? this.viewedItem.registerInfo[0]
        : null;
      return mainInfo?.variablesInfo || [];
    }
  }

  /**
   * Obtiene información de la capa de investigación
   * @returns Información de la capa
   */
  getLayerInfo(): any {
    if (this.viewType === 'historial') {
      return {
        researchLayerId: this.viewedItem?.isResearchLayerGroup?.researchLayerId,
        researchLayerName: this.viewedItem?.isResearchLayerGroup?.researchLayerName
      };
    } else {
      const mainInfo = this.viewedItem?.registerInfo && this.viewedItem.registerInfo.length > 0
        ? this.viewedItem.registerInfo[0]
        : null;
      return {
        researchLayerId: mainInfo?.researchLayerId,
        researchLayerName: mainInfo?.researchLayerName
      };
    }
  }

  /**
   * Obtiene información del cuidador
   * @returns Información del cuidador
   */
  getCaregiver(): any {
    if (this.viewType === 'historial') {
      return this.registroCompleto?.caregiver || null;
    } else {
      return this.viewedItem?.caregiver || null;
    }
  }

  /**
   * Obtiene información del profesional de salud
   * @returns Información del profesional de salud
   */
  getHealthProfessional(): any {
    if (this.viewType === 'historial') {
      return this.registroCompleto?.healthProfessional || null;
    } else {
      return this.viewedItem?.healthProfessional || null;
    }
  }

  // MÉTODOS DE FORMATO Y UTILIDAD
  // =============================

  /**
   * Formatea un tipo de identificación a su representación legible
   * @param tipo Tipo de identificación
   * @returns Tipo formateado
   */
  getTipoIdentificacion(tipo: string): string {
    if (!tipo || tipo === 'No especificado' || tipo === 'null' || tipo === 'undefined') {
      return 'No especificado';
    }

    const tiposMap: { [key: string]: string } = {
      'CC': 'Cédula de Ciudadanía',
      'TI': 'Tarjeta de Identidad',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte',
      'RC': 'Registro Civil',
      'Cedula de ciudadania': 'Cédula de Ciudadanía',
      'Cédula de Ciudadanía': 'Cédula de Ciudadanía',
      'Tarjeta de Identidad': 'Tarjeta de Identidad',
      'Cédula de Extranjería': 'Cédula de Extranjería',
      'Pasaporte': 'Pasaporte',
      'Registro Civil': 'Registro Civil'
    };

    return tiposMap[tipo] || tipo;
  }

  /**
   * Formatea un rol a su representación legible
   * @param rol Rol a formatear
   * @returns Rol formateado
   */
  getRolFormateado(rol: string): string {
    const rolesMap: { [key: string]: string } = {
      'Admin': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador',
      'Admin_client_role': 'Administrador'
    };
    return rolesMap[rol] || rol;
  }

  /**
   * Formatea una fecha a formato local
   * @param dateString Fecha en formato string
   * @returns Fecha formateada
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  }

  /**
   * Obtiene la etiqueta correspondiente a un valor en un array de opciones
   * @param options Array de opciones
   * @param value Valor a buscar
   * @returns Etiqueta correspondiente o el valor original
   */
  getLabel(options: any[], value: string): string {
    if (!value) return '';

    let option = options.find(opt =>
      opt.value?.toLowerCase() === value?.toLowerCase() ||
      opt.value === value
    );

    if (!option) {
      option = options.find(opt =>
        opt.label?.toLowerCase() === value?.toLowerCase() ||
        opt === value
      );
    }

    return option ? option.label : value;
  }

  /**
   * Formatea el valor de una variable para mostrar
   * @param variable Variable a formatear
   * @returns Valor formateado de la variable
   */
  formatVariableValue(variable: any): string {
    if (!variable) return 'No definido';

    if (variable.valueAsNumber !== null && variable.valueAsNumber !== undefined) {
      return variable.valueAsNumber.toString();
    }
    if (variable.valueAsString !== null && variable.valueAsString !== undefined) {
      return variable.valueAsString;
    }

    if (variable.value !== null && variable.value !== undefined) {
      return variable.value.toString();
    }

    return 'No definido';
  }

  /**
   * Obtiene el nombre de la variable (compatible con ambos formatos)
   * @param variable Variable
   * @returns Nombre de la variable
   */
  getVariableName(variable: any): string {
    return variable.variableName || variable.name || 'Variable sin nombre';
  }

  /**
   * Obtiene el tipo de variable (compatible con ambos formatos)
   * @param variable Variable
   * @returns Tipo de variable
   */
  getVariableType(variable: any): string {
    return variable.type || 'Tipo no especificado';
  }

  /**
   * Obtiene la operación formateada para el historial
   * @returns Operación formateada
   */
  getOperationDisplay(): string {
    if (this.viewType !== 'historial') return '';

    const operations: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'Registro Creado',
      'UPDATE_RESEARCH_LAYER': 'Capa Actualizada',
      'VARIABLE_UPDATED': 'Variable Actualizada',
      'PATIENT_INFO_UPDATED': 'Información Paciente Actualizada'
    };

    return operations[this.viewedItem?.operation] || this.viewedItem?.operation;
  }

  // MÉTODOS DE VALIDACIÓN
  // =====================

  /**
   * Verifica si un valor es un array
   * @param valor Valor a verificar
   * @returns True si es array, false en caso contrario
   */
  esArray(valor: any): boolean {
    return Array.isArray(valor);
  }

  /**
   * Verifica si hay datos del cuidador
   * @returns True si hay datos del cuidador, false en caso contrario
   */
  hasCaregiverData(): boolean {
    const caregiver = this.getCaregiver();
    return caregiver && (
      caregiver.name ||
      caregiver.identificationType ||
      caregiver.identificationNumber
    );
  }

  /**
   * Verifica si la información del paciente está vacía
   * @returns True si la información está vacía, false en caso contrario
   */
  isPatientInfoEmpty(): boolean {
    if (this.viewType === 'historial') {
      const hasBasicInfo = this.registroCompleto?.patientBasicInfo &&
        Object.keys(this.registroCompleto.patientBasicInfo).length > 0;
      const hasHistorialInfo = this.viewedItem?.patientIdentificationNumber;

      return !hasBasicInfo && !hasHistorialInfo;
    } else {
      const patientInfo = this.getPatientInfo();
      if (!patientInfo) return true;

      if (typeof patientInfo === 'object' && patientInfo !== null) {
        return Object.keys(patientInfo).length === 0;
      }

      return !patientInfo;
    }
  }

  // MÉTODOS DE INTERACCIÓN DE USUARIO
  // =================================

  /**
   * Cierra el modal emitiendo el evento correspondiente
   */
  cerrarModal(): void {
    this.closeModal.emit();
  }

  // MÉTODOS UTILITARIOS PARA TEMPLATE
  // =================================

  /**
   * Método para usar Math.min en el template
   * @param a Primer número
   * @param b Segundo número
   * @returns El menor de los dos números
   */
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
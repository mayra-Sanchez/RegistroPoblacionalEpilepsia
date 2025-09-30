import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
// Services
import { ConsolaRegistroService } from 'src/app/services/register.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginationRequest } from 'src/app/services/register.service';

/**
 * Datos de entrada para el modal de versionamiento
 */
export interface VersionamientoModalData {
  patientIdentificationNumber?: number;
  researchLayerId: string;
  pacienteNombre?: string;
}

/**
 * Item individual del historial de cambios
 */
export interface HistorialItem {
  id: string;
  registerId: string;
  changedBy: string;
  changedAt: string;
  operation: string;
  patientIdentificationNumber: number;
  isCaregiverInfo?: any;
  isPatientBasicInfo?: any;
  isResearchLayerGroup?: any;
}

/**
 * Grupo de cambios por versión/registro
 */
export interface VersionGroup {
  registerId: string;
  changedBy: string;
  changedAt: string;
  operation: string;
  items: HistorialItem[];
  hasBasicInfo: boolean;
  hasCaregiverInfo: boolean;
  hasResearchVariables: boolean;
}

/**
 * Información del paciente
 */
export interface PatientInfo {
  name: string;
  identificationNumber: number;
  verified: boolean;
}

/**
 * Componente modal para mostrar el versionamiento completo de un paciente
 * Incluye historial de información básica, cuidador y variables de investigación
 */
@Component({
  selector: 'app-versionamiento-modal',
  templateUrl: './versionamiento-modal.component.html',
  styleUrls: ['./versionamiento-modal.component.css']
})
export class VersionamientoModalComponent implements OnInit {
  //#region Propiedades de Estado
  /** Indica si se está cargando datos generales */
  loading = false;

  /** Número de identificación del paciente */
  patientIdentificationNumber?: number;

  /** Información del paciente */
  patientInfo: PatientInfo | null = null;

  /** Formulario de búsqueda */
  searchForm: FormGroup;

  // Estados de carga por sección
  loadingBasicInfo = false;
  loadingCaregiver = false;
  loadingVariables = false;

  /** Página actual para cargar más versiones */
  private currentVersionPage = 0;

  /** Indica si hay más versiones por cargar */
  private hasMoreVersions = true;

  /** Grupos de versiones agrupadas */
  versionGroups: VersionGroup[] = [];

  // Historiales separados por tipo
  private basicInfoHistory: HistorialItem[] = [];
  private caregiverHistory: HistorialItem[] = [];
  private variablesHistory: HistorialItem[] = [];

  //#endregion

  //#region Propiedades de Paginación
  /** Página actual por sección */
  currentPage = {
    basic: 0,
    caregiver: 0,
    variables: 0
  };

  /** Tamaño de página */
  pageSize = 10;

  /** Total de elementos por sección */
  totalElements = {
    basic: 0,
    caregiver: 0,
    variables: 0
  };

  //#region Propiedades de Filtros y UI Adicionales
  /** Mensaje de error */
  errorMessage: string = '';

  /** Mensaje de éxito */
  successMessage: string = '';

  /** Modo de vista actual */
  viewMode: 'timeline' | 'table' | 'summary' = 'timeline';

  /** Versión seleccionada para mostrar detalles */
  selectedVersion: VersionGroup | null = null;
  /** Selección para checkboxes */
  selection = new SelectionModel<VersionGroup>(true, []);
  /** Indica si se está cargando más versiones */
  loadingMore: boolean = false;

  /** Filtros aplicados */
  filters = {
    sections: {
      basic: true,
      caregiver: true,
      variables: true
    },
    operations: [] as string[],
    searchText: ''
  };

  /** Operaciones disponibles para filtrar */
  availableOperations: string[] = [
    'REGISTER_CREATED_SUCCESSFULL',
    'UPDATE_PATIENT_BASIC_INFO',
    'UPDATE_CAREGIVER',
    'UPDATE_RESEARCH_LAYER'
  ];

  /** Estadísticas del historial */
  statistics = {
    totalVersions: 0,
    bySection: {
      basic: 0,
      caregiver: 0,
      variables: 0
    },
    byOperation: {} as { [key: string]: number }
  };

  /** Grupos de versiones filtrados */
  filteredVersionGroups: VersionGroup[] = [];
  //#endregion
  //#endregion

  //#region Propiedades de UI
  /** Índice de la pestaña activa */
  activeTabIndex = 0;
  //#endregion

  //#region Constructor e Inicialización
  /**
   * Constructor del componente
   * @param dialogRef Referencia al modal dialog
   * @param data Datos inyectados para el modal
   * @param consolaService Servicio de consola de registro
   * @param authService Servicio de autenticación
   * @param fb FormBuilder para formularios reactivos
   */
  constructor(
    public dialogRef: MatDialogRef<VersionamientoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VersionamientoModalData,
    private consolaService: ConsolaRegistroService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.data = data || {
      researchLayerId: '',
      patientIdentificationNumber: undefined,
      pacienteNombre: undefined
    };

    this.searchForm = this.fb.group({
      patientIdentificationNumber: [
        this.data.patientIdentificationNumber || '',
        [Validators.required, Validators.min(1)]
      ]
    });

    if (this.data.patientIdentificationNumber) {
      this.searchForm.patchValue({
        patientIdentificationNumber: this.data.patientIdentificationNumber
      });
    }
  }

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    if (this.searchForm.get('patientIdentificationNumber')?.value) {
      if (this.data.pacienteNombre) {
        this.patientInfo = {
          name: this.data.pacienteNombre,
          identificationNumber: this.data.patientIdentificationNumber!,
          verified: true
        };
      }
      this.searchPatient();
    }
  }
  //#endregion

  //#region Métodos de Búsqueda y Validación
  /**
   * Valida si el paciente existe en el sistema
   * @param identificationNumber Número de identificación a validar
   * @returns Promise que resuelve a true si el paciente existe
   */
  private async validatePatientExists(identificationNumber: number): Promise<boolean> {
    return new Promise(resolve => {
      // Simulación de validación - en una implementación real haría una llamada API
      setTimeout(() => {
        resolve(identificationNumber > 0);
      }, 500);
    });
  }

  /**
   * Busca y carga los historiales del paciente
   */
  searchPatient(): void {
    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      this.showError('Por favor corrige los errores en el formulario');
      return;
    }

    const idNumber = this.searchForm.get('patientIdentificationNumber')?.value;

    if (!idNumber || idNumber <= 0) {
      this.showError('El número de identificación debe ser válido');
      return;
    }

    this.patientIdentificationNumber = idNumber;
    this.loading = true;
    this.patientInfo = null;
    this.versionGroups = [];
    this.clearAllHistories();

    if (!this.data.researchLayerId) {
      this.loading = false;
      this.showError('No se ha configurado la capa de investigación');
      return;
    }

    this.validateAndLoadPatientData(idNumber);
  }

  /**
   * Valida y carga los datos del paciente
   */
  private validateAndLoadPatientData(idNumber: number): void {
    this.validatePatientExists(idNumber).then(isValid => {
      if (isValid) {
        this.loadAllHistoriesWithPatientInfo();
      } else {
        this.showError('No se encontró un paciente con ese número de identificación');
        this.loading = false;
      }
    }).catch(error => {
      this.loading = false;
      this.showError('Error al buscar el paciente: ' + error.message);
    });
  }
  //#endregion

  //#region Métodos de Carga de Datos
  /**
   * Carga todos los historiales y extrae la información del paciente
   */
  private loadAllHistoriesWithPatientInfo(): void {
    this.loading = true;

    forkJoin({
      basicInfo: this.loadPatientBasicInfoInternal(0),
      caregiver: this.loadCaregiverInfoInternal(0),
      variables: this.loadResearchVariablesInternal(0)
    }).subscribe({
      next: (results) => {
        this.processHistoriesResults(results);
        this.loading = false;
      },
      error: (error) => {
        this.handleHistoriesError(error);
        this.loading = false;
      }
    });
  }

  /**
   * Procesa los resultados de los historiales cargados
   */
  private processHistoriesResults(results: any): void {
    this.basicInfoHistory = results.basicInfo;
    this.caregiverHistory = results.caregiver;
    this.variablesHistory = results.variables;

    this.extractPatientInfoFromHistories();
    this.groupHistoriesByVersion();

    this.hasMoreVersions = this.checkIfHasMoreVersions(results);
  }

  /**
   * Maneja errores en la carga de historiales
   */
  private handleHistoriesError(error: any): void {
    console.error('Error loading histories:', error);
    this.showError('Error al cargar el historial completo');
  }

  /**
   * Carga más versiones cuando el usuario hace scroll
   */
  loadMore(): void {
    if (!this.hasMoreVersions || this.loadingMore) return;

    this.loadingMore = true;
    this.currentVersionPage++;

    forkJoin({
      basicInfo: this.loadPatientBasicInfoInternal(this.currentVersionPage),
      caregiver: this.loadCaregiverInfoInternal(this.currentVersionPage),
      variables: this.loadResearchVariablesInternal(this.currentVersionPage)
    }).subscribe({
      next: (results) => {
        this.updateHistoriesWithPagination(results, this.currentVersionPage);
        this.groupHistoriesByVersion();
        this.updateHasMoreVersions(results);
        this.loadingMore = false;
      },
      error: (error) => {
        this.handleHistoriesError(error);
        this.loadingMore = false;
      }
    });
  }

  /**
   * Carga todas las secciones y las agrupa por versión
   */
  private loadAllHistories(page: number = 0): Observable<any> {
    return new Observable(observer => {
      this.loading = page === 0;

      forkJoin({
        basicInfo: this.loadPatientBasicInfoInternal(page),
        caregiver: this.loadCaregiverInfoInternal(page),
        variables: this.loadResearchVariablesInternal(page)
      }).subscribe({
        next: (results) => {
          this.updateHistoriesWithPagination(results, page);
          this.groupHistoriesByVersion();
          this.updateHasMoreVersions(results);
          this.loading = false;
          observer.next(results);
          observer.complete();
        },
        error: (error) => {
          this.handleHistoriesError(error);
          this.loading = false;
          observer.error(error);
        }
      });
    });
  }

  /**
   * Actualiza los historiales con paginación
   */
  private updateHistoriesWithPagination(results: any, page: number): void {
    if (page === 0) {
      this.basicInfoHistory = results.basicInfo;
      this.caregiverHistory = results.caregiver;
      this.variablesHistory = results.variables;
      this.versionGroups = [];
    } else {
      this.basicInfoHistory = [...this.basicInfoHistory, ...results.basicInfo];
      this.caregiverHistory = [...this.caregiverHistory, ...results.caregiver];
      this.variablesHistory = [...this.variablesHistory, ...results.variables];
    }
  }

  /**
   * Actualiza el estado de si hay más versiones por cargar
   */
  private updateHasMoreVersions(results: any): void {
    this.hasMoreVersions = results.basicInfo.length === this.pageSize ||
      results.caregiver.length === this.pageSize ||
      results.variables.length === this.pageSize;
  }

  /**
   * Verifica si hay más versiones por cargar
   */
  private checkIfHasMoreVersions(results: any): boolean {
    return results.basicInfo.length === this.pageSize ||
      results.caregiver.length === this.pageSize ||
      results.variables.length === this.pageSize;
  }
  //#endregion

  //#region Métodos de Carga por Sección
  /**
   * Carga el historial de información básica del paciente
   */
  loadPatientBasicInfo(page: number = 0): void {
    if (!this.patientIdentificationNumber) return;

    this.loadingBasicInfo = true;
    const pagination = this.createPaginationRequest(page);

    this.consolaService.getPatientBasicInfoRegisters(
      this.patientIdentificationNumber,
      pagination
    ).subscribe({
      next: (response: any) => this.handleBasicInfoResponse(response, page),
      error: (error) => this.handleBasicInfoError(error)
    });
  }

  /**
   * Maneja la respuesta de información básica
   */
  private handleBasicInfoResponse(response: any, page: number): void {
    const data = response.data || response.content || [];
    this.basicInfoHistory = page === 0 ? data : [...this.basicInfoHistory, ...data];
    this.totalElements.basic = response.totalElements || 0;
    this.currentPage.basic = page;
    this.loadingBasicInfo = false;
  }

  /**
   * Maneja errores de información básica
   */
  private handleBasicInfoError(error: any): void {
    console.error('Error loading patient basic info:', error);
    this.loadingBasicInfo = false;
    this.showError('Error al cargar el historial de información básica: ' + error.message);
  }

  /**
   * Carga el historial de información del cuidador
   */
  loadCaregiverInfo(page: number = 0): void {
    if (!this.patientIdentificationNumber) return;

    this.loadingCaregiver = true;
    const pagination = this.createPaginationRequest(page);

    this.consolaService.getCaregiverRegisters(
      this.patientIdentificationNumber,
      pagination
    ).subscribe({
      next: (response: any) => this.handleCaregiverResponse(response, page),
      error: (error) => this.handleCaregiverError(error)
    });
  }

  /**
   * Maneja la respuesta del cuidador
   */
  private handleCaregiverResponse(response: any, page: number): void {
    const data = response.data || response.content || [];
    this.caregiverHistory = page === 0 ? data : [...this.caregiverHistory, ...data];
    this.totalElements.caregiver = response.totalElements || 0;
    this.currentPage.caregiver = page;
    this.loadingCaregiver = false;
  }

  /**
   * Maneja errores del cuidador
   */
  private handleCaregiverError(error: any): void {
    console.error('Error loading caregiver info:', error);
    this.loadingCaregiver = false;
    this.showError('Error al cargar el historial del cuidador: ' + error.message);
  }

  /**
   * Carga el historial de variables de investigación
   */
  loadResearchVariables(page: number = 0): void {
    if (!this.patientIdentificationNumber || !this.data.researchLayerId) return;

    this.loadingVariables = true;
    const pagination = this.createPaginationRequest(page);
    const userEmail = this.authService.getUserEmail();

    if (!userEmail) {
      this.loadingVariables = false;
      this.showError('No se pudo obtener el email del usuario');
      return;
    }

    this.consolaService.getRegistersByResearchLayer(
      this.data.researchLayerId,
      userEmail,
      this.patientIdentificationNumber,
      pagination
    ).subscribe({
      next: (response: any) => this.handleVariablesResponse(response, page),
      error: (error) => this.handleVariablesError(error)
    });
  }

  /**
   * Maneja la respuesta de variables de investigación
   */
  private handleVariablesResponse(response: any, page: number): void {
    const data = response.data || response.content || [];
    this.variablesHistory = page === 0 ? data : [...this.variablesHistory, ...data];
    this.totalElements.variables = response.totalElements || 0;
    this.currentPage.variables = page;
    this.loadingVariables = false;
  }

  /**
   * Maneja errores de variables de investigación
   */
  private handleVariablesError(error: any): void {
    console.error('Error loading research variables:', error);
    this.loadingVariables = false;
    this.showError('Error al cargar el historial de variables: ' + error.message);
  }

  /**
   * Crea un objeto de paginación
   */
  private createPaginationRequest(page: number): PaginationRequest {
    return {
      page: page,
      size: this.pageSize,
      sort: 'changedAt',
      sortDirection: 'DESC'
    };
  }
  //#endregion

  //#region Métodos Internos de Carga (para forkJoin)
  /**
   * Carga información básica (para uso interno con forkJoin)
   */
  private loadPatientBasicInfoInternal(page: number = 0): Observable<HistorialItem[]> {
    return new Observable(observer => {
      if (!this.patientIdentificationNumber) {
        observer.next([]);
        observer.complete();
        return;
      }

      const pagination = this.createPaginationRequest(page);

      this.consolaService.getPatientBasicInfoRegisters(
        this.patientIdentificationNumber,
        pagination
      ).subscribe({
        next: (response: any) => {
          const data = response.data || response.content || [];
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          console.error('Error loading patient basic info:', error);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }

  /**
   * Carga información del cuidador (para uso interno con forkJoin)
   */
  private loadCaregiverInfoInternal(page: number = 0): Observable<HistorialItem[]> {
    return new Observable(observer => {
      if (!this.patientIdentificationNumber) {
        observer.next([]);
        observer.complete();
        return;
      }

      const pagination = this.createPaginationRequest(page);

      this.consolaService.getCaregiverRegisters(
        this.patientIdentificationNumber,
        pagination
      ).subscribe({
        next: (response: any) => {
          const data = response.data || response.content || [];
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          console.error('Error loading caregiver info:', error);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }

  /**
   * Carga variables de investigación (para uso interno con forkJoin)
   */
  private loadResearchVariablesInternal(page: number = 0): Observable<HistorialItem[]> {
    return new Observable(observer => {
      if (!this.patientIdentificationNumber || !this.data.researchLayerId) {
        observer.next([]);
        observer.complete();
        return;
      }

      const pagination = this.createPaginationRequest(page);
      const userEmail = this.authService.getUserEmail();

      if (!userEmail) {
        observer.next([]);
        observer.complete();
        return;
      }

      this.consolaService.getRegistersByResearchLayer(
        this.data.researchLayerId,
        userEmail,
        this.patientIdentificationNumber,
        pagination
      ).subscribe({
        next: (response: any) => {
          const data = response.data || response.content || [];
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          console.error('Error loading research variables:', error);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }
  //#endregion

  //#region Métodos de Procesamiento de Datos
  /**
   * Agrupa todos los historiales por registerId y changedAt
   */
  private groupHistoriesByVersion(): void {
    this.extractPatientInfoFromHistories();

    const allItems = [
      ...this.basicInfoHistory,
      ...this.caregiverHistory,
      ...this.variablesHistory
    ];

    const groupsMap = new Map<string, VersionGroup>();

    allItems.forEach(item => {
      const key = `${item.registerId}-${item.changedAt}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, this.createVersionGroup(item));
      }

      this.updateVersionGroup(groupsMap.get(key)!, item);
    });

    this.versionGroups = this.sortVersionGroups(groupsMap);

    // Aplicar filtros después de agrupar
    this.applyFilters();
    this.updateStatistics();
  }

  /**
   * Crea un nuevo grupo de versión
   */
  private createVersionGroup(item: HistorialItem): VersionGroup {
    return {
      registerId: item.registerId,
      changedBy: item.changedBy,
      changedAt: item.changedAt,
      operation: item.operation,
      items: [],
      hasBasicInfo: false,
      hasCaregiverInfo: false,
      hasResearchVariables: false
    };
  }

  /**
   * Actualiza un grupo de versión con un nuevo item
   */
  private updateVersionGroup(group: VersionGroup, item: HistorialItem): void {
    group.items.push(item);

    if (item.isPatientBasicInfo) group.hasBasicInfo = true;
    if (item.isCaregiverInfo) group.hasCaregiverInfo = true;
    if (item.isResearchLayerGroup) group.hasResearchVariables = true;
    if (this.isMoreSignificantOperation(item.operation, group.operation)) {
      group.operation = item.operation;
    }
  }

  /**
   * Ordena los grupos de versión por fecha (más reciente primero)
   */
  private sortVersionGroups(groupsMap: Map<string, VersionGroup>): VersionGroup[] {
    return Array.from(groupsMap.values())
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }

  /**
   * Determina si una operación es más significativa que otra
   */
  private isMoreSignificantOperation(newOp: string, currentOp: string): boolean {
    const significanceOrder = [
      'REGISTER_CREATED_SUCCESSFULL',
      'UPDATE_PATIENT_BASIC_INFO',
      'UPDATE_CAREGIVER',
      'UPDATE_RESEARCH_LAYER'
    ];

    const newIndex = significanceOrder.indexOf(newOp);
    const currentIndex = significanceOrder.indexOf(currentOp);

    return newIndex < currentIndex || currentIndex === -1;
  }

  /**
   * Extrae la información del paciente de los historiales cargados
   */
  private extractPatientInfoFromHistories(): void {
    const allItems = [
      ...this.basicInfoHistory,
      ...this.caregiverHistory,
      ...this.variablesHistory
    ];

    const patientBasicInfoItem = allItems
      .filter(item => item.isPatientBasicInfo && item.isPatientBasicInfo.name)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0];

    if (patientBasicInfoItem && patientBasicInfoItem.isPatientBasicInfo) {
      const basicInfo = patientBasicInfoItem.isPatientBasicInfo;
      this.patientInfo = {
        name: basicInfo.name || `Paciente ${this.patientIdentificationNumber}`,
        identificationNumber: this.patientIdentificationNumber!,
        verified: true
      };
    } else {
      this.patientInfo = {
        name: `Paciente ${this.patientIdentificationNumber}`,
        identificationNumber: this.patientIdentificationNumber!,
        verified: true
      };
    }

    if (this.data.pacienteNombre && this.patientInfo.name.startsWith('Paciente ')) {
      this.patientInfo.name = this.data.pacienteNombre;
    }
  }
  //#endregion

  //#region Métodos de Utilidad para la UI
  /**
   * Maneja el cambio de pestaña
   */
  onTabChange(event: any): void {
    const tabIndex = event.index !== undefined ? event.index : 0;
    this.activeTabIndex = tabIndex;
    this.loadSectionDataForTab(tabIndex);
  }

  /**
   * Carga los datos de la sección correspondiente a la pestaña activa
   */
  private loadSectionDataForTab(tabIndex: number): void {
    switch (tabIndex) {
      case 0:
        if (this.basicInfoHistory.length === 0) {
          this.loadPatientBasicInfo();
        }
        break;
      case 1:
        if (this.caregiverHistory.length === 0) {
          this.loadCaregiverInfo();
        }
        break;
      case 2:
        if (this.variablesHistory.length === 0) {
          this.loadResearchVariables();
        }
        break;
    }
  }

  /**
   * Obtiene los datos de una sección específica dentro de un grupo
   */
  getSectionData(group: VersionGroup, section: string): any {
    const item = group.items.find(item => {
      switch (section) {
        case 'basic': return item.isPatientBasicInfo;
        case 'caregiver': return item.isCaregiverInfo;
        case 'variables': return item.isResearchLayerGroup;
        default: return false;
      }
    });

    return item ? this.getSectionDataFromItem(item, section) : null;
  }

  /**
   * Obtiene los datos de sección de un item específico
   */
  private getSectionDataFromItem(item: HistorialItem, section: string): any {
    switch (section) {
      case 'basic': return item.isPatientBasicInfo;
      case 'caregiver': return item.isCaregiverInfo;
      case 'variables': return item.isResearchLayerGroup;
      default: return null;
    }
  }

  /**
   * Obtiene el texto descriptivo de la operación
   */
  getOperationText(operation: string): string {
    const operations: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'Registro Creado',
      'UPDATE_PATIENT_BASIC_INFO': 'Información Básica Actualizada',
      'UPDATE_CAREGIVER': 'Cuidador Actualizado',
      'UPDATE_RESEARCH_LAYER': 'Variables Actualizadas',
    };
    return operations[operation] || operation;
  }

  /**
   * Obtiene la clase CSS para el tipo de operación
   */
  getOperationClass(operation: string): string {
    const classes: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'operation-created',
      'UPDATE_PATIENT_BASIC_INFO': 'operation-updated',
      'UPDATE_CAREGIVER': 'operation-updated',
      'UPDATE_RESEARCH_LAYER': 'operation-updated'
    };
    return classes[operation] || 'operation-default';
  }

  /**
   * Obtiene el icono para el tipo de operación
   */
  getOperationIcon(operation: string): string {
    const icons: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'add_circle',
      'UPDATE_PATIENT_BASIC_INFO': 'edit',
      'UPDATE_CAREGIVER': 'edit',
      'UPDATE_RESEARCH_LAYER': 'edit'
    };
    return icons[operation] || 'history';
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Obtiene las claves de un objeto para mostrar en la vista
   */
  getObjectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  /**
   * Obtiene el valor formateado para mostrar
   */
  getFormattedValue(value: any): string {
    if (value === null || value === undefined) return 'No especificado';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (value === '') return 'Vacío';
    return String(value);
  }

  /**
   * Formatea los nombres de las claves para mostrarlos mejor
   */
  formatKeyName(key: string): string {
    const keyMap: { [key: string]: string } = {
      'name': 'Nombre',
      'sex': 'Sexo',
      'birthDate': 'Fecha de Nacimiento',
      'age': 'Edad',
      'email': 'Email',
      'phoneNumber': 'Teléfono',
      'deathDate': 'Fecha de Fallecimiento',
      'economicStatus': 'Estado Económico',
      'educationLevel': 'Nivel Educativo',
      'maritalStatus': 'Estado Civil',
      'hometown': 'Ciudad de Origen',
      'currentCity': 'Ciudad Actual',
      'firstCrisisDate': 'Fecha Primera Crisis',
      'crisisStatus': 'Estado de Crisis',
      'identificationType': 'Tipo de Identificación',
      'identificationNumber': 'Número de Identificación',
      'occupation': 'Ocupación'
    };
    return keyMap[key] || key;
  }
  //#endregion

  //#region Métodos de Utilidad
  /**
   * Verifica si hay más versiones por cargar
   */
  hasMore(): boolean {
    return this.hasMoreVersions;
  }

  /**
   * Obtiene los datos actuales de una sección
   */
  getCurrentData(section: string): HistorialItem[] {
    switch (section) {
      case 'basic': return this.basicInfoHistory;
      case 'caregiver': return this.caregiverHistory;
      case 'variables': return this.variablesHistory;
      default: return [];
    }
  }

  /**
   * Limpia todos los historiales
   */
  clearAllHistories(): void {
    this.basicInfoHistory = [];
    this.caregiverHistory = [];
    this.variablesHistory = [];
    this.currentPage = { basic: 0, caregiver: 0, variables: 0 };
    this.totalElements = { basic: 0, caregiver: 0, variables: 0 };
    this.versionGroups = [];
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.dialogRef.close();
  }

  //#region Métodos de Filtrado y Búsqueda
  /**
   * Maneja el cambio de filtros
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Maneja el cambio de filtros de operación - CORREGIDO
   */
  onOperationFilterChange(operation: string, event: any): void {
    if (event.selected) {
      if (!this.filters.operations.includes(operation)) {
        this.filters.operations = [...this.filters.operations, operation];
      }
    } else {
      this.filters.operations = this.filters.operations.filter(op => op !== operation);
    }
    this.applyFilters();
  }

  /**
   * Maneja el cambio en los checkboxes de secciones - NUEVO MÉTODO
   */
  onSectionFilterChange(section: keyof typeof this.filters.sections, event: any): void {
    this.filters.sections[section] = event.checked;
    this.applyFilters();
  }

  /**
   * Maneja el cambio en la búsqueda rápida - MEJORADO
   */
  onSearchChange(searchText: string): void {
    this.filters.searchText = searchText.trim().toLowerCase();
    this.applyFilters();
  }


  /**
 * Aplica todos los filtros a los grupos de versiones - OPTIMIZADO
 */
  applyFilters(): void {
    if (this.versionGroups.length === 0) {
      this.filteredVersionGroups = [];
      this.updateStatistics();
      return;
    }

    this.filteredVersionGroups = this.versionGroups.filter(group => {

      const sectionMatch = this.checkSectionFilter(group);


      const operationMatch = this.checkOperationFilter(group);


      const searchMatch = this.checkSearchFilter(group);

      return sectionMatch && operationMatch && searchMatch;
    });

    this.updateStatistics();
  }

  /**
   * Verifica si el grupo pasa el filtro de secciones
   */
  private checkSectionFilter(group: VersionGroup): boolean {
    const { basic, caregiver, variables } = this.filters.sections;

    if (!basic && !caregiver && !variables) {
      return false;
    }

    return (basic && group.hasBasicInfo) ||
      (caregiver && group.hasCaregiverInfo) ||
      (variables && group.hasResearchVariables);
  }

  /**
   * Verifica si el grupo pasa el filtro de operaciones
   */
  private checkOperationFilter(group: VersionGroup): boolean {
    if (this.filters.operations.length === 0) {
      return true;
    }

    // Verificar si la operación del grupo está en los filtros
    return this.filters.operations.includes(group.operation);
  }

  /**
   * Verifica si el grupo pasa el filtro de búsqueda
   */
  private checkSearchFilter(group: VersionGroup): boolean {
    if (!this.filters.searchText) {
      return true;
    }

    return this.searchInVersionGroup(group, this.filters.searchText);
  }

  /**
   * Busca texto en un grupo de versión
   */
  private searchInVersionGroup(group: VersionGroup, searchText: string): boolean {
    const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);

    return searchTerms.every(term =>
      group.changedBy.toLowerCase().includes(term) ||
      group.operation.toLowerCase().includes(term) ||
      this.getOperationText(group.operation).toLowerCase().includes(term) ||
      this.formatDate(group.changedAt).toLowerCase().includes(term) ||
      group.registerId.toLowerCase().includes(term) ||
      this.searchInVersionData(group, term)
    );
  }

  /**
   * Busca texto en los datos de la versión
   */
  private searchInVersionData(group: VersionGroup, searchText: string): boolean {
    for (const item of group.items) {
      if (item.isPatientBasicInfo && this.searchInObject(item.isPatientBasicInfo, searchText)) {
        return true;
      }
      if (item.isCaregiverInfo && this.searchInObject(item.isCaregiverInfo, searchText)) {
        return true;
      }
      if (item.isResearchLayerGroup && this.searchInObject(item.isResearchLayerGroup, searchText)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Busca texto en un objeto
   */
  private searchInObject(obj: any, searchText: string): boolean {
    if (!obj || typeof obj !== 'object') return false;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (value !== null && value !== undefined) {
          const stringValue = Array.isArray(value)
            ? value.map(v => this.getFormattedValue(v)).join(' ')
            : this.getFormattedValue(value);

          if (stringValue.toLowerCase().includes(searchText)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.filters = {
      sections: {
        basic: true,
        caregiver: true,
        variables: true
      },
      operations: [],
      searchText: ''
    };

    this.applyFilters();

    this.showSuccess('Filtros limpiados correctamente');
  }

  /**
   * Verifica si hay filtros activos - MEJORADO
   */
  hasActiveFilters(): boolean {
    const hasSectionFilters =
      !this.filters.sections.basic ||
      !this.filters.sections.caregiver ||
      !this.filters.sections.variables;

    const hasOperationFilters = this.filters.operations.length > 0;
    const hasSearchFilter = this.filters.searchText !== '';

    return hasSectionFilters || hasOperationFilters || hasSearchFilter;
  }

  //#endregion

  //#region Métodos de Vista y Navegación
  /**
   * Cambia el modo de vista
   */
  setViewMode(mode: 'timeline' | 'table' | 'summary'): void {
    this.viewMode = mode;
  }

  /**
   * Alterna la visualización de detalles de una versión
   */
  toggleVersion(version: VersionGroup): void {
    this.selectedVersion = this.selectedVersion === version ? null : version;
  }

  /**
   * Carga más versiones (para infinite scroll)
   */
  loadMoreVersions(): void {
    if (this.loadingMore || !this.hasMoreVersions) return;

    this.loadingMore = true;
    this.currentVersionPage++;

    this.loadAllHistories(this.currentVersionPage).subscribe({
      next: () => {
        this.loadingMore = false;
        this.applyFilters(); 
      },
      error: () => {
        this.loadingMore = false;
      }
    });
  }
  //#endregion

  //#region Métodos de Estadísticas
  /**
   * Actualiza las estadísticas
   */
  private updateStatistics(): void {
    const groups = this.filteredVersionGroups;

    this.statistics = {
      totalVersions: groups.length,
      bySection: {
        basic: groups.filter(g => g.hasBasicInfo).length,
        caregiver: groups.filter(g => g.hasCaregiverInfo).length,
        variables: groups.filter(g => g.hasResearchVariables).length
      },
      byOperation: this.calculateOperationStats(groups)
    };
  }

  /**
   * Calcula estadísticas por operación
   */
  private calculateOperationStats(groups: VersionGroup[]): { [key: string]: number } {
    const stats: { [key: string]: number } = {};

    groups.forEach(group => {
      stats[group.operation] = (stats[group.operation] || 0) + 1;
    });

    return stats;
  }

  /**
   * Obtiene estadísticas de operaciones para mostrar
   */
  getOperationStats(): Array<{ operation: string, count: number, percentage: number }> {
    const total = this.statistics.totalVersions;
    if (total === 0) return [];

    return Object.entries(this.statistics.byOperation)
      .map(([operation, count]) => ({
        operation,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }
  //#endregion

  //#region Métodos de Utilidad Adicionales
  /**
   * Muestra un mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  /**
   * Muestra un mensaje de error (sobrescribe el método existente)
   */
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * Obtiene el nombre de la clase CSS para la barra de progreso de operación
   */
  getOperationProgressBarClass(operation: string): string {
    const classMap: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'progress-created',
      'UPDATE_PATIENT_BASIC_INFO': 'progress-updated',
      'UPDATE_CAREGIVER': 'progress-updated',
      'UPDATE_RESEARCH_LAYER': 'progress-updated'
    };
    return classMap[operation] || 'progress-default';
  }
  //#endregion
  /**
   * Alterna el filtro de sección
   */
  toggleSectionFilter(section: string, event: any): void {
    this.filters.sections[section as keyof typeof this.filters.sections] = event.selected;
    this.applyFilters();
  }

  /**
   * Alterna el filtro de operación
   */
  toggleOperationFilter(operation: string, event: any): void {
    if (event.selected) {
      this.filters.operations.push(operation);
    } else {
      this.filters.operations = this.filters.operations.filter(op => op !== operation);
    }
    this.applyFilters();
  }
  //#endregion

  //#region Métodos de Selección Múltiple
  /**
   * Verifica si todos los elementos están seleccionados
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredVersionGroups.length;
    return numSelected === numRows && numRows > 0;
  }

  /**
   * Alterna la selección de todas las filas
   */
  toggleAllVersions(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.filteredVersionGroups);
  }

  /**
   * Obtiene el tiempo relativo (hace x tiempo)
   */
  getTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else if (diffMins > 0) {
        return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
      } else {
        return 'hace unos segundos';
      }
    } catch (error) {
      return '';
    }
  }
  //#endregion

  //#region Métodos de Exportación
  /**
   * Exporta el historial a diferentes formatos
   */
  exportHistory(): void {
    if (this.selection.hasValue()) {
      const dataToExport = this.selection.selected;
      this.downloadExport(dataToExport, 'versiones-seleccionadas');
    } else {
      const dataToExport = this.filteredVersionGroups;
      this.downloadExport(dataToExport, 'historial-completo');
    }
  }

  /**
   * Descarga el archivo de exportación
   */
  private downloadExport(data: VersionGroup[], filename: string): void {

    const csvContent = this.convertToCSV(data);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showSuccess('Historial exportado correctamente');
    }
  }

  /**
   * Convierte los datos a formato CSV
   */
  private convertToCSV(data: VersionGroup[]): string {
    const headers = ['Fecha', 'Operación', 'Autor', 'Secciones', 'Register ID'];
    const rows = data.map(version => [
      this.formatDate(version.changedAt),
      this.getOperationText(version.operation),
      version.changedBy,
      this.getSectionsText(version),
      version.registerId
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  /**
   * Obtiene texto de secciones para exportación
   */
  private getSectionsText(version: VersionGroup): string {
    const sections = [];
    if (version.hasBasicInfo) sections.push('Información Básica');
    if (version.hasCaregiverInfo) sections.push('Cuidador');
    if (version.hasResearchVariables) sections.push('Variables');
    return sections.join(', ');
  }
}
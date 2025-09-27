import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';

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
    // Inicializar datos con valores por defecto
    this.data = data || {
      researchLayerId: '',
      patientIdentificationNumber: undefined,
      pacienteNombre: undefined
    };

    // Crear formulario de búsqueda
    this.searchForm = this.fb.group({
      patientIdentificationNumber: [
        this.data.patientIdentificationNumber || '',
        [Validators.required, Validators.min(1)]
      ]
    });

    // Pre-cargar número de identificación si está disponible
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
    const idNumber = this.getPatientIdentificationNumberFromForm();
    
    if (!this.isValidPatientId(idNumber)) {
      return;
    }

    this.patientIdentificationNumber = idNumber;
    this.loading = true;
    this.patientInfo = null;
    this.versionGroups = [];

    if (!this.data.researchLayerId) {
      this.loading = false;
      this.showError('No se ha configurado la capa de investigación');
      return;
    }

    this.validateAndLoadPatientData(idNumber);
  }

  /**
   * Obtiene el número de identificación del formulario
   */
  private getPatientIdentificationNumberFromForm(): number {
    const value = this.searchForm.get('patientIdentificationNumber')?.value;
    return Number(value);
  }

  /**
   * Valida si el ID del paciente es válido
   */
  private isValidPatientId(idNumber: number): boolean {
    if (!idNumber) {
      this.showError('Por favor ingresa un número de identificación válido');
      return false;
    }

    if (isNaN(idNumber) || idNumber <= 0) {
      this.showError('El número de identificación debe ser un número válido');
      return false;
    }

    return true;
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
    if (!this.hasMoreVersions) return;
    
    this.currentVersionPage++;
    this.loadAllHistories(this.currentVersionPage);
  }

  /**
   * Carga todas las secciones y las agrupa por versión
   */
  private loadAllHistories(page: number = 0): void {
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
      },
      error: (error) => {
        this.handleHistoriesError(error);
        this.loading = false;
      }
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
    
    // Mantener la operación más reciente o significativa
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
      'REGISTER_DELETED',
      'UPDATE_PATIENT_BASIC_INFO',
      'UPDATE_CAREGIVER',
      'UPDATE_RESEARCH_LAYER',
      'REGISTER_UPDATED'
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

    // Usar el nombre proporcionado si está disponible
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
      'REGISTER_UPDATED': 'Registro Actualizado',
      'REGISTER_DELETED': 'Registro Eliminado'
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
      'UPDATE_RESEARCH_LAYER': 'operation-updated',
      'REGISTER_UPDATED': 'operation-updated',
      'REGISTER_DELETED': 'operation-deleted'
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
      'UPDATE_RESEARCH_LAYER': 'edit',
      'REGISTER_UPDATED': 'edit',
      'REGISTER_DELETED': 'delete'
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
   * Muestra un mensaje de error
   */
  private showError(message: string): void {
    console.error(message);
    // En una implementación real, usarías un servicio de notificaciones
    alert(message);
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.dialogRef.close();
  }
  //#endregion
}
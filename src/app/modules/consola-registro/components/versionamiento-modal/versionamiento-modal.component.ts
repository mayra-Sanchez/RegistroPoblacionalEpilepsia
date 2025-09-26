import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConsolaRegistroService } from 'src/app/services/register.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginationRequest } from 'src/app/services/register.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';

export interface VersionamientoModalData {
  patientIdentificationNumber?: number;
  researchLayerId: string;
  pacienteNombre?: string;
}

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

// Nueva interfaz para agrupar por versión
export interface VersionGroup {
  registerId: string;
  changedBy: string;
  changedAt: string;
  operation: string;
  items: HistorialItem[]; // Todos los cambios de esta versión
  hasBasicInfo: boolean;
  hasCaregiverInfo: boolean;
  hasResearchVariables: boolean;
}

export interface PatientInfo {
  name: string;
  identificationNumber: number;
  verified: boolean;
}

@Component({
  selector: 'app-versionamiento-modal',
  templateUrl: './versionamiento-modal.component.html',
  styleUrls: ['./versionamiento-modal.component.css']
})
export class VersionamientoModalComponent implements OnInit {
  loading = false;
  patientIdentificationNumber?: number;
  patientInfo: PatientInfo | null = null;
  searchForm: FormGroup;

  // Estados de carga por sección
  loadingBasicInfo = false;
  loadingCaregiver = false;
  loadingVariables = false;
  private currentVersionPage = 0;
  private hasMoreVersions = true;

  versionGroups: VersionGroup[] = [];

  // Mantener historiales separados para las llamadas API
  private basicInfoHistory: HistorialItem[] = [];
  private caregiverHistory: HistorialItem[] = [];
  private variablesHistory: HistorialItem[] = [];

  // Paginación
  currentPage = {
    basic: 0,
    caregiver: 0,
    variables: 0
  };

  pageSize = 10;
  totalElements = {
    basic: 0,
    caregiver: 0,
    variables: 0
  };

  // Pestaña activa
  activeTabIndex = 0;

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

  /**
   * Valida si el paciente existe
   */
  private async validatePatientExists(identificationNumber: number): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(identificationNumber > 0);
      }, 500);
    });
  }

  /**
   * Maneja el cambio de pestaña
   */
  onTabChange(event: any): void {
    const tabIndex = event.index !== undefined ? event.index :
      event.tab?.textLabel ? this.getTabIndexFromEvent(event) : 0;

    this.activeTabIndex = tabIndex;

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

  private getTabIndexFromEvent(event: any): number {
    return 0;
  }

  /**
   * Verifica si hay más versiones por cargar
   */
  hasMore(): boolean {
    return this.hasMoreVersions;
  }

  /**
   * Carga más versiones
   */
  loadMore(): void {
    if (!this.hasMoreVersions) return;
    this.currentVersionPage++;
    this.loadAllHistories(this.currentVersionPage);
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

  /**
   * Muestra un mensaje de error
   */
  private showError(message: string): void {
    console.error(message);
    alert(message);
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Carga el historial de información básica del paciente
   */
  loadPatientBasicInfo(page: number = 0): void {
    if (!this.patientIdentificationNumber) return;

    this.loadingBasicInfo = true;
    const pagination: PaginationRequest = {
      page: page,
      size: this.pageSize,
      sort: 'changedAt',
      sortDirection: 'DESC'
    };

    this.consolaService.getPatientBasicInfoRegisters(
      this.patientIdentificationNumber,
      pagination
    ).subscribe({
      next: (response: any) => {
        const data = response.data || response.content || [];
        this.basicInfoHistory = page === 0 ? data : [...this.basicInfoHistory, ...data];
        this.totalElements.basic = response.totalElements || 0;
        this.currentPage.basic = page;
        this.loadingBasicInfo = false;
      },
      error: (error) => {
        console.error('Error loading patient basic info:', error);
        this.loadingBasicInfo = false;
        this.showError('Error al cargar el historial de información básica: ' + error.message);
      }
    });
  }

  /**
   * Carga el historial de información del cuidador
   */
  loadCaregiverInfo(page: number = 0): void {
    if (!this.patientIdentificationNumber) return;

    this.loadingCaregiver = true;
    const pagination: PaginationRequest = {
      page: page,
      size: this.pageSize,
      sort: 'changedAt',
      sortDirection: 'DESC'
    };

    this.consolaService.getCaregiverRegisters(
      this.patientIdentificationNumber,
      pagination
    ).subscribe({
      next: (response: any) => {
        const data = response.data || response.content || [];
        this.caregiverHistory = page === 0 ? data : [...this.caregiverHistory, ...data];
        this.totalElements.caregiver = response.totalElements || 0;
        this.currentPage.caregiver = page;
        this.loadingCaregiver = false;
      },
      error: (error) => {
        console.error('Error loading caregiver info:', error);
        this.loadingCaregiver = false;
        this.showError('Error al cargar el historial del cuidador: ' + error.message);
      }
    });
  }

  /**
   * Carga el historial de variables de investigación
   */
  loadResearchVariables(page: number = 0): void {
    if (!this.patientIdentificationNumber || !this.data.researchLayerId) return;

    this.loadingVariables = true;
    const pagination: PaginationRequest = {
      page: page,
      size: this.pageSize,
      sort: 'changedAt',
      sortDirection: 'DESC'
    };

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
      next: (response: any) => {
        const data = response.data || response.content || [];
        this.variablesHistory = page === 0 ? data : [...this.variablesHistory, ...data];
        this.totalElements.variables = response.totalElements || 0;
        this.currentPage.variables = page;
        this.loadingVariables = false;
      },
      error: (error) => {
        console.error('Error loading research variables:', error);
        this.loadingVariables = false;
        this.showError('Error al cargar el historial de variables: ' + error.message);
      }
    });
  }

  /**
   * Agrupa todos los historiales por registerId y changedAt
   */
  private groupHistoriesByVersion(): void {
    this.extractPatientInfoFromPatientInfo();

    const allItems = [
      ...this.basicInfoHistory,
      ...this.caregiverHistory,
      ...this.variablesHistory
    ];

    const groupsMap = new Map<string, VersionGroup>();

    allItems.forEach(item => {
      const key = `${item.registerId}-${item.changedAt}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          registerId: item.registerId,
          changedBy: item.changedBy,
          changedAt: item.changedAt,
          operation: item.operation,
          items: [],
          hasBasicInfo: false,
          hasCaregiverInfo: false,
          hasResearchVariables: false
        });
      }

      const group = groupsMap.get(key)!;
      group.items.push(item);

      if (item.isPatientBasicInfo) group.hasBasicInfo = true;
      if (item.isCaregiverInfo) group.hasCaregiverInfo = true;
      if (item.isResearchLayerGroup) group.hasResearchVariables = true;
      group.operation = item.operation;
    });

    this.versionGroups = Array.from(groupsMap.values())
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }

  /**
   * Carga todas las secciones y las agrupa
   */
  private loadAllHistories(page: number = 0): void {
    this.loading = page === 0;

    forkJoin({
      basicInfo: this.loadPatientBasicInfoInternal(page),
      caregiver: this.loadCaregiverInfoInternal(page),
      variables: this.loadResearchVariablesInternal(page)
    }).subscribe({
      next: (results) => {
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

        this.groupHistoriesByVersion();

        this.hasMoreVersions = results.basicInfo.length === this.pageSize ||
          results.caregiver.length === this.pageSize ||
          results.variables.length === this.pageSize;

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading histories:', error);
        this.loading = false;
        this.showError('Error al cargar el historial completo');
      }
    });
  }

  /**
   * Carga información básica (interna, sin agrupar)
   */
  private loadPatientBasicInfoInternal(page: number = 0): Observable<HistorialItem[]> {
    return new Observable(observer => {
      if (!this.patientIdentificationNumber) {
        observer.next([]);
        observer.complete();
        return;
      }

      const pagination: PaginationRequest = {
        page: page,
        size: this.pageSize,
        sort: 'changedAt',
        sortDirection: 'DESC'
      };

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
   * Carga información del cuidador (interna, sin agrupar)
   */
  private loadCaregiverInfoInternal(page: number = 0): Observable<HistorialItem[]> {
    return new Observable(observer => {
      if (!this.patientIdentificationNumber) {
        observer.next([]);
        observer.complete();
        return;
      }

      const pagination: PaginationRequest = {
        page: page,
        size: this.pageSize,
        sort: 'changedAt',
        sortDirection: 'DESC'
      };

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
   * Carga variables de investigación (interna, sin agrupar)
   */
  private loadResearchVariablesInternal(page: number = 0): Observable<HistorialItem[]> {
    return new Observable(observer => {
      if (!this.patientIdentificationNumber || !this.data.researchLayerId) {
        observer.next([]);
        observer.complete();
        return;
      }

      const pagination: PaginationRequest = {
        page: page,
        size: this.pageSize,
        sort: 'changedAt',
        sortDirection: 'DESC'
      };

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

  /**
   * Busca y carga todos los historiales agrupados por versión
   */
  searchPatient(): void {
    if (!this.patientIdentificationNumber) {
      this.showError('Por favor ingresa un número de identificación válido');
      return;
    }

    const idNumber = Number(this.patientIdentificationNumber);
    if (isNaN(idNumber) || idNumber <= 0) {
      this.showError('El número de identificación debe ser un número válido');
      return;
    }

    this.loading = true;
    this.patientInfo = null;
    this.versionGroups = [];

    if (!this.data.researchLayerId) {
      this.loading = false;
      this.showError('No se ha configurado la capa de investigación');
      return;
    }

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

  /**
   * Carga todos los historiales y extrae la información del paciente del primer registro
   */
  private loadAllHistoriesWithPatientInfo(): void {
    this.loading = true;

    forkJoin({
      basicInfo: this.loadPatientBasicInfoInternal(0),
      caregiver: this.loadCaregiverInfoInternal(0),
      variables: this.loadResearchVariablesInternal(0)
    }).subscribe({
      next: (results) => {
        this.basicInfoHistory = results.basicInfo;
        this.caregiverHistory = results.caregiver;
        this.variablesHistory = results.variables;

        // CORRECCIÓN: Cambiar por el método correcto
        this.extractPatientInfoFromPatientInfo();

        this.groupHistoriesByVersion();

        this.hasMoreVersions = results.basicInfo.length === this.pageSize ||
          results.caregiver.length === this.pageSize ||
          results.variables.length === this.pageSize;

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading histories:', error);
        this.loading = false;
        this.showError('Error al cargar el historial completo');
      }
    });
  }

  /**
   * Extrae la información del paciente del historial cargado
   */
  private extractPatientInfoFromPatientInfo(): void {
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

    return item ?
      (section === 'basic' ? item.isPatientBasicInfo :
        section === 'caregiver' ? item.isCaregiverInfo :
          item.isResearchLayerGroup) : null;
  }
}
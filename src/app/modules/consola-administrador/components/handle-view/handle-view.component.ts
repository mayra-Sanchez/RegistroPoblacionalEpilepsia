import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ConsolaAdministradorService } from '../../../../services/consola-administrador.service';
import { ConsolaRegistroService } from 'src/app/services/register.service';
/**
 * Componente para visualización detallada de elementos
 */
@Component({
  selector: 'app-handle-view',
  templateUrl: './handle-view.component.html',
  styleUrls: ['./handle-view.component.css']
})
export class HandleViewComponent implements OnInit, OnChanges {

  @Input() viewedItem: any;
  @Input() viewType: string = '';
  @Output() closeModal = new EventEmitter<void>();

  capas: any[] = [];
  capaMap: { [key: string]: string } = {};
  variablesAsociadas: any[] = [];
  filteredVariables: any[] = [];
  paginatedVariables: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  activeTab: string = 'basic';

  // Para el historial de registros
  registroCompleto: any = null;
  loadingRegistroCompleto: boolean = false;

  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];

  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Postgrado' }
  ];

  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' }
  ];

  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio Bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio Alto' },
    { value: 'alto', label: 'Alto' }
  ];

  constructor(private consolaService: ConsolaAdministradorService, private registerService: ConsolaRegistroService) { }

  ngOnInit(): void {
    this.cargarCapas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewType']) {
      console.log('🎯 ViewType recibido:', this.viewType);
      console.log('📦 ViewedItem recibido:', this.viewedItem);
    }

    if (changes['viewedItem'] && this.viewedItem) {
      console.log('🔄 Cambios en viewedItem - ViewType actual:', this.viewType);

      if (this.viewType === 'historial') {
        console.log('✅ Cargando registro completo para historial');
        this.loadRegistroCompleto();
      } else if (this.viewType === 'capa') {
        const capaId = this.viewedItem?.id || this.viewedItem?.capaId || this.viewedItem?.researchLayerId;
        if (capaId) {
          this.loadVariablesPorCapa(capaId);
        }
      }
    }
  }

  /**
   * Carga la información completa del registro para el historial
   */
  loadRegistroCompleto(): void {
    if (!this.viewedItem?.registerId) {
      console.warn('No hay registerId para cargar el registro completo');
      return;
    }

    // Necesitamos el patientIdentificationNumber y researchLayerId del historial
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

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVariables.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedVariables = this.filteredVariables.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

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

  getNombreCapas(capas: string[] | string): string[] {
    if (!Array.isArray(capas)) {
      capas = [capas];
    }
    return capas
      .map(id => this.capaMap[id] || 'Capa no encontrada')
      .filter(nombre => nombre !== 'Capa no encontrada');
  }

  getNombreCapa(id: string): string {
    if (!id) return 'Sin asignar';
    return this.capaMap[id] || `Capa (ID: ${id}) no encontrada`;
  }

  cerrarModal(): void {
    this.closeModal.emit();
  }

  getCapaIds(): string[] {
    // Primero intenta obtener de attributes.researchLayerId
    if (this.viewedItem?.attributes?.researchLayerId) {
      return Array.isArray(this.viewedItem.attributes.researchLayerId)
        ? this.viewedItem.attributes.researchLayerId
        : [this.viewedItem.attributes.researchLayerId];
    }

    // Luego intenta otras propiedades comunes
    const raw = this.viewedItem?.researchLayerId || this.viewedItem?.capaRawValue;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }

  getTipoDocumento(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'Cédula de Ciudadanía': 'Cédula de Ciudadanía',
      'Tarjeta de Identidad': 'Tarjeta de Identidad',
      'Cédula de Extranjería': 'Cédula de Extranjería',
      'Pasaporte': 'Pasaporte'
    };
    return tipos[tipo] || tipo;
  }

  getRolFormateado(rol: string): string {
    const rolesMap: { [key: string]: string } = {
      'Admin': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador',
      'Admin_client_role': 'Administrador'
    };
    return rolesMap[rol] || rol;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  }

  getLabel(options: any[], value: string): string {
    if (!value) return '';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }


  public esArray(valor: any): boolean {
    return Array.isArray(valor);
  }

  /**
 * Obtiene la información del paciente (compatible con historial y registro completo)
 */
  getPatientInfo(): any {
    if (this.viewType === 'historial') {
      // Para historial, usar el registro completo si está cargado, sino los datos básicos del historial
      return this.registroCompleto?.patientBasicInfo || {};
    } else {
      return this.viewedItem?.patientBasicInfo || {};
    }
  }

  /**
   * Obtiene las variables de investigación (compatible con ambos formatos)
   */
  getVariables(): any[] {
    if (this.viewType === 'historial') {
      // Para historial, usar las variables del grupo de investigación
      return this.viewedItem?.isResearchLayerGroup?.variables || [];
    } else {
      // Para registro normal
      const mainInfo = this.viewedItem?.registerInfo && this.viewedItem.registerInfo.length > 0
        ? this.viewedItem.registerInfo[0]
        : null;
      return mainInfo?.variablesInfo || [];
    }
  }

  /**
   * Obtiene información de la capa de investigación
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
   */
  getHealthProfessional(): any {
    if (this.viewType === 'historial') {
      return this.registroCompleto?.healthProfessional || null;
    } else {
      return this.viewedItem?.healthProfessional || null;
    }
  }

  /**
   * Verifica si hay datos del cuidador
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
   * Formatea el valor de una variable para mostrar
   */
  formatVariableValue(variable: any): string {
    if (!variable) return 'No definido';

    // Para el formato del historial
    if (variable.valueAsNumber !== null && variable.valueAsNumber !== undefined) {
      return variable.valueAsNumber.toString();
    }
    if (variable.valueAsString !== null && variable.valueAsString !== undefined) {
      return variable.valueAsString;
    }

    // Para el formato normal de registro
    if (variable.value !== null && variable.value !== undefined) {
      return variable.value.toString();
    }

    return 'No definido';
  }

  /**
   * Obtiene el nombre de la variable (compatible con ambos formatos)
   */
  getVariableName(variable: any): string {
    return variable.variableName || variable.name || 'Variable sin nombre';
  }

  /**
   * Obtiene el tipo de variable (compatible con ambos formatos)
   */
  getVariableType(variable: any): string {
    return variable.type || 'Tipo no especificado';
  }

  /**
   * Obtiene la operación formateada para el historial
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

  /**
   * Verifica si la información del paciente está vacía
   */
  isPatientInfoEmpty(): boolean {
    if (this.viewType === 'historial') {
      // Para historial, verificar si tenemos datos del registro completo o básicos
      const hasBasicInfo = this.registroCompleto?.patientBasicInfo &&
        Object.keys(this.registroCompleto.patientBasicInfo).length > 0;
      const hasHistorialInfo = this.viewedItem?.patientIdentificationNumber;

      return !hasBasicInfo && !hasHistorialInfo;
    } else {
      // Para registro normal
      const patientInfo = this.getPatientInfo();
      if (!patientInfo) return true;

      if (typeof patientInfo === 'object' && patientInfo !== null) {
        return Object.keys(patientInfo).length === 0;
      }

      return !patientInfo;
    }
  }

  /**
 * Método para usar Math.min en el template
 */
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}

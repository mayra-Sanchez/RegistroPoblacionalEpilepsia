import { Component, Output, Input, EventEmitter, OnChanges, SimpleChanges, NgZone } from '@angular/core';

/**
 * Interfaz para eventos de paginación
 */
interface PageEvent {
  page: number;
  size: number;
  query?: string;
  operation?: string;
}

/**
 * Componente de tabla reutilizable para visualización de usuarios/registros
 * Soporta paginación, filtrado y búsqueda en el lado del cliente
 */
@Component({
  selector: 'app-table-ver-usuarios',
  templateUrl: './table-ver-usuarios.component.html',
  styleUrls: ['./table-ver-usuarios.component.css']
})
export class TableVerUsuariosComponent implements OnChanges {
  //#region Input Properties
  /** Datos a mostrar en la tabla */
  @Input() data: any[] = [];
  
  /** Configuración de columnas de la tabla */
  @Input() columns: { field: string; header: string }[] = [];
  
  /** Opciones de items por página para el selector */
  @Input() itemsPerPageOptions: number[] = [10, 20, 30];
  
  /** Total de registros disponibles (para mostrar en paginación) */
  @Input() totalRecords: number = 0;
  
  /** Indica si los datos están cargando */
  @Input() loading: boolean = false;
  //#endregion

  //#region Output Events
  /** Evento emitido cuando se hace click en ver un registro */
  @Output() onView = new EventEmitter<any>();
  
  /** Evento emitido cuando se hace click en editar un registro */
  @Output() onEdit = new EventEmitter<any>();
  
  /** Evento emitido cuando cambia la paginación o filtros */
  @Output() onPageChange = new EventEmitter<PageEvent>();
  //#endregion

  //#region Propiedades de Estado de la Tabla
  /** Número de items por página actual */
  itemsPerPage = this.itemsPerPageOptions[0];
  
  /** Página actual */
  currentPage = 1;
  
  /** Término de búsqueda actual */
  searchQuery = '';
  
  /** Operación seleccionada para filtrar */
  selectedOperation = '';
  
  /** Datos filtrados según búsqueda y operación */
  filteredData: any[] = [];
  
  /** Total de registros después de aplicar filtros */
  filteredTotalRecords: number = 0;
  //#endregion

  //#region Constructor y Lifecycle Hooks
  /**
   * Constructor del componente
   * @param ngZone Servicio para ejecutar código en la zona Angular
   */
  constructor(private ngZone: NgZone) { }

  /**
   * Maneja cambios en las propiedades de entrada
   * @param changes Objeto con los cambios detectados
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Inicializar itemsPerPage con la primera opción disponible
    if (changes['itemsPerPageOptions'] && this.itemsPerPageOptions?.length) {
      this.itemsPerPage = this.itemsPerPageOptions[0];
    }

    // Re-aplicar filtros cuando cambian los datos o el total de registros
    if (changes['data'] || changes['totalRecords']) {
      this.applyFilters();
    }
  }
  //#endregion

  //#region Métodos de Filtrado y Búsqueda
  /**
   * Aplica filtros combinados (búsqueda y operación) a los datos
   */
  applyFilters(): void {
    let filtered = this.data;

    // Filtrar por operación si está seleccionada
    if (this.selectedOperation) {
      filtered = filtered.filter(item => item.operation === this.selectedOperation);
    }

    // Filtrar por búsqueda de texto si existe
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item => this.searchInItem(item, query));
    }

    this.filteredData = filtered;
    this.filteredTotalRecords = filtered.length;

    // Resetear a página 1 cuando se aplican nuevos filtros
    this.currentPage = 1;
  }

  /**
   * Realiza búsqueda en diferentes campos de un item
   * @param item Item a evaluar
   * @param query Término de búsqueda en minúsculas
   * @returns true si el item coincide con la búsqueda
   */
  private searchInItem(item: any, query: string): boolean {
    if (!item) return false;

    // Buscar en campos básicos del historial
    if (item.changedBy?.toLowerCase().includes(query)) return true;
    if (item.patientIdentificationNumber?.toString().includes(query)) return true;
    if (item.operation?.toLowerCase().includes(query)) return true;

    // Búsqueda profunda en research layer group si existe
    if (item.isResearchLayerGroup) {
      const researchLayer = item.isResearchLayerGroup;
      
      // Buscar en nombre de la capa de investigación
      if (researchLayer.researchLayerName?.toLowerCase().includes(query)) return true;

      // Buscar en variables de la capa
      if (researchLayer.variables) {
        const variableMatch = researchLayer.variables.some((variable: any) =>
          variable.name?.toLowerCase().includes(query) ||
          variable.valueAsString?.toLowerCase().includes(query) ||
          variable.valueAsNumber?.toString().includes(query)
        );
        if (variableMatch) return true;
      }
    }

    return false;
  }

  /**
   * Maneja el cambio en el término de búsqueda
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Maneja el cambio en el filtro de operación
   */
  onOperationFilterChange(): void {
    this.applyFilters();
  }
  //#endregion

  //#region Métodos de Paginación
  /**
   * Calcula el total de páginas basado en los registros filtrados
   */
  get totalPages(): number {
    return Math.ceil(this.filteredTotalRecords / this.itemsPerPage);
  }

  /**
   * Obtiene los datos paginados para la página actual
   */
  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Navega a la página anterior
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Maneja el cambio en el número de items por página
   */
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }
  //#endregion

  //#region Métodos de Interacción con Filas
  /**
   * Maneja la acción de ver un registro
   * @param row Fila/registro seleccionado
   */
  view(row: any): void {
    this.ngZone.run(() => {
      this.onView.emit(row);
    });
  }

  /**
   * Maneja la acción de editar un registro
   * @param row Fila/registro seleccionado
   */
  edit(row: any): void {
    this.ngZone.run(() => {
      this.onEdit.emit(row);
    });
  }
  //#endregion

  //#region Métodos de Formateo y Utilidades
  /**
   * Obtiene el nombre legible para una operación
   * @param operation Operación a formatear
   * @returns Nombre legible de la operación
   */
  getOperationDisplayName(operation: string): string {
    const operationMap: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'Registro Creado',
      'UPDATE_RESEARCH_LAYER': 'Actualización'
    };
    return operationMap[operation] || operation;
  }

  /**
   * Obtiene la clase CSS para el badge de una operación
   * @param operation Operación a evaluar
   * @returns Clase CSS correspondiente
   */
  getOperationClass(operation: string): string {
    const classMap: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'operation-created',
      'UPDATE_RESEARCH_LAYER': 'operation-updated'
    };
    return classMap[operation] || 'operation-default';
  }

  /**
   * Formatea una fecha para display en la interfaz
   * @param dateValue Valor de fecha a formatear
   * @returns Fecha formateada como string
   */
  formatDateForDisplay(dateValue: any): string {
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
   * Formatea variables para display en la interfaz
   * @param variables Array de variables a formatear
   * @returns String formateado con las variables
   */
  formatVariablesForDisplay(variables: any[]): string {
    if (!variables || !Array.isArray(variables)) return 'Sin variables';

    return variables.map(v => {
      if (v.valueAsNumber !== null && v.valueAsNumber !== undefined) {
        return `${v.name}: ${v.valueAsNumber}`;
      } else if (v.valueAsString) {
        return `${v.name}: ${v.valueAsString}`;
      } else {
        return `${v.name}: N/A`;
      }
    }).join(', ');
  }
  //#endregion

  //#region Métodos de Utilidad para la Template
  /**
   * Obtiene el rango de registros mostrados actualmente
   */
  get currentRange(): string {
    const start = ((this.currentPage - 1) * this.itemsPerPage) + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredTotalRecords);
    return `${start} - ${end} de ${this.filteredTotalRecords}`;
  }

  /**
   * Verifica si hay datos para mostrar
   */
  get hasData(): boolean {
    return this.filteredData.length > 0 && !this.loading;
  }

  /**
   * Verifica si está cargando
   */
  get isLoading(): boolean {
    return this.loading;
  }

  /**
   * Verifica si no hay datos después de aplicar filtros
   */
  get noData(): boolean {
    return this.filteredData.length === 0 && !this.loading;
  }

  /**
   * Obtiene el mensaje para cuando no hay datos
   */
  get noDataMessage(): string {
    if (this.searchQuery || this.selectedOperation) {
      return 'No se encontraron registros que coincidan con los filtros aplicados';
    }
    return 'No hay registros disponibles';
  }
  //#endregion

  //#region Métodos de Navegación de Páginas Avanzados
  /**
   * Navega a una página específica
   * @param pageNumber Número de página a la que navegar
   */
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
    }
  }

  /**
   * Genera un array de números de página para la paginación
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar startPage si endPage está cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Verifica si la página actual es la primera
   */
  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  /**
   * Verifica si la página actual es la última
   */
  get isLastPage(): boolean {
    return this.currentPage === this.totalPages;
  }
  //#endregion

  //#region Métodos de Reset y Limpieza
  /**
   * Resetea todos los filtros a sus valores por defecto
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedOperation = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Limpia solo el filtro de búsqueda
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  /**
   * Limpia solo el filtro de operación
   */
  clearOperationFilter(): void {
    this.selectedOperation = '';
    this.applyFilters();
  }
  //#endregion
}
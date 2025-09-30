import { Component, Output, Input, EventEmitter, OnChanges, SimpleChanges, NgZone } from '@angular/core';

interface PageEvent {
  page: number;
  size: number;
  query?: string;
  operation?: string;
}

@Component({
  selector: 'app-table-ver-usuarios',
  templateUrl: './table-ver-usuarios.component.html',
  styleUrls: ['./table-ver-usuarios.component.css']
})
export class TableVerUsuariosComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: { field: string; header: string }[] = [];
  @Input() itemsPerPageOptions: number[] = [10, 20, 30];
  @Input() totalRecords: number = 0;
  @Input() loading: boolean = false;

  @Output() onView = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onPageChange = new EventEmitter<PageEvent>();

  // Propiedades de estado
  itemsPerPage = this.itemsPerPageOptions[0];
  currentPage = 1;
  searchQuery = '';
  selectedOperation = '';

  // Datos filtrados
  filteredData: any[] = [];
  filteredTotalRecords: number = 0;

  // Operaciones disponibles para el filtro
  availableOperations: string[] = [];

  constructor(private ngZone: NgZone) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemsPerPageOptions'] && this.itemsPerPageOptions?.length) {
      this.itemsPerPage = this.itemsPerPageOptions[0];
    }

    if (changes['data'] || changes['totalRecords']) {
      this.extractAvailableOperations();
      this.applyFilters();
    }
  }

  /**
   * Extrae las operaciones únicas disponibles en los datos
   */
  private extractAvailableOperations(): void {
    if (!this.data || this.data.length === 0) {
      this.availableOperations = [];
      return;
    }

    const operations = new Set<string>();
    this.data.forEach(item => {
      if (item.operation) {
        operations.add(item.operation);
      }
    });

    this.availableOperations = Array.from(operations).sort();
  }

  /**
   * Aplica filtros combinados
   */
  applyFilters(): void {
    let filtered = [...this.data]; 

    if (this.selectedOperation) {
      filtered = filtered.filter(item => 
        item.operation === this.selectedOperation
      );
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => this.searchInItem(item, query));
    }

    this.filteredData = filtered;
    this.filteredTotalRecords = filtered.length;
    this.currentPage = 1;
  }

  /**
   * Búsqueda en múltiples campos del item
   */
  private searchInItem(item: any, query: string): boolean {
    if (!item) return false;

    // Campos básicos para búsqueda
    const searchableFields = [
      item.changedBy,
      item.patientIdentificationNumber?.toString(),
      item.operation,
      item.patientName,
      item.documento
    ];

    // Buscar en campos básicos
    if (searchableFields.some(field => 
      field && field.toString().toLowerCase().includes(query))
    ) {
      return true;
    }

    // Búsqueda en research layer group
    if (item.isResearchLayerGroup) {
      const researchLayer = item.isResearchLayerGroup;

      // Buscar en nombre de la capa
      if (researchLayer.researchLayerName?.toLowerCase().includes(query)) {
        return true;
      }

      // Buscar en variables
      if (researchLayer.variables) {
        return researchLayer.variables.some((variable: any) =>
          variable.name?.toLowerCase().includes(query) ||
          variable.valueAsString?.toLowerCase().includes(query) ||
          variable.valueAsNumber?.toString().includes(query)
        );
      }
    }

    return false;
  }

  /**
   * Maneja cambio en búsqueda
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Maneja cambio en filtro de operación
   */
  onOperationFilterChange(): void {
    this.applyFilters();
  }

  // Métodos de paginación
  get totalPages(): number {
    return Math.ceil(this.filteredTotalRecords / this.itemsPerPage);
  }

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // Navegación
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
    }
  }

  // Métodos de interacción
  view(row: any): void {
    this.ngZone.run(() => {
      this.onView.emit(row);
    });
  }

  edit(row: any): void {
    this.ngZone.run(() => {
      this.onEdit.emit(row);
    });
  }

  // Utilidades de template
  getOperationLabel(operation: string): string {
    const operationMap: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'Creado',
      'UPDATE_RESEARCH_LAYER': 'Actualizado',
      'REGISTER_UPDATED': 'Actualizado',
      'REGISTER_DELETED': 'Eliminado',
      'PATIENT_CREATED': 'Paciente Creado',
      'CONSENT_GIVEN': 'Consentimiento Otorgado'
    };
    return operationMap[operation] || operation;
  }

  formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return 'Fecha no disponible';

    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  formatVariablesForDisplay(variables: any[]): string {
    if (!variables || !Array.isArray(variables)) return 'Sin variables';

    return variables.map(v => {
      if (v.valueAsNumber !== null && v.valueAsNumber !== undefined) {
        return `${v.name}: ${v.valueAsNumber}`;
      } else if (v.valueAsString) {
        return `${v.name}: "${v.valueAsString}"`;
      } else {
        return `${v.name}: N/A`;
      }
    }).join('; ');
  }

  // Getters para template
  get currentRange(): string {
    const start = ((this.currentPage - 1) * this.itemsPerPage) + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredTotalRecords);
    return `${start} - ${end} de ${this.filteredTotalRecords}`;
  }

  get hasData(): boolean {
    return this.filteredData.length > 0 && !this.loading;
  }

  get noData(): boolean {
    return this.filteredData.length === 0 && !this.loading;
  }

  get noDataMessage(): string {
    if (this.searchQuery || this.selectedOperation) {
      return 'No se encontraron registros con los filtros aplicados';
    }
    return 'No hay registros disponibles';
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  get isLastPage(): boolean {
    return this.currentPage === this.totalPages;
  }

  // Métodos de reset
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedOperation = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  getOperationClass(operation: string): string {
    switch (operation) {
      case 'REGISTER_CREATED_SUCCESSFULL': return 'created';
      case 'UPDATE_RESEARCH_LAYER':
      case 'REGISTER_UPDATED': return 'updated';
      case 'REGISTER_DELETED': return 'deleted';
      default: return '';
    }
  }
}
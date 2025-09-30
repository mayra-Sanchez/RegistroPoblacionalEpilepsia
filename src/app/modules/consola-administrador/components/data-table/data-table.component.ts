import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Componente de tabla de datos genérica con funcionalidades avanzadas
 * 
 * Este componente proporciona:
 * - Visualización tabular de datos
 * - Paginación
 * - Ordenamiento
 * - Búsqueda/filtrado
 * - Acciones sobre filas (ver, editar, eliminar)
 * 
 * Es altamente configurable mediante propiedades de entrada.
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnChanges {

  /* -------------------- Propiedades de Entrada -------------------- */

  /**
   * Datos a mostrar en la tabla
   */
  @Input() data: any[] = [];

  /**
   * Configuración de columnas:
   * - field: Nombre del campo o path anidado (ej: 'user.name')
   * - header: Título a mostrar
   * - type: Tipo especial (date, count)
   * - formatter: Función personalizada para formatear valores
   */
  @Input() columns: { 
    field: string; 
    header: string; 
    type?: string; 
    formatter?: (value: any) => string 
  }[] = [];

  /**
   * Opciones de items por página
   */
  @Input() itemsPerPageOptions: number[] = [5, 10, 20];

  /**
   * Total de registros (para paginación server-side)
   */
  @Input() totalRecords: number = 0;

  /**
   * Estado de carga
   */
  @Input() loading: boolean = false;

  /* -------------------- Eventos de Salida -------------------- */

  /**
   * Se emite al ver un item
   */
  @Output() onView = new EventEmitter<any>();

  /**
   * Se emite al editar un item
   */
  @Output() onEdit = new EventEmitter<any>();

  /**
   * Se emite al eliminar un item
   */
  @Output() onDelete = new EventEmitter<any>();

  /**
   * Se emite al cambiar de página o tamaño de página
   */
  @Output() onPageChange = new EventEmitter<{page: number, size: number}>();

  /* -------------------- Estado Interno -------------------- */

  /**
   * Items mostrados por página
   */
  itemsPerPage: number = this.itemsPerPageOptions[0];

  /**
   * Página actual
   */
  currentPage: number = 1;

  /**
   * Término de búsqueda
   */
  searchQuery: string = '';

  /**
   * Campo de ordenamiento
   */
  sortField: string = '';

  /**
   * Dirección de ordenamiento
   */
  sortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Datos filtrados
   */
  filteredData: any[] = [];

  /**
   * Datos paginados
   */
  paginatedData: any[] = [];

  /**
   * Total de páginas
   */
  totalPages: number = 1;

  /* -------------------- Métodos del Ciclo de Vida -------------------- */

  /**
   * Detecta cambios en los inputs
   * @param changes Objeto con los cambios
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['totalRecords']) {
      this.filteredData = [...this.data];
      this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
      this.updatePagination();
    }
  }

  /* -------------------- Métodos de Utilidad -------------------- */

  /**
   * Obtiene valores anidados usando notación de puntos
   * @param obj Objeto a inspeccionar
   * @param path Ruta al valor (ej: 'user.name')
   * @returns Valor encontrado o 'N/A'
   */
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj) || 'N/A';
  }

  /**
   * Formatea el valor de la celda según la configuración de columna
   * @param row Fila completa
   * @param col Configuración de columna
   * @returns Valor formateado
   */
  getCellValue(row: any, col: any): string {
    const value = col.field.includes('.') 
      ? this.getNestedValue(row, col.field) 
      : row[col.field];

    if (col.formatter) {
      return col.formatter(value);
    }

    switch (col.type) {
      case 'date':
        return this.formatDate(value);
      case 'count':
        return this.formatCount(value);
      default:
        return value !== undefined && value !== null ? value.toString() : 'N/A';
    }
  }

  /**
   * Formatea fechas
   * @param dateString Fecha en formato string
   * @returns Fecha formateada o mensaje de error
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
  
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  
  /**
   * Formatea conteos (ej: variablesRegister.length)
   * @param value Valor a formatear
   * @returns String formateada con pluralización
   */
  formatCount(value: any): string {
    const count = Number(value);
    return isNaN(count) ? 'N/A' : `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  /* -------------------- Funcionalidades de Tabla -------------------- */

  /**
   * Filtra los datos basado en la búsqueda
   */
  filterData(): void {
    if (!this.searchQuery) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(item => 
        this.columns.some(col => {
          const value = this.getCellValue(item, col);
          return value.toLowerCase().includes(this.searchQuery.toLowerCase());
        })
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Ordena los datos por campo
   * @param field Campo por el que ordenar
   */
  sortData(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const valueA = this.getNestedValue(a, field);
      const valueB = this.getNestedValue(b, field);
      
      if (valueA == null) return 1;
      if (valueB == null) return -1;
      
      return this.sortDirection === 'asc' 
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

    this.updatePagination();
  }

  /**
   * Actualiza la paginación
   */
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  /**
   * Cambia el tamaño de página
   * @param size Nuevo tamaño
   */
  changePageSize(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.updatePagination();
    this.emitPageChange();
  }

  /**
   * Navega a una página específica
   * @param page Número de página
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.emitPageChange();
    }
  }

  /**
   * Emite el evento de cambio de página
   */
  emitPageChange(): void {
    this.onPageChange.emit({
      page: this.currentPage,
      size: this.itemsPerPage
    });
  }

  /* -------------------- Manejo de Eventos -------------------- */

  /**
   * Emite evento para ver un item
   * @param item Item a visualizar
   */
  viewItem(item: any): void {
    this.onView.emit(item);
  }

  /**
   * Emite evento para editar un item
   * @param item Item a editar
   */
  editItem(item: any): void {
    this.onEdit.emit(item);
  }

  /**
   * Emite evento para eliminar un item
   * @param item Item a eliminar
   */
  deleteItem(item: any): void {
    this.onDelete.emit(item);
  }
}
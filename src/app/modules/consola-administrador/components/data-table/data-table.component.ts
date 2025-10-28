import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnChanges {

  /* -------------------- Propiedades de Entrada -------------------- */
  @Input() data: any[] = [];
  @Input() columns: { field: string; header: string; type?: string }[] = [];
  @Input() itemsPerPageOptions: number[] = [10, 20, 50];
  @Input() totalRecords: number = 0;
  @Input() loading: boolean = false;

  /* -------------------- Eventos de Salida -------------------- */
  @Output() onView = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onPageChange = new EventEmitter<{page: number, size: number}>();

  /* -------------------- Estado Interno -------------------- */
  itemsPerPage: number = 10;
  currentPage: number = 1;
  searchQuery: string = '';
  
  // ✅ Ya no necesitamos filteredData y paginatedData para datos del servidor
  // El servidor ya nos envía los datos paginados
  filteredData: any[] = [];
  paginatedData: any[] = [];
  totalPages: number = 1;

  // ✅ Exponer Math para el template
  Math = Math;

  /* -------------------- Métodos del Ciclo de Vida -------------------- */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['totalRecords']) {
      // ✅ Para datos del servidor, usar los datos tal cual vienen
      this.filteredData = [...this.data];
      this.paginatedData = [...this.data];
      
      // ✅ Calcular totalPages basado en totalRecords del servidor
      this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage) || 1;
      
      console.log('📊 Datos recibidos en tabla:', {
        datosRecibidos: this.data.length,
        totalRecords: this.totalRecords,
        itemsPerPage: this.itemsPerPage,
        totalPages: this.totalPages,
        currentPage: this.currentPage
      });
    }
  }

  /* -------------------- Métodos de Utilidad -------------------- */
  
  // ✅ Método trackBy para mejor performance
  trackByFn(index: number, item: any): any {
    return item.id || item.registerId || index;
  }

  getCellValue(row: any, col: any): string {
    const value = this.getNestedValue(row, col.field);
    
    if (value === undefined || value === null) return '-';
    
    switch (col.type) {
      case 'date':
        return this.formatDate(value);
      case 'count':
        return this.formatCount(value);
      default:
        // ✅ Si es un formatter personalizado, usarlo
        if (col.formatter) {
          return col.formatter(value);
        }
        return value.toString();
    }
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  }

  formatCount(value: any): string {
    const count = Number(value);
    return isNaN(count) ? '-' : count.toString();
  }

  // ✅ Método para calcular el rango de registros mostrados (para datos del servidor)
  getDisplayRange(): string {
    if (this.totalRecords === 0) {
      return '0 - 0 de 0';
    }
    
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalRecords);
    return `${start} - ${end} de ${this.totalRecords}`;
  }

  /* -------------------- Funcionalidades de Tabla -------------------- */
  
  // ✅ Solo filtrar si es necesario (para datos locales)
  filterData(): void {
    if (!this.searchQuery.trim()) {
      this.filteredData = [...this.data];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredData = this.data.filter(item => 
        this.columns.some(col => {
          const value = this.getCellValue(item, col).toString().toLowerCase();
          return value.includes(query);
        })
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  // ✅ Solo para datos locales
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
  }

  // ✅ Cambiar tamaño de página - notificar al componente padre
  changePageSize(size: number): void {
    console.log('📏 Cambiando tamaño de página a:', size);
    this.itemsPerPage = size;
    this.currentPage = 1; // ✅ Resetear a primera página
    this.emitPageChange();
  }

  // ✅ Navegar a página - notificar al componente padre
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log('➡️ Navegando a página:', page);
      this.currentPage = page;
      this.emitPageChange();
    }
  }

  // ✅ Emitir evento de cambio de página
  emitPageChange(): void {
    console.log('🚀 Emitiendo cambio de página:', {
      page: this.currentPage,
      size: this.itemsPerPage
    });
    
    this.onPageChange.emit({
      page: this.currentPage,  // ✅ 1-based para el componente padre
      size: this.itemsPerPage
    });
  }

  /* -------------------- Manejo de Eventos -------------------- */
  viewItem(item: any): void {
    this.onView.emit(item);
  }

  editItem(item: any): void {
    this.onEdit.emit(item);
  }

  deleteItem(item: any): void {
    this.onDelete.emit(item);
  }
}
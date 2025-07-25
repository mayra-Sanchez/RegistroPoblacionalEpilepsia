import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: { field: string; header: string }[] = [];
  @Input() itemsPerPageOptions: number[] = [5, 10, 20];
  @Input() showStatusAction: boolean = false;
  @Output() onView = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onToggleStatus = new EventEmitter<any>();

  itemsPerPage = this.itemsPerPageOptions[0];
  currentPage = 1;
  searchQuery = '';
  sortField = '';

  filteredData: any[] = [];
  paginatedData: any[] = [];
  totalPages: number = 1;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.filteredData = [...this.data];
      this.currentPage = 1; // Resetear a la primera página
      this.updatePagination();
    }
  }

  ngOnInit() {
    this.filteredData = [...this.data];
    this.updatePagination();
  }

  filterData() {
    this.filteredData = this.data.filter(item =>
      Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(this.searchQuery.toLowerCase());
        }
        return false;
      })
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  getCellValue(row: any, col: any): string {
    if (col.formatter) {
      return col.formatter(row[col.field], row);
    }
    return row[col.field] !== undefined ? row[col.field].toString() : '';
  }

  sortData() {
    if (this.sortField) {
      this.filteredData.sort((a, b) =>
        a[this.sortField]?.localeCompare(b[this.sortField]) || 0
      );
    }
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  view(row: any) {
    this.onView.emit(row);
  }

  edit(row: any) {
    this.onEdit.emit(row);
  }

  delete(row: any) {
    this.onDelete.emit(row);
  }

  
}

import { Component, Output, Input, EventEmitter, OnChanges, SimpleChanges, NgZone } from '@angular/core';
// Define una interfaz para el objeto de paginación
interface PageEvent {
  page: number;
  size: number;
  query?: string; // Hacemos query opcional
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
  @Output() onPageChange = new EventEmitter<PageEvent>(); // Usamos la interfaz definida

  itemsPerPage = this.itemsPerPageOptions[0];
  currentPage = 1;
  searchQuery = '';

  constructor(private ngZone: NgZone) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['itemsPerPageOptions'] && this.itemsPerPageOptions?.length) {
      this.itemsPerPage = this.itemsPerPageOptions[0];
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.emitPageChange();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.emitPageChange();
    }
  }


  private emitPageChange() {
    this.onPageChange.emit({
      page: this.currentPage - 1,
      size: this.itemsPerPage,
      query: this.searchQuery
    });
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.emitPageChange();
  }

  onSearch() {
    this.currentPage = 1;
    this.emitPageChange();
  }

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
}
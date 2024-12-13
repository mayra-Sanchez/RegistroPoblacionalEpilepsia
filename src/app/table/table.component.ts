import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent {
  @Input() data: any[] = []; // Filas de la tabla
  @Input() columns: { field: string, header: string }[] = []; // Columnas
  @Output() onView = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

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

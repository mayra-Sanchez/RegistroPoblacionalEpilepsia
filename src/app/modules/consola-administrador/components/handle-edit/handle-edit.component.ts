import { Component, Input, Output, EventEmitter } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-handle-edit',
  templateUrl: './handle-edit.component.html',
  styleUrls: ['./handle-edit.component.css']
})
export class HandleEditComponent {
  @Input() itemToEdit: any;
  @Input() editType: string = '';
  @Input() capas: any[] = [];
  @Output() saveChanges = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  tieneOpciones: boolean = false;
  showPassword: boolean = false;

  ngOnInit() {
    if (this.editType === 'variable') {
      this.tieneOpciones = this.itemToEdit.options && this.itemToEdit.options.length > 0;
    }

    if (!this.itemToEdit.capaRawValue && this.capas.length > 0) {
      this.itemToEdit.capaRawValue = this.capas[0].id;
    }
  }

  getEditTypeIcon(): string {
    switch (this.editType) {
      case 'usuario': return 'fa-user-edit';
      case 'variable': return 'fa-pencil-alt';
      case 'capa': return 'fa-layer-group';
      default: return 'fa-edit';
    }
  }

  onTieneOpcionesChange() {
    if (!this.tieneOpciones) {
      this.itemToEdit.options = [];
    } else if (!this.itemToEdit.options || this.itemToEdit.options.length === 0) {
      this.itemToEdit.options = [''];
    }
  }

  agregarOpcion() {
    this.itemToEdit.options.push('');
  }

  eliminarOpcion(index: number) {
    this.itemToEdit.options.splice(index, 1);
  }

  guardarCambios() {
    if (this.editType === 'variable') {
      this.itemToEdit.tieneOpciones = this.tieneOpciones;
    }
    this.saveChanges.emit(this.itemToEdit);
  }

  cerrarModal() {
    this.closeModal.emit();
  }

  trackByIndex(index: number, item: any) {
    return index;
  }
}
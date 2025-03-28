import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-handle-view',
  templateUrl: './handle-view.component.html',
  styleUrls: ['./handle-view.component.css']
})
export class HandleViewComponent {
  @Input() viewedItem: any;
  @Input() viewType: string = '';
  @Output() closeModal = new EventEmitter<void>();

  cerrarModal(): void {
    this.closeModal.emit();
  }

  getTipoDocumento(tipo: string): string {
    const tipos: {[key: string]: string} = {
      'CC': 'Cédula de Ciudadanía',
      'TI': 'Tarjeta de Identidad',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte'
    };
    return tipos[tipo] || tipo;
  }
}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import Swal from 'sweetalert2';

/**
 * Componente para edición de elementos
 * 
 * Este componente proporciona una interfaz para editar:
 * - Usuarios
 * - Variables de investigación
 * - Capas de investigación
 * 
 * Maneja la lógica de edición y emite eventos para guardar cambios o cerrar el modal.
 */
@Component({
  selector: 'app-handle-edit',
  templateUrl: './handle-edit.component.html',
  styleUrls: ['./handle-edit.component.css']
})
export class HandleEditComponent {

  /* -------------------- Inputs y Outputs -------------------- */

  /**
   * Elemento a editar
   */
  @Input() itemToEdit: any;

  /**
   * Tipo de elemento a editar
   * Valores posibles: 'usuario', 'variable', 'capa'
   */
  @Input() editType: string = '';

  /**
   * Lista de capas disponibles para asignación
   */
  @Input() capas: any[] = [];

  /**
   * Evento emitido al guardar cambios
   */
  @Output() saveChanges = new EventEmitter<any>();

  /**
   * Evento emitido al cerrar el modal
   */
  @Output() closeModal = new EventEmitter<void>();

  /* -------------------- Propiedades del componente -------------------- */

  /**
   * Indica si una variable tiene opciones configurables
   */
  tieneOpciones: boolean = false;

  /**
   * Controla la visibilidad del campo de contraseña
   */
  showPassword: boolean = false;

  /* -------------------- Métodos del ciclo de vida -------------------- */

  /**
   * Inicialización del componente
   * - Configura estado inicial para variables con opciones
   * - Asigna capa por defecto si no está definida
   */
  ngOnInit() {
    // Configuración para variables
    if (this.editType === 'variable') {
      this.tieneOpciones = this.itemToEdit.options && this.itemToEdit.options.length > 0;
    }

    // Asignación de capa por defecto
    if (!this.itemToEdit.capaRawValue && this.capas.length > 0) {
      this.itemToEdit.capaRawValue = this.capas[0].id;
    }
  }

  /* -------------------- Métodos de UI -------------------- */

  /**
   * Obtiene el icono correspondiente al tipo de edición
   * @returns Clase del icono FontAwesome
   */
  getEditTypeIcon(): string {
    switch (this.editType) {
      case 'usuario': return 'fa-user-edit';
      case 'variable': return 'fa-pencil-alt';
      case 'capa': return 'fa-layer-group';
      default: return 'fa-edit';
    }
  }

  /**
   * Maneja el cambio en el estado de 'tieneOpciones' para variables
   */
  onTieneOpcionesChange() {
    if (!this.tieneOpciones) {
      this.itemToEdit.options = [];
    } else if (!this.itemToEdit.options || this.itemToEdit.options.length === 0) {
      this.itemToEdit.options = [''];
    }
  }

  /**
   * Agrega una nueva opción vacía a la lista de opciones
   */
  agregarOpcion() {
    this.itemToEdit.options.push('');
  }

  /**
   * Elimina una opción de la lista por índice
   * @param index Índice de la opción a eliminar
   */
  eliminarOpcion(index: number) {
    this.itemToEdit.options.splice(index, 1);
  }

  /**
   * Emite el evento para guardar los cambios realizados
   */
  guardarCambios() {
    if (this.editType === 'variable') {
      this.itemToEdit.tieneOpciones = this.tieneOpciones;
    }
    this.saveChanges.emit(this.itemToEdit);
  }

  /**
   * Emite el evento para cerrar el modal
   */
  cerrarModal() {
    this.closeModal.emit();
  }

  /**
   * Función trackBy para optimizar el rendering de listas
   * @param index Índice del elemento
   * @param item Elemento de la lista
   * @returns Identificador único para el elemento
   */
  trackByIndex(index: number, item: any) {
    return index;
  }
}
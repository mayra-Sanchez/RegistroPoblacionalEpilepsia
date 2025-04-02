import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-buscar-paciente-modal',
  templateUrl: './buscar-paciente-modal.component.html',
  styleUrls: ['./buscar-paciente-modal.component.css']
})
export class BuscarPacienteModalComponent {
  /**
   * Evento que emite el número de identificación cuando se realiza una búsqueda válida
   * @type {EventEmitter<number>}
   */
  @Output() buscar = new EventEmitter<number>();

  /**
   * Evento que se emite cuando se solicita cerrar el modal
   * @type {EventEmitter<void>} 
   */
  @Output() cerrar = new EventEmitter<void>();
  
  /**
   * Formulario reactivo para la búsqueda
   * @type {FormGroup}
   */
  form: FormGroup;
  
  /**
   * Constructor del componente
   * @param {FormBuilder} fb Servicio para crear formularios reactivos
   */
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      // Campo de identificación con validaciones requeridas y de patrón numérico
      identificacion: ['', [Validators.required, Validators.pattern(/^[0-9]*$/)]]
    });
  }

  /**
   * Maneja el envío del formulario
   * 
   * Si el formulario es válido, emite el evento 'buscar' con el número de identificación
   * convertido a número.
   */
  onSubmit() {
    if (this.form.valid) {
      this.buscar.emit(Number(this.form.value.identificacion));
    }
  }

  /**
   * Maneja el cierre del modal
   * 
   * Emite el evento 'cerrar' para notificar al componente padre.
   */
  onCerrar() {
    this.cerrar.emit();
  }
}
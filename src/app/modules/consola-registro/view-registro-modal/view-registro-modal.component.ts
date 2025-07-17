import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Register } from '../interfaces';
import { DatePipe } from '@angular/common';

/**
 * Componente modal para visualización detallada de registros de pacientes
 * 
 * Este componente muestra todos los datos de un registro médico en un formato organizado,
 * convirtiendo códigos internos a etiquetas legibles y formateando adecuadamente los datos.
 * 
 * @example
 * <app-view-registro-modal 
 *   [registro]="registroSeleccionado"
 *   (close)="handleCloseModal()">
 * </app-view-registro-modal>
 */
@Component({
  selector: 'app-view-registro-modal',
  templateUrl: './view-registro-modal.component.html',
  styleUrls: ['./view-registro-modal.component.css'],
  providers: [DatePipe]  // Provee DatePipe para formateo de fechas
})
export class ViewRegistroModalComponent {
  //#region Inputs y Outputs

  /**
   * Registro médico a visualizar. Recibe todos los datos del paciente y su historial.
   * @type {Register | null}
   */
  @Input() registro: Register | null = null;

  /**
   * Evento emitido cuando el usuario solicita cerrar el modal
   * @type {EventEmitter<void>}
   */
  @Output() close = new EventEmitter<void>();

  //#endregion

  //#region Opciones para selectores

  /**
   * Opciones para tipos de identificación con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];

  /**
   * Opciones para género con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  /**
   * Opciones para estado económico con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio alto' },
    { value: 'alto', label: 'Alto' }
  ];

  /**
   * Opciones para nivel educativo con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Posgrado' }
  ];

  /**
   * Opciones para estado civil con sus etiquetas legibles
   * @type {Array<{value: string, label: string}>}
   */
  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
    { value: 'union_libre', label: 'Unión libre' }
  ];

  //#endregion

  //#region Constructor

  /**
   * Constructor del componente
   * @param {DatePipe} datePipe Servicio para formateo de fechas
   */
  constructor(private datePipe: DatePipe) { }

  //#endregion

  //#region Métodos Públicos

  /**
   * Obtiene la etiqueta legible correspondiente a un valor de un conjunto de opciones
   * 
   * @param {Array<{value: string, label: string}>} options - Lista de opciones disponibles
   * @param {string | null | undefined} value - Valor a buscar en las opciones
   * @returns {string} La etiqueta correspondiente o 'No especificado' si el valor es nulo/undefined
   * 
   * @example
   * // Returns 'Cédula de Ciudadanía'
   * getLabel(tiposIdentificacion, 'cc');
   */
  getLabel(options: { value: string, label: string }[], value: string | null | undefined): string {
    if (!value) return 'No especificado';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  /**
   * Determina si existen datos válidos del cuidador para mostrar en la interfaz
   * 
   * @param {any} caregiver - Objeto con los datos del cuidador
   * @returns {boolean} True si hay al menos un campo con datos válidos (no nulo, no undefined y no string vacío)
   * 
   * @example
   * // Returns false
   * hasCaregiverData(null);
   * 
   * // Returns true
   * hasCaregiverData({ nombre: 'Juan', parentesco: 'Hijo' });
   */
  hasCaregiverData(caregiver: any): boolean {
    if (!caregiver) return false;
    return Object.values(caregiver).some(
      (val: any) => val !== null && val !== undefined && val !== ''
    );
  }

  /**
   * Emite el evento para cerrar el modal
   * 
   * @example
   * // En el template:
   * <button (click)="closeModal()">Cerrar</button>
   */
  closeModal() {
    this.close.emit();
  }

  //#endregion

  //#region Métodos de Formateo (Privados)

  /**
   * Formatea una fecha usando el DatePipe de Angular
   * @private
   * @param {string | Date} date - Fecha a formatear
   * @returns {string} Fecha formateada o 'No especificada' si es nula
   */
  private formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'No especificada';
    return this.datePipe.transform(date, 'mediumDate') || 'Fecha inválida';
  }

  //#endregion

  /**
 * Formatea inteligentemente el valor de una variable:
 * - Si es una fecha, intenta formatearla como fecha legible.
 * - Si está vacío o null, retorna "No especificado"
 */
  formatVariableValue(nombre: string, valor: any, tipo?: string): string {
    if (!valor || valor === '') return 'No especificado';

    const nombreNormalizado = nombre.toLowerCase();
    const esFechaPorNombre = nombreNormalizado.includes('fecha');
    const esFechaPorTipo = tipo === 'date';

    if (esFechaPorNombre || esFechaPorTipo) {
      try {
        const fechaFormateada = this.datePipe.transform(valor, 'dd/MM/yyyy');
        return fechaFormateada || valor;
      } catch {
        return valor;
      }
    }

    return valor;
  }
}
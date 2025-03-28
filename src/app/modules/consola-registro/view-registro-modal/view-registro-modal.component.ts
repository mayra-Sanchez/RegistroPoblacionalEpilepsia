import { Component, Input } from '@angular/core';
import { Register } from '../interfaces';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-view-registro-modal',
  templateUrl: './view-registro-modal.component.html',
  styleUrls: ['./view-registro-modal.component.css'],
  providers: [DatePipe]
})
export class ViewRegistroModalComponent {
  @Input() registro: Register | null = null;
  @Input() closeModal!: () => void;

  // Opciones para los selectores
  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];

  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio alto' },
    { value: 'alto', label: 'Alto' }
  ];

  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Posgrado' }
  ];

  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
    { value: 'union_libre', label: 'Unión libre' }
  ];

  constructor(private datePipe: DatePipe) { }

  /**
   * Obtiene el label correspondiente a un valor en un array de opciones
   * @param options Array de opciones con value y label
   * @param value Valor a buscar
   * @returns Label correspondiente o el valor original si no se encuentra
   */
  getLabel(options: { value: string, label: string }[], value: string | null | undefined): string {
    if (!value) return 'No especificado';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  /**
   * Verifica si hay datos válidos del cuidador
   * @param caregiver Objeto con los datos del cuidador
   * @returns true si hay al menos un campo con datos válidos
   */
  hasCaregiverData(caregiver: any): boolean {
    if (!caregiver) return false;
    return Object.values(caregiver).some(
      (val: any) => val !== null && val !== undefined && val !== ''
    );
  }
}
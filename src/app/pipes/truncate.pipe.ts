import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  /**
   * Trunca un texto a la longitud especificada
   * @param value Texto a truncar
   * @param limit Límite de caracteres (por defecto 50)
   * @param completeWords Si es true, mantiene palabras completas
   * @param ellipsis Caracteres para indicar truncamiento (por defecto '...')
   * @returns Texto truncado
   */
  transform(value: string, limit: number = 50, completeWords: boolean = false, ellipsis: string = '...'): string {
    // Si no hay valor o es más corto que el límite, retornar completo
    if (!value || value.length <= limit) {
      return value;
    }

    // Si se deben mantener palabras completas
    if (completeWords) {
      limit = value.substring(0, limit).lastIndexOf(' ');
      // Si no encuentra espacio, usar el límite original
      if (limit < 0) {
        return value.substring(0, limit) + ellipsis;
      }
    }

    // Retornar texto truncado con los puntos suspensivos
    return value.substring(0, limit) + ellipsis;
  }
}
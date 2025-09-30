import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado para formatear tamaños de archivo en unidades legibles
 * 
 * Convierte bytes a formatos más legibles como KB, MB, GB según el tamaño del archivo.
 * Es útil para mostrar tamaños de archivo de manera amigable al usuario.
 * 
 * @example
 * <!-- En templates -->
 * {{ fileSizeInBytes | fileSize }}          <!-- Formato por defecto (2 decimales) -->
 * {{ fileSizeInBytes | fileSize:1 }}        <!-- Con 1 decimal -->
 * {{ fileSizeInBytes | fileSize:0 }}        <!-- Sin decimales -->
 * 
 * @example
 * // En código TypeScript
 * const formattedSize = this.fileSizePipe.transform(1048576, 2); // "1.00 MB"
 */
@Pipe({
  name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {

  // ============================
  // CONSTANTES DE CONVERSIÓN
  // ============================

  /** Tamaño en bytes de cada unidad (base binaria) */
  private readonly BYTES_PER_KB = 1024;

  /** Unidades de medida disponibles */
  private readonly SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // ============================
  // MÉTODO PRINCIPAL
  // ============================

  /**
   * Transforma un tamaño en bytes a una representación legible
   * 
   * @param bytes - El tamaño del archivo en bytes. Debe ser un número no negativo.
   * @param decimals - Número de decimales a mostrar (por defecto: 2). Rango: 0-10.
   * @returns Cadena formateada con el tamaño y unidad (ej: "1.50 MB")
   * 
   * @throws {Error} Si el valor de bytes es negativo
   * 
   * @example
   * // Ejemplos de uso:
   * transform(0) → "0 Bytes"
   * transform(500) → "500 Bytes"
   * transform(1024) → "1.00 KB"
   * transform(1048576) → "1.00 MB"
   * transform(1536, 0) → "2 KB" (redondeado)
   * transform(1536, 1) → "1.5 KB"
   */
  transform(bytes: number, decimals: number = 2): string {
    // Validar parámetro de entrada
    this.validateInput(bytes, decimals);

    // Caso especial: 0 bytes
    if (bytes === 0) {
      return '0 Bytes';
    }

    // Calcular la unidad apropiada
    const unitIndex = this.calculateUnitIndex(bytes);
    const formattedValue = this.formatValue(bytes, unitIndex, decimals);
    
    return `${formattedValue} ${this.SIZE_UNITS[unitIndex]}`;
  }

  // ============================
  // MÉTODOS PRIVADOS - VALIDACIÓN
  // ============================

  /**
   * Valida los parámetros de entrada del pipe
   * 
   * @param bytes - Tamaño en bytes a validar
   * @param decimals - Número de decimales a validar
   * @throws {Error} Si los parámetros no son válidos
   * 
   * @private
   */
  private validateInput(bytes: number, decimals: number): void {
    if (typeof bytes !== 'number' || isNaN(bytes)) {
      throw new Error('FileSizePipe: El parámetro "bytes" debe ser un número válido');
    }

    if (bytes < 0) {
      throw new Error('FileSizePipe: El tamaño del archivo no puede ser negativo');
    }

    if (!Number.isInteger(decimals) || decimals < 0) {
      throw new Error('FileSizePipe: El parámetro "decimals" debe ser un entero no negativo');
    }

    if (decimals > 10) {
      console.warn('FileSizePipe: Se recomienda usar máximo 10 decimales para mejor legibilidad');
    }
  }

  // ============================
  // MÉTODOS PRIVADOS - CÁLCULOS
  // ============================

  /**
   * Calcula el índice de la unidad más apropiada para el tamaño dado
   * 
   * @param bytes - Tamaño en bytes
   * @returns Índice de la unidad en SIZE_UNITS array
   * 
   * @private
   */
  private calculateUnitIndex(bytes: number): number {
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(this.BYTES_PER_KB));
    
    return Math.min(unitIndex, this.SIZE_UNITS.length - 1);
  }

  /**
   * Formatea el valor según la unidad y decimales especificados
   * 
   * @param bytes - Tamaño original en bytes
   * @param unitIndex - Índice de la unidad a usar
   * @param decimals - Número de decimales a mostrar
   * @returns Valor formateado como string
   * 
   * @private
   */
  private formatValue(bytes: number, unitIndex: number, decimals: number): string {

    const valueInUnit = bytes / Math.pow(this.BYTES_PER_KB, unitIndex);
    

    return this.roundValue(valueInUnit, decimals);
  }

  /**
   * Redondea un valor al número especificado de decimales
   * 
   * @param value - Valor a redondear
   * @param decimals - Número de decimales
   * @returns Valor redondeado como string
   * 
   * @private
   */
  private roundValue(value: number, decimals: number): string {

    if (decimals === 0) {
      return Math.round(value).toString();
    }

    const fixedValue = value.toFixed(decimals);
    return parseFloat(fixedValue).toString();
  }

  // ============================
  // MÉTODOS PÚBLICOS ADICIONALES (opcionales)
  // ============================

  /**
   * Obtiene las unidades de medida disponibles
   * 
   * @returns Array con las unidades soportadas
   * 
   * @public
   */
  getAvailableUnits(): string[] {
    return [...this.SIZE_UNITS];
  }

  /**
   * Convierte bytes a una unidad específica
   * 
   * @param bytes - Tamaño en bytes
   * @param unit - Unidad destino ('Bytes', 'KB', 'MB', 'GB', 'TB')
   * @param decimals - Número de decimales (por defecto: 2)
   * @returns Valor convertido a la unidad especificada
   * 
   * @throws {Error} Si la unidad no es válida
   * 
   * @public
   */
  convertToUnit(bytes: number, unit: string, decimals: number = 2): number {
    const unitIndex = this.SIZE_UNITS.indexOf(unit);
    
    if (unitIndex === -1) {
      throw new Error(`FileSizePipe: Unidad "${unit}" no válida. Unidades disponibles: ${this.SIZE_UNITS.join(', ')}`);
    }

    const valueInUnit = bytes / Math.pow(this.BYTES_PER_KB, unitIndex);
    return parseFloat(valueInUnit.toFixed(decimals));
  }
}
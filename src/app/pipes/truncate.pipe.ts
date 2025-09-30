import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado para truncar texto con opciones avanzadas
 * 
 * Este pipe permite truncar texto largo a una longitud específica,
 * con opciones para mantener palabras completas y personalizar el ellipsis.
 * 
 * @example
 * <!-- Uso básico con límite por defecto (50 caracteres) -->
 * <p>{{ longText | truncate }}</p>
 * 
 * <!-- Uso con límite personalizado -->
 * <p>{{ longText | truncate:25 }}</p>
 * 
 * <!-- Mantener palabras completas -->
 * <p>{{ longText | truncate:30:true }}</p>
 * 
 * <!-- Ellipsis personalizado -->
 * <p>{{ longText | truncate:40:false:' […]' }}</p>
 * 
 * <!-- Uso con todos los parámetros -->
 * <p>{{ longText | truncate:35:true:' …' }}</p>
 */
@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {

  // ============================
  // CONSTANTES Y CONFIGURACIONES
  // ============================

  /** Límite por defecto de caracteres */
  private readonly DEFAULT_LIMIT = 50;

  /** Ellipsis por defecto */
  private readonly DEFAULT_ELLIPSIS = '...';

  /** Límite mínimo de caracteres permitido */
  private readonly MIN_LIMIT = 1;

  /** Límite máximo razonable para prevenir abusos */
  private readonly MAX_LIMIT = 10000;

  // ============================
  // MÉTODO PRINCIPAL
  // ============================

  /**
   * Transforma y trunca un texto según los parámetros especificados
   * 
   * @param value - Texto a truncar. Si es null/undefined, retorna el mismo valor.
   * @param limit - Límite máximo de caracteres (por defecto: 50)
   * @param completeWords - Si debe mantener palabras completas (por defecto: false)
   * @param ellipsis - Texto a agregar al final del texto truncado (por defecto: '...')
   * @returns Texto truncado o el texto original si es más corto que el límite
   * 
   * @throws {Error} Si el límite no es un número válido
   * 
   * @example
   * // Ejemplos de uso:
   * transform('Hello world', 5) → 'Hello...'
   * transform('Hello world', 5, true) → 'Hello...'
   * transform('Hello world', 8, true) → 'Hello...' (no 'Hello w...')
   * transform('Hello', 10) → 'Hello' (sin truncar)
   * transform(null, 10) → null
   */
  transform(
    value: string | null | undefined,
    limit: number = this.DEFAULT_LIMIT,
    completeWords: boolean = false,
    ellipsis: string = this.DEFAULT_ELLIPSIS
  ): string | null | undefined {
    // Validar parámetros de entrada
    this.validateInputs(limit, ellipsis);

    // Casos edge: valor nulo, undefined o vacío
    if (this.shouldReturnOriginal(value, limit)) {
      return value;
    }

    // Si el texto es más corto o igual al límite, retornar original
    if (value!.length <= limit) {
      return value;
    }

    // Aplicar truncamiento según las opciones
    return this.applyTruncation(value!, limit, completeWords, ellipsis);
  }

  // ============================
  // MÉTODOS PRIVADOS - VALIDACIÓN
  // ============================

  /**
   * Valida los parámetros de entrada del pipe
   * 
   * @param limit - Límite a validar
   * @param ellipsis - Ellipsis a validar
   * @throws {Error} Si los parámetros no son válidos
   * 
   * @private
   */
  private validateInputs(limit: number, ellipsis: string): void {
    // Validar que limit sea un número
    if (typeof limit !== 'number' || isNaN(limit)) {
      throw new Error('TruncatePipe: El parámetro "limit" debe ser un número válido');
    }

    // Validar que limit esté en rango razonable
    if (limit < this.MIN_LIMIT) {
      throw new Error(`TruncatePipe: El límite debe ser al menos ${this.MIN_LIMIT} caracteres`);
    }

    if (limit > this.MAX_LIMIT) {
      console.warn(`TruncatePipe: Límite muy alto (${limit}). Considera usar un valor menor para mejor rendimiento.`);
    }

    // Validar que ellipsis sea un string
    if (typeof ellipsis !== 'string') {
      throw new Error('TruncatePipe: El parámetro "ellipsis" debe ser un string');
    }
  }

  /**
   * Determina si se debe retornar el valor original sin procesar
   * 
   * @param value - Valor a verificar
   * @param limit - Límite a considerar
   * @returns true si se debe retornar el valor original
   * 
   * @private
   */
  private shouldReturnOriginal(value: string | null | undefined, limit: number): boolean {
    return value == null || value === '' || limit <= 0;
  }

  // ============================
  // MÉTODOS PRIVADOS - TRUNCAMIENTO
  // ============================

  /**
   * Aplica el truncamiento según las opciones especificadas
   * 
   * @param value - Texto a truncar
   * @param limit - Límite de caracteres
   * @param completeWords - Si mantener palabras completas
   * @param ellipsis - Texto de ellipsis
   * @returns Texto truncado
   * 
   * @private
   */
  private applyTruncation(
    value: string,
    limit: number,
    completeWords: boolean,
    ellipsis: string
  ): string {
    if (completeWords) {
      return this.truncateWithCompleteWords(value, limit, ellipsis);
    } else {
      return this.truncateSimple(value, limit, ellipsis);
    }
  }

  /**
   * Truncamiento simple - Corta en el límite exacto
   * 
   * @param value - Texto a truncar
   * @param limit - Límite de caracteres
   * @param ellipsis - Texto de ellipsis
   * @returns Texto truncado simple
   * 
   * @private
   */
  private truncateSimple(value: string, limit: number, ellipsis: string): string {
    return value.substring(0, limit) + ellipsis;
  }

  /**
   * Truncamiento que mantiene palabras completas
   * 
   * @param value - Texto a truncar
   * @param limit - Límite de caracteres
   * @param ellipsis - Texto de ellipsis
   * @returns Texto truncado con palabras completas
   * 
   * @private
   */
  private truncateWithCompleteWords(value: string, limit: number, ellipsis: string): string {
    // Buscar el último espacio dentro del límite
    const truncatedText = value.substring(0, limit);
    const lastSpaceIndex = truncatedText.lastIndexOf(' ');

    // Si encontramos un espacio y no es al inicio, truncar ahí
    if (lastSpaceIndex > 0) {
      return value.substring(0, lastSpaceIndex) + ellipsis;
    }

    // Si no hay espacios o el espacio está al inicio, usar truncamiento simple
    // Esto evita problemas con textos muy largos sin espacios
    return this.truncateSimple(value, limit, ellipsis);
  }

  // ============================
  // MÉTODOS PÚBLICOS ADICIONALES
  // ============================

  /**
   * Obtiene información sobre la configuración por defecto del pipe
   * 
   * @returns Objeto con configuración por defecto
   * 
   * @public
   */
  getDefaultConfig(): { limit: number; completeWords: boolean; ellipsis: string } {
    return {
      limit: this.DEFAULT_LIMIT,
      completeWords: false,
      ellipsis: this.DEFAULT_ELLIPSIS
    };
  }

  /**
   * Calcula la longitud del texto después del truncamiento sin aplicar el truncamiento
   * 
   * @param value - Texto a analizar
   * @param limit - Límite de caracteres
   * @param completeWords - Si mantener palabras completas
   * @param ellipsis - Texto de ellipsis
   * @returns Longitud estimada después del truncamiento
   * 
   * @public
   */
  calculateTruncatedLength(
    value: string | null | undefined,
    limit: number = this.DEFAULT_LIMIT,
    completeWords: boolean = false,
    ellipsis: string = this.DEFAULT_ELLIPSIS
  ): number {
    if (this.shouldReturnOriginal(value, limit)) {
      return value?.length || 0;
    }

    if (value!.length <= limit) {
      return value!.length;
    }

    const truncated = this.applyTruncation(value!, limit, completeWords, ellipsis);
    return truncated.length;
  }

  /**
   * Verifica si un texto sería truncado con los parámetros dados
   * 
   * @param value - Texto a verificar
   * @param limit - Límite de caracteres
   * @returns true si el texto sería truncado
   * 
   * @public
   */
  wouldBeTruncated(value: string | null | undefined, limit: number = this.DEFAULT_LIMIT): boolean {
    if (this.shouldReturnOriginal(value, limit)) {
      return false;
    }
    return value!.length > limit;
  }
}
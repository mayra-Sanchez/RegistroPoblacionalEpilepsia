import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Pipe personalizado para sanitizar y marcar contenido como seguro en Angular
 * 
 * Este pipe utiliza el DomSanitizer de Angular para marcar contenido como seguro
 * y evitar que sea bloqueado por las políticas de seguridad del navegador.
 * 
 * ⚠️ ADVERTENCIA DE SEGURIDAD:
 * Use este pipe con precaución y solo con contenido de confianza.
 * El bypass de seguridad puede exponer la aplicación a ataques XSS.
 * 
 * @example
 * <!-- Sanitizar HTML -->
 * <div [innerHTML]="untrustedHTML | safe:'html'"></div>
 * 
 * <!-- Sanitizar URLs para iframes -->
 * <iframe [src]="videoUrl | safe:'resourceUrl'"></iframe>
 * 
 * <!-- Sanitizar URLs para enlaces -->
 * <a [href]="downloadUrl | safe:'url'">Descargar</a>
 * 
 * <!-- Sanitizar estilos CSS -->
 * <div [style]="dynamicStyles | safe:'style'"></div>
 * 
 * @example
 * // En código TypeScript
 * const safeHtml = this.safePipe.transform('<script>alert("XSS")</script>', 'html');
 */
@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

  // ============================
  // TIPOS DE SANITIZACIÓN SOPORTADOS
  // ============================

  /** Tipos de sanitización disponibles y sus descripciones */
  private readonly SANITIZATION_TYPES = {
    html: 'Contenido HTML - Para usar con [innerHTML]',
    style: 'Estilos CSS - Para usar con [style] o [ngStyle]',
    script: 'Scripts JavaScript - Para ejecutar código JS',
    url: 'URLs normales - Para enlaces, imágenes, etc.',
    resourceUrl: 'URLs de recursos - Para iframes, objetos, etc.'
  };

  // ============================
  // CONSTRUCTOR
  // ============================

  /**
   * Constructor del pipe SafePipe
   * @param sanitizer Servicio DomSanitizer de Angular para bypass de seguridad
   */
  constructor(protected sanitizer: DomSanitizer) { }

  // ============================
  // MÉTODO PRINCIPAL
  // ============================

  /**
   * Transforma y marca contenido como seguro según el tipo especificado
   * 
   * @param value - El contenido a sanitizar (string)
   * @param type - Tipo de sanitización: 'html', 'style', 'script', 'url', 'resourceUrl'
   * @returns Contenido marcado como seguro del tipo correspondiente
   * 
   * @throws {Error} Si el tipo especificado no es válido
   * @throws {Error} Si el valor no es un string
   * 
   * @example
   * // Ejemplos de uso:
   * transform('<div>Hola</div>', 'html') → SafeHtml
   * transform('javascript:alert()', 'url') → SafeUrl
   * transform('url("http://example.com")', 'style') → SafeStyle
   */
  transform(value: string, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {

    this.validateInput(value, type);

    return this.applySanitization(value, type);
  }

  // ============================
  // MÉTODOS PRIVADOS - VALIDACIÓN
  // ============================

  /**
   * Valida los parámetros de entrada del pipe
   * 
   * @param value - Valor a sanitizar
   * @param type - Tipo de sanitización
   * @throws {Error} Si los parámetros no son válidos
   * 
   * @private
   */
  private validateInput(value: string, type: string): void {

    if (typeof value !== 'string') {
      throw new Error(`SafePipe: El valor debe ser un string. Se recibió: ${typeof value}`);
    }

    if (!value.trim()) {
      console.warn('SafePipe: El valor proporcionado está vacío o contiene solo espacios');
    }

    if (!this.isValidType(type)) {
      const validTypes = Object.keys(this.SANITIZATION_TYPES).join(', ');
      throw new Error(
        `SafePipe: Tipo de sanitización "${type}" no válido. ` +
        `Tipos válidos: ${validTypes}`
      );
    }

    this.checkSecurityWarnings(value, type);
  }

  /**
   * Verifica si el tipo de sanitización es válido
   * 
   * @param type - Tipo a validar
   * @returns true si el tipo es válido
   * 
   * @private
   */
  private isValidType(type: string): boolean {
    return Object.keys(this.SANITIZATION_TYPES).includes(type);
  }

  /**
   * Verifica advertencias de seguridad en el contenido
   * 
   * @param value - Contenido a analizar
   * @param type - Tipo de sanitización
   * 
   * @private
   */
  private checkSecurityWarnings(value: string, type: string): void {
    const securityWarnings = this.detectSecurityIssues(value, type);
    
    if (securityWarnings.length > 0) {
      console.warn(
        `SafePipe: Advertencias de seguridad detectadas para tipo "${type}":\n` +
        securityWarnings.join('\n') +
        `\nContenido: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`
      );
    }
  }

  // ============================
  // MÉTODOS PRIVADOS - SANITIZACIÓN
  // ============================

  /**
   * Aplica la sanitización correspondiente según el tipo
   * 
   * @param value - Valor a sanitizar
   * @param type - Tipo de sanitización
   * @returns Contenido marcado como seguro
   * 
   * @private
   */
  private applySanitization(value: string, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
    switch (type) {
      case 'html':
        return this.sanitizeHtml(value);
      
      case 'style':
        return this.sanitizeStyle(value);
      
      case 'script':
        return this.sanitizeScript(value);
      
      case 'url':
        return this.sanitizeUrl(value);
      
      case 'resourceUrl':
        return this.sanitizeResourceUrl(value);
      
      default:
        throw new Error(`SafePipe: Tipo no implementado: ${type}`);
    }
  }

  /**
   * Sanitiza contenido HTML
   * 
   * @param value - HTML a sanitizar
   * @returns HTML marcado como seguro
   * 
   * @private
   */
  private sanitizeHtml(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }

  /**
   * Sanitiza estilos CSS
   * 
   * @param value - CSS a sanitizar
   * @returns Estilos marcados como seguros
   * 
   * @private
   */
  private sanitizeStyle(value: string): SafeStyle {
    console.log('SafePipe: Sanitizando estilos CSS');
    return this.sanitizer.bypassSecurityTrustStyle(value);
  }

  /**
   * Sanitiza scripts JavaScript
   * 
   * ⚠️ EXTREMADAMENTE PELIGROSO - Use con mucho cuidado
   * 
   * @param value - Script a sanitizar
   * @returns Script marcado como seguro
   * 
   * @private
   */
  private sanitizeScript(value: string): SafeScript {
    console.warn('SafePipe: Sanitizando script JavaScript - ¡ADVERTENCIA DE SEGURIDAD!');
    return this.sanitizer.bypassSecurityTrustScript(value);
  }

  /**
   * Sanitiza URLs normales
   * 
   * @param value - URL a sanitizar
   * @returns URL marcada como segura
   * 
   * @private
   */
  private sanitizeUrl(value: string): SafeUrl {
    console.log('SafePipe: Sanitizando URL:', value);
    return this.sanitizer.bypassSecurityTrustUrl(value);
  }

  /**
   * Sanitiza URLs de recursos (para iframes, objetos, etc.)
   * 
   * @param value - URL de recurso a sanitizar
   * @returns URL de recurso marcada como segura
   * 
   * @private
   */
  private sanitizeResourceUrl(value: string): SafeResourceUrl {
    console.log('SafePipe: Sanitizando URL de recurso:', value);
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  // ============================
  // MÉTODOS DE DETECCIÓN DE SEGURIDAD
  // ============================

  /**
   * Detecta posibles problemas de seguridad en el contenido
   * 
   * @param value - Contenido a analizar
   * @param type - Tipo de sanitización
   * @returns Array de advertencias de seguridad
   * 
   * @private
   */
  private detectSecurityIssues(value: string, type: string): string[] {
    const warnings: string[] = [];
    const lowerValue = value.toLowerCase();

    const dangerousPatterns = [
      { pattern: 'javascript:', description: 'Protocolo JavaScript en URL' },
      { pattern: 'data:text/html', description: 'HTML embebido en data URI' },
      { pattern: '<script', description: 'Etiquetas script en HTML' },
      { pattern: 'onload=', description: 'Atributos de evento en HTML' },
      { pattern: 'expression(', description: 'Expresiones CSS peligrosas' },
    ];

    dangerousPatterns.forEach(({ pattern, description }) => {
      if (lowerValue.includes(pattern)) {
        warnings.push(`- ${description} detectado`);
      }
    });

    // Advertencias específicas por tipo
    if (type === 'script') {
      warnings.push('- Uso de tipo "script" detectado - ¡Extremo riesgo de seguridad!');
    }

    if (type === 'html' && value.length > 1000) {
      warnings.push('- Contenido HTML muy extenso puede contener código malicioso');
    }

    return warnings;
  }

  // ============================
  // MÉTODOS PÚBLICOS ADICIONALES
  // ============================

  /**
   * Obtiene los tipos de sanitización disponibles
   * 
   * @returns Objeto con tipos y descripciones
   * 
   * @public
   */
  getAvailableTypes(): { [key: string]: string } {
    return { ...this.SANITIZATION_TYPES };
  }

  /**
   * Verifica si un tipo de sanitización es válido
   * 
   * @param type - Tipo a verificar
   * @returns true si el tipo es válido
   * 
   * @public
   */
  isValidSanitizationType(type: string): boolean {
    return this.isValidType(type);
  }

  /**
   * Obtiene una descripción para un tipo de sanitización
   * 
   * @param type - Tipo de sanitización
   * @returns Descripción del tipo o mensaje de error
   * 
   * @public
   */
  getTypeDescription(type: string): string {
    if (this.isValidType(type)) {
      return this.SANITIZATION_TYPES[type as keyof typeof this.SANITIZATION_TYPES];
    }
    return `Tipo "${type}" no válido`;
  }
}
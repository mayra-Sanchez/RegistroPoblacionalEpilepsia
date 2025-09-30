import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/**
 * Pipe especializado para sanitizar URLs marcándolas como seguras para uso en recursos
 * 
 * Este pipe está específicamente diseñado para URLs que serán utilizadas en
 * contextos que requieren SafeResourceUrl, como iframes, objetos, embeds, etc.
 * 
 * ⚠️ ADVERTENCIA DE SEGURIDAD:
 * Use este pipe solo con URLs de confianza. El bypass de seguridad puede
 * exponer la aplicación a ataques si se utilizan URLs maliciosas.
 * 
 * @example
 * <!-- Uso en iframes -->
 * <iframe [src]="videoUrl | safeUrl" frameborder="0"></iframe>
 * 
 * <!-- Uso en objetos -->
 * <object [data]="pdfUrl | safeUrl" type="application/pdf"></object>
 * 
 * <!-- Uso en embeds -->
 * <embed [src]="documentUrl | safeUrl" type="application/pdf">
 * 
 * @example
 * // En código TypeScript
 * const safeVideoUrl = this.safeUrlPipe.transform('https://example.com/video.mp4');
 */
@Pipe({
  name: 'safeUrl'
})
export class SafeUrlPipe implements PipeTransform {

  // ============================
  // CONSTRUCTOR
  // ============================

  /**
   * Constructor del pipe SafeUrlPipe
   * @param sanitizer Servicio DomSanitizer de Angular para bypass de seguridad de URLs
   */
  constructor(private sanitizer: DomSanitizer) {}

  // ============================
  // MÉTODO PRINCIPAL
  // ============================

  /**
   * Transforma una URL normal en una URL segura para uso en recursos
   * 
   * Este método utiliza bypassSecurityTrustResourceUrl que es específicamente
   * diseñado para URLs que cargarán recursos como iframes, objetos, etc.
   * 
   * @param url - La URL a sanitizar. Puede ser string o null.
   * @returns SafeUrl marcada como segura para recursos, o null si la URL es null/undefined
   * 
   * @throws {Error} Si la URL no es un string válido (cuando se proporciona un valor no nulo)
   * 
   * @example
   * // Ejemplos de uso:
   * transform('https://example.com/video.mp4') → SafeUrl
   * transform('https://www.youtube.com/embed/abc123') → SafeUrl  
   * transform(null) → null
   * transform('') → null
   * transform(undefined) → null
   */
  transform(url: string | null): SafeUrl | null {
    // Validar y limpiar la URL de entrada
    const cleanedUrl = this.validateAndCleanUrl(url);
    
    // Si la URL es inválida después de la limpieza, retornar null
    if (!cleanedUrl) {
      return null;
    }

    // Aplicar sanitización de seguridad
    return this.sanitizeUrl(cleanedUrl);
  }

  // ============================
  // MÉTODOS PRIVADOS - VALIDACIÓN
  // ============================

  /**
   * Valida y limpia la URL de entrada
   * 
   * @param url - URL a validar y limpiar
   * @returns URL limpia y validada, o null si es inválida
   * 
   * @private
   */
  private validateAndCleanUrl(url: string | null): string | null {
    // Caso: URL nula o undefined
    if (url == null) {
      console.debug('SafeUrlPipe: URL nula o undefined proporcionada');
      return null;
    }

    // Caso: URL vacía o solo espacios
    if (url.trim() === '') {
      console.warn('SafeUrlPipe: URL vacía proporcionada');
      return null;
    }

    const trimmedUrl = url.trim();

    // Validar que sea un string
    if (typeof trimmedUrl !== 'string') {
      console.error('SafeUrlPipe: La URL debe ser un string. Se recibió:', typeof trimmedUrl);
      return null;
    }

    // Validaciones de seguridad adicionales
    const securityIssues = this.detectSecurityIssues(trimmedUrl);
    if (securityIssues.length > 0) {
      console.warn(
        `SafeUrlPipe: Advertencias de seguridad detectadas en la URL:\n` +
        securityIssues.join('\n') +
        `\nURL: ${this.maskSensitiveUrl(trimmedUrl)}`
      );
    }

    return trimmedUrl;
  }

  /**
   * Detecta posibles problemas de seguridad en la URL
   * 
   * @param url - URL a analizar
   * @returns Array de advertencias de seguridad
   * 
   * @private
   */
  private detectSecurityIssues(url: string): string[] {
    const warnings: string[] = [];
    const lowerUrl = url.toLowerCase();

    // Patrones potencialmente peligrosos en URLs
    const dangerousPatterns = [
      { 
        pattern: 'javascript:', 
        description: 'Protocolo JavaScript - Puede ejecutar código malicioso',
        severity: 'high'
      },
      { 
        pattern: 'data:', 
        description: 'Data URI - Puede contener contenido malicioso embebido',
        severity: 'medium'
      },
      { 
        pattern: 'vbscript:', 
        description: 'Protocolo VBScript - Obsoleto y potencialmente peligroso',
        severity: 'high'
      },
      {
        pattern: 'file://',
        description: 'Protocolo de archivo local - Puede acceder a sistema de archivos',
        severity: 'high'
      }
    ];

    // Verificar patrones peligrosos
    dangerousPatterns.forEach(({ pattern, description, severity }) => {
      if (lowerUrl.includes(pattern)) {
        warnings.push(`- [${severity.toUpperCase()}] ${description}`);
      }
    });

    // Validar formato básico de URL (opcional, pero recomendado)
    if (!this.isValidUrlFormat(url)) {
      warnings.push('- [MEDIUM] Formato de URL potencialmente inválido');
    }

    return warnings;
  }

  /**
   * Valida el formato básico de la URL
   * 
   * @param url - URL a validar
   * @returns true si la URL tiene un formato básicamente válido
   * 
   * @private
   */
  private isValidUrlFormat(url: string): boolean {
    try {
      // Intentar crear un objeto URL (nativo del navegador)
      new URL(url);
      return true;
    } catch (e) {
      // Si falla, puede ser una URL relativa o con formato incorrecto
      // En muchos casos, las URLs relativas son válidas en el contexto de la aplicación
      return this.isPossiblyRelativeUrl(url);
    }
  }

  /**
   * Verifica si la URL podría ser una URL relativa válida
   * 
   * @param url - URL a verificar
   * @returns true si parece ser una URL relativa
   * 
   * @private
   */
  private isPossiblyRelativeUrl(url: string): boolean {
    // URLs relativas comunes
    const relativePatterns = [
      /^\/[^/]/, // Rutas absolutas del sitio (/path/to/resource)
      /^\.\.?\//, // Rutas relativas (../path o ./path)
      /^[^:/?#]+\.(html|pdf|mp4|jpg|png|gif)$/i // Nombres de archivo
    ];

    return relativePatterns.some(pattern => pattern.test(url));
  }

  // ============================
  // MÉTODOS PRIVADOS - SANITIZACIÓN
  // ============================

  /**
   * Aplica la sanitización de seguridad a la URL
   * 
   * @param url - URL limpia y validada
   * @returns URL marcada como SafeUrl segura para recursos
   * 
   * @private
   */
  private sanitizeUrl(url: string): SafeUrl {
    console.log('SafeUrlPipe: Sanitizando URL para recurso:', this.maskSensitiveUrl(url));
    
    // Usar bypassSecurityTrustResourceUrl específicamente para recursos
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ============================
  // MÉTODOS DE UTILIDAD
  // ============================

  /**
   * Enmascara URL sensible para logging (oculta parámetros potencialmente sensibles)
   * 
   * @param url - URL original
   * @returns URL enmascarada para logging seguro
   * 
   * @private
   */
  private maskSensitiveUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Enmascarar parámetros de query potencialmente sensibles
      const maskedParams = new URLSearchParams();
      urlObj.searchParams.forEach((value, key) => {
        // Lista de parámetros comúnmente sensibles
        const sensitiveParams = ['token', 'auth', 'password', 'key', 'secret', 'access'];
        if (sensitiveParams.some(sensitive => key.toLowerCase().includes(sensitive))) {
          maskedParams.set(key, '***');
        } else {
          maskedParams.set(key, value.length > 20 ? value.substring(0, 20) + '...' : value);
        }
      });

      // Reconstruir URL con parámetros enmascarados
      const maskedUrl = `${urlObj.origin}${urlObj.pathname}`;
      const queryString = maskedParams.toString();
      
      return queryString ? `${maskedUrl}?${queryString}` : maskedUrl;
    } catch (e) {
      // Si no se puede parsear, devolver truncada
      return url.length > 100 ? url.substring(0, 100) + '...' : url;
    }
  }

  // ============================
  // MÉTODOS PÚBLICOS ADICIONALES
  // ============================

  /**
   * Verifica si una URL es potencialmente segura para usar con el pipe
   * 
   * @param url - URL a verificar
   * @returns Objeto con resultado de la verificación
   * 
   * @public
   */
  checkUrlSafety(url: string | null): { isSafe: boolean; warnings: string[]; cleanedUrl: string | null } {
    const cleanedUrl = this.validateAndCleanUrl(url);
    const warnings = cleanedUrl ? this.detectSecurityIssues(cleanedUrl) : ['URL inválida o vacía'];
    
    return {
      isSafe: cleanedUrl !== null && warnings.length === 0,
      warnings,
      cleanedUrl
    };
  }

  /**
   * Obtiene información sobre los protocolos considerados peligrosos
   * 
   * @returns Array con información de protocolos peligrosos
   * 
   * @public
   */
  getDangerousProtocols(): Array<{ protocol: string; description: string; severity: string }> {
    return [
      {
        protocol: 'javascript:',
        description: 'Ejecuta código JavaScript en el contexto de la página',
        severity: 'ALTA'
      },
      {
        protocol: 'data:',
        description: 'Puede contener contenido malicioso embebido',
        severity: 'MEDIA'
      },
      {
        protocol: 'vbscript:',
        description: 'Protocolo obsoleto de Visual Basic Script',
        severity: 'ALTA'
      },
      {
        protocol: 'file://',
        description: 'Accede al sistema de archivos local del usuario',
        severity: 'ALTA'
      }
    ];
  }
}
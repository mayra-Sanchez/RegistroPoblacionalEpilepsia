/**
 * Utilidades para el manejo de fechas en la aplicación.
 * 
 * Este módulo proporciona funciones especializadas para la conversión, validación
 * y formateo de fechas entre diferentes formatos utilizados en el sistema.
 * 
 * @module DateUtils
 * 
 * @example
 * // Uso básico de las funciones
 * import { parseToIsoDate, formatToEuropeanDate, isValidDate } from './date-utils';
 * 
 * const isoDate = parseToIsoDate('31-12-2023'); // '2023-12-31'
 * const euroDate = formatToEuropeanDate('2023-12-31'); // '31-12-2023'
 * const isValid = isValidDate('2023-12-31'); // true
 */

/**
 * Expresiones regulares precompiladas para validación de formatos de fecha
 */
const DATE_PATTERNS = {
    /** Patrón para formato ISO 8601: YYYY-MM-DD */
    ISO: /^\d{4}-\d{2}-\d{2}$/,
    
    /** Patrón para formato europeo: DD-MM-YYYY con separadores - o / */
    EUROPEAN: /^(\d{2})[-\/](\d{2})[-\/](\d{4})$/,
    
    /** Patrón para formato completo ISO con tiempo: YYYY-MM-DDTHH:mm:ss.sssZ */
    ISO_FULL: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
};

/**
 * Valida los componentes individuales de una fecha (día, mes, año).
 * 
 * @param day - Día como string (debe ser numérico)
 * @param month - Mes como string (debe ser numérico)
 * @param year - Año como string (debe ser numérico)
 * @returns true si los componentes forman una fecha potencialmente válida
 * 
 * @internal
 */
function isValidDateComponents(day: string, month: string, year: string): boolean {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Validaciones básicas de rango
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;

    return true;
}

/**
 * Valida si una fecha ISO representa una fecha de calendario válida.
 * Considera meses con diferentes cantidades de días y años bisiestos.
 * 
 * @param isoDate - Fecha en formato ISO (YYYY-MM-DD)
 * @returns true si es una fecha de calendario válida
 * 
 * @internal
 */
function isValidCalendarDate(isoDate: string): boolean {
    const date = new Date(isoDate);
    const [year, month, day] = isoDate.split('-').map(Number);
    
    // Verificar que la fecha creada coincida con los componentes originales
    return date.getFullYear() === year &&
           date.getMonth() + 1 === month &&
           date.getDate() === day;
}

/**
 * Convierte una cadena de fecha en formato ISO (YYYY-MM-DD) o europeo (DD-MM-YYYY) a formato ISO.
 * 
 * Esta función es esencial para normalizar fechas provenientes de diferentes fuentes:
 * - Formularios de entrada de usuario
 * - Bases de datos
 * - APIs externas
 * - Archivos de importación
 * 
 * @param input - Cadena de fecha a parsear, puede ser en formato ISO, europeo o nula/undefined
 * @returns Cadena en formato ISO (YYYY-MM-DD) o cadena vacía si no se puede parsear
 * 
 * @throws {Error} No lanza excepciones, devuelve cadena vacía en caso de error
 * 
 * @example
 * // Casos de uso comunes:
 * parseToIsoDate('2023-12-31')    // '2023-12-31' (ya está en ISO)
 * parseToIsoDate('31-12-2023')    // '2023-12-31' (convierte de europeo a ISO)
 * parseToIsoDate('31/12/2023')    // '2023-12-31' (acepta ambos separadores)
 * parseToIsoDate('')              // '' (entrada vacía)
 * parseToIsoDate(null)            // '' (entrada nula)
 * parseToIsoDate('invalid-date')  // '' (formato no reconocido)
 * 
 * @example
 * // Uso en formularios:
 * const fechaNormalizada = parseToIsoDate(this.form.get('fechaNacimiento').value);
 * if (fechaNormalizada) {
 *   this.pacienteService.actualizarFechaNacimiento(fechaNormalizada);
 * }
 */
export function parseToIsoDate(input: string | null | undefined): string {
    // Validación de entrada nula, undefined o vacía
    if (!input || typeof input !== 'string' || input.trim() === '') {
        return '';
    }

    const trimmedInput = input.trim();

    // Verificar si ya está en formato ISO
    if (DATE_PATTERNS.ISO.test(trimmedInput)) {
        return trimmedInput;
    }

    // Intentar parsear formato europeo
    const match = trimmedInput.match(DATE_PATTERNS.EUROPEAN);
    if (match) {
        const [, day, month, year] = match;
        
        // Validar componentes básicos de la fecha
        if (isValidDateComponents(day, month, year)) {
            return `${year}-${month}-${day}`;
        }
    }

    // Formato no reconocido o fecha inválida
    console.warn(`Formato de fecha no reconocido: "${input}". Se esperaba formato ISO (YYYY-MM-DD) o Europeo (DD-MM-YYYY).`);
    return '';
}

/**
 * Convierte una fecha en formato ISO (YYYY-MM-DD) a formato europeo (DD-MM-YYYY).
 * 
 * @param isoDateString - Cadena de fecha en formato ISO (YYYY-MM-DD)
 * @returns Cadena en formato europeo (DD-MM-YYYY) o cadena vacía si la entrada es inválida
 * 
 * @example
 * formatToEuropeanDate('2023-12-31') // '31-12-2023'
 * formatToEuropeanDate('invalid')    // ''
 */
export function formatToEuropeanDate(isoDateString: string): string {
    if (!isoDateString || !DATE_PATTERNS.ISO.test(isoDateString)) {
        return '';
    }

    const [year, month, day] = isoDateString.split('-');
    return `${day}-${month}-${year}`;
}

/**
 * Valida si una cadena representa una fecha válida en formato ISO o europeo.
 * 
 * @param dateString - Cadena de fecha a validar
 * @returns true si la fecha es válida y tiene un formato reconocido, false en caso contrario
 * 
 * @example
 * isValidDate('2023-12-31') // true
 * isValidDate('31-12-2023') // true
 * isValidDate('2023-13-45') // false (mes y día inválidos)
 * isValidDate('invalid')     // false
 */
export function isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const isoDate = parseToIsoDate(dateString);
    if (!isoDate) return false;

    const date = new Date(isoDate);
    return !isNaN(date.getTime()) && isValidCalendarDate(isoDate);
}

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD).
 * 
 * @returns Fecha actual en formato ISO
 * 
 * @example
 * getCurrentIsoDate() // '2023-12-31'
 */
export function getCurrentIsoDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Calcula la edad a partir de una fecha de nacimiento en formato ISO.
 * 
 * @param birthDateIso - Fecha de nacimiento en formato ISO (YYYY-MM-DD)
 * @returns Edad en años, o null si la fecha es inválida o futura
 * 
 * @example
 * calculateAge('1990-05-15') // 33 (dependiendo de la fecha actual)
 */
export function calculateAge(birthDateIso: string): number | null {
    if (!isValidDate(birthDateIso)) {
        return null;
    }

    const birthDate = new Date(birthDateIso);
    const today = new Date();
    
    // Verificar que la fecha de nacimiento no sea en el futuro
    if (birthDate > today) {
        return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Ajustar edad si el cumpleaños aún no ha ocurrido este año
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Compara dos fechas en formato ISO.
 * 
 * @param date1 - Primera fecha en formato ISO
 * @param date2 - Segunda fecha en formato ISO
 * @returns 
 *   -1 si date1 es anterior a date2
 *    0 si las fechas son iguales
 *    1 si date1 es posterior a date2
 *    null si alguna fecha es inválida
 * 
 * @example
 * compareDates('2023-01-01', '2023-12-31') // -1
 * compareDates('2023-12-31', '2023-01-01') // 1
 * compareDates('2023-12-31', '2023-12-31') // 0
 */
export function compareDates(date1: string, date2: string): number | null {
    if (!isValidDate(date1) || !isValidDate(date2)) {
        return null;
    }

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
}

/**
 * Formatea una fecha ISO para mostrarla de manera legible.
 * 
 * @param isoDate - Fecha en formato ISO
 * @param locale - Configuración regional (por defecto 'es-ES')
 * @returns Fecha formateada o cadena vacía si la fecha es inválida
 * 
 * @example
 * formatDisplayDate('2023-12-31') // '31 de diciembre de 2023'
 */
export function formatDisplayDate(isoDate: string, locale: string = 'es-ES'): string {
    if (!isValidDate(isoDate)) {
        return '';
    }

    const date = new Date(isoDate);
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Agrega días a una fecha ISO y devuelve el resultado en formato ISO.
 * 
 * @param isoDate - Fecha base en formato ISO
 * @param days - Número de días a agregar (puede ser negativo)
 * @returns Nueva fecha en formato ISO o cadena vacía si la fecha base es inválida
 * 
 * @example
 * addDaysToDate('2023-12-31', 1)  // '2024-01-01'
 * addDaysToDate('2023-12-31', -1) // '2023-12-30'
 */
export function addDaysToDate(isoDate: string, days: number): string {
    if (!isValidDate(isoDate)) {
        return '';
    }

    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    
    return date.toISOString().split('T')[0];
}

/**
 * Calcula la diferencia en días entre dos fechas ISO.
 * 
 * @param date1 - Primera fecha en formato ISO
 * @param date2 - Segunda fecha en formato ISO
 * @returns Diferencia en días (date2 - date1) o null si alguna fecha es inválida
 * 
 * @example
 * getDaysDifference('2023-12-01', '2023-12-31') // 30
 * getDaysDifference('2023-12-31', '2023-12-01') // -30
 */
export function getDaysDifference(date1: string, date2: string): number | null {
    if (!isValidDate(date1) || !isValidDate(date2)) {
        return null;
    }

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Exportación por defecto de todas las funciones utilitarias
 */
export default {
    parseToIsoDate,
    formatToEuropeanDate,
    isValidDate,
    getCurrentIsoDate,
    calculateAge,
    compareDates,
    formatDisplayDate,
    addDaysToDate,
    getDaysDifference
};
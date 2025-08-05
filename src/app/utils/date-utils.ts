/**
 * Utilidades para el manejo de fechas.
 * Contiene funciones para conversión y formato de fechas.
 */

/**
 * Convierte una cadena de fecha en formato ISO (YYYY-MM-DD) o europeo (DD-MM-YYYY) a formato ISO.
 * Si la entrada ya está en formato ISO, la devuelve sin cambios.
 * Si la entrada está en formato europeo, la convierte a ISO.
 * Si la entrada no coincide con ningún formato conocido o es nula/undefined, devuelve una cadena vacía.
 * 
 * @param input Cadena de fecha a parsear, puede ser en formato ISO, europeo o nula/undefined
 * @returns Cadena en formato ISO (YYYY-MM-DD) o cadena vacía si no se puede parsear
 */
export function parseToIsoDate(input: string | null | undefined): string {
  if (!input) return '';

  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(input)) return input;

  const europeanPattern = /^(\d{2})[-\/](\d{2})[-\/](\d{4})$/;
  const match = input.match(europeanPattern);

  if (match) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  return '';
}
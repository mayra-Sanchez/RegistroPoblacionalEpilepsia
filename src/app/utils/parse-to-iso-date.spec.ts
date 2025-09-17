// src/app/utils/parse-to-iso-date.spec.ts
import { parseToIsoDate } from './date-utils';

describe('parseToIsoDate', () => {

  it('✅ Devuelve vacío si la entrada es null', () => {
    expect(parseToIsoDate(null)).toBe('');
  });

  it('✅ Devuelve vacío si la entrada es undefined', () => {
    expect(parseToIsoDate(undefined)).toBe('');
  });

  it('✅ Devuelve vacío si la entrada es cadena vacía', () => {
    expect(parseToIsoDate('')).toBe('');
  });

  it('✅ Mantiene fechas en formato ISO', () => {
    expect(parseToIsoDate('2025-09-13')).toBe('2025-09-13');
  });

  it('✅ Convierte fecha europea con guiones', () => {
    expect(parseToIsoDate('13-09-2025')).toBe('2025-09-13');
  });

  it('✅ Convierte fecha europea con barras', () => {
    expect(parseToIsoDate('13/09/2025')).toBe('2025-09-13');
  });

  it('❌ Devuelve vacío si el string no es fecha', () => {
    expect(parseToIsoDate('texto')).toBe('');
  });
});

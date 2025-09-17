import { TruncatePipe } from '../truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('✅ debería crear el pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('✅ Texto más corto que el límite', () => {
    const result = pipe.transform('Hola', 10);
    expect(result).toBe('Hola');
  });

  it('✅ Texto exacto al límite', () => {
    const result = pipe.transform('12345', 5);
    expect(result).toBe('12345');
  });

  it('✅ Texto más largo sin mantener palabras', () => {
    const result = pipe.transform('Angular testing', 7);
    expect(result).toBe('Angular...');
  });

  it('✅ Texto más largo manteniendo palabras', () => {
    const result = pipe.transform('Angular unit test', 10, true);
    expect(result).toBe('Angular...');
  });

  it('✅ Texto largo sin espacios con completeWords=true', () => {
    const result = pipe.transform('AngularTesting', 7, true);
    expect(result).toBe('Angular...');
  });

  it('✅ Cambiar sufijo de truncamiento', () => {
    const result = pipe.transform('Angular test', 7, false, '---');
    expect(result).toBe('Angular---');
  });

  it('✅ Maneja cadena vacía o undefined', () => {
    expect(pipe.transform('', 5)).toBe('');
    expect(pipe.transform(undefined as any, 5)).toBeUndefined();
  });
});

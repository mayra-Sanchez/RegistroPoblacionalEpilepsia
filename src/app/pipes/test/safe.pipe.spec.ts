// src/app/pipes/safe.pipe.spec.ts
import { SafePipe } from '../safe.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('SafePipe', () => {
  let pipe: SafePipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SafePipe(sanitizer);
  });

  it('✅ Sanitiza HTML', () => {
    const result = pipe.transform('<b>texto</b>', 'html');
    expect(result).toBeDefined();
    // Verifica que sea instancia de un tipo seguro (SafeHtml)
    expect(result.constructor.name).toContain('SafeHtml');
  });

  it('✅ Sanitiza CSS', () => {
    const result = pipe.transform('color:red;', 'style');
    expect(result).toBeDefined();
    expect(result.constructor.name).toContain('SafeStyle');
  });

  it('✅ Sanitiza Script', () => {
    const result = pipe.transform('alert(1)', 'script');
    expect(result).toBeDefined();
    expect(result.constructor.name).toContain('SafeScript');
  });

  it('✅ Sanitiza URL', () => {
    const result = pipe.transform('https://example.com', 'url');
    expect(result).toBeDefined();
    expect(result.constructor.name).toContain('SafeUrl');
  });

  it('✅ Sanitiza ResourceUrl', () => {
    const result = pipe.transform('https://example.com/resource', 'resourceUrl');
    expect(result).toBeDefined();
    expect(result.constructor.name).toContain('SafeResourceUrl');
  });

  it('❌ Lanza error con tipo inválido', () => {
    expect(() => pipe.transform('cualquier valor', 'invalido'))
      .toThrowError('Invalid safe type specified: invalido');
  });
});

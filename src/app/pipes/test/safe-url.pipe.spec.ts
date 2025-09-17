import { TestBed } from '@angular/core/testing';
import { SafeUrlPipe } from '../safeUrl.pipe';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

describe('SafeUrlPipe', () => {
  let pipe: SafeUrlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeUrlPipe]
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = TestBed.inject(SafeUrlPipe);
  });

  it('✅ debería crearse', () => {
    expect(pipe).toBeTruthy();
  });

  it('✅ devuelve null si la entrada es null', () => {
    const result = pipe.transform(null);
    expect(result).toBeNull();
  });

  it('✅ devuelve SafeUrl si la entrada es válida', () => {
    const url = 'https://example.com';
    const result = pipe.transform(url);
    const expected: SafeUrl = sanitizer.bypassSecurityTrustResourceUrl(url);

    // comparar por el string generado internamente
    expect(result).toEqual(expected);
  });
});

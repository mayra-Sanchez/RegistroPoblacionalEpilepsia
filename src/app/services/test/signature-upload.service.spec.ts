import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SignatureUploadService } from '../signature-upload.service';
import { environment } from '../../environments/environment';

describe('SignatureUploadService', () => {
  let service: SignatureUploadService;
  let httpMock: HttpTestingController;

  const API_UPLOAD = `${environment.backendUrl}/documents/upload`;
  const API_DOWNLOAD = `${environment.backendUrl}/documents/download`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SignatureUploadService]
    });
    service = TestBed.inject(SignatureUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería subir firma válida y retornar URL/ID', () => {
    const mockFile = new File(['firma'], 'signature.png', { type: 'image/png' });
    const patientId = 123;
    const mockResponse = 'signature-id-123';

    service.uploadConsentFile(patientId, mockFile).subscribe(resp => {
      expect(resp).toBe(mockResponse);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'POST' && r.url === API_UPLOAD
    );
    expect(req.request.params.get('patientId')).toBe(patientId.toString());
    expect(req.request.body.has('file')).toBeTrue();

    req.flush(mockResponse);
  });

  it('debería retornar error 415 si el archivo es inválido', () => {
    const mockFile = new File(['xxxx'], 'invalid.exe', { type: 'application/x-msdownload' });
    const patientId = 456;

    service.uploadConsentFile(patientId, mockFile).subscribe({
      next: () => fail('Debe fallar con error 415'),
      error: (error) => {
        expect(error.status).toBe(415);
      }
    });

    const req = httpMock.expectOne(r =>
      r.method === 'POST' && r.url === API_UPLOAD
    );
    expect(req.request.params.get('patientId')).toBe(patientId.toString());

    req.flush('Unsupported Media Type', { status: 415, statusText: 'Unsupported Media Type' });
  });

  it('debería manejar error 500 en subida interrumpida', () => {
    const mockFile = new File(['firma'], 'signature.png', { type: 'image/png' });
    const patientId = 789;

    service.uploadConsentFile(patientId, mockFile).subscribe({
      next: () => fail('Debe fallar con error 500'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(r =>
      r.method === 'POST' && r.url === API_UPLOAD
    );
    expect(req.request.params.get('patientId')).toBe(patientId.toString());

    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('debería incluir headers de autenticación si se implementa', () => {
    const mockFile = new File(['firma'], 'signature.png', { type: 'image/png' });
    const patientId = 321;

    service.uploadConsentFile(patientId, mockFile).subscribe();

    const req = httpMock.expectOne(r =>
      r.method === 'POST' && r.url === API_UPLOAD
    );
    expect(req.request.params.get('patientId')).toBe(patientId.toString());

    // si luego agregas headers con token, aquí lo validas
    // ej: expect(req.request.headers.get('Authorization')).toContain('Bearer');

    req.flush('ok');
  });
});

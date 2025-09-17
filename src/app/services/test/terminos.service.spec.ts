import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TerminosService } from '../terminos.service';

describe('TerminosService', () => {
  let service: TerminosService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:8080/api/v1/TermsConditions/GetAll';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TerminosService],
    });
    service = TestBed.inject(TerminosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // asegura que no queden requests pendientes
  });

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debería obtener los términos (GET)', () => {
    const mockResponse = { termsAndConditionsInfo: 'Texto de los términos' };

    service.getTerminos().subscribe((resp) => {
      expect(resp).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('debería manejar error 500 al obtener los términos', () => {
    service.getTerminos().subscribe({
      next: () => fail('La petición debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Server Error');
      },
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Error interno', { status: 500, statusText: 'Server Error' });
  });
});

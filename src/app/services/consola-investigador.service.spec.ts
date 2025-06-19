import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaInvestigadorService } from './consola-investigador.service';
import { AuthService } from 'src/app/services/auth.service';
import { Observable, of } from 'rxjs';
import { Register, ResearchLayer } from '../modules/consola-registro/interfaces';

describe('ConsolaInvestigadorService', () => {
  let service: ConsolaInvestigadorService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaInvestigadorService,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(ConsolaInvestigadorService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuthHeaders', () => {
    it('should return headers with authorization token', () => {
      authServiceSpy.getToken.and.returnValue('test-token');
      const headers = (service as any).getAuthHeaders();
      expect(headers.get('Authorization')).toBe('Bearer test-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('isDoctor', () => {
    it('should return true if user has Doctor_client_role', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(['Doctor_client_role']));
      expect((service as any).isDoctor()).toBeTrue();
    });

    it('should return false if user does not have Doctor_client_role', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(['Other_role']));
      expect((service as any).isDoctor()).toBeFalse();
    });

    it('should return false if userRoles is empty', () => {
      spyOn(localStorage, 'getItem').and.returnValue('[]');
      expect((service as any).isDoctor()).toBeFalse();
    });
  });

  describe('getDataUpdatedListener', () => {
    it('should return an observable', () => {
      expect(service.getDataUpdatedListener() instanceof Observable).toBeTrue();
    });
  });

  describe('dataChanged$', () => {
    it('should emit when notifyDataChanged is called', (done) => {
      service.dataChanged$.subscribe(() => {
        expect(true).toBeTrue();
        done();
      });
      service.notifyDataChanged();
    });
  });

  describe('obtenerRegistrosPorCapa', () => {
    it('should make GET request with correct parameters and headers', () => {
      authServiceSpy.getToken.and.returnValue('test-token');
      const mockResponse = {
        registers: [{
          registerId: '1',
          id: '1',
          registerDate: '2023-01-01',
          updateRegisterDate: '2023-01-02',
          patientIdentificationNumber: 123456789,
          patientIdentificationType: 'CC',
          variablesRegister: [],
          patientBasicInfo: {
            name: 'John Doe',
            sex: 'Male',
            birthDate: '1990-01-01',
            age: 35,
            email: 'john.doe@example.com',
            phoneNumber: '1234567890',
            deathDate: null,
            economicStatus: 'Middle',
            educationLevel: 'University',
            maritalStatus: 'Single',
            hometown: 'Bogota',
            currentCity: 'Medellin',
            firstCrisisDate: '2020-01-01',
            crisisStatus: 'Active',
            hasCaregiver: true
          },
          caregiver: {
            name: 'Jane Smith',
            identificationType: 'CC',
            identificationNumber: 987654321,
            age: 40,
            educationLevel: 'High School',
            occupation: 'Nurse'
          },
          healthProfessional: {
            id: 'hp1',
            name: 'Dr. Alice Brown',
            identificationNumber: 456789123
          }
        }],
        currentPage: 0,
        totalPages: 1,
        totalElements: 1
      };

      service.obtenerRegistrosPorCapa('layer1', 0, 10, 'registerDate', 'DESC')
        .subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/registers/allByResearchLayer?researchLayerId=layer1&page=0&size=10&sort=registerDate&sortDirection=DESC'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockResponse);
    });

    it('should handle HTTP error', (done) => {
      authServiceSpy.getToken.and.returnValue('test-token');

      service.obtenerRegistrosPorCapa('layer1').subscribe({
        error: (err) => {
          expect(err.message).toBe('Error al cargar registros');
          done();
        }
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/registers/allByResearchLayer?researchLayerId=layer1&page=0&size=10&sort=registerDate&sortDirection=DESC'
      );
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('obtenerCapaPorId', () => {
    it('should make GET request to fetch research layer by ID', () => {
      authServiceSpy.getToken.and.returnValue('test-token');
      const mockLayer: ResearchLayer = {
        id: '1',
        layerName: 'Test Layer',
        description: 'A test research layer',
        layerBoss: {
          id: 1,
          name: 'Dr. Bob Smith',
          identificationNumber: '123456789'
        }
      };

      service.obtenerCapaPorId('1').subscribe(response => {
        expect(response).toEqual(mockLayer);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/ResearchLayer?id=1');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockLayer);
    });

    it('should handle 403 error and trigger logout', (done) => {
      authServiceSpy.getToken.and.returnValue('test-token');
      authServiceSpy.logout.and.stub();

      service.obtenerCapaPorId('1').subscribe({
        error: (err) => {
          expect(err.message).toBe('No se encontró la capa con ID: 1');
          expect(authServiceSpy.logout).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/ResearchLayer?id=1');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle generic error', (done) => {
      authServiceSpy.getToken.and.returnValue('test-token');

      service.obtenerCapaPorId('1').subscribe({
        error: (err) => {
          expect(err.message).toBe('No se encontró la capa con ID: 1');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/ResearchLayer?id=1');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaInvestigadorService, ResearchLayerHistory } from '../consola-investigador.service';
import { AuthService } from 'src/app/services/auth.service';
import { Register, ResearchLayer } from '../../modules/consola-registro/interfaces';

describe('ConsolaInvestigadorService', () => {
  let service: ConsolaInvestigadorService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaInvestigadorService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ConsolaInvestigadorService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    authService.getToken.and.returnValue('test-token');
    localStorage.setItem('userRoles', JSON.stringify(['Doctor_client_role']));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('obtenerHistorialCapaInvestigacion', () => {
    it('should fetch research layer history', () => {
      const mockResponse = {
        data: [{
          id: '1',
          registerId: 'reg-1',
          changedBy: 'doctor@test.com',
          changedAt: '2024-01-15T10:30:00Z',
          operation: 'CREATE',
          patientIdentificationNumber: 123456789,
          isResearchLayerGroup: {
            researchLayerId: 'layer-1',
            researchLayerName: 'Test Layer',
            variables: [{
              id: 'var-1',
              name: 'Test Variable',
              type: 'STRING',
              valueAsString: 'Test Value',
              valueAsNumber: null
            }]
          },
          patientBasicInfo: {
            sex: 'M',
            educationLevel: 'University',
            economicStatus: 'Medium'
          }
        } as ResearchLayerHistory],
        currentPage: 0,
        totalPages: 1,
        totalElements: 1
      };

      service.obtenerHistorialCapaInvestigacion('layer-1', 'test@email.com', 0, 10)
        .subscribe(response => {
          expect(response.data.length).toBe(1);
          expect(response.data[0].id).toBe('1');
          expect(response.data[0].patientBasicInfo?.sex).toBe('M');
        });

      const req = httpMock.expectOne(req => 
        req.url.includes('/allResearchLayerHistoryById') &&
        req.params.get('researchLayerId') === 'layer-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('obtenerRegistroActual', () => {
    it('should fetch current patient register without caregiver', () => {
      const mockRegister: Register = {
        registerId: 'reg-1',
        patientIdentificationNumber: 123456789,
        patientIdentificationType: 'CC',
        registerDate: '2024-01-15T10:30:00Z',
        healthProfessional: {
          name: 'Dr. Test',
          email: 'doctor@test.com'
        },
        patientBasicInfo: {
          name: 'Test Patient',
          sex: 'M',
          birthDate: '1990-01-01',
          age: 34,
          email: 'patient@test.com',
          phoneNumber: '1234567890',
          economicStatus: 'Medium',
          educationLevel: 'University',
          maritalStatus: 'Single',
          hometown: 'Test Town',
          currentCity: 'Test City',
          firstCrisisDate: '2020-01-01',
          crisisStatus: 'Stable'
        }
        // caregiver is undefined (optional)
      };

      service.obtenerRegistroActual(123456789, 'layer-1')
        .subscribe(register => {
          expect(register.registerId).toBe('reg-1');
          expect(register.caregiver).toBeUndefined();
        });

      const req = httpMock.expectOne(req => 
        req.url.includes('/actualRegisterByPatient')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRegister);
    });

    it('should fetch current patient register with caregiver', () => {
      const mockRegister: Register = {
        registerId: 'reg-1',
        patientIdentificationNumber: 123456789,
        patientIdentificationType: 'CC',
        registerDate: '2024-01-15T10:30:00Z',
        healthProfessional: {
          name: 'Dr. Test',
          email: 'doctor@test.com'
        },
        patientBasicInfo: {
          name: 'Test Patient',
          sex: 'M',
          birthDate: '1990-01-01',
          age: 34,
          email: 'patient@test.com',
          phoneNumber: '1234567890',
          economicStatus: 'Medium',
          educationLevel: 'University',
          maritalStatus: 'Single',
          hometown: 'Test Town',
          currentCity: 'Test City',
          firstCrisisDate: '2020-01-01',
          crisisStatus: 'Stable'
        },
        caregiver: {
          name: 'Caregiver Name',
          identificationType: 'CC',
          identificationNumber: 987654321,
          age: 45,
          educationLevel: 'High School',
          occupation: 'Caregiver'
        }
      };

      service.obtenerRegistroActual(123456789, 'layer-1')
        .subscribe(register => {
          expect(register.registerId).toBe('reg-1');
          expect(register.caregiver?.name).toBe('Caregiver Name');
        });

      const req = httpMock.expectOne(req => 
        req.url.includes('/actualRegisterByPatient')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRegister);
    });
  });

  describe('obtenerRegistrosPorCapa', () => {
    it('should fetch registers by research layer', () => {
      const mockResponse = {
        registers: [{
          registerId: 'reg-1',
          patientIdentificationNumber: 123456789,
          patientIdentificationType: 'CC',
          registerDate: '2024-01-15T10:30:00Z',
          healthProfessional: {
            name: 'Dr. Test',
            email: 'doctor@test.com'
          },
          patientBasicInfo: {
            name: 'Test Patient',
            sex: 'M',
            birthDate: '1990-01-01',
            age: 34,
            email: 'patient@test.com',
            phoneNumber: '1234567890'
          }
        } as Register],
        currentPage: 0,
        totalPages: 1,
        totalElements: 1
      };

      service.obtenerRegistrosPorCapa('layer-1', 0, 10)
        .subscribe(response => {
          expect(response.registers.length).toBe(1);
          expect(response.registers[0].registerId).toBe('reg-1');
        });

      const req = httpMock.expectOne(req => 
        req.url.includes('/allByResearchLayer') &&
        req.params.get('researchLayerId') === 'layer-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('obtenerCapaPorId', () => {
    it('should fetch research layer by id', () => {
      const mockResearchLayer: ResearchLayer = {
        id: 'layer-1',
        researchLayerId: 'layer-1',
        layerName: 'Test Layer',
        description: 'Test Description',
        layerBoss: {
          id: 1,
          name: 'Layer Boss',
          identificationNumber: '123456789'
        }
      };

      service.obtenerCapaPorId('layer-1')
        .subscribe(layer => {
          expect(layer.id).toBe('layer-1');
          expect(layer.layerName).toBe('Test Layer');
        });

      const req = httpMock.expectOne(req => 
        req.url === service['API_RESEARCH_LAYER_URL'] &&
        req.params.get('id') === 'layer-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResearchLayer);
    });
  });

  // Safe property access in tests
  it('should safely access optional properties', () => {
    const historyItem: ResearchLayerHistory = {
      id: '1',
      registerId: 'reg-1',
      changedBy: 'test@email.com',
      changedAt: '2024-01-15T10:30:00Z',
      operation: 'UPDATE',
      patientIdentificationNumber: 123456789,
      isResearchLayerGroup: {
        researchLayerId: 'layer-1',
        researchLayerName: 'Test Layer',
        variables: []
      },
      patientBasicInfo: {
        sex: 'F',
        educationLevel: 'High School'
      }
    };

    // Safe access to optional properties
    const basicInfo = historyItem.patientBasicInfo;
    if (basicInfo) {
      expect(basicInfo.sex).toBe('F');
    }

    // Or use optional chaining
    expect(historyItem.patientBasicInfo?.sex).toBe('F');
    expect(historyItem.patientBasicInfo?.economicStatus).toBeUndefined();
  });

  describe('error handling', () => {
    it('should handle authentication errors', () => {
      spyOn(service['authService'], 'logout');

      service.obtenerRegistrosPorCapa('layer-1')
        .subscribe({
          error: (error) => {
            expect(error.code).toBe('AUTH_ERROR');
          }
        });

      const req = httpMock.expectOne(req => 
        req.url.includes('/allByResearchLayer')
      );
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle network errors', () => {
      service.obtenerRegistrosPorCapa('layer-1')
        .subscribe({
          error: (error) => {
            expect(error.code).toBe('NETWORK_ERROR');
          }
        });

      const req = httpMock.expectOne(req => 
        req.url.includes('/allByResearchLayer')
      );
      req.error(new ProgressEvent('Network error'));
    });
  });
});
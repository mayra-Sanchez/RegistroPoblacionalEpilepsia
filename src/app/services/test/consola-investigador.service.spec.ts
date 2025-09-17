import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaInvestigadorService } from '../consola-investigador.service';
import { AuthService } from 'src/app/services/auth.service';
import { Register, ResearchLayer } from '../../modules/consola-registro/interfaces';
import { environment } from '../../environments/environment';

describe('ConsolaInvestigadorService', () => {
  let service: ConsolaInvestigadorService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const API_URL = `${environment.backendUrl}${environment.endpoints.registers}`;
  const API_RESEARCH_LAYER_URL = `${environment.backendUrl}${environment.endpoints.researchLayer}`;

  // 🔹 Mock válido de Register
  const mockRegister: Register = {
    registerId: '1',
    registerDate: '2025-09-14',
    updateRegisterDate: '2025-09-14',
    updatedBy: 'tester',
    patientIdentificationNumber: 123,
    patientIdentificationType: 'CC',
    registerInfo: [
      {
        researchLayerId: 'layer1',
        researchLayerName: 'Capa 1',
        variablesInfo: [
          { variableId: 'v1', variableName: 'Edad', variableType: 'number', valueAsNumber: 30 }
        ]
      }
    ],
    variablesRegister: [
      {
        variableId: 'v1',
        variableName: 'Edad',
        value: 30,
        type: 'number',
        researchLayerId: 'layer1',
        researchLayerName: 'Capa 1'
      }
    ],
    patientBasicInfo: {
      name: 'Juan Pérez',
      sex: 'M',
      birthDate: '1990-01-01',
      age: 35,
      email: 'juan@test.com',
      phoneNumber: '3001234567',
      deathDate: null,
      economicStatus: 'medio',
      educationLevel: 'universitario',
      maritalStatus: 'soltero',
      hometown: 'Bogotá',
      currentCity: 'Cali',
      firstCrisisDate: '2000-01-01',
      crisisStatus: 'activo',
      hasCaregiver: false
    },
    caregiver: null,
    healthProfessional: { id: 'hp1', name: 'Dr. House', identificationNumber: 987654 }
  };

  // 🔹 Mock válido de ResearchLayer
  const mockCapa: ResearchLayer = {
    id: '1',
    researchLayerId: 'capa123',
    layerName: 'Capa Test',
    description: 'Descripción de capa',
    layerBoss: {
      id: 10,
      name: 'Dr. Boss',
      identificationNumber: '112233'
    }
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    authServiceSpy.getToken.and.returnValue('fake-jwt-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaInvestigadorService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ConsolaInvestigadorService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ---------- isDoctor ----------
  it('✅ Usuario con rol Doctor retorna true', () => {
    localStorage.setItem('userRoles', JSON.stringify(['Doctor_client_role']));
    const result = (service as any).isDoctor();
    expect(result).toBeTrue();
  });

  it('✅ Usuario sin rol Doctor retorna false', () => {
    localStorage.setItem('userRoles', JSON.stringify(['Researcher_client_role']));
    const result = (service as any).isDoctor();
    expect(result).toBeFalse();
  });

  // ---------- obtenerRegistrosPorCapa ----------
  it('✅ obtenerRegistrosPorCapa retorna registros (éxito)', () => {
    const mockResponse = {
      registers: [mockRegister],
      currentPage: 0,
      totalPages: 1,
      totalElements: 1
    };

    service.obtenerRegistrosPorCapa('layer1').subscribe(resp => {
      expect(resp.currentPage).toBe(0);
      expect(resp.totalPages).toBe(1);
      expect(resp.totalElements).toBe(1);
      expect(resp.registers[0].registerId).toBe('1');
      expect(resp.registers[0].patientBasicInfo.name).toBe('Juan Pérez');
    });

    const req = httpMock.expectOne(
      `${API_URL}/allByResearchLayer?researchLayerId=layer1&page=0&size=10&sort=registerDate&sortDirection=DESC`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('❌ obtenerRegistrosPorCapa lanza error 500', () => {
    service.obtenerRegistrosPorCapa('layer1').subscribe({
      next: () => fail('Debe fallar con 500'),
      error: (err) => {
        expect(err.message).toBe('Error al cargar registros');
      }
    });

    const req = httpMock.expectOne(
      `${API_URL}/allByResearchLayer?researchLayerId=layer1&page=0&size=10&sort=registerDate&sortDirection=DESC`
    );
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  // ---------- obtenerCapaPorId ----------
  it('✅ obtenerCapaPorId retorna capa y la guarda en localStorage', () => {
    service.obtenerCapaPorId('capa123').subscribe(resp => {
      expect(resp.researchLayerId).toBe('capa123');
      const stored = JSON.parse(localStorage.getItem('capaInvestigacion') || '{}');
      expect(stored.researchLayerId).toBe('capa123');
    });

    const req = httpMock.expectOne(`${API_RESEARCH_LAYER_URL}?id=capa123`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCapa);
  });

  it('❌ obtenerCapaPorId error 403 ejecuta logout y retorna error', () => {
    service.obtenerCapaPorId('capa123').subscribe({
      next: () => fail('Debe fallar con 403'),
      error: (err) => {
        expect(err.message).toBe('No se encontró la capa con ID: capa123');
        expect(authServiceSpy.logout).toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne(`${API_RESEARCH_LAYER_URL}?id=capa123`);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  it('❌ obtenerCapaPorId error distinto retorna error genérico', () => {
    service.obtenerCapaPorId('capa123').subscribe({
      next: () => fail('Debe fallar con error'),
      error: (err) => {
        expect(err.message).toBe('No se encontró la capa con ID: capa123');
      }
    });

    const req = httpMock.expectOne(`${API_RESEARCH_LAYER_URL}?id=capa123`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});

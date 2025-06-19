import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaRegistroService } from './consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import { of, throwError } from 'rxjs';
import { ResearchLayer, Variable, Register, UserResponse } from '../modules/consola-registro/interfaces';

describe('ConsolaRegistroService', () => {
  let service: ConsolaRegistroService;
  let httpMock: HttpTestingController;
  let authServiceMock: any;

  // Mock objects
  const mockUserResponse: UserResponse = {
    id: 'user1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    attributes: {
      role: ['Doctor_client_role'],
      researchLayerId: ['1'],
      identificationNumber: ['123456789'],
      identificationType: ['CC'],
      birthDate: ['1990-01-01']
    }
  };

  const mockResearchLayer: ResearchLayer = {
    id: '1',
    layerName: 'Capa 1',
    description: 'Descripción de capa 1',
    layerBoss: {
      id: 1,
      name: 'Jefe Capa',
      identificationNumber: '123456789'
    }
  };

  const mockVariable: Variable = {
    id: 'v1',
    researchLayerId: '1',
    variableName: 'Variable 1',
    description: 'Descripción de variable 1',
    type: 'string',
    hasOptions: false,
    isEnabled: true,
    options: [],
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  const mockRegister: Register = {
    registerId: 'reg1',
    registerDate: '2023-01-01',
    updateRegisterDate: null,
    patientIdentificationNumber: 123456789,
    patientIdentificationType: 'CC',
    variablesRegister: [],
    patientBasicInfo: {
      name: 'Paciente Test',
      sex: 'M',
      birthDate: '1990-01-01',
      age: 33,
      email: 'paciente@test.com',
      phoneNumber: '1234567890',
      deathDate: null,
      economicStatus: 'medio',
      educationLevel: 'universitario',
      maritalStatus: 'soltero',
      hometown: 'Bogotá',
      currentCity: 'Bogotá',
      firstCrisisDate: '2020-01-01',
      crisisStatus: 'activo',
      hasCaregiver: true
    },
    caregiver: {
      name: 'Cuidador Test',
      identificationType: 'CC',
      identificationNumber: 987654321,
      age: 45,
      educationLevel: 'universitario',
      occupation: 'Ingeniero'
    },
    healthProfessional: {
      id: 'doc1',
      name: 'Doctor Test',
      identificationNumber: 987654321
    }
  };

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getToken', 'getUserEmail']);
    authServiceMock.getToken.and.returnValue('fake-token');
    authServiceMock.getUserEmail.and.returnValue('test@example.com');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaRegistroService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(ConsolaRegistroService);
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'userRoles') {
        return JSON.stringify(['Doctor_client_role']);
      }
      return null;
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Métodos básicos', () => {
    it('debería crearse el servicio', () => {
      expect(service).toBeTruthy();
    });

    it('debería notificar cambios de datos', () => {
      spyOn(service['dataChanged'], 'next');
      service.notifyDataChanged();
      expect(service['dataChanged'].next).toHaveBeenCalled();
    });

    it('debería devolver observable de actualización de datos', () => {
      const observable = service.getDataUpdatedListener();
      expect(observable).toEqual(service['dataUpdated'].asObservable());
    });
  });

  describe('Métodos de autenticación', () => {
    it('debería obtener headers de autenticación', () => {
      const headers = service['getAuthHeaders']();
      expect(headers.get('Authorization')).toBe('Bearer fake-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('debería verificar si el usuario es doctor', () => {
      expect(service['isDoctor']()).toBeTrue();
      
      (localStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(['Other_role']));
      expect(service['isDoctor']()).toBeFalse();
    });
  });

  describe('Métodos de usuarios', () => {
    it('debería obtener usuario autenticado', () => {
      service.obtenerUsuarioAutenticado('test@example.com').subscribe(response => {
        expect(response).toEqual(mockUserResponse);
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/users' && 
        req.params.get('email') === 'test@example.com'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockUserResponse);
    });

    it('debería manejar error al obtener usuario sin token', () => {
      authServiceMock.getToken.and.returnValue(null);
      
      service.obtenerUsuarioAutenticado('test@example.com').subscribe({
        error: (err) => expect(err.message).toContain('No hay token disponible')
      });
    });
  });

  describe('Métodos de registros', () => {
    it('debería registrar un nuevo registro', () => {
      const registerData = { ...mockRegister };
      
      service.registrarRegistro(registerData, 'test@example.com').subscribe(response => {
        expect(response).toEqual(registerData);
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/registers' &&
        req.params.get('userEmail') === 'test@example.com'
      );
      expect(req.request.method).toBe('POST');
      req.flush(registerData);
    });

    it('debería obtener registros paginados', () => {
      const mockResponse = { 
        content: [mockRegister], 
        totalElements: 1,
        totalPages: 1,
        number: 0
      };
      
      service.obtenerRegistros().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/registers/all?page=0&size=10&sort=registerDate&sortDirection=DESC'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería obtener registros por profesional', () => {
      const mockResponse = { 
        content: [mockRegister], 
        totalElements: 1,
        totalPages: 1,
        number: 0
      };
      
      service.obtenerRegistrosPorProfesional(123).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/registers/allByHealtProfessional' &&
        req.params.get('healthProfesionalIdentificationNumber') === '123'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería obtener registros por paciente', () => {
      const mockResponse = { 
        content: [mockRegister], 
        totalElements: 1,
        totalPages: 1,
        number: 0
      };
      
      service.obtenerRegistrosPorPaciente(456).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/registers/allByPatient' &&
        req.params.get('patientIdentificationNumber') === '456'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería obtener registros por capa de investigación', () => {
      const mockResponse = { 
        registers: [mockRegister], 
        currentPage: 0, 
        totalPages: 1, 
        totalElements: 1 
      };
      
      service.obtenerRegistrosPorCapa('layer-123').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/registers/allByResearchLayer' &&
        req.params.get('researchLayerId') === 'layer-123'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería actualizar un registro', () => {
      const updatedData = { ...mockRegister };
      
      service.actualizarRegistro('123', updatedData).subscribe(response => {
        expect(response).toEqual(updatedData);
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/registers' &&
        req.params.get('registerId') === '123' &&
        req.params.get('userEmail') === 'test@example.com'
      );
      expect(req.request.method).toBe('PUT');
      req.flush(updatedData);
    });

    it('debería rechazar actualización si no es doctor', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(['Other_role']));
      
      service.actualizarRegistro('123', {}).subscribe({
        error: (err) => expect(err.message).toContain('Acceso denegado')
      });
    });

    it('debería manejar error 401 al actualizar registro', () => {
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      
      service.actualizarRegistro('123', {}).subscribe({
        error: (err) => expect(err.message).toContain('Sesión expirada')
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/registers' &&
        req.params.get('registerId') === '123' &&
        req.params.get('userEmail') === 'test@example.com'
      );
      req.flush(null, errorResponse);
    });

    it('debería manejar error 403 al actualizar registro', () => {
      const errorResponse = { status: 403, statusText: 'Forbidden' };
      
      service.actualizarRegistro('123', {}).subscribe({
        error: (err) => expect(err.message).toContain('No tiene permisos')
      });

      const req = httpMock.expectOne(req => 
        req.url === 'http://localhost:8080/api/v1/registers' &&
        req.params.get('registerId') === '123' &&
        req.params.get('userEmail') === 'test@example.com'
      );
      req.flush(null, errorResponse);
    });
  });

  describe('Métodos de capas de investigación', () => {
    it('debería obtener todas las capas', () => {
      const mockResponse = [mockResearchLayer];
      
      service.obtenerTodasLasCapas().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/ResearchLayer/GetAll'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería buscar capa por nombre', () => {
      const mockCapas = [mockResearchLayer];
      
      spyOn(service, 'obtenerTodasLasCapas').and.returnValue(of(mockCapas));
      
      service.buscarCapaPorNombre('capa 1').subscribe(response => {
        expect(response).toEqual(mockResearchLayer);
      });
    });

    it('debería manejar error cuando no encuentra capa por nombre', () => {
      spyOn(service, 'obtenerTodasLasCapas').and.returnValue(of([]));
      
      service.buscarCapaPorNombre('inexistente').subscribe({
        error: (err) => expect(err.message).toContain('No se encontró la capa')
      });
    });

    it('debería obtener capa completa por nombre', () => {
      const mockDetalles = { ...mockResearchLayer, additionalInfo: 'Extra info' };
      
      spyOn(service, 'buscarCapaPorNombre').and.returnValue(of(mockResearchLayer));
      spyOn(service as any, 'obtenerDetallesCapa').and.returnValue(of(mockDetalles));
      
      service.obtenerCapaCompleta('Capa 1').subscribe(response => {
        expect(response).toEqual(mockDetalles);
      });
    });

    it('debería obtener capa por ID', () => {
      service.obtenerCapaPorId('123').subscribe(response => {
        expect(response).toEqual(mockResearchLayer);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/ResearchLayer?id=123'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResearchLayer);
    });

    it('debería manejar error 404 al obtener detalles de capa', () => {
      const errorResponse = { status: 404, statusText: 'Not Found' };
      
      service['obtenerDetallesCapa']('999').subscribe({
        error: (err) => expect(err.message).toContain('No se encontró la capa')
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/ResearchLayer?id=999'
      );
      req.flush(null, errorResponse);
    });
  });

  describe('Métodos de variables', () => {
    it('debería obtener variables por capa', () => {
      const mockResponse = [mockVariable];
      
      service.obtenerVariablesPorCapa('layer-123').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/Variable/ResearchLayerId?researchLayerId=layer-123'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Métodos privados', () => {
    it('debería formatear datos de registro', () => {
      const testData = {
        patient: {
          birthDate: '2023-01-15',
          deathDate: '2023-12-31'
        }
      };
      
      const formatted = service['formatRegisterData'](testData);
      expect(formatted.patient.birthDate).toBe('15-01-2023');
      expect(formatted.patient.deathDate).toBe('31-12-2023');
    });

    it('debería formatear fecha para backend', () => {
      const dateStr = '2023-05-20';
      expect(service['formatDateToBackend'](dateStr)).toBe('20-05-2023');
    });
  });
});
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaRegistroService, ValidatePatientResponse } from './register.service';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';
import {
  RegisterRequest,
  RegisterResponse,
  BasicResponse,
  PaginatedResponse,
  RegisterHistoryResponse,
  ResearchLayer,
  Variable
} from '../modules/consola-registro/interfaces';
import { ErrorWithCode } from '../modules/consola-registro/interfaces';

describe('ConsolaRegistroService', () => {
  let service: ConsolaRegistroService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const API_URL = environment.backendUrl + environment.endpoints.registers;
  const API_LAYERS = environment.backendUrl + environment.endpoints.researchLayer;
  const API_VARIABLES = environment.backendUrl + environment.endpoints.variables;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'getUserEmail']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaRegistroService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ConsolaRegistroService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Mock default token, user email, and Doctor role
    authService.getToken.and.returnValue('mock-token');
    authService.getUserEmail.and.returnValue('doctor@gmail.com');
    localStorage.setItem('userRoles', JSON.stringify(['Doctor_client_role']));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // Mock data usando las interfaces correctas
  const mockRegisterRequest: RegisterRequest = {
    registerInfo: {
      researchLayerId: '68c61d99e02a181581d8a760',
      researchLayerName: 'capa de investigación1',
      variablesInfo: [
        {
          id: '68c63b50650e1f247d2f6a30',
          name: 'Variable prueba actualización',
          value: 30,
          type: 'Number'
        }
      ]
    },
    patientIdentificationNumber: 1109660212,
    patientIdentificationType: 'Cedula de ciudadania',
    patient: {
      name: 'NUEVO REGISTRO PRUEBA 2',
      sex: 'Masculino',
      birthDate: '1977-02-12',
      age: 67,
      email: 'pepito13@gmail.com',
      phoneNumber: '3128282071',
      deathDate: null,
      economicStatus: 'cinco',
      educationLevel: 'bachiller',
      maritalStatus: 'asd',
      hometown: 'asd',
      currentCity: 'ads',
      firstCrisisDate: 'ads',
      crisisStatus: 'asd'
    },
    caregiver: {
      name: 'nombre2',
      identificationType: 'aasd',
      identificationNumber: 1109887612,
      age: 0,
      educationLevel: 'sdasd',
      occupation: 'adasd'
    }
  };

  const mockRegisterResponse: RegisterResponse = {
    registerId: '67c4ea06d6080526486f0760',
    patientIdentificationNumber: 1109660212,
    patientIdentificationType: 'Cedula de ciudadania',
    registerInfo: [
      {
        researchLayerId: '68c61d99e02a181581d8a760',
        researchLayerName: 'capa de investigación1',
        variablesInfo: [
          {
            id: '68c63b50650e1f247d2f6a30',
            name: 'Variable prueba actualización',
            value: 30,
            type: 'Number'
          }
        ]
      }
    ],
    patient: {
      name: 'NUEVO REGISTRO PRUEBA 2',
      sex: 'Masculino',
      birthDate: '1977-02-12',
      age: 67,
      email: 'pepito13@gmail.com',
      phoneNumber: '3128282071',
      deathDate: null,
      economicStatus: 'cinco',
      educationLevel: 'bachiller',
      maritalStatus: 'asd',
      hometown: 'asd',
      currentCity: 'ads',
      firstCrisisDate: 'ads',
      crisisStatus: 'asd'
    },
    caregiver: {
      name: 'nombre2',
      identificationType: 'aasd',
      identificationNumber: 1109887612,
      age: 0,
      educationLevel: 'sdasd',
      occupation: 'adasd'
    }
  };

  const mockBasicResponse: BasicResponse = {
    success: true,
    message: 'Operación exitosa'
  };

  const mockResearchLayer: ResearchLayer = {
    id: '68c61d99e02a181581d8a760',
    researchLayerId: '68c61d99e02a181581d8a760',
    layerName: 'capa de investigación1',
    description: 'Descripción de la capa de investigación',
    layerBoss: {
      id: 1,
      name: 'Jefe de Capa',
      identificationNumber: '123456789'
    }
  };

  const mockVariable: Variable = {
    selectionType: 'SINGLE',
    id: '68c63b50650e1f247d2f6a30',
    researchLayerId: '68c61d99e02a181581d8a760',
    variableName: 'Variable prueba actualización',
    description: 'Descripción de la variable',
    type: 'Number',
    hasOptions: false,
    isEnabled: true,
    options: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('Métodos principales de registros', () => {

    it('debería crear un nuevo registro exitosamente', () => {
      // Set Doctor role in localStorage
      localStorage.setItem('userRoles', JSON.stringify(['Doctor_client_role']));

      service.saveRegister('doctor@gmail.com', mockRegisterRequest).subscribe(response => {
        expect(response).toEqual(mockRegisterResponse);
      });

      const req = httpMock.expectOne(`${API_URL}?userEmail=doctor@gmail.com`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterRequest);
      req.flush(mockRegisterResponse);
    });

    it('debería actualizar un registro existente', () => {
      const updatedRequest: RegisterRequest = {
        ...mockRegisterRequest,
        caregiver: {
          ...mockRegisterRequest.caregiver!,
          name: 'nombre2 actualizado'
        }
      };

      service.updateRegister('67c4ea06d6080526486f0760', 'doctor@gmail.com', updatedRequest).subscribe(response => {
        expect(response).toEqual(mockBasicResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url === API_URL &&
        req.method === 'PUT' &&
        req.params.get('registerId') === '67c4ea06d6080526486f0760' &&
        req.params.get('userEmail') === 'doctor@gmail.com'
      );
      expect(req.request.body).toEqual(updatedRequest);
      req.flush(mockBasicResponse);
    });

    it('debería eliminar un registro', () => {
      const registroId = '67c4ea06d6080526486f0760';

      service.deleteRegister(registroId).subscribe(response => {
        expect(response).toEqual(mockBasicResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url === API_URL &&
        req.method === 'DELETE' &&
        req.params.get('registerId') === registroId
      );
      req.flush(mockBasicResponse);
    });

    it('debería manejar error cuando no hay rol de Doctor al crear registro', () => {
      // Simular que el usuario no tiene rol de Doctor modificando localStorage
      localStorage.setItem('userRoles', JSON.stringify(['Researcher_client_role'])); // Rol que no es Doctor

      service.saveRegister('doctor@gmail.com', mockRegisterRequest).subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('Solo los usuarios con rol de Doctor pueden crear registros');
          expect(error.code).toBe('PERMISSION_DENIED');
          expect(error.status).toBe(403);
        }
      });
    });
  });

  describe('Métodos de consulta de registros', () => {

    it('debería obtener información actual del paciente', () => {
      const patientIdentificationNumber = 66789098;
      const researchLayerId = '688697340a120220197c1a46';

      const mockResponse = {
        registerId: '68c8addba3fe051fe1008e46',
        patientIdentificationNumber: 66999436,
        patientIdentificationType: 'Cedula de ciudadania',
        registerInfo: [
          {
            researchLayerId: '688697340a120220197c1a46',
            researchLayerName: 'capa-test7',
            variablesInfo: [
              {
                variableId: '68c63246ea7bd007c17c81b0',
                variableName: 'Variable new test24',
                variableType: 'Number',
                valueAsString: null,
                valueAsNumber: 40.0
              }
            ]
          }
        ],
        patientBasicInfo: {
          name: 'NUEVO REGISTRO PRUEBA 2',
          sex: 'Masculino',
          birthDate: null,
          age: 67,
          email: 'pepito13@gmail.com',
          phoneNumber: '3128282071',
          deathDate: null,
          economicStatus: 'seis',
          educationLevel: 'bachiller',
          maritalStatus: 'asd',
          hometown: 'asd',
          currentCity: 'ads',
          firstCrisisDate: 'ads',
          crisisStatus: 'asd'
        },
        caregiver: {
          name: 'nombre2',
          identificationType: 'aasd',
          identificationNumber: 1109887612,
          age: 0,
          educationLevel: 'sdasd',
          occupation: 'adasd'
        }
      };

      service.getActualRegisterByPatient(patientIdentificationNumber, researchLayerId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${API_URL}/actualRegisterByPatient?patientIdentificationNumber=${patientIdentificationNumber}&researchLayerId=${researchLayerId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería obtener historial de cambios de cuidador', () => {
      const patientIdentificationNumber = 1109776512;
      const pagination = {
        page: 0,
        size: 1,
        sort: 'registerDate',
        sortDirection: 'ASC' as 'ASC' | 'DESC'
      };

      // CORRECCIÓN: Usar la estructura correcta de PaginatedResponse según tus interfaces
      const mockResponse: PaginatedResponse = {
        data: [
          {
            id: '68c8addba3fe051fe1008e47',
            registerId: '68c8addba3fe051fe1008e46',
            changedBy: 'superadmin3@gmail.com',
            changedAt: '2025-09-16T00:22:51.975585703',
            operation: 'REGISTER_CREATED_SUCCESSFULL',
            patientIdentificationNumber: 66999436,
            isCaregiverInfo: {
              name: 'nombre1',
              identificationType: 'aasd',
              identificationNumber: 1109887612,
              age: 0,
              educationLevel: 'sdasd',
              occupation: 'adasd'
            }
          }
        ],
        totalElements: 2,
        totalPages: 1,
        currentPage: 0
      };

      service.getCaregiverRegisters(patientIdentificationNumber, pagination).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url === `${API_URL}/allCarevigerRegisters` &&
        req.params.get('patientIdentificationNumber') === patientIdentificationNumber.toString()
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería obtener historial de información básica del paciente', () => {
      const patientIdentificationNumber = 1109776512;
      const pagination = {
        page: 0,
        size: 1,
        sort: 'registerDate',
        sortDirection: 'ASC' as 'ASC' | 'DESC'
      };

      // CORRECCIÓN: Usar la estructura correcta de PaginatedResponse según tus interfaces
      const mockResponse: PaginatedResponse = {
        data: [
          {
            id: '68c8addba3fe051fe1008e47',
            registerId: '68c8addba3fe051fe1008e46',
            changedBy: 'superadmin3@gmail.com',
            changedAt: '2025-09-16T00:22:51.975585703',
            operation: 'REGISTER_CREATED_SUCCESSFULL',
            patientIdentificationNumber: 66999436,
            isPatientBasicInfo: {
              name: 'NUEVO REGISTRO PRUEBA 2',
              sex: 'Masculino',
              birthDate: null,
              age: 67,
              email: 'pepito13@gmail.com',
              phoneNumber: '3128282071',
              deathDate: null,
              economicStatus: 'cinco',
              educationLevel: 'bachiller',
              maritalStatus: 'asd',
              hometown: 'asd',
              currentCity: 'ads',
              firstCrisisDate: 'ads',
              crisisStatus: 'asd'
            }
          }
        ],
        totalElements: 2,
        totalPages: 1,
        currentPage: 0
      };

      service.getPatientBasicInfoRegisters(patientIdentificationNumber, pagination).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url === `${API_URL}/allPatientBasicInfoRegisters` &&
        req.params.get('patientIdentificationNumber') === patientIdentificationNumber.toString()
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Métodos de historial de investigación', () => {

    it('debería obtener historial completo de capa de investigación', () => {
      const researchLayerId = '688697340a120220197c1a46';
      const userEmail = 'superadmin@gmail.com';
      const page = 0;
      const size = 1;
      const sort = 'registerDate';
      const sortDirection = 'ASC';

      const mockResponse: RegisterHistoryResponse = {
        data: [
          {
            id: '68c8ac7ba3fe051fe1008e45',
            registerId: '68c8ac7ba3fe051fe1008e44',
            changedBy: 'superadmin@gmail.com',
            changedAt: '2025-09-16T00:16:59.499244897',
            operation: 'REGISTER_CREATED_SUCCESSFULL',
            patientIdentificationNumber: 1109660212,
            isResearchLayerGroup: {
              researchLayerId: '688697340a120220197c1a46',
              researchLayerName: 'capa-test7',
              variables: [
                {
                  id: '68916265a60b5572909330ad',
                  name: 'Variable new test2',
                  type: 'Number',
                  valueAsString: null,
                  valueAsNumber: 20.0
                }
              ]
            }
          }
        ],
        currentPage: 0,
        totalPages: 1,
        totalElements: 4
      };

      service.getRegisterHistory(researchLayerId, userEmail, page, size, sort, sortDirection)
        .subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(
        `${API_URL}/allResearchLayerHistoryById?researchLayerId=${researchLayerId}&userEmail=${userEmail}&page=${page}&size=${size}&sort=${sort}&sortDirection=${sortDirection}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería validar si un paciente existe', () => {
      const researchLayerId = '688697340a120220197c1a46';
      const patientIdentificationNumber = 345677885;

      const mockResponse: ValidatePatientResponse = {
        action: 'patient_already_exist_in_layer',
        registerId: '68d356b7e36e5b34324e317a',
        patientIdentificationNumber: 345677885,
        patientIdentificationType: 'Cedula de ciudadania',
        registerInfo: [
          {
            researchLayerId: '688697340a120220197c1a46',
            researchLayerName: 'capa-test7',
            variablesInfo: [
              {
                variableId: '68c63246ea7bd007c17c81b0',
                variableName: 'Variable new test24',
                variableType: 'Number',
                valueAsString: null,
                valueAsNumber: 22.0
              }
            ]
          }
        ],
        patientBasicInfo: {
          name: 'NUEVO REGISTRO PRUEBA 2',
          sex: 'Masculino',
          birthDate: '1977-02-12',
          age: 67,
          email: 'pepito13@gmail.com',
          phoneNumber: '3128282071',
          deathDate: null,
          economicStatus: 'cinco',
          educationLevel: 'bachiller',
          maritalStatus: 'asd',
          hometown: 'asd',
          currentCity: 'ads',
          firstCrisisDate: 'ads',
          crisisStatus: 'asd'
        },
        caregiver: {
          name: 'nombre1',
          identificationType: 'aasd',
          identificationNumber: 1109887612,
          age: 0,
          educationLevel: 'sdasd',
          occupation: 'adasd'
        }
      };

      service.validarPaciente(patientIdentificationNumber, researchLayerId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url === `${API_URL}/validatePatient` &&
        req.params.get('researchLayerId') === researchLayerId &&
        req.params.get('userEmail') === 'doctor@gmail.com' &&
        req.params.get('patientIdentificationNumber') === patientIdentificationNumber.toString()
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Métodos de capas de investigación y variables', () => {

    it('debería obtener capa por ID exitosamente', () => {
      const layerId = '68c61d99e02a181581d8a760';

      service.obtenerCapaPorId(layerId).subscribe(layer => {
        expect(layer).toEqual(mockResearchLayer);
        // Verificar que se guardó en localStorage
        const storedLayer = localStorage.getItem('capaInvestigacion');
        expect(storedLayer).toBeTruthy();
        if (storedLayer) {
          expect(JSON.parse(storedLayer)).toEqual(mockResearchLayer);
        }
      });

      const req = httpMock.expectOne(`${API_LAYERS}?id=${layerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResearchLayer);
    });

    it('debería manejar error al obtener capa con ID inválido', () => {
      const invalidLayerId = '';

      service.obtenerCapaPorId(invalidLayerId).subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('Layer ID is required and must be valid');
        }
      });
    });

    it('debería obtener variables por capa', () => {
      const researchLayerId = '68c61d99e02a181581d8a760';
      const mockVariables: Variable[] = [mockVariable];

      service.obtenerVariablesPorCapa(researchLayerId).subscribe(variables => {
        expect(variables).toEqual(mockVariables);
      });

      const req = httpMock.expectOne(
        `${API_VARIABLES}/ResearchLayerId?researchLayerId=${researchLayerId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockVariables);
    });

    it('debería manejar error al obtener variables sin researchLayerId', () => {
      service.obtenerVariablesPorCapa('').subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('Research layer ID is required');
        }
      });
    });
  });

  describe('Métodos de compatibilidad y utilidad', () => {

    it('debería usar método de compatibilidad para historial de cuidador', () => {
      const patientIdentificationNumber = 1109776512;

      // CORRECCIÓN: Usar la estructura correcta de PaginatedResponse
      const mockResponse: PaginatedResponse = {
        data: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0
      };

      service.obtenerHistorialCuidador(patientIdentificationNumber).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url === `${API_URL}/allCarevigerRegisters` &&
        req.params.get('patientIdentificationNumber') === patientIdentificationNumber.toString()
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería notificar cambios de datos', (done) => {
      service.dataChanged$.subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      service.notifyDataChanged();
    });

    it('debería obtener token del localStorage', () => {
      localStorage.setItem('kc_token', 'test-token');
      const token = service.getToken();
      expect(token).toBe('test-token');
    });
  });

  describe('Manejo de errores', () => {

    it('debería manejar error 404 al eliminar registro inexistente', () => {
      const registroId = 'id-inexistente';

      service.deleteRegister(registroId).subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(req =>
        req.url === API_URL &&
        req.method === 'DELETE' &&
        req.params.get('registerId') === registroId
      );
      req.flush('Registro no encontrado', { status: 404, statusText: 'Not Found' });
    });

    it('debería manejar error 400 al crear registro con datos inválidos', () => {
      // Set Doctor role in localStorage
      localStorage.setItem('userRoles', JSON.stringify(['Doctor_client_role']));

      const invalidRequest: RegisterRequest = {
        ...mockRegisterRequest,
        patientIdentificationNumber: null as any
      };

      service.saveRegister('doctor@gmail.com', invalidRequest).subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}?userEmail=doctor@gmail.com`);
      expect(req.request.method).toBe('POST');
      req.flush('Datos inválidos', { status: 400, statusText: 'Bad Request' });
    });

    it('debería manejar error de validación cuando falta patientIdentificationNumber', () => {
      service.validarPaciente(null as any, 'researchLayerId').subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('Patient identification number is required');
        }
      });
    });

    it('debería manejar error de autenticación cuando no hay token', () => {
      authService.getToken.and.returnValue(null);

      try {
        service.saveRegister('doctor@gmail.com', mockRegisterRequest).subscribe({
          next: () => fail('debería haber fallado'),
          error: (error: ErrorWithCode) => {
            expect(error.message).toBe('No authentication token available');
          }
        });
      } catch (error: any) {
        expect(error.message).toBe('No authentication token available');
      }
    });

    it('debería manejar error de red', () => {
      service.obtenerCapaPorId('valid-id').subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.code).toBe('NETWORK_ERROR');
          expect(error.message).toContain('Network error');
        }
      });

      const req = httpMock.expectOne(`${API_LAYERS}?id=valid-id`);
      req.error(new ProgressEvent('Network error'), { status: 0 });
    });

    it('debería manejar error 401 de autenticación', () => {
      service.obtenerCapaPorId('valid-id').subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.code).toBe('AUTH_ERROR');
          expect(error.status).toBe(401);
          expect(error.message).toContain('Session expired');
        }
      });

      const req = httpMock.expectOne(`${API_LAYERS}?id=valid-id`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('debería manejar error 403 de permisos', () => {
      service.obtenerCapaPorId('valid-id').subscribe({
        next: () => fail('debería haber fallado'),
        error: (error) => {
          expect(error.code).toBe('PERMISSION_ERROR');
          expect(error.status).toBe(403);
          expect(error.message).toContain('You do not have permission');
        }
      });

      const req = httpMock.expectOne(`${API_LAYERS}?id=valid-id`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
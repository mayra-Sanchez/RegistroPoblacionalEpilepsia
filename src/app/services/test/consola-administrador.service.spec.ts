import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaAdministradorService } from '../consola-administrador.service';
import { AuthService } from './../auth.service';
import { environment } from '../../environments/environment';

describe('ConsolaAdministradorService', () => {
  let service: ConsolaAdministradorService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockToken = 'fake-jwt-token';
  const API_LAYERS = `${environment.backendUrl}${environment.endpoints.researchLayer}`;
  const API_USERS = `${environment.backendUrl}${environment.endpoints.users}`;
  const API_VARIABLES = `${environment.backendUrl}${environment.endpoints.variables}`;
  const API_REGISTERS = `${environment.backendUrl}${environment.endpoints.registers}`;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'logout',
      'isLoggedIn'
    ]);

    authServiceSpy.getToken.and.returnValue(mockToken);
    authServiceSpy.isLoggedIn.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaAdministradorService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ConsolaAdministradorService);
    httpMock = TestBed.inject(HttpTestingController);

    // Forzar que isAdmin siempre sea true en las pruebas
    spyOn<any>(service, 'isAdmin').and.returnValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ==================== PRUEBAS PARA CAPAS ====================

  describe('Métodos para Capas', () => {
    it('✅ getAllLayers retorna array de capas', () => {
      const mockCapas = [{ id: '1', layerName: 'Capa Test' }];

      service.getAllLayers().subscribe((capas) => {
        expect(capas).toEqual(mockCapas);
      });

      const req = httpMock.expectOne(`${API_LAYERS}/GetAll`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockCapas);
    });

    it('✅ getLayerById retorna capa específica', () => {
      const mockCapa = { id: '1', layerName: 'Capa Test' };
      const layerId = '1';

      service.getLayerById(layerId).subscribe((capa) => {
        expect(capa).toEqual(mockCapa);
      });

      const req = httpMock.expectOne(`${API_LAYERS}?id=${layerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCapa);
    });

    it('✅ registrarCapa crea nueva capa exitosamente', () => {
      const nuevaCapa = { layerName: 'Nueva Capa', description: 'Descripción' };
      const mockResponse = { id: '123', ...nuevaCapa };

      service.registrarCapa(nuevaCapa).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_LAYERS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(nuevaCapa);
      req.flush(mockResponse);
    });

    it('✅ actualizarCapa actualiza capa existente', () => {
      const capaId = '1';
      const datosActualizados = { layerName: 'Capa Actualizada' };
      const mockResponse = { message: 'Capa actualizada' };

      service.actualizarCapa(capaId, datosActualizados).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_LAYERS}?researchLayerId=${capaId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(datosActualizados);
      req.flush(mockResponse);
    });

    it('✅ eliminarCapa elimina capa correctamente', () => {
      const capaId = '1';
      const mockResponse = { message: 'Capa eliminada' };

      service.eliminarCapa(capaId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_LAYERS}?researchLayerId=${capaId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  // ==================== PRUEBAS PARA USUARIOS ====================

  describe('Métodos para Usuarios', () => {
    it('✅ getAllUsuarios retorna array de usuarios', () => {
      const mockUsuarios = [{ id: '1', nombre: 'Usuario Test' }];

      service.getAllUsuarios().subscribe((usuarios) => {
        expect(usuarios).toEqual(mockUsuarios);
      });

      const req = httpMock.expectOne(`${API_USERS}/GetAll`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsuarios);
    });

    it('✅ crearUsuario crea nuevo usuario exitosamente', () => {
      const nuevoUsuario = { 
        firstName: 'Juan', 
        lastName: 'Pérez', 
        email: 'juan@test.com',
        username: 'juanperez',
        password: 'password123',
        identificationType: 'CC',
        identificationNumber: '123456789',
        birthDate: '1990-01-01',
        researchLayer: '1',
        role: 'Doctor_client_role',
        acceptTermsAndConditions: true
      };
      const mockResponse = { id: '123', ...nuevoUsuario };

      service.crearUsuario(nuevoUsuario).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_USERS}/create`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('✅ updateUsuario actualiza usuario existente', () => {
      const userId = '1';
      const usuarioActualizado = {
        firstName: 'Juan Actualizado',
        lastName: 'Pérez',
        email: 'juan@test.com',
        username: 'juanperez',
        identificationType: 'CC',
        identificationNumber: '123456789',
        birthDate: '1990-01-01',
        researchLayer: '1',
        role: 'Doctor_client_role',
        acceptTermsAndConditions: true
      };
      const mockResponse = { ...usuarioActualizado, id: userId };

      service.updateUsuario(userId, usuarioActualizado).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_USERS}/update?userId=${userId}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('✅ eliminarUsuario elimina usuario correctamente', () => {
      const userId = '1';
      const mockResponse = { message: 'Usuario eliminado' };

      service.eliminarUsuario(userId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_USERS}/delete?userId=${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('✅ enableUser habilita usuario correctamente', () => {
      const userId = '1';
      const mockResponse = { message: 'Usuario habilitado' };

      service.enableUser(userId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_USERS}/enabledUser?userId=${userId}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('✅ disableUser deshabilita usuario correctamente', () => {
      const userId = '1';
      const mockResponse = { message: 'Usuario deshabilitado' };

      service.disableUser(userId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_USERS}/disableUser?userId=${userId}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  // ==================== PRUEBAS PARA VARIABLES ====================

  describe('Métodos para Variables', () => {
    it('✅ getAllVariables retorna array de variables', () => {
      const mockVariables = [{ id: '1', variableName: 'Variable Test' }];

      service.getAllVariables().subscribe((variables) => {
        expect(variables).toEqual(mockVariables);
      });

      const req = httpMock.expectOne(`${API_VARIABLES}/GetAll`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVariables);
    });

    it('✅ crearVariable crea nueva variable exitosamente', () => {
      const nuevaVariable = { 
        variableName: 'Nueva Variable',
        description: 'Descripción',
        researchLayerId: '1',
        type: 'Number'
      };
      const mockResponse = { id: '123', ...nuevaVariable };

      service.crearVariable(nuevaVariable).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_VARIABLES);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(nuevaVariable);
      req.flush(mockResponse);
    });

    it('✅ eliminarVariable elimina variable correctamente', () => {
      const variableId = '1';
      const mockResponse = { message: 'Variable eliminada' };

      service.eliminarVariable(variableId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_VARIABLES}?variableId=${variableId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('✅ actualizarVariable actualiza variable existente', () => {
      const variableId = '1';
      const variableActualizada = {
        id: variableId,
        variableName: 'Variable Actualizada',
        description: 'Descripción actualizada',
        researchLayerId: '1',
        type: 'Number',
        options: []
      };
      const mockResponse = { message: 'Variable actualizada' };

      service.actualizarVariable(variableActualizada).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_VARIABLES}?variableId=${variableId}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('✅ obtenerVariablesPorCapa retorna variables de capa específica', () => {
      const capaId = '1';
      const mockVariables = [{ id: '1', variableName: 'Variable 1', researchLayerId: capaId }];

      service.obtenerVariablesPorCapa(capaId).subscribe((variables) => {
        expect(variables).toEqual(mockVariables);
      });

      const req = httpMock.expectOne(`${API_VARIABLES}/ResearchLayerId?researchLayerId=${capaId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVariables);
    });

    it('✅ getVariableById retorna variable específica', () => {
      const variableId = '1';
      const mockVariable = { id: variableId, variableName: 'Variable Test' };

      service.getVariableById(variableId).subscribe((variable) => {
        expect(variable).toEqual(mockVariable);
      });

      const req = httpMock.expectOne(`${API_VARIABLES}?id=${variableId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVariable);
    });
  });

  // ==================== PRUEBAS PARA REGISTROS ====================

  describe('Métodos para Registros', () => {
    it('✅ getRegistrosCapas retorna registros paginados', () => {
      const mockResponse = {
        content: [{ registerId: '1', patientIdentificationNumber: 123456789 }],
        totalElements: 1,
        totalPages: 1
      };

      service.getRegistrosCapas(0, 10, 'registerDate', 'DESC').subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req => 
        req.url === API_REGISTERS && 
        req.params.get('page') === '0' &&
        req.params.get('size') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('✅ deleteRegistroCapa elimina registro correctamente', () => {
      const registerId = '1';
      const mockResponse = { message: 'Registro eliminado' };

      service.deleteRegistroCapa(registerId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req => 
        req.url === API_REGISTERS && 
        req.params.get('registerId') === registerId
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('✅ getRegisterHistory retorna historial de registros', () => {
      const researchLayerId = '1';
      const userEmail = 'test@email.com';
      const mockResponse = {
        data: [{
          id: '1',
          registerId: 'reg-1',
          changedBy: 'user@test.com',
          changedAt: '2024-01-15T10:30:00Z',
          operation: 'CREATE',
          patientIdentificationNumber: 123456789,
          isResearchLayerGroup: {
            researchLayerId: researchLayerId,
            researchLayerName: 'Capa Test',
            variables: []
          }
        }],
        totalElements: 1,
        totalPages: 1
      };

      service.getRegisterHistory(researchLayerId, userEmail, 0, 10, 'changedAt', 'DESC')
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(req => 
        req.url === `${API_REGISTERS}/allResearchLayerHistoryById` &&
        req.params.get('researchLayerId') === researchLayerId &&
        req.params.get('userEmail') === userEmail
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('✅ downloadAllDocuments descarga archivo correctamente', () => {
      const mockBlob = new Blob(['test content'], { type: 'application/zip' });

      service.downloadAllDocuments().subscribe((blob) => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${environment.backendUrl}/documents/download/all`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  // ==================== PRUEBAS DE NOTIFICACIONES ====================

  describe('Notificaciones', () => {
    it('✅ notifyDataUpdated emite notificaciones', (done) => {
      service.capaUpdated$.subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      service.notifyDataUpdated();
    });

    it('✅ getDataUpdatedListener retorna observable', () => {
      const listener = service.getDataUpdatedListener();
      expect(listener).toBeTruthy();
      expect(typeof listener.subscribe).toBe('function');
    });
  });

  // ==================== PRUEBAS DE MANEJO DE ERRORES ====================

  describe('Manejo de Errores', () => {
    it('✅ maneja error 401 de autenticación', () => {
      service.getAllLayers().subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('Carga de capas fallida');
        }
      });

      const req = httpMock.expectOne(`${API_LAYERS}/GetAll`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('✅ maneja error 500 del servidor', () => {
      service.getAllUsuarios().subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('Carga de usuarios fallida');
        }
      });

      const req = httpMock.expectOne(`${API_USERS}/GetAll`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('✅ maneja error de red', () => {
      service.getAllVariables().subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('Carga de variables fallida');
        }
      });

      const req = httpMock.expectOne(`${API_VARIABLES}/GetAll`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  // ==================== PRUEBAS DE VALIDACIÓN ====================

  describe('Validaciones', () => {
    it('✅ obtenerVariablesPorCapa valida capaId vacío', () => {
      service.obtenerVariablesPorCapa('').subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toContain('ID de capa no válido');
        }
      });
    });

    it('✅ valida token no disponible', () => {
      authServiceSpy.getToken.and.returnValue(null);

      expect(() => service.getAllLayers()).toThrowError('Sesión expirada');
    });
  });
});
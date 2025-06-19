import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaAdministradorService } from '../../../services/consola-administrador.service';
import { AuthService } from 'src/app/services/auth.service';
import { throwError, of } from 'rxjs';

describe('ConsolaAdministradorService', () => {
  let service: ConsolaAdministradorService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: any;

  // Mock data
  const mockLayers = [
    { id: 1, nombreCapa: 'Capa 1', descripcion: 'Descripción de la capa 1' },
    { id: 2, nombreCapa: 'Capa 2', descripcion: 'Descripción de la capa 2' }
  ];

  const mockVariables = [
    { id: 1, nombreVariable: 'Variable 1', tipo: 'Tipo 1' },
    { id: 2, nombreVariable: 'Variable 2', tipo: 'Tipo 2' }
  ];

  const mockUsers = [
    { id: '1', username: 'admin', email: 'admin@test.com' }
  ];

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getToken', 'isLoggedIn', 'logout']);
    authServiceMock.getToken.and.returnValue('mock-token');
    authServiceMock.isLoggedIn.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaAdministradorService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(ConsolaAdministradorService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /* -------------------- Pruebas para Capas -------------------- */
  describe('Capas de Investigación', () => {
    it('debería obtener todas las capas', () => {
      service.getAllLayers().subscribe(layers => {
        expect(layers).toEqual(mockLayers);
      });

      const req = httpTestingController.expectOne('http://localhost:8080/api/v1/ResearchLayer/GetAll');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush(mockLayers);
    });

    it('debería manejar error 403 al obtener capas', () => {
      service.getAllLayers().subscribe({
        next: () => fail('Se esperaba un error'),
        error: (error) => {
          expect(error.status).toBe(403);
          expect(authServiceMock.logout).toHaveBeenCalled();
        }
      });

      const req = httpTestingController.expectOne('http://localhost:8080/api/v1/ResearchLayer/GetAll');
      req.flush(null, { status: 403, statusText: 'Forbidden' });
    });

    it('debería registrar una nueva capa', () => {
      const newLayer = { nombreCapa: 'Nueva Capa', descripcion: 'Descripción' };

      service.registrarCapa(newLayer).subscribe(response => {
        expect(response.id).toBeDefined();
      });

      const req = httpTestingController.expectOne('http://localhost:8080/api/v1/ResearchLayer');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 3, ...newLayer });
    });
  });

  /* -------------------- Pruebas para Variables -------------------- */
  describe('Variables de Investigación', () => {
    it('debería obtener todas las variables', () => {
      service.getAllVariables().subscribe(variables => {
        expect(variables).toEqual(mockVariables);
      });

      const req = httpTestingController.expectOne('http://localhost:8080/api/v1/Variable/GetAll');
      expect(req.request.method).toBe('GET');
      req.flush(mockVariables);
    });

    it('debería crear una nueva variable', () => {
      const newVar = { nombreVariable: 'Nueva Variable', tipo: 'Tipo 3' };

      service.crearVariable(newVar).subscribe(response => {
        expect(response.id).toBeDefined();
      });

      const req = httpTestingController.expectOne('http://localhost:8080/api/v1/Variable');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 3, ...newVar });
    });
  });

  /* -------------------- Pruebas para Usuarios -------------------- */
  describe('Gestión de Usuarios', () => {
    beforeEach(() => {
      // Mock para simular que es admin
      spyOn(service as any, 'isAdmin').and.returnValue(true);
    });

    it('debería obtener todos los usuarios', () => {
      service.getAllUsuarios().subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpTestingController.expectOne('http://localhost:8080/api/v1/users/GetAll');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('debería rechazar obtener usuarios si no es admin', () => {
      (service as any).isAdmin.and.returnValue(false);

      service.getAllUsuarios().subscribe({
        next: () => fail('Se esperaba un error'),
        error: (error) => {
          expect(error.message).toContain('Acceso denegado');
        }
      });

      httpTestingController.expectNone('http://localhost:8080/api/v1/users/GetAll');
    });
  });

  /* -------------------- Pruebas para Notificaciones -------------------- */
  describe('Sistema de Notificaciones', () => {
    it('debería emitir notificación al registrar capa', () => {
      const spy = jasmine.createSpy();
      service.capaUpdated$.subscribe(spy);

      service.registrarCapa(mockLayers[0]).subscribe();

      const req = httpTestingController.expectOne('http://localhost:8080/api/v1/ResearchLayer');
      req.flush({ id: 1 });
      
      expect(spy).toHaveBeenCalled();
    });
  });

  /* -------------------- Pruebas para Manejo de Errores -------------------- */
  describe('Manejo de Errores', () => {
    it('debería manejar error 401 (no autenticado)', () => {
      authServiceMock.isLoggedIn.and.returnValue(false);

      service.getAllLayers().subscribe({
        next: () => fail('Se esperaba un error'),
        error: (error) => {
          expect(error.message).toContain('no autenticado');
        }
      });

      httpTestingController.expectNone('http://localhost:8080/api/v1/ResearchLayer/GetAll');
    });
  });
});
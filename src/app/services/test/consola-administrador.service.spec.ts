// src/app/services/consola-administrador.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaAdministradorService } from '../consola-administrador.service';
import { AuthService } from '../auth.service';

describe('ConsolaAdministradorService', () => {
  let service: ConsolaAdministradorService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockToken = 'fake-jwt-token';

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

    // 🔥 Forzamos que isAdmin siempre sea true en las pruebas
    spyOn<any>(service, 'isAdmin').and.returnValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('✅ getAllUsuarios retorna array de usuarios', () => {
    const mockUsuarios = [{ id: 1, nombre: 'Juan' }];

    service.getAllUsuarios().subscribe((usuarios) => {
      expect(usuarios).toEqual(mockUsuarios);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/users/GetAll');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush(mockUsuarios);
  });

  it('✅ crearUsuario devuelve usuario creado con ID', () => {
    const mockUsuario = { nombre: 'Nuevo' };
    const mockResponse = { id: 123, nombre: 'Nuevo' };

    service.crearUsuario(mockUsuario).subscribe((usuario) => {
      expect(usuario).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/users/create');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush(mockResponse);
  });

  it('✅ updateUsuario devuelve usuario actualizado', () => {
    const userId = '1';
    const usuario = { firstName: 'Pedro', lastName: 'Lopez', email: 'p@mail.com' };
    const mockResponse = { ...usuario, id: 1 };

    service.updateUsuario(userId, usuario).subscribe((resp) => {
      expect(resp).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/users/update?userId=${userId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush(mockResponse);
  });

  it('✅ eliminarUsuario retorna confirmación', () => {
    const userId = '1';
    const mockResponse = { status: 204 };

    service.eliminarUsuario(userId).subscribe((resp) => {
      expect(resp).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/users/delete?userId=${userId}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush(mockResponse);
  });

  it('✅ getAllUsuarios retorna error 500 controlado', () => {
    service.getAllUsuarios().subscribe({
      next: () => fail('Debió fallar con error 500'),
      error: (error) => {
        expect(error.message).toContain('Carga de usuarios fallida');
      },
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/users/GetAll');
    req.flush('Error interno', { status: 500, statusText: 'Internal Server Error' });
  });
});

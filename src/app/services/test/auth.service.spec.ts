import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // limpiar localStorage antes de cada prueba
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- LOGIN ---
  it('✅ Login con credenciales válidas retorna token mockeado', (done) => {
    const mockResponse = {
      access_token: 'mockAccessToken',
      refresh_token: 'mockRefreshToken'
    };

    service.login('test@test.com', '123456').subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(localStorage.getItem('kc_token')).toBe('mockAccessToken');
      expect(localStorage.getItem('refresh_token')).toBe('mockRefreshToken');
      done();
    });

    const req = httpMock.expectOne(`${environment.backendUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('❌ Login con credenciales inválidas lanza error 401', (done) => {
    service.login('wrong@test.com', 'badpass').subscribe({
      next: () => fail('Debe fallar con 401'),
      error: (err) => {
        expect(err.status).toBe(401);
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.backendUrl}/auth/login`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  // --- IS LOGGED IN ---
  it('✅ isLoggedIn devuelve true si existe token válido', () => {
    localStorage.setItem('kc_token', 'token123');
    expect(service.isLoggedIn()).toBeTrue();
  });

  // --- LOGOUT ---
  it('✅ logout elimina tokens del localStorage', () => {
    localStorage.setItem('kc_token', 'token123');
    localStorage.setItem('refresh_token', 'refresh123');
    service.logout();
    expect(localStorage.getItem('kc_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  // --- REFRESH TOKEN ---
  it('✅ refreshToken devuelve nuevo access_token y lo guarda', (done) => {
    localStorage.setItem('refresh_token', 'refresh123');

    const mockResponse = {
      access_token: 'newAccessToken',
      refresh_token: 'newRefreshToken'
    };

    service.refreshToken().subscribe((res) => {
      expect(localStorage.getItem('kc_token')).toBe('newAccessToken');
      expect(localStorage.getItem('refresh_token')).toBe('newRefreshToken');
      done();
    });

    const req = httpMock.expectOne(`${environment.backendUrl}/auth/refresh?refreshToken=refresh123`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  // --- GET USER PROFILE ---
  it('✅ getUserProfile retorna objeto de usuario desde token', (done) => {
    const mockTokenPayload = {
      sub: 'user123',
      preferred_username: 'testUser',
      email: 'test@test.com',
      realm_access: { roles: ['Admin'] },
      resource_access: { 'registers-users-api-rest': { roles: ['ClientRole'] } }
    };

    const token = `header.${btoa(JSON.stringify(mockTokenPayload))}.sig`;
    localStorage.setItem('kc_token', token);

    service.getUserProfile().subscribe((profile) => {
      expect(profile.id).toBe('user123');
      expect(profile.email).toBe('test@test.com');
      done();
    });
  });
});

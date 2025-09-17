import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/services/auth.service';

// Mock de AuthService
class MockAuthService {
  login = jasmine.createSpy('login').and.returnValue(of({}));
}

// Mock de Router
class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

// Helper para crear un JWT válido (simulado)
function createFakeJwt(payload: any): string {
  const base64Url = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.signature`;
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: MockAuthService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [LoginComponent],
      providers: [
        FormBuilder,
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as unknown as MockAuthService;
    mockRouter = TestBed.inject(Router) as unknown as MockRouter;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    fixture.detectChanges();
  });

  it('✅ debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('✅ Inicialización del componente crea formularios', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.resetPasswordForm).toBeDefined();
  });

  it('❌ Campo email vacío en login -> inválido', () => {
    component.loginForm.get('email')?.setValue('');
    expect(component.loginForm.valid).toBeFalse();
  });

  it('❌ Campo email incorrecto en login -> inválido', () => {
    component.loginForm.get('email')?.setValue('texto');
    expect(component.loginForm.valid).toBeFalse();
  });

  it('❌ Campo password vacío -> inválido', () => {
    component.loginForm.get('password')?.setValue('');
    expect(component.loginForm.valid).toBeFalse();
  });

  it('❌ Campo password menor a 5 caracteres -> inválido', () => {
    component.loginForm.get('password')?.setValue('123');
    expect(component.loginForm.valid).toBeFalse();
  });

  it('✅ Campo password válido -> válido', () => {
    component.loginForm.get('password')?.setValue('12345');
    expect(component.loginForm.get('password')?.valid).toBeTrue();
  });

  it('❌ resetPasswordForm con email vacío -> inválido', () => {
    component.resetPasswordForm.get('email')?.setValue('');
    expect(component.resetPasswordForm.valid).toBeFalse();
  });

  it('✅ resetPasswordForm con email válido -> válido', () => {
    component.resetPasswordForm.get('email')?.setValue('test@mail.com');
    expect(component.resetPasswordForm.valid).toBeTrue();
  });

  it('❌ login con formulario inválido no llama al servicio', () => {
    component.loginForm.setValue({ email: '', password: '' });
    component.login();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('✅ login con credenciales válidas llama al servicio y emite loginSuccess', () => {
    const spyEmit = spyOn(component.loginSuccess, 'emit');
    component.loginForm.setValue({ email: 'test@mail.com', password: '12345' });

    // mockAuthService.login ya está configurado para devolver of({})
    component.login();

    expect(mockAuthService.login).toHaveBeenCalledWith('test@mail.com', '12345');
    expect(spyEmit).toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'success'
    }));
  });

  it('❌ login con credenciales inválidas asigna errorMessage', () => {
    mockAuthService.login.and.returnValue(throwError(() => new Error('Credenciales inválidas')));
    component.loginForm.setValue({ email: 'bad@mail.com', password: 'wrong' });
    component.login();
    expect(component.errorMessage).toContain('❌ Credenciales incorrectas');
    expect(component.loading).toBeFalse();
  });

  it('✅ Manejo de loading en login', () => {
    component.loginForm.setValue({ email: 'test@mail.com', password: '12345' });
    mockAuthService.login.and.returnValue(of({}));
    component.login();
    expect(component.loading).toBeFalse(); // se desactiva en complete
  });

  it('✅ getCombinedRoles sin token devuelve []', () => {
    localStorage.removeItem('kc_token');
    const roles = (component as any).getCombinedRoles();
    expect(roles).toEqual([]);
  });

  it('✅ getCombinedRoles con token válido devuelve roles', () => {
    const payload = {
      resource_access: { 'registers-users-api-rest': { roles: ['Admin_client_role'] } },
      realm_access: { roles: ['realmRole1'] }
    };
    const fakeToken = createFakeJwt(payload);
    localStorage.setItem('kc_token', fakeToken);

    const roles = (component as any).getCombinedRoles();
    expect(roles).toContain('Admin_client_role');
    expect(roles).toContain('realmRole1');
  });

  it('✅ getCombinedRoles con token corrupto devuelve []', () => {
    localStorage.setItem('kc_token', 'token_malo');
    const roles = (component as any).getCombinedRoles();
    expect(roles).toEqual([]);
  });

  it('✅ redirectUser con rol SuperAdmin navega a /administrador', () => {
    (component as any).redirectUser(['SuperAdmin_client_role']);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/administrador']);
  });

  it('✅ redirectUser con rol Admin navega a /administrador', () => {
    (component as any).redirectUser(['Admin_client_role']);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/administrador']);
  });

  it('✅ redirectUser con rol Doctor navega a /registro', () => {
    (component as any).redirectUser(['Doctor_client_role']);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/registro']);
  });

  it('✅ redirectUser con rol Researcher navega a /investigador', () => {
    (component as any).redirectUser(['Researcher_client_role']);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/investigador']);
  });

  it('✅ redirectUser sin roles válidos navega a /', () => {
    (component as any).redirectUser([]);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  // === Fixed toggle test: espiamos document.getElementById para devolver el input creado ===
  it('✅ togglePasswordVisibility alterna flag y tipo input', () => {
    // crear input real y añadir al DOM
    const input = document.createElement('input');
    input.id = 'password';
    input.type = 'password';
    document.body.appendChild(input);

    // espiar document.getElementById y devolver nuestro input para asegurar consistencia
    const getByIdSpy = spyOn(document as any, 'getElementById').and.callFake((id: string) => {
      return id === 'password' ? input : null;
    });

    // primer toggle -> showPassword true y tipo 'text'
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    expect(input.type).toBe('text');

    // segundo toggle -> showPassword false y tipo 'password'
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
    expect(input.type).toBe('password');

    // cleanup: restaurar spy (llamamos callThrough para no dejar el spy en comportamiento falso)
    getByIdSpy.and.callThrough();
    document.body.removeChild(input);
  });

});

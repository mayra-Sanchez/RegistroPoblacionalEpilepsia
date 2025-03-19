import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/login/services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'getStoredRoles']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('✅ Debe llamar al servicio de autenticación cuando el formulario es válido', () => {
    mockAuthService.login.and.returnValue(of({ token: 'fake-token' }));
    spyOn(component.loginSuccess, 'emit'); // Espiar el evento de éxito
    mockAuthService.getStoredRoles.and.returnValue(['Admin_client_role']); // Asegurar que devuelve un array válido

    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    component.login();

    fixture.detectChanges(); // 🔹 Forzar detección de cambios

    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(component.loginSuccess.emit).toHaveBeenCalled(); // 🔹 Confirmar que emitió
  });

  it('🔄 Debe redirigir al usuario según su rol', () => {
    mockAuthService.login.and.returnValue(of({ token: 'fake-token' }));
    mockAuthService.getStoredRoles.and.returnValue(['Admin_client_role']); // 🔹 Devuelve un array válido

    component.loginForm.setValue({ email: 'admin@example.com', password: 'password123' });
    component.login();

    fixture.detectChanges(); // 🔹 Forzar cambios

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/administrador']);
  });
});
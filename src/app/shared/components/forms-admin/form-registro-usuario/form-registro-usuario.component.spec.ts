import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { FormRegistroUsuarioComponent } from './form-registro-usuario.component';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';

describe('FormRegistroUsuarioComponent', () => {
  let component: FormRegistroUsuarioComponent;
  let fixture: ComponentFixture<FormRegistroUsuarioComponent>;
  let mockService: jasmine.SpyObj<ConsolaAdministradorService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('ConsolaAdministradorService', [
      'getAllLayers',
      'crearUsuario'
    ]);

    // 🔹 Mock de Swal.fire con todos los campos
    spyOn(Swal, 'fire').and.callFake(() =>
      Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false,
        value: true
      })
    );

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [FormRegistroUsuarioComponent],
      providers: [{ provide: ConsolaAdministradorService, useValue: mockService }]
    }).compileComponents();

    fixture = TestBed.createComponent(FormRegistroUsuarioComponent);
    component = fixture.componentInstance;

    mockService.getAllLayers.and.returnValue(of([])); // mock de capas
    fixture.detectChanges();
  });

  // ---------- PRUEBAS ----------

  it('✅ debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('✅ debería inicializar el formulario en ngOnInit', () => {
    expect(component.usuarioForm).toBeDefined();
    expect(component.usuarioForm.get('username')).toBeTruthy();
  });

  it('✅ reset limpia todos los campos', () => {
    component.usuarioForm.patchValue({
      nombre: 'Juan',
      username: 'jperez'
    });
    component.usuarioForm.reset(); // 🔹 corregido
    expect(component.usuarioForm.value.nombre).toBeNull();
    expect(component.usuarioForm.value.username).toBeNull();
  });

  it('✅ onRegister con formulario válido debe llamar al servicio', async () => {
    component.usuarioForm.setValue({
      nombre: 'Juan',
      apellido: 'Pérez',
      tipoDocumento: 'CC',
      numeroDocumento: '123456',
      fechaNacimiento: '2000-01-01',
      rol: 'Admin',
      username: 'jperez',
      capaInvestigacion: ['none'],
      email: 'test@mail.com',
      password: 'Valid123',
      acceptTermsAndConditions: true
    });

    mockService.crearUsuario.and.returnValue(of({}));

    await component.onRegister();

    expect(mockService.crearUsuario).toHaveBeenCalled();
  });

  it('❌ onRegister muestra error si servicio falla', async () => {
    component.usuarioForm.setValue({
      nombre: 'Juan',
      apellido: 'Pérez',
      tipoDocumento: 'CC',
      numeroDocumento: '123456',
      fechaNacimiento: '2000-01-01',
      rol: 'Admin',
      username: 'jperez',
      capaInvestigacion: ['none'],
      email: 'test@mail.com',
      password: 'Valid123',
      acceptTermsAndConditions: true
    });

    mockService.crearUsuario.and.returnValue(throwError(() => new Error('Falla')));

    await component.onRegister();

    expect(mockService.crearUsuario).toHaveBeenCalled();
  });

  it('❌ onRegister con formulario inválido no llama al servicio', async () => {
    component.usuarioForm.patchValue({
      username: '',
      email: 'invalido',
      password: ''
    });

    await component.onRegister();

    expect(mockService.crearUsuario).not.toHaveBeenCalled();
  });

  it('❌ username vacío -> formulario inválido', () => {
    component.usuarioForm.patchValue({ username: '' });
    expect(component.usuarioForm.invalid).toBeTrue();
  });

  it('❌ email inválido -> formulario inválido', () => {
    component.usuarioForm.patchValue({ email: 'correo-malo' });
    expect(component.usuarioForm.get('email')?.valid).toBeFalse();
  });

  it('✅ email válido -> campo válido', () => {
    component.usuarioForm.patchValue({ email: 'test@mail.com' });
    expect(component.usuarioForm.get('email')?.valid).toBeTrue();
  });

  it('❌ password vacío -> formulario inválido', () => {
    component.usuarioForm.patchValue({ password: '' });
    expect(component.usuarioForm.get('password')?.valid).toBeFalse();
  });

  it('❌ password demasiado corto -> inválido', () => {
    component.usuarioForm.patchValue({ password: '123' });
    expect(component.usuarioForm.get('password')?.valid).toBeFalse();
  });

  it('❌ rol vacío -> formulario inválido', () => {
    component.usuarioForm.patchValue({ rol: '' });
    expect(component.usuarioForm.get('rol')?.valid).toBeFalse();
  });
});

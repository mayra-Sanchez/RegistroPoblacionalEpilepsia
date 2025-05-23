import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormRegistroUsuarioComponent } from './form-registro-usuario.component';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal, { SweetAlertResult, SweetAlertOptions, SweetAlertIcon } from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FormRegistroUsuarioComponent', () => {
  let component: FormRegistroUsuarioComponent;
  let fixture: ComponentFixture<FormRegistroUsuarioComponent>;
  let consolaServiceSpy: jasmine.SpyObj<ConsolaAdministradorService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ConsolaAdministradorService', ['getAllLayers', 'crearUsuario']);
    spy.getAllLayers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [FormRegistroUsuarioComponent],
      providers: [{ provide: ConsolaAdministradorService, useValue: spy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    consolaServiceSpy = TestBed.inject(ConsolaAdministradorService) as jasmine.SpyObj<ConsolaAdministradorService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRegistroUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debería inicializar el formulario correctamente', () => {
      expect(component.usuarioForm).toBeInstanceOf(FormGroup);
      expect(component.usuarioForm.get('nombre')).toBeTruthy();
      expect(component.usuarioForm.get('apellido')).toBeTruthy();
      expect(component.usuarioForm.get('tipoDocumento')).toBeTruthy();
      expect(component.usuarioForm.get('numeroDocumento')).toBeTruthy();
      expect(component.usuarioForm.get('fechaNacimiento')).toBeTruthy();
      expect(component.usuarioForm.get('rol')).toBeTruthy();
      expect(component.usuarioForm.get('username')).toBeTruthy();
      expect(component.usuarioForm.get('capaInvestigacion')).toBeTruthy();
      expect(component.usuarioForm.get('email')).toBeTruthy();
      expect(component.usuarioForm.get('password')).toBeTruthy();
      expect(component.usuarioForm.get('username')?.disabled).toBeTrue();
    });

    it('debería obtener las capas al iniciar', () => {
      const mockCapas = [{ id: 1, layerName: 'Capa 1' }, { id: 2, layerName: 'Capa 2' }];
      consolaServiceSpy.getAllLayers.and.returnValue(of(mockCapas));

      component.ngOnInit();

      expect(consolaServiceSpy.getAllLayers).toHaveBeenCalled();
      expect(component.capas.length).toBe(2);
      expect(component.capas[0]).toEqual({ id: 1, nombreCapa: 'Capa 1' });
      expect(component.capas[1]).toEqual({ id: 2, nombreCapa: 'Capa 2' });
    });

    it('debería manejar error al obtener capas', () => {
      consolaServiceSpy.getAllLayers.and.returnValue(throwError(() => new Error('Error')));
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

      component.ngOnInit();

      expect(consolaServiceSpy.getAllLayers).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'No se pudieron cargar las capas de investigación.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
      );
    });
  });

  describe('Generación de username', () => {
    it('debería generar username cuando hay datos suficientes', () => {
      component.usuarioForm.patchValue({
        nombre: 'Juan',
        apellido: 'Pérez',
        fechaNacimiento: '1990-05-15'
      });

      const username = component.generarUsername('Juan', 'Pérez', '1990-05-15');
      console.log('Generated username:', username); // Debug
      expect(username).toMatch(/^jperez90\d{3}$/);
    });

    it('debería generar username sin caracteres especiales', () => {
      const username = component.generarUsername('María', 'González-Ñúñez', '1985-12-31');
      console.log('Generated username:', username); // Debug
      expect(username).toMatch(/^mgonzaleznunez85\d{3}$/);
    });

    it('debería actualizar username automáticamente al cambiar nombre, apellido o fecha', () => {
      component.usuarioForm.patchValue({
        nombre: 'Ana',
        apellido: 'López',
        fechaNacimiento: '1995-01-01'
      });

      const username = component.usuarioForm.get('username')?.value;
      console.log('Generated username:', username); // Debug
      expect(username).toMatch(/^alopez95\d{3}$/);
    });
  });

  describe('onRegister', () => {
    beforeEach(() => {
      component.usuarioForm.patchValue({
        nombre: 'Test',
        apellido: 'User',
        tipoDocumento: 'CC',
        numeroDocumento: '123456789',
        fechaNacimiento: '1990-01-01',
        rol: 'ADMIN',
        capaInvestigacion: '1',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('debería mostrar alerta si el formulario es inválido', () => {
      component.usuarioForm.reset();
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

      component.onRegister();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Formulario inválido',
          text: 'Por favor, complete todos los campos correctamente.',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        })
      );
    });

    it('debería llamar al servicio si el formulario es válido y se confirma', fakeAsync(() => {
      const mockResponse = { success: true };
      consolaServiceSpy.crearUsuario.and.returnValue(of(mockResponse));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined, html?: string, icon?: SweetAlertIcon) => {
        if (typeof options !== 'string' && options?.title === '¿Registrar usuario?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });
      spyOn(component.usuarioCreada, 'emit');

      component.onRegister();
      tick();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: '¿Registrar usuario?',
          text: '¿Estás seguro de registrar este usuario?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, registrar',
          cancelButtonText: 'Cancelar'
        })
      );
      expect(consolaServiceSpy.crearUsuario).toHaveBeenCalledWith(
        jasmine.objectContaining({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          username: jasmine.stringMatching(/^tuser90\d{3}$/),
          password: 'password123',
          identificationType: 'CC',
          identificationNumber: 123456789,
          birthDate: '1990-01-01',
          researchLayer: '1',
          role: 'ADMIN'
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: '¡Registro exitoso! 🎉',
          text: 'El usuario ha sido registrado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        })
      );
      expect(component.usuarioCreada.emit).toHaveBeenCalled();
      expect(component.usuarioForm.pristine).toBeTrue();
    }));

    it('debería mostrar error si el servicio falla', fakeAsync(() => {
      consolaServiceSpy.crearUsuario.and.returnValue(throwError(() => new Error('Error')));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined, html?: string, icon?: SweetAlertIcon) => {
        if (typeof options !== 'string' && options?.title === '¿Registrar usuario?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });

      component.onRegister();
      tick();

      expect(consolaServiceSpy.crearUsuario).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'Hubo un problema al registrar el usuario.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
      );
    }));
  });

  describe('togglePasswordVisibility', () => {
    it('debería alternar la visibilidad de la contraseña', () => {
      expect(component.showPassword).toBeFalse();
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTrue();
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeFalse();
    });
  });

  describe('campoEsValido', () => {
    it('debería devolver true para campo inválido y tocado', () => {
      const control = new FormControl('', Validators.required);
      component.usuarioForm = new FormGroup({ test: control });
      control.markAsTouched();

      expect(component.campoEsValido('test')).toBeTrue();
    });

    it('debería devolver false para campo válido', () => {
      const control = new FormControl('valor', Validators.required);
      component.usuarioForm = new FormGroup({ test: control });
      control.markAsTouched();

      expect(component.campoEsValido('test')).toBeFalse();
    });

    it('debería devolver false para campo no existente', () => {
      expect(component.campoEsValido('noExiste')).toBeFalse();
    });
  });
});
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormRegistroCapasComponent } from './form-registro-capas.component';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import Swal, { SweetAlertResult, SweetAlertOptions } from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FormRegistroCapasComponent', () => {
  let component: FormRegistroCapasComponent;
  let fixture: ComponentFixture<FormRegistroCapasComponent>;
  let consolaServiceSpy: jasmine.SpyObj<ConsolaAdministradorService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const consolaSpy = jasmine.createSpyObj('ConsolaAdministradorService', ['registrarCapa']);
    const dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      declarations: [FormRegistroCapasComponent],
      imports: [ReactiveFormsModule, MatDialogModule],
      providers: [
        FormBuilder,
        { provide: ConsolaAdministradorService, useValue: consolaSpy },
        { provide: MatDialog, useValue: dialogMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    consolaServiceSpy = TestBed.inject(ConsolaAdministradorService) as jasmine.SpyObj<ConsolaAdministradorService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRegistroCapasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers ngOnInit
  });

  afterEach(() => {
    component.ngOnDestroy(); // Ensure subscriptions are cleaned up
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debería inicializar el formulario con controles y validaciones', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('layerName')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('layerBoss')).toBeTruthy();
      expect(component.form.get('layerBoss.id')).toBeTruthy();
      expect(component.form.get('layerBoss.name')).toBeTruthy();
      expect(component.form.get('layerBoss.identificationNumber')).toBeTruthy();

      // Test required validators by setting null/empty values and marking as touched
      component.form.get('layerName')?.setValue(null);
      component.form.get('description')?.setValue(null);
      component.form.get('layerBoss.name')?.setValue(null);
      component.form.get('layerBoss.identificationNumber')?.setValue(null);

      // Mark individual controls as touched to ensure validation triggers
      component.form.get('layerName')?.markAsTouched();
      component.form.get('description')?.markAsTouched();
      component.form.get('layerBoss.name')?.markAsTouched();
      component.form.get('layerBoss.identificationNumber')?.markAsTouched();

      // Force change detection to update validation state
      fixture.detectChanges();

      // Debug: Log form errors
       ('layerName errors:', component.form.get('layerName')?.errors);
       ('description errors:', component.form.get('description')?.errors);
       ('layerBoss.name errors:', component.form.get('layerBoss.name')?.errors);
       ('layerBoss.identificationNumber errors:', component.form.get('layerBoss.identificationNumber')?.errors);

      expect(component.form.get('layerName')?.hasError('required')).toBeTrue();
      expect(component.form.get('layerName')?.hasError('minlength')).toBeFalse(); // minlength not triggered for null
      expect(component.form.get('description')?.hasError('required')).toBeTrue();
      expect(component.form.get('description')?.hasError('minlength')).toBeFalse(); // minlength not triggered for null
      expect(component.form.get('layerBoss.name')?.hasError('required')).toBeTrue();
      expect(component.form.get('layerBoss.name')?.hasError('minlength')).toBeFalse(); // minlength not triggered for null
      expect(component.form.get('layerBoss.identificationNumber')?.hasError('required')).toBeTrue();
      expect(component.form.get('layerBoss.identificationNumber')?.hasError('minlength')).toBeFalse(); // minlength not triggered for null

      // Test minlength validators with short values
      component.form.patchValue({
        layerName: 'ab',
        description: 'abcd',
        layerBoss: { name: 'ab', identificationNumber: '1234' }
      });
      component.form.markAllAsTouched();
      fixture.detectChanges();

      expect(component.form.get('layerName')?.hasError('minlength')).toBeTrue();
      expect(component.form.get('description')?.hasError('minlength')).toBeTrue();
      expect(component.form.get('layerBoss.name')?.hasError('minlength')).toBeTrue();
      expect(component.form.get('layerBoss.identificationNumber')?.hasError('minlength')).toBeTrue();

      // Test valid state
      component.form.patchValue({
        layerName: 'Test Layer',
        description: 'Valid description',
        layerBoss: { name: 'Test Boss', identificationNumber: '123456' }
      });
      fixture.detectChanges();

      expect(component.form.get('layerName')?.valid).toBeTrue();
      expect(component.form.get('description')?.valid).toBeTrue();
      expect(component.form.get('layerBoss.name')?.valid).toBeTrue();
      expect(component.form.get('layerBoss.identificationNumber')?.valid).toBeTrue();
    });

    it('debería establecer el valor por defecto del ID del jefe en 1', () => {
      expect(component.form.get('layerBoss.id')?.value).toBe(1);
    });
  });

  describe('registrarCapa', () => {
    beforeEach(() => {
      // Set valid form data
      component.form.patchValue({
        layerName: 'Capa Test',
        description: 'Descripción de prueba',
        layerBoss: {
          id: 1,
          name: 'Jefe Test',
          identificationNumber: '123456'
        }
      });
    });

    it('debería mostrar alerta si el formulario es inválido', () => {
      component.form.reset();
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

      component.registrarCapa();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Formulario inválido',
          text: 'Por favor, completa todos los campos correctamente.',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        })
      );
      expect(component.form.touched).toBeTrue();
    });

    it('debería mostrar confirmación y registrar la capa si el formulario es válido', fakeAsync(() => {
      consolaServiceSpy.registrarCapa.and.returnValue(of({}));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });

      component.registrarCapa();
      tick();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: '¿Confirmar registro?',
          text: '¿Estás seguro de registrar esta capa?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, registrar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33'
        })
      );
      expect(consolaServiceSpy.registrarCapa).toHaveBeenCalledWith({
        layerName: 'Capa Test',
        description: 'Descripción de prueba',
        layerBoss: {
          id: 1,
          name: 'Jefe Test',
          identificationNumber: '123456'
        }
      });
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: '¡Registro exitoso! 🎉',
          html: jasmine.stringMatching(/La capa ha sido registrada correctamente/),
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6',
          background: '#f1f8ff',
          timer: 5000,
          timerProgressBar: true
        })
      );
      expect(component.form.pristine).toBeTrue();
    }));

    it('debería mostrar error genérico si el servicio falla', fakeAsync(() => {
      consolaServiceSpy.registrarCapa.and.returnValue(throwError(() => new Error('Error')));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });

      component.registrarCapa();
      tick();

      expect(consolaServiceSpy.registrarCapa).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'Ocurrió un problema al registrar la capa.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        })
      );
    }));

    it('debería mostrar error específico si la capa ya existe', fakeAsync(() => {
      consolaServiceSpy.registrarCapa.and.returnValue(throwError(() => ({ error: 'El nombre de la capa ya existe' })));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });

      component.registrarCapa();
      tick();

      expect(consolaServiceSpy.registrarCapa).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'El nombre de la capa ya existe. Por favor, elija otro.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        })
      );
    }));

    it('debería mostrar error específico si los campos son demasiado largos', fakeAsync(() => {
      consolaServiceSpy.registrarCapa.and.returnValue(throwError(() => ({ error: 'demasiado largo' })));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });

      component.registrarCapa();
      tick();

      expect(consolaServiceSpy.registrarCapa).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'Algunos campos exceden la longitud máxima permitida.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        })
      );
    }));

    it('debería mostrar error específico si los datos son inválidos', fakeAsync(() => {
      consolaServiceSpy.registrarCapa.and.returnValue(throwError(() => ({ error: 'inválido' })));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });

      component.registrarCapa();
      tick();

      expect(consolaServiceSpy.registrarCapa).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'Datos proporcionados no son válidos.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        })
      );
    }));
  });

  describe('ngOnDestroy', () => {
    it('debería cancelar la suscripción al destruir el componente', () => {
      const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component['capasSubscription'] = mockSubscription; // Access private property for testing
      component.ngOnDestroy();
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormRegistroVariablesComponent } from './form-registro-variables.component';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal, { SweetAlertResult, SweetAlertOptions } from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FormRegistroVariablesComponent', () => {
  let component: FormRegistroVariablesComponent;
  let fixture: ComponentFixture<FormRegistroVariablesComponent>;
  let variableServiceSpy: jasmine.SpyObj<ConsolaAdministradorService>;

  beforeEach(async () => {
    const variableSpy = jasmine.createSpyObj('ConsolaAdministradorService', ['getAllLayers', 'crearVariable']);

    await TestBed.configureTestingModule({
      declarations: [FormRegistroVariablesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ConsolaAdministradorService, useValue: variableSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    variableServiceSpy = TestBed.inject(ConsolaAdministradorService) as jasmine.SpyObj<ConsolaAdministradorService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRegistroVariablesComponent);
    component = fixture.componentInstance;
    // Mock getAllLayers response
    variableServiceSpy.getAllLayers.and.returnValue(of([
      { id: '1', layerName: 'Capa 1' },
      { id: '2', layerName: 'Capa 2' }
    ]));
    fixture.detectChanges(); // Triggers ngOnInit
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debería inicializar el formulario con controles y validaciones', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('variableName')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('type')).toBeTruthy();
      expect(component.form.get('researchLayerId')).toBeTruthy();
      expect(component.form.get('hasOptions')).toBeTruthy();
      expect(component.form.get('options')).toBeTruthy();

      // Test required validators
      component.form.patchValue({
        variableName: '',
        description: '',
        type: '',
        researchLayerId: '',
        hasOptions: false,
        options: []
      });
      component.form.markAllAsTouched();
      fixture.detectChanges();

      expect(component.form.get('variableName')?.hasError('required')).toBeTrue();
      expect(component.form.get('description')?.hasError('required')).toBeTrue();
      expect(component.form.get('type')?.hasError('required')).toBeTrue();
      expect(component.form.get('researchLayerId')?.hasError('required')).toBeTrue();

      // Test minlength validators
      component.form.patchValue({
        variableName: 'ab',
        description: 'abcd'
      });
      fixture.detectChanges();

      expect(component.form.get('variableName')?.hasError('minlength')).toBeTrue();
      expect(component.form.get('description')?.hasError('minlength')).toBeTrue();

      // Test valid state
      component.form.patchValue({
        variableName: 'Test Variable',
        description: 'Valid description',
        type: 'Entero',
        researchLayerId: '1',
        hasOptions: false
      });
      fixture.detectChanges();

      expect(component.form.valid).toBeTrue();
    });

    it('debería cargar las capas de investigación al inicializar', () => {
      expect(variableServiceSpy.getAllLayers).toHaveBeenCalled();
      expect(component.capasInvestigacion).toEqual([
        { id: '1', layerName: 'Capa 1' },
        { id: '2', layerName: 'Capa 2' }
      ]);
    });

    it('debería inicializar los tipos de variables', () => {
      expect(component.tipos).toEqual(['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico']);
    });
  });

  describe('Manejo de opciones', () => {
    it('debería agregar una nueva opción al FormArray', () => {
      component.agregarOpcion();
      expect(component.options.length).toBe(1);
      expect(component.options.at(0).hasValidator(Validators.required)).toBeTrue();
    });

    it('debería eliminar una opción del FormArray', () => {
      component.agregarOpcion();
      component.agregarOpcion();
      expect(component.options.length).toBe(2);
      component.eliminarOpcion(0);
      expect(component.options.length).toBe(1);
    });

    it('debería limpiar las opciones cuando hasOptions es false', () => {
      component.form.patchValue({ hasOptions: true });
      component.agregarOpcion();
      component.agregarOpcion();
      expect(component.options.length).toBe(2);
      component.form.patchValue({ hasOptions: false });
      component.onHasOptionsChange();
      expect(component.options.length).toBe(0);
    });
  });

  describe('crearVariable', () => {
    beforeEach(() => {
      // Set valid form data
      component.form.patchValue({
        variableName: 'Test Variable',
        description: 'Valid description',
        type: 'Entero',
        researchLayerId: '1',
        hasOptions: false
      });
    });

    it('debería mostrar alerta si el formulario es inválido', () => {
      component.form.reset();
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

      component.crearVariable();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Formulario inválido',
          text: 'Complete todos los campos correctamente.',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        })
      );
    });

    it('debería mostrar alerta si tiene opciones pero ninguna está definida', () => {
      component.form.patchValue({ hasOptions: true });
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

      component.crearVariable();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'Debe agregar al menos una opción.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
      );
    });

    it('debería registrar la variable sin opciones y emitir evento', fakeAsync(() => {
      variableServiceSpy.crearVariable.and.returnValue(of({}));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });
      spyOn(component.variableCreada, 'emit');

      component.crearVariable();
      tick();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: '¿Confirmar registro?',
          text: '¿Estás seguro de registrar esta variable?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, registrar',
          cancelButtonText: 'Cancelar'
        })
      );
      expect(variableServiceSpy.crearVariable).toHaveBeenCalledWith({
        variableName: 'Test Variable',
        description: 'Valid description',
        type: 'Entero',
        researchLayerId: '1',
        options: []
      });
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: '¡Variable Creada! 🎉',
          html: jasmine.stringMatching(/La variable ha sido registrada con éxito/),
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6',
          background: '#f1f8ff',
          timer: 5000,
          timerProgressBar: true
        })
      );
      expect(component.variableCreada.emit).toHaveBeenCalled();
      expect(component.form.pristine).toBeTrue();
      expect(component.options.length).toBe(0);
    }));

    it('debería registrar la variable con opciones y emitir evento', fakeAsync(() => {
      component.form.patchValue({ hasOptions: true });
      component.agregarOpcion();
      component.agregarOpcion();
      component.options.at(0).setValue('Opción 1');
      component.options.at(1).setValue('Opción 2');
      variableServiceSpy.crearVariable.and.returnValue(of({}));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });
      spyOn(component.variableCreada, 'emit');

      component.crearVariable();
      tick();

      expect(variableServiceSpy.crearVariable).toHaveBeenCalledWith({
        variableName: 'Test Variable',
        description: 'Valid description',
        type: 'Entero',
        researchLayerId: '1',
        options: ['Opción 1', 'Opción 2']
      });
      expect(component.variableCreada.emit).toHaveBeenCalled();
    }));

    it('debería mostrar error si el servicio falla', fakeAsync(() => {
      variableServiceSpy.crearVariable.and.returnValue(throwError(() => new Error('Error')));
      spyOn(Swal, 'fire').and.callFake((options: SweetAlertOptions | string | undefined) => {
        if (typeof options !== 'string' && options?.title === '¿Confirmar registro?') {
          return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
        }
        return Promise.resolve({ isConfirmed: true } as SweetAlertResult);
      });

      component.crearVariable();
      tick();

      expect(variableServiceSpy.crearVariable).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining<SweetAlertOptions>({
          title: 'Error',
          text: 'Hubo un problema al registrar la variable.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
      );
    }));
  });

  describe('campoEsValido', () => {
    it('debería devolver true si el campo es inválido y tocado', () => {
      component.form.get('variableName')?.setValue('');
      component.form.get('variableName')?.markAsTouched();
      expect(component.campoEsValido('variableName')).toBeTrue();
    });

    it('debería devolver false si el campo es válido o no tocado', () => {
      component.form.get('variableName')?.setValue('Valid Name');
      expect(component.campoEsValido('variableName')).toBeFalse();

      component.form.get('variableName')?.setValue('');
      component.form.get('variableName')?.markAsPristine();
      expect(component.campoEsValido('variableName')).toBeFalse();
    });
  });
});
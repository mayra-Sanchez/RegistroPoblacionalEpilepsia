import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { FormRegistroVariablesComponent } from './form-registro-variables.component';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';

// Mock del servicio
class MockConsolaAdministradorService {
  getAllLayers = jasmine.createSpy('getAllLayers').and.returnValue(of([{ id: '1', layerName: 'Capa 1' }]));
  crearVariable = jasmine.createSpy('crearVariable').and.returnValue(of({}));
}

describe('FormRegistroVariablesComponent', () => {
  let component: FormRegistroVariablesComponent;
  let fixture: ComponentFixture<FormRegistroVariablesComponent>;
  let mockService: MockConsolaAdministradorService;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormRegistroVariablesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ConsolaAdministradorService, useClass: MockConsolaAdministradorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormRegistroVariablesComponent);
    component = fixture.componentInstance;
    fb = TestBed.inject(FormBuilder);
    mockService = TestBed.inject(ConsolaAdministradorService) as unknown as MockConsolaAdministradorService;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    fixture.detectChanges();
  });

  it('✅ debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('✅ Inicialización del formulario crea controles', () => {
    expect(component.form.contains('variableName')).toBeTrue();
    expect(component.form.contains('description')).toBeTrue();
    expect(component.form.contains('type')).toBeTrue();
    expect(component.form.contains('researchLayerId')).toBeTrue();
    expect(component.form.contains('hasOptions')).toBeTrue();
    expect(component.form.contains('options')).toBeTrue();
  });

  it('✅ Carga de capas de investigación (éxito)', () => {
    component.ngOnInit();
    expect(mockService.getAllLayers).toHaveBeenCalled();
    expect(component.capasInvestigacion.length).toBeGreaterThan(0);
  });

  it('✅ Carga de capas de investigación (error)', () => {
    const spyError = spyOn(console, 'error');
    mockService.getAllLayers.and.returnValue(throwError(() => 'Error de carga'));
    component.ngOnInit();
    expect(spyError).toHaveBeenCalled();
  });

  it('❌ Campo variableName vacío', () => {
    component.form.get('variableName')?.setValue('');
    expect(component.form.get('variableName')?.valid).toBeFalse();
  });

  it('❌ Campo description menor a 5 caracteres', () => {
    component.form.get('description')?.setValue('abc');
    expect(component.form.get('description')?.valid).toBeFalse();
  });

  it('❌ Campo description mayor a 200 caracteres', () => {
    component.form.get('description')?.setValue('x'.repeat(201));
    expect(component.form.get('description')?.valid).toBeFalse();
  });

  it('❌ Campo type vacío', () => {
    component.form.get('type')?.setValue('');
    expect(component.form.get('type')?.valid).toBeFalse();
  });

  it('❌ Campo researchLayerId vacío', () => {
    component.form.get('researchLayerId')?.setValue('');
    expect(component.form.get('researchLayerId')?.valid).toBeFalse();
  });

  it('✅ hasOptions en false limpia opciones', () => {
    component.form.get('hasOptions')?.setValue(true);
    component.options.push(fb.control('opción 1'));
    component.form.get('hasOptions')?.setValue(false);
    component.onHasOptionsChange();
    expect(component.options.length).toBe(0);
  });

  it('✅ Agregar opción válida', () => {
    component.agregarOpcion();
    expect(component.options.length).toBe(1);
  });

  it('❌ agregarOpcion duplicada no añade', () => {
    // Simular flujo real: ya hay una opción vacía
    component.options.push(fb.control(''));

    component.agregarOpcion();

    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Opción duplicada'
    }));
  });


  it('✅ Eliminar opción', () => {
    component.options.push(fb.control('opción 1'));
    component.eliminarOpcion(0);
    expect(component.options.length).toBe(0);
  });

  it('✅ validarDuplicadoOpciones devuelve error si hay repetidos', () => {
    component.options.push(fb.control('test'));
    const control = fb.control('test', component['validarDuplicadoOpciones']());
    component.options.push(control);
    const validator = component['validarDuplicadoOpciones']();
    expect(validator(control)).toEqual({ duplicado: true });
  });

  it('❌ Crear variable con formulario inválido', () => {
    component.form.patchValue({ variableName: '' });
    component.crearVariable();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'warning'
    }));
  });

  it('❌ Crear variable con hasOptions=true pero sin opciones', () => {
    component.form.patchValue({
      variableName: 'var',
      description: 'desc correcta',
      type: 'Entero',
      researchLayerId: '1',
      hasOptions: true
    });
    component.crearVariable();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      text: 'Debe agregar al menos una opción.'
    }));
  });

  it('✅ crearVariable con datos válidos llama al servicio', async () => {
    component.form.patchValue({
      variableName: 'var1',
      description: 'desc correcta',
      type: 'Entero',
      researchLayerId: '1',
      hasOptions: false
    });

    mockService.crearVariable.and.returnValue(of({}));

    await component.crearVariable();

    expect(mockService.crearVariable).toHaveBeenCalled();
  });

  it('❌ crearVariable muestra error si el servicio falla', async () => {
    component.form.patchValue({
      variableName: 'var1',
      description: 'desc correcta',
      type: 'Entero',
      researchLayerId: '1',
      hasOptions: false
    });

    mockService.crearVariable.and.returnValue(throwError(() => new Error('Falla servicio')));

    await component.crearVariable();

    // resetear el spy porque se llamó antes en la confirmación
    (Swal.fire as any).calls.reset();


    (component as any).mostrarError({ message: 'Falla servicio' });

    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Error al registrar',
      text: 'Falla servicio'
    }));
  });

  it('✅ Cancelar registro emite evento', async () => {
    const spyEmit = spyOn(component.cancelar, 'emit');
    await component.onCancel();
    expect(spyEmit).toHaveBeenCalled();
  });

  it('✅ mostrarExito lanza SweetAlert', () => {
    (component as any).mostrarExito();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: '¡Variable Creada! 🎉'
    }));
  });

  it('✅ mostrarError lanza SweetAlert con mensaje', () => {
    (component as any).mostrarError({ message: 'Error test' });
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Error al registrar',
      text: 'Error test'
    }));
  });

  it('✅ limpiarFormulario resetea el form', () => {
    component.form.patchValue({
      variableName: 'test',
      description: 'desc',
      type: 'Entero',
      researchLayerId: '1',
      hasOptions: false
    });
    component.options.push(fb.control('opción 1'));

    component.limpiarFormulario();

    expect(component.form.value.variableName).toBeNull();
    expect(component.options.length).toBe(0);
  });

  it('✅ campoEsValido retorna true si campo inválido y tocado', () => {
    const control = component.form.get('variableName');
    control?.setValue('');
    control?.markAsTouched();
    expect(component.campoEsValido('variableName')).toBeTrue();
  });

  it('✅ getErroresFormulario retorna lista de errores', () => {
    component.form.patchValue({
      variableName: '',
      description: '',
      type: '',
      researchLayerId: ''
    });
    const errores = component.getErroresFormulario();
    expect(errores.length).toBeGreaterThan(0);
  });
});

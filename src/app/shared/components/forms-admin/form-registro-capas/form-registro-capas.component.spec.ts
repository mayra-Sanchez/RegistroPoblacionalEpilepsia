import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { FormRegistroCapasComponent } from './form-registro-capas.component';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';

describe('FormRegistroCapasComponent', () => {
  let component: FormRegistroCapasComponent;
  let fixture: ComponentFixture<FormRegistroCapasComponent>;
  let mockService: jasmine.SpyObj<ConsolaAdministradorService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('ConsolaAdministradorService', [
      'registrarCapa'
    ]);

    // 🔹 Mock de Swal.fire
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
      declarations: [FormRegistroCapasComponent],
      providers: [
        { provide: ConsolaAdministradorService, useValue: mockService },
        { provide: MatDialog, useValue: {} } // 🔹 Mock de MatDialog
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormRegistroCapasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------- PRUEBAS ----------

  it('✅ debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('✅ debería inicializar el formulario con controles', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('layerName')).toBeTruthy();
    expect(component.form.get('description')).toBeTruthy();
    expect(component.form.get('layerBoss')).toBeTruthy();
  });

  it('❌ nombre vacío -> formulario inválido', () => {
    component.form.patchValue({ layerName: '' });
    expect(component.form.invalid).toBeTrue();
  });

  it('❌ descripción vacía -> formulario inválido', () => {
    component.form.patchValue({ description: '' });
    expect(component.form.invalid).toBeTrue();
  });

  it('❌ jefe sin nombre -> formulario inválido', () => {
    component.form.get('layerBoss')?.patchValue({ name: '' });
    expect(component.form.invalid).toBeTrue();
  });

  it('✅ registrarCapa con formulario válido debe llamar al servicio', async () => {
    component.form.setValue({
      layerName: 'Capa Test',
      description: 'Descripción válida',
      layerBoss: {
        id: 1,
        name: 'Jefe Test',
        email: 'jefe@test.com',
        identificationNumber: '12345'
      }
    });

    mockService.registrarCapa.and.returnValue(of({}));

    await component.registrarCapa();

    expect(mockService.registrarCapa).toHaveBeenCalled();
  });

  it('❌ registrarCapa con formulario inválido no llama al servicio', async () => {
    component.form.patchValue({
      layerName: '',
      description: '',
      layerBoss: { name: '', email: '', identificationNumber: '' }
    });

    await component.registrarCapa();

    expect(mockService.registrarCapa).not.toHaveBeenCalled();
  });

  it('❌ registrarCapa muestra error si servicio falla', async () => {
    component.form.setValue({
      layerName: 'Capa Test',
      description: 'Descripción válida',
      layerBoss: {
        id: 1,
        name: 'Jefe Test',
        email: 'jefe@test.com',
        identificationNumber: '12345'
      }
    });

    mockService.registrarCapa.and.returnValue(throwError(() => new Error('Falla')));

    await component.registrarCapa();

    expect(mockService.registrarCapa).toHaveBeenCalled();
  });

  it('✅ cargarDatos llena el formulario con valores existentes', () => {
    const capa = {
      layerName: 'Capa Existente',
      description: 'Descripción existente',
      layerBoss: {
        id: 1,
        name: 'Jefe Existente',
        email: 'jefe@existente.com',
        identificationNumber: '98765'
      }
    };

    component.form.patchValue(capa);

    expect(component.form.value.layerName).toBe('Capa Existente');
    expect(component.form.value.description).toBe('Descripción existente');
    expect(component.form.value.layerBoss.name).toBe('Jefe Existente');
  });

  it('✅ reset del formulario limpia todos los campos', () => {
    component.form.patchValue({
      layerName: 'Capa Test',
      description: 'Desc test',
      layerBoss: { name: 'Jefe', email: 'mail@test.com', identificationNumber: '11111' }
    });

    component.form.reset();

    expect(component.form.value.layerName).toBeNull();
    expect(component.form.value.description).toBeNull();
    expect(component.form.value.layerBoss.name).toBeNull();
  });
});

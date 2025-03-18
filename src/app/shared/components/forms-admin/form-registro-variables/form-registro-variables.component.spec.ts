import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormRegistroVariablesComponent } from './form-registro-variables.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { of, throwError } from 'rxjs';

describe('FormRegistroVariablesComponent', () => {
  let component: FormRegistroVariablesComponent;
  let fixture: ComponentFixture<FormRegistroVariablesComponent>;
  let mockService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  beforeEach(() => {
    mockService = {
      getAllLayers: jasmine.createSpy('getAllLayers').and.returnValue(of([{ id: '1', nombreCapa: 'Capa 1' }])),
      crearVariable: jasmine.createSpy('crearVariable').and.returnValue(of({ success: true }))
    };
    mockDialog = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of(true)
      })
    };
    mockSnackBar = {
      open: jasmine.createSpy('open')
    };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [FormRegistroVariablesComponent],
      providers: [
        FormBuilder,
        { provide: ConsolaAdministradorService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    fixture = TestBed.createComponent(FormRegistroVariablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit the form if invalid', () => {
    component.form.patchValue({ nombreVariable: '', descripcion: '', tipo: '', idCapaInvestigacion: '' });
    component.crearVariable();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Formulario inválido. Complete todos los campos correctamente.', 'Cerrar', { duration: 3000 });
  });

  it('should open confirmation dialog and call service on confirm', () => {
    component.form.patchValue({
      nombreVariable: 'Variable Test',
      descripcion: 'Descripción válida',
      tipo: 'Entero',
      idCapaInvestigacion: '1',
      tieneOpciones: false,
      opciones: []
    });

    component.crearVariable();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockService.crearVariable).toHaveBeenCalledWith({
      nombreVariable: 'Variable Test',
      descripcion: 'Descripción válida',
      tipo: 'Entero',
      idCapaInvestigacion: '1',
      tieneOpciones: false,
      opciones: []
    });
    expect(mockSnackBar.open).toHaveBeenCalledWith('Variable registrada con éxito', 'Cerrar', { duration: 3000 });
  });

  it('should clear form after successful creation', () => {
    spyOn(component, 'limpiarFormulario');
    component.form.patchValue({
      nombreVariable: 'Variable Test',
      descripcion: 'Descripción válida',
      tipo: 'Entero',
      idCapaInvestigacion: '1',
      tieneOpciones: false,
      opciones: []
    });

    component.crearVariable();
    expect(component.limpiarFormulario).toHaveBeenCalled();
  });

  it('should show error message if creation fails', () => {
    mockService.crearVariable.and.returnValue(throwError(() => new Error('Error en el backend')));
  
    component.form.patchValue({
      nombreVariable: 'Variable Test',
      descripcion: 'Descripción válida',
      tipo: 'Entero',
      idCapaInvestigacion: '1',
      tieneOpciones: false,
      opciones: []
    });
  
    component.crearVariable();
  
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error al registrar la variable', 'Cerrar', { duration: 3000 });
  });
  
});

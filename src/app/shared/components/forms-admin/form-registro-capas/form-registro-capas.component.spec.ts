import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormRegistroCapasComponent } from './form-registro-capas.component';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { of } from 'rxjs';

describe('FormRegistroCapasComponent', () => {
  let component: FormRegistroCapasComponent;
  let fixture: ComponentFixture<FormRegistroCapasComponent>;
  let mockService: jasmine.SpyObj<ConsolaAdministradorService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ConsolaAdministradorService', ['registrarCapa']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, MatDialogModule, MatSnackBarModule],
      declarations: [FormRegistroCapasComponent],
      providers: [
        { provide: ConsolaAdministradorService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormRegistroCapasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open confirmation dialog and register layer if confirmed', () => {
    // 🔹 Simulamos la respuesta del diálogo como 'true' (confirmado)
    mockDialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    // 🔹 Simulamos respuesta exitosa del servicio
    mockService.registrarCapa.and.returnValue(of({}));

    // 🔹 Inicializamos correctamente el formulario antes de llamar a la función
    component.form.setValue({
      nombre: 'Capa de prueba',
      descripcion: 'Descripción de prueba',
      jefeCapa: {
        id: 1, // ✅ Aseguramos que `id` está definido en `jefeCapa`
        nombre: 'Jefe de prueba',
        numeroIdentificacion: '12345',
      },
    });

    component.registrarCapa();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockService.registrarCapa).toHaveBeenCalledWith({
      nombreCapa: 'Capa de prueba',
      descripcion: 'Descripción de prueba',
      jefeCapa: {
        id: 1,
        nombre: 'Jefe de prueba',
        numeroIdentificacion: '12345',
      },
    });
    expect(mockSnackBar.open).toHaveBeenCalledWith('Capa registrada con éxito. 🎉', 'Cerrar', {
      duration: 3000,
      panelClass: 'snack-success',
    });
  });
});

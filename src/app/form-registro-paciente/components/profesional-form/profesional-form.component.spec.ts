import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfesionalFormComponent } from './profesional-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProfesionalFormComponent', () => {
  let component: ProfesionalFormComponent;
  let fixture: ComponentFixture<ProfesionalFormComponent>;

  // Mocks de servicios
  const mockAuthService = {
    getUserEmail: jasmine.createSpy('getUserEmail').and.returnValue('user@example.com'),
    getUserData: jasmine.createSpy('getUserData').and.returnValue({
      id: 'token-id',
      firstName: 'Token Name'
    }),
    getUserIdentificationNumber: jasmine.createSpy('getUserIdentificationNumber').and.returnValue('123456789')
  };

  const mockConsolaService = {
    obtenerUsuarioAutenticado: jasmine.createSpy('obtenerUsuarioAutenticado')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfesionalFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConsolaRegistroService, useValue: mockConsolaService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesionalFormComponent);
    component = fixture.componentInstance;
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario con campos requeridos', () => {
    expect(component.form.contains('healthProfessionalId')).toBeTrue();
    expect(component.form.contains('healthProfessionalName')).toBeTrue();
    expect(component.form.contains('healthProfessionalIdentificationNumber')).toBeTrue();
  });

  it('debería cargar datos del profesional desde la API', fakeAsync(() => {
    const apiData = [{
      id: 'api-id',
      firstName: 'API',
      lastName: 'User',
      attributes: {
        identificationNumber: ['987654321']
      }
    }];
    mockConsolaService.obtenerUsuarioAutenticado.and.returnValue(of(apiData));

    component.ngOnInit();
    tick();

    const formValues = component.form.getRawValue();
    expect(formValues.healthProfessionalId).toBe('api-id');
    expect(formValues.healthProfessionalName).toBe('API User');
    expect(formValues.healthProfessionalIdentificationNumber).toBe('987654321');
  }));

  it('debería cargar datos desde el token como fallback si falla la API', fakeAsync(() => {
    mockConsolaService.obtenerUsuarioAutenticado.and.returnValue(throwError(() => new Error('API Error')));
    
    component.ngOnInit();
    tick();

    const formValues = component.form.getRawValue();
    expect(formValues.healthProfessionalId).toBe('token-id');
    expect(formValues.healthProfessionalName).toBe('Token Name');
    expect(formValues.healthProfessionalIdentificationNumber).toBe('123456789');
    expect(component.errorMessage).toBeTruthy();
  }));

  it('debería deshabilitar todos los campos después de cargar datos', fakeAsync(() => {
    const apiData = [{
      id: 'api-id',
      firstName: 'API',
      lastName: 'User',
      attributes: {
        identificationNumber: ['987654321']
      }
    }];
    mockConsolaService.obtenerUsuarioAutenticado.and.returnValue(of(apiData));

    component.ngOnInit();
    tick();

    expect(component.form.get('healthProfessionalId')?.disabled).toBeTrue();
    expect(component.form.get('healthProfessionalName')?.disabled).toBeTrue();
    expect(component.form.get('healthProfessionalIdentificationNumber')?.disabled).toBeTrue();
  }));

  it('debería emitir el evento submit si el formulario es válido', () => {
    spyOn(component.submit, 'emit');

    component.form.setValue({
      healthProfessionalId: '1',
      healthProfessionalName: 'Nombre Apellido',
      healthProfessionalIdentificationNumber: '123456'
    });

    component.onSubmit();

    expect(component.submit.emit).toHaveBeenCalledWith({
      healthProfessionalId: '1',
      healthProfessionalName: 'Nombre Apellido',
      healthProfessionalIdentificationNumber: '123456'
    });
  });

  it('no debería emitir submit si el formulario está incompleto', () => {
    spyOn(component.submit, 'emit');
    component.form.setValue({
      healthProfessionalId: '',
      healthProfessionalName: '',
      healthProfessionalIdentificationNumber: ''
    });

    component.onSubmit();

    expect(component.submit.emit).not.toHaveBeenCalled();
    expect(component.errorMessage).toBeDefined();
  });

  it('debería emitir el evento prev al invocar onPrevious', () => {
    spyOn(component.prev, 'emit');
    component.onPrevious();
    expect(component.prev.emit).toHaveBeenCalled();
  });
});

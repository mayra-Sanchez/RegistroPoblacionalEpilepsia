import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { EditRegistroModalComponent } from './edit-registro-modal.component';
import { ConsolaRegistroService } from '../services/consola-registro.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Register, Variable } from '../interfaces';

// Custom type to match component's usage of variablesRegister
interface TestVariable extends Variable {
  value: string | number | boolean;
}

describe('EditRegistroModalComponent', () => {
  let component: EditRegistroModalComponent;
  let fixture: ComponentFixture<EditRegistroModalComponent>;
  let registroService: jasmine.SpyObj<ConsolaRegistroService>;
  let swalSpy: jasmine.Spy;

  const mockRegister: Register = {
    registerId: '123',
    patientIdentificationNumber: 123456,
    patientIdentificationType: 'cc',
    registerDate: '2023-01-01',
    updateRegisterDate: null,
    patientBasicInfo: {
      name: 'John Doe',
      sex: 'masculino',
      birthDate: '1990-01-01',
      age: 35,
      email: 'john@example.com',
      phoneNumber: '1234567890',
      deathDate: null,
      economicStatus: 'medio',
      educationLevel: 'universitario',
      maritalStatus: 'soltero',
      hometown: 'City',
      currentCity: 'City',
      firstCrisisDate: '',
      crisisStatus: 'Estable'
    },
    variablesRegister: [
      {
        id: 'var1',
        value: '10',
        type: 'number',
        researchLayerId: 'layer1',
        variableName: 'Test Variable',
        description: 'Test Description',
        hasOptions: false,
        isEnabled: true,
        options: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }
    ],
    caregiver: null,
    healthProfessional: null
  };

  beforeEach(async () => {
    const registroServiceSpy = jasmine.createSpyObj('ConsolaRegistroService', ['actualizarRegistro']);
    swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    await TestBed.configureTestingModule({
      declarations: [EditRegistroModalComponent],
      imports: [FormsModule],
      providers: [
        { provide: ConsolaRegistroService, useValue: registroServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditRegistroModalComponent);
    component = fixture.componentInstance;
    registroService = TestBed.inject(ConsolaRegistroService) as jasmine.SpyObj<ConsolaRegistroService>;
    component.registro = { ...mockRegister };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();
    expect(component.successMessage).toBeNull();
    expect(component.activeTab).toBe('paciente');
    expect(component.tiposIdentificacion.length).toBe(4);
    expect(component.generos.length).toBe(3);
    expect(component.estadosEconomicos.length).toBe(5);
    expect(component.nivelesEducacion.length).toBe(5);
    expect(component.estadosCiviles.length).toBe(5);
    expect(component.estadosCrisis.length).toBe(5);
  });

  it('should emit close event when closeModal is called', () => {
    spyOn(component.close, 'emit');
    component.closeModal();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit saveChanges event with registro when onSave is called', () => {
    spyOn(component.saveChanges, 'emit');
    component.onSave();
    expect(component.saveChanges.emit).toHaveBeenCalledWith(mockRegister);
  });

  it('should not emit saveChanges if registro is null', () => {
    spyOn(component.saveChanges, 'emit');
    component.registro = null;
    component.onSave();
    expect(component.saveChanges.emit).not.toHaveBeenCalled();
  });

  it('should change active tab when changeTab is called', () => {
    component.changeTab('variables');
    expect(component.activeTab).toBe('variables');
  });

  it('should show error alert when submitting with invalid registro', () => {
    component.registro = null;
    component.onSubmit();
    expect(swalSpy).toHaveBeenCalledWith({
      title: 'Error!',
      text: 'Datos del registro no válidos',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  });

  it('should handle successful registro update', fakeAsync(() => {
    registroService.actualizarRegistro.and.returnValue(of(mockRegister));
    spyOn(component.registroActualizado, 'emit');
    spyOn(component, 'closeModal');

    component.onSubmit();
    tick(1500); // Added to handle setTimeout delay

    expect(component.isLoading).toBeFalse();
    expect(swalSpy).toHaveBeenCalledWith({
      title: 'Éxito!',
      text: 'Registro actualizado correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      timer: 2000,
      timerProgressBar: true
    });
    expect(component.registroActualizado.emit).toHaveBeenCalledWith(mockRegister);
    expect(component.closeModal).toHaveBeenCalled();
  }));

  it('should handle update error', fakeAsync(() => {
    const errorResponse = { error: { message: 'Update failed' } };
    registroService.actualizarRegistro.and.returnValue(throwError(errorResponse));

    component.onSubmit();
    tick();

    expect(component.isLoading).toBeFalse();
    expect(swalSpy).toHaveBeenCalledWith({
      title: 'Error!',
      text: 'Update failed',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }));

  it('should calculate age correctly', () => {
    const birthDate = '1990-01-01';
    const age = component.calculateAge(birthDate);
    const expectedAge = new Date().getFullYear() - 1990;
    expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
    expect(age).toBeLessThanOrEqual(expectedAge);
  });

  it('should format date for input correctly', () => {
    expect(component.prepareDateForInput('01-01-1990')).toBe('1990-01-01');
    expect(component.prepareDateForInput('1990-01-01')).toBe('1990-01-01');
    expect(component.prepareDateForInput(null)).toBe('');
    expect(component.prepareDateForInput(undefined)).toBe('');
  });

  it('should convert to storage format correctly', () => {
    expect(component.convertToStorageFormat('1990-01-01')).toBe('01-01-1990');
    expect(component.convertToStorageFormat('')).toBe('');
  });

  it('should update variable value', () => {
    const variable: TestVariable = {
      id: 'var1',
      value: '10',
      type: 'number',
      researchLayerId: 'layer1',
      variableName: 'Test Variable',
      description: 'Test Description',
      hasOptions: false,
      isEnabled: true,
      options: [],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };
    const event = { target: { value: '20' } };
    component.updateVariableValue(variable, event);
    expect(component.registro?.variablesRegister[0].value).toBe('20');
  });
});
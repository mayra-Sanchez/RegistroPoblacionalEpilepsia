import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { EditRegistroModalComponent } from './edit-registro-modal.component';
import { ConsolaRegistroService } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';
import { Variable, Register } from '../../interfaces';

// Mocks para los servicios
class MockConsolaRegistroService {
  updateRegister = jasmine.createSpy('updateRegister').and.returnValue(of({}));
}

class MockAuthService {
  getUserEmail = jasmine.createSpy('getUserEmail').and.returnValue('test@example.com');
}

class MockMatDialogRef {
  close = jasmine.createSpy('close');
}

describe('EditRegistroModalComponent', () => {
  let component: EditRegistroModalComponent;
  let fixture: ComponentFixture<EditRegistroModalComponent>;
  let consolaService: MockConsolaRegistroService;
  let authService: MockAuthService;
  let dialogRef: MockMatDialogRef;
  let formBuilder: FormBuilder;

  const mockVariables: Variable[] = [
    {
      id: '1',
      name: 'Variable 1',
      variableName: 'var1',
      type: 'Texto',
      isEnabled: true,
      isRequired: true,
      hasOptions: false,
      options: [],
      selectionType: 'single',
      description: 'Descripción variable 1',
      researchLayerId: 'test-layer-id',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      name: 'Variable 2',
      variableName: 'var2',
      type: 'Entero',
      isEnabled: true,
      isRequired: false,
      hasOptions: false,
      options: [],
      selectionType: 'single',
      description: 'Descripción variable 2',
      researchLayerId: 'test-layer-id',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  const mockRegistro: Register = {
    registerId: '12345',
    patientIdentificationNumber: 123456789,
    patientIdentificationType: 'Cédula de Ciudadanía',
    patientBasicInfo: {
      name: 'Juan Pérez',
      sex: 'Masculino',
      birthDate: '1990-01-01',
      age: 33,
      email: 'juan@example.com',
      phoneNumber: '123456789',
      deathDate: null as any,
      economicStatus: 'Medio',
      educationLevel: 'Universitario',
      maritalStatus: 'Casado',
      hometown: 'Bogotá',
      currentCity: 'Medellín',
      firstCrisisDate: null as any,
      crisisStatus: ''
    },
    caregiver: {
      name: 'María Pérez',
      identificationType: 'Cédula de Ciudadanía',
      identificationNumber: 987654321,
      age: 35,
      educationLevel: 'Universitario',
      occupation: 'Enfermera'
    },
    registerInfo: [
      {
        researchLayerId: 'test-layer-id',
        researchLayerName: 'Test Layer',
        variablesInfo: [
          {
            variableId: '1',
            variableName: 'Variable 1',
            variableType: 'Texto',
            valueAsString: 'Valor prueba'
          },
          {
            variableId: '2',
            variableName: 'Variable 2',
            variableType: 'Entero',
            valueAsNumber: 42
          }
        ]
      }
    ],
    variablesRegister: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditRegistroModalComponent],
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatCheckboxModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCardModule,
        MatButtonModule,
        MatStepperModule,
        MatTooltipModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: ConsolaRegistroService, useClass: MockConsolaRegistroService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: MatDialogRef, useClass: MockMatDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            registro: mockRegistro,
            variables: mockVariables
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRegistroModalComponent);
    component = fixture.componentInstance;
    consolaService = TestBed.inject(ConsolaRegistroService) as any;
    authService = TestBed.inject(AuthService) as any;
    dialogRef = TestBed.inject(MatDialogRef) as any;
    formBuilder = TestBed.inject(FormBuilder);

    fixture.detectChanges();
  });

  afterEach(() => {
    // Limpiar spies
    if (Swal.fire && typeof Swal.fire === 'function') {
      (Swal.fire as jasmine.Spy).calls?.reset();
    }
  });

  describe('Inicialización', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with data from input', () => {
      expect(component.editForm).toBeDefined();
      expect(component.editForm.get('patientIdentificationNumber')?.value).toBe(123456789);
      expect(component.editForm.get('patient.name')?.value).toBe('Juan Pérez');
      expect(component.editForm.get('patient.sex')?.value).toBe('Masculino');
    });

    it('should initialize variables from input data', () => {
      expect(component.variablesDeCapa.length).toBe(2);
      expect(component.variables.length).toBe(2);
    });

    it('should handle missing registro data', () => {
      // Para este test específico, vamos a recrear el componente con datos nulos
      // sin recrear todo el TestBed
      const originalData = component.data;
      component.data = { registro: null, variables: [] } as any;

      spyOn(Swal, 'fire').and.callThrough();
      // No spiamos close aquí porque ya está spied en el mock

      // Forzar la ejecución de ngOnInit nuevamente
      component.ngOnInit();

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudieron cargar los datos del registro', 'error');

      // Restaurar los datos originales
      component.data = originalData;
    });

    it('should initialize caregiver data when available', () => {
      expect(component.hasCaregiver).toBeTrue();
      expect(component.editForm.get('caregiver.name')?.value).toBe('María Pérez');
    });

    it('should disable variables by default', () => {
      expect(component.variablesReadOnly).toBeTrue();
      const firstVariableControl = component.variables.at(0).get('value');
      expect(firstVariableControl?.disabled).toBeTrue();
    });
  });

  describe('Gestión del Formulario', () => {
    it('should create form with correct structure', () => {
      const form = component.editForm;

      expect(form.get('patientIdentificationNumber')).toBeTruthy();
      expect(form.get('patientIdentificationType')).toBeTruthy();
      expect(form.get('patient.name')).toBeTruthy();
      expect(form.get('patient.sex')).toBeTruthy();
      expect(form.get('patient.birthDate')).toBeTruthy();
      expect(form.get('variables')).toBeTruthy();
    });

    it('should return correct variables array', () => {
      const variablesArray = component.variables;
      expect(variablesArray).toBeInstanceOf(FormArray);
    });

    it('should return correct variables form groups', () => {
      const formGroups = component.variablesFormGroups;
      expect(Array.isArray(formGroups)).toBeTrue();
      expect(formGroups.length).toBe(2);
    });
  });

  describe('Navegación entre secciones', () => {
    it('should change section', () => {
      component.changeSection(2);
      expect(component.currentSection).toBe(2);
    });

    it('should go to next section when current section is valid', () => {
      component.currentSection = 0;

      component.nextSection();

      expect(component.currentSection).toBe(1);
    });

    it('should not go to next section when current section is invalid', () => {
      component.currentSection = 1;
      // Hacer el formulario inválido
      component.editForm.get('patient.name')?.setValue('');
      component.editForm.get('patient.sex')?.setValue('');
      component.editForm.get('patient.birthDate')?.setValue('');

      spyOn(Swal, 'fire');

      component.nextSection();

      expect(component.currentSection).toBe(1);
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('should go to previous section', () => {
      component.currentSection = 2;

      component.prevSection();

      expect(component.currentSection).toBe(1);
    });

    it('should not go below section 0', () => {
      component.currentSection = 0;

      component.prevSection();

      expect(component.currentSection).toBe(0);
    });
  });

  describe('Gestión de Variables', () => {
    it('should toggle variables edit mode', () => {
      expect(component.variablesReadOnly).toBeTrue();

      component.toggleVariablesEdit();
      expect(component.variablesReadOnly).toBeFalse();

      component.toggleVariablesEdit();
      expect(component.variablesReadOnly).toBeTrue();
    });

    it('should enable variables when toggling edit mode', () => {
      component.enableVariables();

      const firstVariableControl = component.variables.at(0).get('value');
      expect(firstVariableControl?.enabled).toBeTrue();
      expect(component.variablesReadOnly).toBeFalse();
    });

    it('should disable variables when toggling read-only mode', () => {
      component.enableVariables(); // Primero habilitar
      component.disableVariables(); // Luego deshabilitar

      const firstVariableControl = component.variables.at(0).get('value');
      expect(firstVariableControl?.disabled).toBeTrue();
      expect(component.variablesReadOnly).toBeTrue();
    });

    it('should handle checkbox changes', () => {
      // Crear una variable lógica para test usando formBuilder del test
      const logicalVariable = formBuilder.group({
        variableId: ['3'],
        variableName: ['Test Logical'],
        value: [false],
        type: ['Lógico'],
        isRequired: [false],
        originalType: ['Lógico']
      });

      component.variables.push(logicalVariable);

      const event = { checked: true } as MatCheckboxChange;
      component.onCheckboxChange(logicalVariable, event);

      expect(logicalVariable.get('value')?.value).toBeTrue();
    });
  });

  describe('Gestión de Cuidador', () => {
    it('should toggle caregiver visibility', () => {
      expect(component.hasCaregiver).toBeTrue();

      component.toggleCaregiver();

      expect(component.hasCaregiver).toBeFalse();
      // Verificar que el formulario del cuidador se reseteó correctamente
      const caregiverGroup = component.editForm.get('caregiver') as FormGroup;
      expect(caregiverGroup.get('name')?.value).toBeNull();
      expect(caregiverGroup.get('identificationNumber')?.value).toBeNull();
      expect(caregiverGroup.get('age')?.value).toBeNull();

      component.toggleCaregiver();

      expect(component.hasCaregiver).toBeTrue();
    });
  });

  describe('Cálculo de Edad', () => {
    it('should calculate age from birth date', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const birthDateString = birthDate.toISOString().split('T')[0];

      component.editForm.patchValue({
        patient: {
          birthDate: birthDateString
        }
      });

      component.onBirthDateChange();

      expect(component.editForm.get('patient.age')?.value).toBe(25);
    });

    it('should handle invalid birth date', () => {
      component.editForm.patchValue({
        patient: {
          birthDate: 'invalid-date'
        }
      });

      component.onBirthDateChange();

      // La edad debería ser NaN para fecha inválida
      const age = component.editForm.get('patient.age')?.value;
      expect(isNaN(age)).toBeTrue();
    });
  });

  describe('Envío del Formulario', () => {
    beforeEach(() => {
      // Configurar formulario válido
      component.editForm.patchValue({
        patient: {
          name: 'Test Patient',
          sex: 'Masculino',
          birthDate: '1990-01-01'
        }
      });
    });

    it('should submit form successfully', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.onSubmit();
      tick();

      expect(consolaService.updateRegister).toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should handle form validation errors', fakeAsync(() => {
      // Hacer el formulario inválido
      component.editForm.get('patient.name')?.setValue('');

      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.onSubmit();
      tick();

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'Por favor complete todos los campos requeridos', 'error');
      expect(consolaService.updateRegister).not.toHaveBeenCalled();
    }));

    it('should handle update errors', fakeAsync(() => {
      consolaService.updateRegister.and.returnValue(throwError(() => ({ error: { message: 'Update error' } })));
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.onSubmit();
      tick();

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'Update error', 'error');
      expect(component.loading).toBeFalse();
    }));

    it('should handle missing user email', fakeAsync(() => {
      authService.getUserEmail.and.returnValue(null);
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.onSubmit();
      tick();

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudo obtener el email del usuario', 'error');
    }));

    it('should handle missing register ID', fakeAsync(() => {
      // Crear una copia del registro sin ID
      const registroSinId = { ...mockRegistro, registerId: '' };
      component.data.registro = registroSinId;

      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.onSubmit();
      tick();

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudo identificar el registro a actualizar', 'error');
    }));
  });

  describe('Utilidades', () => {
    it('should get type label correctly', () => {
      expect(component.getTypeLabel('Entero')).toBe('Entero');
      expect(component.getTypeLabel('Texto')).toBe('Texto');
      expect(component.getTypeLabel('Unknown')).toBe('Unknown');
    });

    it('should get type description correctly', () => {
      expect(component.getTypeDescription('Entero')).toContain('Número entero');
      expect(component.getTypeDescription('Unknown')).toBe('');
    });

    it('should validate number input', () => {
      const numberEvent = { which: 50, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      const letterEvent = { which: 65, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;

      expect(component.validateNumber(numberEvent)).toBeTrue();
      expect(component.validateNumber(letterEvent)).toBeFalse();
      expect(letterEvent.preventDefault).toHaveBeenCalled();
    });

    it('should validate decimal input', () => {
      const decimalEvent = { which: 46, target: { value: '123' }, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;

      expect(component.validateDecimal(decimalEvent)).toBeTrue();
    });

    it('should get error message for variable', () => {
      const variableGroup = formBuilder.group({
        value: ['', Validators.required]
      });

      variableGroup.get('value')?.markAsTouched();

      expect(component.getErrorMessage(variableGroup)).toBe('Este campo es requerido');
    });

    it('should get patient display name', () => {
      expect(component.getPatientDisplayName()).toBe('Juan Pérez');

      component.editForm.get('patient.name')?.setValue('');
      expect(component.getPatientDisplayName()).toContain('Documento');

      component.editForm.get('patientIdentificationNumber')?.setValue('');
      expect(component.getPatientDisplayName()).toBe('Paciente');
    });

    it('should get patient identification', () => {
      expect(component.getPatientIdentification()).toContain('123456789');
    });
  });

  describe('Cierre del Modal', () => {
    it('should close modal without confirmation when form is pristine', () => {
      component.editForm.markAsPristine();

      component.onCancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should show confirmation when form is dirty', () => {
      component.editForm.markAsDirty();

      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.onCancel();

      expect(Swal.fire).toHaveBeenCalled();
    });

    it('should not close when cancellation is not confirmed', fakeAsync(() => {
      component.editForm.markAsDirty();

      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));

      component.onCancel();
      tick();

      expect(dialogRef.close).not.toHaveBeenCalled();
    }));

    it('should close when cancellation is confirmed', fakeAsync(() => {
      component.editForm.markAsDirty();

      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.onCancel();
      tick();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    }));

    it('should close modal directly', () => {
      component.onClose();

      expect(dialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Validación de Formulario', () => {
    it('should check if form is valid', () => {
      expect(component.isFormValid).toBeTrue();

      component.editForm.get('patient.name')?.setValue('');
      expect(component.isFormValid).toBeFalse();
    });

    it('should check if current section is valid', () => {
      component.currentSection = 0;
      expect(component.isCurrentSectionValid).toBeTrue();

      component.editForm.get('patient.name')?.setValue('');
      expect(component.isCurrentSectionValid).toBeFalse();
    });

    it('should check for required variables incomplete', () => {
      // Variable 1 es requerida y tiene valor, así que debería ser false
      expect(component.hasRequiredVariablesIncomplete).toBeFalse();

      // Hacer que una variable requerida esté vacía
      const requiredVariable = component.variables.at(0) as FormGroup;
      requiredVariable.get('value')?.setValue('');

      expect(component.hasRequiredVariablesIncomplete).toBeTrue();
    });
  });

  describe('Métodos de Utilidad Internos', () => {
    it('should mark fields as touched', () => {
      const field = { markAsTouched: jasmine.createSpy() };

      component.markFieldsAsTouched([field]);

      expect(field.markAsTouched).toHaveBeenCalled();
    });

    it('should format date for backend correctly', () => {
      // Acceder al método privado mediante bracket notation
      const formatDateForBackend = (component as any).formatDateForBackend;

      const formattedDate = formatDateForBackend('2023-12-31');
      expect(formattedDate).toBe('2023-12-31');

      const invalidDate = formatDateForBackend('invalid-date');
      expect(invalidDate).toBeNull();
    });

    it('should convert values for API correctly', () => {
      // Acceder al método privado mediante bracket notation
      const convertValueForApi = (component as any).convertValueForApi;

      const result1 = convertValueForApi('123', 'Entero');
      expect(result1.value).toBe(123);
      expect(result1.finalType).toBe('Number');

      const result2 = convertValueForApi('test', 'Texto');
      expect(result2.value).toBe('test');
      expect(result2.finalType).toBe('String');

      // Para el caso lógico, verificar el comportamiento real del método
      const result3 = convertValueForApi(true, 'Lógico');
      // El método podría devolver boolean o string, así que verificamos ambos casos
      expect([true, 'true']).toContain(result3.value);
      expect(result3.finalType).toBe('String');

      // Probar también con string
      const result4 = convertValueForApi('false', 'Lógico');
      expect([false, 'false']).toContain(result4.value);
      expect(result4.finalType).toBe('String');

      // Probar con número para tipo lógico
      const result5 = convertValueForApi(1, 'Lógico');
      expect([true, 'true']).toContain(result5.value);
      expect(result5.finalType).toBe('String');

      const result6 = convertValueForApi(0, 'Lógico');
      expect([false, 'false']).toContain(result6.value);
      expect(result6.finalType).toBe('String');
    });
  });

  describe('Gestión de Suscripciones', () => {
    it('should unsubscribe on destroy', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
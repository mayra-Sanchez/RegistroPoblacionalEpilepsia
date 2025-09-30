import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { EditRegistroModalComponent } from './edit-registro-modal.component';
import { ConsolaRegistroService } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';

// Define the BasicResponse interface based on your service
interface BasicResponse {
  message: string;
  // Add other properties if they exist in your BasicResponse
  success?: boolean;
  data?: any;
}

// Mock interfaces that match your actual types
const mockVariable: any = {
  id: '1',
  name: 'Test Variable',
  type: 'Texto',
  isRequired: true
};

const mockRegister: any = {
  registerId: '123',
  patientIdentificationNumber: '123456789',
  patientIdentificationType: 'Cédula de Ciudadanía',
  patientBasicInfo: {
    name: 'Test Patient',
    sex: 'Masculino',
    birthDate: '1990-01-01',
    age: 33,
    email: 'test@example.com',
    phoneNumber: '1234567890'
  },
  registerInfo: [
    {
      researchLayerId: 'layer1',
      researchLayerName: 'Test Layer'
    }
  ],
  variablesRegister: [
    {
      variableId: '1',
      variableName: 'Test Variable',
      value: 'Test Value'
    }
  ]
};

// Mock BasicResponse
const mockBasicResponse: BasicResponse = {
  message: 'Success',
  success: true,
  data: {}
};

describe('EditRegistroModalComponent', () => {
  let component: EditRegistroModalComponent;
  let fixture: ComponentFixture<EditRegistroModalComponent>;
  let mockConsolaService: jasmine.SpyObj<ConsolaRegistroService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditRegistroModalComponent>>;

  beforeEach(async () => {
    const consolaServiceSpy = jasmine.createSpyObj('ConsolaRegistroService', ['updateRegister']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserEmail']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [EditRegistroModalComponent],
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatCheckboxModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: ConsolaRegistroService, useValue: consolaServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: {
            registro: mockRegister,
            variables: [mockVariable]
          }
        }
      ]
    }).compileComponents();

    mockConsolaService = TestBed.inject(ConsolaRegistroService) as jasmine.SpyObj<ConsolaRegistroService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditRegistroModalComponent>>;

    fixture = TestBed.createComponent(EditRegistroModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with data', () => {
    fixture.detectChanges(); // This triggers ngOnInit
    
    expect(component.editForm).toBeTruthy();
    expect(component.editForm.get('patientIdentificationNumber')?.value).toBe('123456789');
    expect(component.editForm.get('patient.name')?.value).toBe('Test Patient');
  });

  it('should handle form submission successfully', async () => {
    mockAuthService.getUserEmail.and.returnValue('test@example.com');
    mockConsolaService.updateRegister.and.returnValue(of(mockBasicResponse));
    
    fixture.detectChanges();
    
    // Set form values properly to avoid null assignment issues
    component.editForm.patchValue({
      patient: {
        name: 'Updated Patient',
        sex: 'Femenino',
        birthDate: '1990-01-01'
      }
    });
    
    await component.onSubmit();
    
    expect(mockConsolaService.updateRegister).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should handle form submission error', async () => {
    mockAuthService.getUserEmail.and.returnValue('test@example.com');
    mockConsolaService.updateRegister.and.returnValue(throwError(() => new Error('Test error')));
    
    fixture.detectChanges();
    
    // Set required form values to avoid validation errors
    component.editForm.patchValue({
      patient: {
        name: 'Test Patient',
        sex: 'Masculino', 
        birthDate: '1990-01-01'
      }
    });
    
    await component.onSubmit();
    
    expect(mockConsolaService.updateRegister).toHaveBeenCalled();
    // Should not close on error
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should not submit when form is invalid', async () => {
    fixture.detectChanges();
    
    // Make form invalid by clearing required fields
    component.editForm.patchValue({
      patient: {
        name: '',
        sex: '',
        birthDate: ''
      }
    });
    
    await component.onSubmit();
    
    expect(mockConsolaService.updateRegister).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should toggle caregiver section', () => {
    fixture.detectChanges();
    
    expect(component.hasCaregiver).toBeFalse();
    
    component.toggleCaregiver();
    
    expect(component.hasCaregiver).toBeTrue();
    
    component.toggleCaregiver();
    
    expect(component.hasCaregiver).toBeFalse();
  });

  it('should navigate between sections', () => {
    fixture.detectChanges();
    
    expect(component.currentSection).toBe(0);
    
    component.nextSection();
    expect(component.currentSection).toBe(1);
    
    component.prevSection();
    expect(component.currentSection).toBe(0);
  });

  it('should calculate age from birth date', () => {
    fixture.detectChanges();
    
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    const birthDateString = birthDate.toISOString().split('T')[0];
    
    component.editForm.get('patient.birthDate')?.setValue(birthDateString);
    
    expect(component.editForm.get('patient.age')?.value).toBe(25);
  });

  it('should get patient display name correctly', () => {
    fixture.detectChanges();
    
    // Test with name
    component.editForm.patchValue({
      patient: { name: 'John Doe' }
    });
    expect(component.getPatientDisplayName()).toBe('John Doe');
    
    // Test with only identification
    component.editForm.patchValue({
      patient: { name: '' },
      patientIdentificationNumber: '123456'
    });
    expect(component.getPatientDisplayName()).toContain('123456');
  });

  it('should handle cancel with confirmation', () => {
    fixture.detectChanges();
    
    component.onCancel();
    
    // Should attempt to close without changes
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should toggle variables edit mode', () => {
    fixture.detectChanges();
    
    expect(component.variablesReadOnly).toBeTrue();
    
    component.toggleVariablesEdit();
    expect(component.variablesReadOnly).toBeFalse();
    
    component.toggleVariablesEdit();
    expect(component.variablesReadOnly).toBeTrue();
  });

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
  });
});
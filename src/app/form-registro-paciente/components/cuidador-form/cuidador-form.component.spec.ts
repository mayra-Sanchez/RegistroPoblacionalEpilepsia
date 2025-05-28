import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CuidadorFormComponent } from './cuidador-form.component';

describe('CuidadorFormComponent', () => {
  let component: CuidadorFormComponent;
  let fixture: ComponentFixture<CuidadorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CuidadorFormComponent],
      imports: [ReactiveFormsModule],
      providers: [FormBuilder]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CuidadorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with all required controls', () => {
    const form = component.form;
    expect(form).toBeTruthy();
    const controls = [
      'caregiverName',
      'caregiverIdentificationType',
      'caregiverIdentificationNumber',
      'caregiverAge',
      'caregiverEducationLevel',
      'caregiverOccupation'
    ];
    controls.forEach(control => {
      expect(form.get(control)).toBeTruthy();
    });
  });

  it('should mark form as invalid if required fields are empty', () => {
    expect(component.form.valid).toBeFalse();
    Object.keys(component.form.controls).forEach(key => {
      expect(component.form.get(key)?.hasError('required')).toBeTrue();
    });
  });

  it('should validate caregiverIdentificationNumber as numeric only', () => {
    const control = component.form.get('caregiverIdentificationNumber');
    control?.setValue('123456');
    expect(control?.valid).toBeTrue();

    control?.setValue('12a34');
    expect(control?.valid).toBeFalse();
    expect(control?.hasError('pattern')).toBeTrue();
  });

  it('should validate caregiverAge with minimum value of 18', () => {
    const control = component.form.get('caregiverAge');
    control?.setValue(18);
    expect(control?.valid).toBeTrue();

    control?.setValue(17);
    expect(control?.valid).toBeFalse();
    expect(control?.hasError('min')).toBeTrue();

    control?.setValue(25);
    expect(control?.valid).toBeTrue();
  });

  it('should populate form with initialData on ngOnInit', () => {
    const initialData = {
      caregiverName: 'Jane Doe',
      caregiverIdentificationType: 'CC',
      caregiverIdentificationNumber: '987654',
      caregiverAge: 30,
      caregiverEducationLevel: 'University',
      caregiverOccupation: 'Nurse'
    };
    component.initialData = initialData;
    component.ngOnInit();
    expect(component.form.value).toEqual(initialData);
  });

  it('should not throw error if initialData is undefined or empty', () => {
    component.initialData = undefined;
    expect(() => component.ngOnInit()).not.toThrow();

    component.initialData = {};
    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.form.value).toEqual({
      caregiverName: '',
      caregiverIdentificationType: '',
      caregiverIdentificationNumber: '',
      caregiverAge: '',
      caregiverEducationLevel: '',
      caregiverOccupation: ''
    });
  });

  it('should emit next event with transformed data when form is valid', () => {
    spyOn(component.next, 'emit');
    const formValue = {
      caregiverName: 'Jane Doe',
      caregiverIdentificationType: 'CC',
      caregiverIdentificationNumber: '987654',
      caregiverAge: 30,
      caregiverEducationLevel: 'University',
      caregiverOccupation: 'Nurse'
    };
    const expectedTransformedData = {
      name: formValue.caregiverName,
      identificationType: formValue.caregiverIdentificationType,
      identificationNumber: formValue.caregiverIdentificationNumber,
      age: formValue.caregiverAge,
      educationLevel: formValue.caregiverEducationLevel,
      occupation: formValue.caregiverOccupation
    };
    component.form.setValue(formValue);
    component.onSubmit();
    expect(component.next.emit).toHaveBeenCalledWith(expectedTransformedData);
  });

  it('should mark all fields as touched when form is invalid', () => {
    spyOn(component.next, 'emit');
    component.onSubmit();
    expect(component.next.emit).not.toHaveBeenCalled();
    Object.keys(component.form.controls).forEach(key => {
      expect(component.form.get(key)?.touched).toBeTrue();
    });
  });

  it('should emit prev event when onPrevious is called', () => {
    spyOn(component.prev, 'emit');
    component.onPrevious();
    expect(component.prev.emit).toHaveBeenCalled();
  });

  it('should transform form data correctly on submit', () => {
    spyOn(component.next, 'emit');
    const formValue = {
      caregiverName: 'Jane Doe',
      caregiverIdentificationType: 'CC',
      caregiverIdentificationNumber: '987654',
      caregiverAge: 30,
      caregiverEducationLevel: 'University',
      caregiverOccupation: 'Nurse'
    };
    component.form.setValue(formValue);
    component.onSubmit();
    expect(component.next.emit).toHaveBeenCalledWith({
      name: 'Jane Doe',
      identificationType: 'CC',
      identificationNumber: '987654',
      age: 30,
      educationLevel: 'University',
      occupation: 'Nurse'
    });
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { PacienteFormComponent, PacienteFormData } from './paciente-form.component';

describe('PacienteFormComponent', () => {
  let component: PacienteFormComponent;
  let fixture: ComponentFixture<PacienteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PacienteFormComponent],
      imports: [ReactiveFormsModule],
      providers: [FormBuilder]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PacienteFormComponent);
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
      'name', 'identificationType', 'identificationNumber', 'sex', 'birthDate',
      'email', 'phoneNumber', 'deathDate', 'economicStatus', 'educationLevel',
      'maritalStatus', 'hometown', 'currentCity', 'firstCrisisDate', 'crisisStatus', 'tieneCuidador'
    ];
    controls.forEach(control => {
      expect(form.get(control)).toBeTruthy();
    });
  });

  it('should mark form as invalid if required fields are empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should validate identificationNumber as numeric only', () => {
    const control = component.form.get('identificationNumber');
    control?.setValue('12345');
    expect(control?.valid).toBeTrue();

    control?.setValue('12a34');
    expect(control?.valid).toBeFalse();
    expect(control?.hasError('pattern')).toBeTrue();
  });

  it('should validate email format', () => {
    const control = component.form.get('email');
    control?.setValue('test@example.com');
    expect(control?.valid).toBeTrue();

    control?.setValue('invalid-email');
    expect(control?.valid).toBeFalse();
    expect(control?.hasError('email')).toBeTrue();
  });

  it('should invalidate future dates in birthDate', () => {
    const control = component.form.get('birthDate');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    control?.setValue(futureDate.toISOString().split('T')[0]);
    expect(control?.valid).toBeFalse();
    expect(control?.hasError('futureDate')).toBeTrue();

    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    control?.setValue(pastDate.toISOString().split('T')[0]);
    expect(control?.valid).toBeTrue();
  });

  it('should format date to dd-mm-yyyy', () => {
    const formatted = (component as any).formatDate('2023-05-15');
    expect(formatted).toBe('15-05-2023');

    const date = new Date(2023, 4, 15); // Month is 0-based
    expect((component as any).formatDate(date)).toBe('15-05-2023');

    expect((component as any).formatDate('')).toBe('');
    expect((component as any).formatDate(null)).toBe('');
    expect((component as any).formatDate('invalid')).toBe('');
  });

  it('should prepare and format form data correctly', () => {
    const formValue = {
      name: 'John Doe',
      identificationType: 'CC',
      identificationNumber: '123456',
      sex: 'Male',
      birthDate: '1990-01-01',
      email: 'john@example.com',
      phoneNumber: '123456789',
      deathDate: '2023-12-31',
      economicStatus: 'Medium',
      educationLevel: 'University',
      maritalStatus: 'Single',
      hometown: 'City A',
      currentCity: 'City B',
      firstCrisisDate: '2022-06-15',
      crisisStatus: 'Estable',
      tieneCuidador: true
    };
    component.form.setValue(formValue);
    const preparedData = (component as any).prepareFormData(formValue);
    expect(preparedData.birthDate).toBe('01-01-1990');
    expect(preparedData.deathDate).toBe('31-12-2023');
    expect(preparedData.firstCrisisDate).toBe('15-06-2022');
    expect(preparedData).toEqual(jasmine.objectContaining({
      ...formValue,
      birthDate: '01-01-1990',
      deathDate: '31-12-2023',
      firstCrisisDate: '15-06-2022'
    }));
  });

  it('should emit next event with formatted data when form is valid', () => {
    spyOn(component.next, 'emit');
    const formValue = {
      name: 'John Doe',
      identificationType: 'CC',
      identificationNumber: '123456',
      sex: 'Male',
      birthDate: '1990-01-01',
      email: 'john@example.com',
      phoneNumber: '123456789',
      deathDate: '',
      economicStatus: 'Medium',
      educationLevel: 'University',
      maritalStatus: 'Single',
      hometown: 'City A',
      currentCity: 'City B',
      firstCrisisDate: '2022-06-15',
      crisisStatus: 'Estable',
      tieneCuidador: true
    };
    component.form.setValue(formValue);
    component.onSubmit();
    expect(component.next.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      ...formValue,
      birthDate: '01-01-1990',
      deathDate: '',
      firstCrisisDate: '15-06-2022'
    }));
  });

  it('should mark all fields as touched when form is invalid', () => {
    spyOn(component.next, 'emit');
    component.onSubmit();
    expect(component.next.emit).not.toHaveBeenCalled();
    Object.keys(component.form.controls).forEach(key => {
      expect(component.form.get(key)?.touched).toBeTrue();
    });
  });

  it('should have predefined crisis status options', () => {
    expect(component.estadosCrisis).toEqual(['Activa', 'Remisión', 'Estable', 'Crítica', 'Recuperado']);
  });
});
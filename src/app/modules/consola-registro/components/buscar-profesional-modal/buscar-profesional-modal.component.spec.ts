import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BuscarProfesionalModalComponent } from './buscar-profesional-modal.component';

describe('BuscarProfesionalModalComponent', () => {
  let component: BuscarProfesionalModalComponent;
  let fixture: ComponentFixture<BuscarProfesionalModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [BuscarProfesionalModalComponent],
      providers: [FormBuilder]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuscarProfesionalModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize the form correctly', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('identificacion')).toBeTruthy();
    });

    it('should have required and pattern validators on identificacion field', () => {
      const control = component.form.get('identificacion');
      expect(control?.hasError('required')).toBeTruthy();
      
      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTruthy();
      
      control?.setValue('123');
      expect(control?.valid).toBeTruthy();
    });
  });

  describe('Event Emitters', () => {
    it('should emit buscar event with correct value when form is valid', () => {
      spyOn(component.buscar, 'emit');
      const testValue = '12345678';
      
      component.form.get('identificacion')?.setValue(testValue);
      component.onSubmit();
      
      expect(component.buscar.emit).toHaveBeenCalledWith(Number(testValue));
    });

    it('should not emit buscar event when form is invalid', () => {
      spyOn(component.buscar, 'emit');
      
      component.form.get('identificacion')?.setValue('invalid');
      component.onSubmit();
      
      expect(component.buscar.emit).not.toHaveBeenCalled();
    });

    it('should emit cerrar event when onCerrar is called', () => {
      spyOn(component.cerrar, 'emit');
      
      component.onCerrar();
      
      expect(component.cerrar.emit).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should convert string to number when emitting buscar event', () => {
      spyOn(component.buscar, 'emit');
      const testValue = '12345';
      
      component.form.get('identificacion')?.setValue(testValue);
      component.onSubmit();
      
      expect(component.buscar.emit).toHaveBeenCalledWith(12345);
      expect(typeof component.form.value.identificacion).toBe('string');
    });
  });
});
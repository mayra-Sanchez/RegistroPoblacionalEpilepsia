import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BuscarPacienteModalComponent } from './buscar-paciente-modal.component';
import { EventEmitter } from '@angular/core';

describe('BuscarPacienteModalComponent', () => {
  let component: BuscarPacienteModalComponent;
  let fixture: ComponentFixture<BuscarPacienteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [BuscarPacienteModalComponent],
      providers: [FormBuilder]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuscarPacienteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with identificacion field', () => {
      expect(component.form.contains('identificacion')).toBeTrue();
    });

    it('should have required validator on identificacion field', () => {
      const control = component.form.get('identificacion');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should have pattern validator for numbers only', () => {
      const control = component.form.get('identificacion');
      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTrue();
      
      control?.setValue('123');
      expect(control?.hasError('pattern')).toBeFalse();
    });
  });

  describe('onSubmit()', () => {
    it('should emit buscar event with number when form is valid', () => {
      spyOn(component.buscar, 'emit');
      const testId = '123456';
      
      component.form.get('identificacion')?.setValue(testId);
      component.onSubmit();
      
      expect(component.buscar.emit).toHaveBeenCalledWith(Number(testId));
    });

    it('should not emit buscar event when form is invalid', () => {
      spyOn(component.buscar, 'emit');
      
      component.form.get('identificacion')?.setValue('invalid');
      component.onSubmit();
      
      expect(component.buscar.emit).not.toHaveBeenCalled();
    });

    it('should convert string to number when emitting', () => {
      spyOn(component.buscar, 'emit');
      const testId = '98765';
      
      component.form.get('identificacion')?.setValue(testId);
      component.onSubmit();
      
      expect(component.buscar.emit).toHaveBeenCalledWith(98765);
    });
  });

  describe('onCerrar()', () => {
    it('should emit cerrar event', () => {
      spyOn(component.cerrar, 'emit');
      
      component.onCerrar();
      
      expect(component.cerrar.emit).toHaveBeenCalled();
    });

    it('should emit void event', () => {
      let emittedValue: any = 'not void';
      component.cerrar.subscribe(() => emittedValue = undefined);
      
      component.onCerrar();
      
      expect(emittedValue).toBeUndefined();
    });
  });

  describe('Output Types', () => {
    it('should have buscar as EventEmitter<number>', () => {
      expect(component.buscar).toBeInstanceOf(EventEmitter);
      
      component.buscar.subscribe((value: number) => {
        expect(typeof value).toBe('number');
      });
    });

    it('should have cerrar as EventEmitter<void>', () => {
      expect(component.cerrar).toBeInstanceOf(EventEmitter);
      
      component.cerrar.subscribe((value: void) => {
        expect(value).toBeUndefined();
      });
    });
  });
});
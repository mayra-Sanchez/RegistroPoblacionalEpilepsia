import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewRegistroModalComponent } from './view-registro-modal.component';
import { DatePipe } from '@angular/common';
import { Register } from '../interfaces';

// Mock para DatePipe
class DatePipeMock {
  transform(value: string | Date | null | undefined, format: string): string | null {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null; // Maneja fechas inválidas
      if (format === 'mediumDate') {
        // Simula el formato 'mediumDate' (e.g., 'Oct 14, 2023' para en-US)
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      return date.toISOString().split('T')[0]; // Fallback para otros formatos
    } catch (e) {
      return null; // Maneja errores de conversión
    }
  }
}

describe('ViewRegistroModalComponent', () => {
  let component: ViewRegistroModalComponent;
  let fixture: ComponentFixture<ViewRegistroModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewRegistroModalComponent],
      providers: [
        { provide: DatePipe, useClass: DatePipeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewRegistroModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('getLabel', () => {
    it('should return the correct label for a valid value', () => {
      const result = component.getLabel(component.tiposIdentificacion, 'cc');
      expect(result).toBe('Cédula de Ciudadanía');
    });

    it('should return "No especificado" for null value', () => {
      const result = component.getLabel(component.tiposIdentificacion, null);
      expect(result).toBe('No especificado');
    });

    it('should return "No especificado" for undefined value', () => {
      const result = component.getLabel(component.tiposIdentificacion, undefined);
      expect(result).toBe('No especificado');
    });

    it('should return the original value if no matching option is found', () => {
      const result = component.getLabel(component.tiposIdentificacion, 'invalid');
      expect(result).toBe('invalid');
    });
  });

  describe('hasCaregiverData', () => {
    it('should return false for null caregiver', () => {
      const result = component.hasCaregiverData(null);
      expect(result).toBeFalse();
    });

    it('should return false for empty caregiver object', () => {
      const caregiver = { nombre: '', parentesco: '', telefono: '' };
      const result = component.hasCaregiverData(caregiver);
      expect(result).toBeFalse();
    });

    it('should return true if caregiver has at least one valid field', () => {
      const caregiver = { nombre: 'Juan', parentesco: '', telefono: null };
      const result = component.hasCaregiverData(caregiver);
      expect(result).toBeTrue();
    });

    it('should return false if all fields are null or undefined', () => {
      const caregiver = { nombre: null, parentesco: undefined, telefono: null };
      const result = component.hasCaregiverData(caregiver);
      expect(result).toBeFalse();
    });
  });

  describe('closeModal', () => {
    it('should emit the close event', () => {
      spyOn(component.close, 'emit');
      component.closeModal();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('formatDate', () => {
    it('should format a valid date correctly', () => {
      // Usar una hora que compense la zona horaria GMT-0500
      const date = new Date('2023-10-14T05:00:00.000Z'); // 05:00 UTC = 00:00 GMT-0500
      spyOn(component['datePipe'], 'transform').and.callThrough();
      const result = (component as any).formatDate(date);
      expect(result).toBe('Oct 14, 2023');
      expect(component['datePipe'].transform).toHaveBeenCalledWith(date, 'mediumDate');
    });

    it('should return "No especificada" for null date', () => {
      const result = (component as any).formatDate(null);
      expect(result).toBe('No especificada');
    });

    it('should return "No especificada" for undefined date', () => {
      const result = (component as any).formatDate(undefined);
      expect(result).toBe('No especificada');
    });

    it('should return "Fecha inválida" for invalid date', () => {
      spyOn(component['datePipe'], 'transform').and.returnValue(null);
      const result = (component as any).formatDate('invalid');
      expect(result).toBe('Fecha inválida');
    });
  });

  describe('component initialization', () => {
    it('should initialize tiposIdentificacion with correct options', () => {
      expect(component.tiposIdentificacion).toEqual([
        { value: 'cc', label: 'Cédula de Ciudadanía' },
        { value: 'ti', label: 'Tarjeta de Identidad' },
        { value: 'ce', label: 'Cédula de Extranjería' },
        { value: 'pa', label: 'Pasaporte' }
      ]);
    });

    it('should initialize registro as null', () => {
      expect(component.registro).toBeNull();
    });
  });
});
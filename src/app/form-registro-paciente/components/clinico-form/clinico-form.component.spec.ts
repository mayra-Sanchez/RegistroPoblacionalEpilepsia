import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { ClinicoFormComponent } from './clinico-form.component';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

interface Variable {
  id: string;
  researchLayerId: string;
  variableName: string;
  description: string;
  type: string;
  hasOptions: boolean;
  isEnabled: boolean;
  options: string[];
  createdAt: string;
  updatedAt: string;
  required?: boolean;
}

describe('ClinicoFormComponent', () => {
  let component: ClinicoFormComponent;
  let fixture: ComponentFixture<ClinicoFormComponent>;
  let consolaServiceSpy: jasmine.SpyObj<ConsolaRegistroService>;

  const mockVariables: Variable[] = [
    {
      id: '1',
      researchLayerId: 'layer1',
      variableName: 'Edad',
      description: 'Edad del paciente',
      type: 'Entero',
      hasOptions: false,
      isEnabled: true,
      options: [],
      createdAt: '',
      updatedAt: '',
      required: true
    },
    {
      id: '2',
      researchLayerId: 'layer1',
      variableName: 'Género',
      description: 'Género del paciente',
      type: 'Cadena',
      hasOptions: true,
      isEnabled: true,
      options: ['Masculino', 'Femenino'],
      createdAt: '',
      updatedAt: '',
      required: true
    },
    {
      id: '3',
      researchLayerId: 'layer1',
      variableName: 'Fumador',
      description: 'Indica si el paciente fuma',
      type: 'Lógico',
      hasOptions: false,
      isEnabled: true,
      options: [],
      createdAt: '',
      updatedAt: '',
      required: false
    }
  ];

  beforeEach(async () => {
    consolaServiceSpy = jasmine.createSpyObj('ConsolaRegistroService', ['obtenerVariablesPorCapa']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ClinicoFormComponent],
      providers: [
        FormBuilder,
        { provide: ConsolaRegistroService, useValue: consolaServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicoFormComponent);
    component = fixture.componentInstance;
    component.researchLayerId = 'layer1';
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Pruebas básicas', () => {
    it('debería crearse', () => {
      expect(component).toBeTruthy();
    });

    it('debería inicializar el formulario', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('variablesClinicas')).toBeInstanceOf(FormArray);
    });

    it('debería tener los tipos disponibles inicializados', () => {
      expect(component.availableTypes).toEqual(['Entero', 'Real', 'Cadena', 'Lógico', 'Fecha']);
    });
  });

  describe('loadVariables()', () => {
    it('debería cargar variables correctamente', fakeAsync(() => {
      consolaServiceSpy.obtenerVariablesPorCapa.and.returnValue(of(mockVariables));

      component.loadVariables();
      tick();

      expect(consolaServiceSpy.obtenerVariablesPorCapa).toHaveBeenCalledWith('layer1');
      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.variablesClinicas.length).toBe(3);
    }));

    it('debería manejar errores al cargar variables', fakeAsync(() => {
      consolaServiceSpy.obtenerVariablesPorCapa.and.returnValue(throwError(() => new Error('Error')));

      component.loadVariables();
      tick();

      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toBe('Error al cargar las variables. Por favor, intente nuevamente.');
    }));

    it('no debería cargar variables si no hay researchLayerId', () => {
      component.researchLayerId = '';
      component.loadVariables();

      expect(consolaServiceSpy.obtenerVariablesPorCapa).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('No se ha especificado una capa de investigación válida');
    });
  });

  describe('initializeForm()', () => {
    beforeEach(() => {
      consolaServiceSpy.obtenerVariablesPorCapa.and.returnValue(of(mockVariables));
      component.loadVariables();
    });

    it('debería crear grupos de formulario para cada variable', () => {
      expect(component.variablesClinicas.length).toBe(3);

      const firstGroup = component.variablesClinicas.at(0) as FormGroup;
      expect(firstGroup.get('id')?.value).toBe('1');
      expect(firstGroup.get('variableName')?.value).toBe('Edad');
      expect(firstGroup.get('type')?.value).toBe('Entero');
      expect(firstGroup.get('required')?.value).toBeTrue();

      const secondGroup = component.variablesClinicas.at(1) as FormGroup;
      expect(secondGroup.get('id')?.value).toBe('2');
      expect(secondGroup.get('type')?.value).toBe('Opciones');

      const thirdGroup = component.variablesClinicas.at(2) as FormGroup;
      expect(thirdGroup.get('type')?.value).toBe('Booleano');
    });

    it('debería aplicar validadores requeridos cuando corresponda', () => {
      const requiredGroup = component.variablesClinicas.at(0) as FormGroup;
      expect(requiredGroup.get('valor')?.validator).toBeTruthy();

      const optionalGroup = component.variablesClinicas.at(2) as FormGroup;
      expect(optionalGroup.get('valor')?.validator).toBeNull();
    });

    it('debería actualizar availableTypes según las variables cargadas', () => {
      expect(component.availableTypes).toEqual(['Entero', 'Opciones', 'Booleano']);
    });
  });

  describe('Filtros', () => {
    beforeEach(() => {
      consolaServiceSpy.obtenerVariablesPorCapa.and.returnValue(of(mockVariables));
      component.loadVariables();

      // Limpiar todos los valores antes de cada prueba
      component.variablesClinicas.controls.forEach(control => {
        control.get('valor')?.setValue(null);
      });
      component.applyFilters();
    });

    it('debería filtrar por término de búsqueda', () => {
      component.searchTerm = 'edad';
      component.applyFilters();

      expect(component.filteredVariables.length).toBe(1);
      expect(component.filteredVariables[0].get('variableName')?.value).toBe('Edad');
    });

    it('debería filtrar por descripción', () => {
      component.searchTerm = 'paciente';
      component.applyFilters();

      // Actualizado a 3 porque todas las variables mock tienen 'paciente' en la descripción
      expect(component.filteredVariables.length).toBe(3);
    });

    it('debería filtrar por tipo', () => {
      component.activeTypeFilter = 'Entero';
      component.applyFilters();

      expect(component.filteredVariables.length).toBe(1);
      expect(component.filteredVariables[0].get('type')?.value).toBe('Entero');
    });

    it('debería actualizar completedCount al aplicar filtros', () => {
      // Estado inicial limpio
      expect(component.completedVariables).toBe(0);

      // Establecer solo un valor requerido
      component.variablesClinicas.at(0).get('valor')?.setValue(30);
      component.applyFilters();

      expect(component.completedVariables).toBe(1);
    });
  });

  describe('Manejo de datos', () => {
    it('debería guardar y cargar desde localStorage', () => {
      consolaServiceSpy.obtenerVariablesPorCapa.and.returnValue(of(mockVariables));
      component.loadVariables();

      // Establecer valores
      component.variablesClinicas.at(0).get('valor')?.setValue(30);
      component.variablesClinicas.at(1).get('valor')?.setValue('Masculino');

      component.saveToLocalStorage();

      // Verificar localStorage
      const savedData = localStorage.getItem('clinicalFormData');
      expect(savedData).toBeTruthy();
      const parsedData = JSON.parse(savedData as string);
      expect(parsedData).toEqual([
        { id: '1', valor: 30 },
        { id: '2', valor: 'Masculino' },
        { id: '3', valor: null }
      ]);
    });

    it('debería obtener valores guardados correctamente', () => {
      component.initialData = [{ id: '1', valor: 25 }];
      expect(component.getSavedValue('1')).toBe(25);

      const notFoundValue = component.getSavedValue('99');
      expect(notFoundValue).toBeNull();
    });
  });

  describe('Validación y envío', () => {
    beforeEach(() => {
      consolaServiceSpy.obtenerVariablesPorCapa.and.returnValue(of(mockVariables));
      component.loadVariables();
    });

    it('debería emitir evento next al enviar con datos válidos', () => {
      spyOn(component.next, 'emit');

      // Llenar campos requeridos
      component.variablesClinicas.at(0).get('valor')?.setValue(30);
      component.variablesClinicas.at(1).get('valor')?.setValue('Masculino');

      component.onSubmit();

      expect(component.next.emit).toHaveBeenCalledWith([
        jasmine.objectContaining({ id: '1', value: 30, type: 'number' }),
        jasmine.objectContaining({ id: '2', value: 'Masculino', type: 'string' }),
        jasmine.objectContaining({ id: '3', value: null, type: 'boolean' })
      ]);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Interacción de usuario', () => {
    beforeEach(() => {
      consolaServiceSpy.obtenerVariablesPorCapa.and.returnValue(of(mockVariables));
      component.loadVariables();

      // Resetear todos los valores antes de cada prueba
      component.variablesClinicas.controls.forEach(control => {
        control.get('valor')?.setValue(null);
      });
      component.applyFilters();
    });

    it('debería actualizar contador al cambiar valores', () => {
      // Estado inicial
      expect(component.completedVariables).toBe(0);

      // Primer cambio - campo requerido
      component.variablesClinicas.at(0).get('valor')?.setValue(30);
      component.onInputChange(component.variablesClinicas.at(0) as FormGroup);
      expect(component.completedVariables).toBe(1);

      // Segundo cambio - campo requerido
      component.variablesClinicas.at(1).get('valor')?.setValue('Femenino');
      component.onInputChange(component.variablesClinicas.at(1) as FormGroup);
      expect(component.completedVariables).toBe(2);

      // Tercer cambio - campo no requerido (no debería afectar el contador)
      component.variablesClinicas.at(2).get('valor')?.setValue(true);
      component.onInputChange(component.variablesClinicas.at(2) as FormGroup);
      expect(component.completedVariables).toBe(2); // Sigue siendo 2 porque el tercero no es requerido
    });
  });
});
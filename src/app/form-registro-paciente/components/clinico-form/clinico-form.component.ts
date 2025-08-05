import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaRegistroService } from 'src/app/services/consola-registro.service';
import { Subject, takeUntil } from 'rxjs';

/**
 * Interfaz que define la estructura de una variable clínica
 */
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
  allowMultiple?: boolean;
}

/**
 * Componente para el formulario clínico
 * 
 * Este componente maneja la captura de variables clínicas con diferentes tipos de datos,
 * incluyendo validaciones, filtrado y persistencia local.
 */
@Component({
  selector: 'app-clinico-form',
  templateUrl: './clinico-form.component.html',
  styleUrls: ['./clinico-form.component.css']
})
export class ClinicoFormComponent implements OnInit, OnDestroy {
  /**
   * ID de la capa de investigación actual
   */
  @Input() researchLayerId: string = '';

  /**
   * Datos iniciales para el formulario
   */
  @Input() initialData: any[] = [];

  /**
   * Evento emitido al avanzar al siguiente paso
   */
  @Output() next = new EventEmitter<any[]>();

  /**
   * Evento emitido al retroceder al paso anterior
   */
  @Output() prev = new EventEmitter<void>();

  /**
   * Formulario reactivo principal
   */
  form: FormGroup;

  /**
   * Tipos de variables disponibles
   */
  availableTypes: string[] = ['Entero', 'Real', 'Cadena', 'Lógico', 'Fecha'];

  /**
   * Variables filtradas para mostrar
   */
  filteredVariables: FormGroup[] = [];

  /**
   * Término de búsqueda actual
   */
  searchTerm: string = '';

  /**
   * Filtro activo por tipo
   */
  activeTypeFilter: string = '';

  /**
   * Contador de variables completadas
   */
  completedVariables = 0;

  /**
   * Indica si está cargando datos
   */
  loading = false;

  /**
   * Mensaje de error actual
   */
  errorMessage = '';

  /**
   * Subject para manejar la destrucción del componente
   */
  private destroy$ = new Subject<void>();

  /**
   * Almacena valores actuales de las variables
   */
  private currentValues: Record<string, any> = {};

  /**
   * Constructor del componente
   * 
   * @param fb Servicio para construir formularios reactivos
   * @param consolaService Servicio para obtener variables clínicas
   */
  constructor(
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService
  ) {
    this.form = this.fb.group({
      variablesClinicas: this.fb.array([])
    });
  }

  /**
   * Método del ciclo de vida OnInit
   */
  ngOnInit(): void {
    this.loadFromLocalStorage();
    if (this.researchLayerId) {
      this.loadVariables();
    } else {
      this.availableTypes = [];
    }
  }

  /**
   * Método del ciclo de vida OnDestroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las variables clínicas desde el servicio
   */
  loadVariables(): void {
    if (!this.researchLayerId) {
      this.errorMessage = 'No se ha especificado una capa de investigación válida';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.variablesClinicas.clear();
    this.filteredVariables = [];

    this.consolaService.obtenerVariablesPorCapa(this.researchLayerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (variables) => {
          if (variables?.length > 0) {
            this.initializeForm(variables);
          } else {
            this.errorMessage = 'No se encontraron variables clínicas para esta capa';
          }
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = 'Error al cargar las variables. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
  }

  /**
   * Inicializa el formulario con las variables recibidas
   * 
   * @param variables Array de variables clínicas
   */
  initializeForm(variables: Variable[]): void {
    this.saveCurrentValues();
    this.variablesClinicas.clear();

    const uniqueDisplayTypes = new Set<string>();

    variables
      .filter(v => v.isEnabled)
      .forEach(variable => {
        const variableGroup = this.createVariableGroup(variable);
        this.variablesClinicas.push(variableGroup);
        const displayType = variableGroup.get('type')?.value;
        if (displayType) {
          uniqueDisplayTypes.add(displayType);
        }
      });

    this.availableTypes = Array.from(uniqueDisplayTypes).sort((a, b) => {
      const order = ['Entero', 'Decimal', 'Texto', 'Opciones', 'Booleano', 'Fecha'];
      return order.indexOf(a) - order.indexOf(b);
    });

    this.applyFilters();
  }

  /**
   * Guarda los valores actuales de las variables
   */
  private saveCurrentValues(): void {
    this.currentValues = {};
    this.variablesClinicas.controls.forEach(control => {
      this.currentValues[control.get('id')?.value] = control.get('valor')?.value;
    });
  }

  /**
   * Obtiene el valor guardado para una variable
   * 
   * @param variableId ID de la variable
   * @returns Valor guardado o null si no existe
   */
  getSavedValue(variableId: string): any {
    if (this.initialData && this.initialData.length > 0) {
      const initialVar = this.initialData.find((v: any) => v.id === variableId);
      if (initialVar) {
        return initialVar.valor;
      }
    }

    const savedData = localStorage.getItem('clinicalFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const savedVar = parsedData.find((v: any) => v.id === variableId);
        if (savedVar) {
          return savedVar.valor;
        }
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
  }

  /**
   * Establece el modo de selección para una variable
   * 
   * @param variableGroup Grupo de la variable
   * @param mode Modo de selección ('single' o 'multiple')
   */
  setSelectionMode(variableGroup: FormGroup, mode: 'single' | 'multiple'): void {
    variableGroup.get('selectionMode')?.setValue(mode);
    variableGroup.get('valor')?.setValue(null);
    this.onInputChange(variableGroup);
  }

  /**
   * Verifica si una opción está seleccionada
   * 
   * @param variableGroup Grupo de la variable
   * @param option Opción a verificar
   * @returns true si la opción está seleccionada
   */
  isOptionSelected(variableGroup: FormGroup, option: string): boolean {
    const currentValue = variableGroup.get('valor')?.value;
    return Array.isArray(currentValue) && currentValue.includes(option);
  }

  /**
   * Función trackBy para opciones
   * 
   * @param index Índice de la opción
   * @param option Valor de la opción
   * @returns Valor de la opción como identificador único
   */
  trackByOption(index: number, option: string): string {
    return option;
  }

  /**
   * Maneja cambios en selección múltiple
   * 
   * @param variableGroup Grupo de la variable
   * @param option Opción modificada
   * @param event Evento de cambio
   */
  onMultiSelectChange(variableGroup: FormGroup, option: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentValue = [...(variableGroup.get('valor')?.value || [])];

    if (isChecked) {
      if (!currentValue.includes(option)) {
        currentValue.push(option);
      }
    } else {
      const index = currentValue.indexOf(option);
      if (index > -1) {
        currentValue.splice(index, 1);
      }
    }

    variableGroup.get('valor')?.setValue(currentValue.length > 0 ? currentValue : null);
    this.onInputChange(variableGroup);
  }

  /**
   * Crea un grupo de formulario para una variable
   * 
   * @param variable Variable clínica
   * @returns FormGroup configurado
   */
  createVariableGroup(variable: Variable): FormGroup {
    const validators = variable.required ? [Validators.required] : [];
    const options = Array.isArray(variable.options) ? variable.options : [];

    let displayType = variable.type;

    if (options.length > 0) {
      displayType = 'Opciones';
    }
    else if (variable.type === 'Lógico') {
      displayType = 'Booleano';
    }
    else if (variable.type === 'Cadena') {
      displayType = 'Texto';
    } else if (variable.type === 'Real') {
      displayType = 'Decimal';
    }

    return this.fb.group({
      id: [variable.id],
      variableName: [variable.variableName],
      description: [variable.description],
      type: [displayType],
      hasOptions: [options.length > 0],
      options: [options],
      required: [variable.required || false],
      valor: [null, validators],
      selectionMode: ['single']
    });
  }

  /**
   * Guarda los valores actuales en localStorage
   */
  saveToLocalStorage(): void {
    const values = this.variablesClinicas.controls.map(control => ({
      id: control.get('id')?.value,
      valor: control.get('valor')?.value
    }));
    localStorage.setItem('clinicalFormData', JSON.stringify(values));
  }

  /**
   * Carga datos guardados desde localStorage
   */
  loadFromLocalStorage(): void {
    const savedData = localStorage.getItem('clinicalFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && !this.initialData) {
          this.initialData = parsedData;
        }
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
  }

  /**
   * Getter para el array de variables clínicas
   */
  get variablesClinicas(): FormArray {
    return this.form.get('variablesClinicas') as FormArray;
  }

  /**
   * Aplica los filtros de búsqueda y tipo
   */
  applyFilters(): void {
    let filtered = this.variablesClinicas.controls as FormGroup[];

    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(control => {
        const name = control.get('variableName')?.value?.toLowerCase() || '';
        const desc = control.get('description')?.value?.toLowerCase() || '';
        return name.includes(searchTermLower) || desc.includes(searchTermLower);
      });
    }

    if (this.activeTypeFilter) {
      filtered = filtered.filter(control =>
        control.get('type')?.value === this.activeTypeFilter
      );
    }

    this.filteredVariables = filtered;
    this.updateCompletedCount();
  }

  /**
   * Verifica si todos los campos requeridos están completados
   * 
   * @returns true si todos los campos requeridos están llenos
   */
  allRequiredFieldsFilled(): boolean {
    return this.variablesClinicas.controls.every(control => {
      if (control.get('required')?.value) {
        const value = control.get('valor')?.value;
        return value !== null && value !== undefined && value !== '';
      }
      return true;
    });
  }

  /**
   * Filtra las variables por tipo
   * 
   * @param type Tipo de variable a filtrar
   */
  filterByType(type: string): void {
    this.activeTypeFilter = type;
    this.applyFilters();
  }

  /**
   * Limpia el filtro por tipo
   */
  clearTypeFilter(): void {
    this.activeTypeFilter = '';
    this.applyFilters();
  }

  /**
   * Actualiza el contador de variables completadas
   */
  private updateCompletedCount(): void {
    this.completedVariables = this.filteredVariables
      .filter(control => {
        const isRequired = control.get('required')?.value;
        const value = control.get('valor')?.value;
        return isRequired && (value !== null && value !== undefined && value !== '');
      })
      .length;
  }

  /**
   * Obtiene el placeholder para un tipo de variable
   * 
   * @param variableGroup Grupo de la variable
   * @returns Texto del placeholder
   */
  getPlaceholder(variableGroup: FormGroup): string {
    const type = variableGroup.get('type')?.value;
    const name = variableGroup.get('variableName')?.value;

    const placeholders: Record<string, string> = {
      'Entero': `Ingrese ${name} (número entero)`,
      'Decimal': `Ingrese ${name} (número decimal)`,
      'Texto': `Ingrese ${name}`,
      'Booleano': `Seleccione ${name}`,
      'Fecha': `Seleccione fecha para ${name}`
    };

    return placeholders[type] || `Ingrese ${name}`;
  }

  /**
   * Obtiene la etiqueta legible para un tipo de variable
   * 
   * @param type Tipo de variable
   * @returns Etiqueta legible
   */
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Entero': 'Número entero',
      'Decimal': 'Número decimal',
      'Texto': 'Texto',
      'Booleano': 'Sí/No',
      'Opciones': 'Opciones',
      'Fecha': 'Fecha'
    };
    return labels[type] || type;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.form.valid && this.allRequiredFieldsFilled()) {
      this.saveToLocalStorage();
      const currentValues = this.variablesClinicas.controls.map(control => {
        const value = Array.isArray(control.get('valor')?.value)
          ? control.get('valor')?.value.join(',')
          : control.get('valor')?.value;

        return {
          id: control.get('id')?.value,
          value: value,
          type: this.mapToBackendType(control.get('type')?.value),
          researchLayerId: this.researchLayerId
        };
      });
      this.next.emit(currentValues);
    } else {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor complete todos los campos requeridos';
    }
  }

  /**
   * Maneja cambios en los inputs
   * 
   * @param variableGroup Grupo de la variable modificada
   */
  onInputChange(variableGroup: FormGroup) {
    variableGroup.get('valor')?.updateValueAndValidity();
    this.updateCompletedCount();
    this.saveToLocalStorage();
  }

  /**
   * Mapea tipos de frontend a tipos de backend
   * 
   * @param frontendType Tipo en frontend
   * @returns Tipo equivalente en backend
   */
  mapToBackendType(frontendType: string): string {
    const typeMap: Record<string, string> = {
      'Entero': 'number',
      'Decimal': 'number',
      'Texto': 'string',
      'Booleano': 'boolean',
      'Fecha': 'date',
      'Opciones': 'string',
      'OpcionesMúltiples': 'string[]'
    };
    return typeMap[frontendType] || 'string';
  }

  /**
   * Maneja el evento de retroceder
   */
  onPrevious(): void {
    this.saveToLocalStorage();
    this.prev.emit();
  }

  /**
   * Función trackBy para optimizar el rendimiento
   * 
   * @param index Índice del elemento
   * @param item Grupo de la variable
   * @returns ID único de la variable
   */
  trackByVariableId(index: number, item: FormGroup): string {
    return item.get('id')?.value;
  }
}
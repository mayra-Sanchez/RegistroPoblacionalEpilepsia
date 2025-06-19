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
}

@Component({
  selector: 'app-clinico-form',
  templateUrl: './clinico-form.component.html',
  styleUrls: ['./clinico-form.component.css']
})
export class ClinicoFormComponent implements OnInit, OnDestroy {
  // Inputs: Recibe datos del componente padre
  @Input() researchLayerId: string = ''; // ID de la capa de investigación
  @Input() initialData: any[] = []; // Datos iniciales para el formulario

  // Outputs: Emite eventos al componente padre
  @Output() next = new EventEmitter<any[]>(); // Evento al avanzar
  @Output() prev = new EventEmitter<void>(); // Evento al retroceder

  form: FormGroup; // Formulario reactivo principal
  availableTypes: string[] = ['Entero', 'Real', 'Cadena', 'Lógico', 'Fecha']; // Tipos de variables disponibles
  filteredVariables: FormGroup[] = []; // Variables filtradas para mostrar
  searchTerm: string = ''; // Término de búsqueda
  activeTypeFilter: string = ''; // Filtro activo por tipo
  completedVariables = 0; // Contador de variables completadas
  loading = false; // Estado de carga
  errorMessage = ''; // Mensaje de error

  private destroy$ = new Subject<void>(); // Subject para manejar la destrucción del componente
  private currentValues: Record<string, any> = {}; // Almacena valores actuales de las variables

  constructor(
    private fb: FormBuilder, // Servicio para construir formularios
    private consolaService: ConsolaRegistroService // Servicio para obtener variables clínicas
  ) {
    // Inicializa el formulario con un array de variables clínicas vacío
    this.form = this.fb.group({
      variablesClinicas: this.fb.array([])
    });
  }

  /**
   * Método del ciclo de vida: Se ejecuta al inicializar el componente
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
   * Método del ciclo de vida: Se ejecuta al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next(); // Emite señal de destrucción
    this.destroy$.complete(); // Completa el subject
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
    this.variablesClinicas.clear(); // Limpia el array de variables
    this.filteredVariables = [];

    this.consolaService.obtenerVariablesPorCapa(this.researchLayerId)
      .pipe(takeUntil(this.destroy$)) // Cancela la suscripción al destruir
      .subscribe({
        next: (variables) => {
          if (variables?.length > 0) {
            this.initializeForm(variables); // Inicializa el formulario con las variables
          } else {
            this.errorMessage = 'No se encontraron variables clínicas para esta capa';
          }
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = 'Error al cargar las variables. Por favor, intente nuevamente.';
          this.loading = false;
          console.error('Error loading clinical variables:', err);
        }
      });
  }

  /**
   * Inicializa el formulario con las variables recibidas
   * @param variables Array de variables clínicas
   */
  initializeForm(variables: Variable[]): void {
    this.saveCurrentValues();
    this.variablesClinicas.clear();

    // Calculate unique display types from actual variables
    const uniqueDisplayTypes = new Set<string>();

    variables
      .filter(v => v.isEnabled)
      .forEach(variable => {
        const variableGroup = this.createVariableGroup(variable);

        // Add to form array
        this.variablesClinicas.push(variableGroup);

        // Get display type and add to unique types
        const displayType = variableGroup.get('type')?.value;
        if (displayType) {
          uniqueDisplayTypes.add(displayType);
        }
      });

    // Update available types based on actual variables
    this.availableTypes = Array.from(uniqueDisplayTypes).sort((a, b) => {
      // Custom sorting to keep consistent order
      const order = ['Entero', 'Decimal', 'Texto', 'Opciones', 'Booleano', 'Fecha'];
      return order.indexOf(a) - order.indexOf(b);
    });

    this.applyFilters();
  }

  /**
   * Guarda los valores actuales de las variables en currentValues
   */
  private saveCurrentValues(): void {
    this.currentValues = {};
    this.variablesClinicas.controls.forEach(control => {
      this.currentValues[control.get('id')?.value] = control.get('valor')?.value;
    });
  }

  /**
   * Obtiene el valor guardado para una variable específica
   * @param variableId ID de la variable
   * @returns Valor guardado o null si no existe
   */
  getSavedValue(variableId: string): any {
    console.log('Buscando valor para:', variableId, 'InitialData:', this.initialData); // <-- Añade esto

    if (this.initialData && this.initialData.length > 0) {
      const initialVar = this.initialData.find((v: any) => v.id === variableId);
      if (initialVar) {
        console.log('Valor encontrado en initialData:', initialVar.valor); // <-- Añade esto
        return initialVar.valor;
      }
    }

    const savedData = localStorage.getItem('clinicalFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const savedVar = parsedData.find((v: any) => v.id === variableId);
        if (savedVar) {
          console.log('Valor encontrado en localStorage:', savedVar.valor); // <-- Añade esto
          return savedVar.valor;
        }
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }

    console.log('No se encontró valor para:', variableId); // <-- Añade esto
    return null;
  }

  /**
   * Crea un grupo de formulario para una variable
   * @param variable Variable clínica
   * @returns FormGroup configurado para la variable
   */
  createVariableGroup(variable: Variable): FormGroup {
    const validators = variable.required ? [Validators.required] : [];
    const options = Array.isArray(variable.options) ? variable.options : [];

    // Determinar el tipo de control a mostrar
    let displayType = variable.type;

    // Si tiene opciones, forzar el tipo a 'Opciones'
    if (options.length > 0) {
      displayType = 'Opciones';
    }
    // Si es Lógico sin opciones, mostrar como Booleano
    else if (variable.type === 'Lógico') {
      displayType = 'Booleano';
    }
    // Mapear otros tipos
    else if (variable.type === 'Cadena') {
      displayType = 'Texto';
    } else if (variable.type === 'Real') {
      displayType = 'Decimal';
    }

    return this.fb.group({
      id: [variable.id],
      variableName: [variable.variableName],
      description: [variable.description],
      type: [displayType], // Usar el tipo de visualización
      hasOptions: [options.length > 0],
      options: [options],
      required: [variable.required || false],
      valor: [null, validators]
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
   * Aplica los filtros de búsqueda y tipo a las variables
   */
  applyFilters(): void {
    console.log('Aplicando filtros. Término:', this.searchTerm, 'Tipo:', this.activeTypeFilter);
    let filtered = this.variablesClinicas.controls as FormGroup[];

    // Filtra por término de búsqueda
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(control => {
        const name = control.get('variableName')?.value?.toLowerCase() || '';
        const desc = control.get('description')?.value?.toLowerCase() || '';
        return name.includes(searchTermLower) || desc.includes(searchTermLower);
      });
    }

    // Filtra por tipo de variable
    if (this.activeTypeFilter) {
      filtered = filtered.filter(control =>
        control.get('type')?.value === this.activeTypeFilter
      );
    }

    this.filteredVariables = filtered;
    this.updateCompletedCount(); // Actualiza el contador de completadas
  }

  /**
   * Verifica si todos los campos requeridos están completados
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
   * Obtiene el placeholder adecuado para un tipo de variable
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
      // Prepara los datos para enviar al componente padre
      const currentValues = this.variablesClinicas.controls.map(control => ({
        id: control.get('id')?.value,
        value: control.get('valor')?.value,
        type: this.mapToBackendType(control.get('type')?.value),
        researchLayerId: this.researchLayerId
      }));
      this.next.emit(currentValues); // Emite los valores
    } else {
      this.form.markAllAsTouched(); // Marca todos los controles como tocados
      this.errorMessage = 'Por favor complete todos los campos requeridos';
    }
  }

  /**
   * Maneja cambios en los inputs
   * @param variableGroup Grupo de la variable modificada
   */
  onInputChange(variableGroup: FormGroup) {
    // Forza la actualización de la validación
    variableGroup.get('valor')?.updateValueAndValidity();
    this.updateCompletedCount();

    // Guarda automáticamente en localStorage
    this.saveToLocalStorage();
  }

  /**
   * Mapea tipos de frontend a tipos de backend
   * @param frontendType Tipo en frontend
   * @returns Tipo equivalente en backend
   */
  mapToBackendType(frontendType: string): string {
    const typeMap: Record<string, string> = {
      'Entero': 'number',
      'Decimal': 'number',
      'Texto': 'string',
      'Booleano': 'boolean',
      'Fecha': 'date'
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
   * Función trackBy para optimizar el rendimiento de ngFor
   * @param index Índice del elemento
   * @param item Grupo de la variable
   * @returns ID único de la variable
   */
  trackByVariableId(index: number, item: FormGroup): string {
    return item.get('id')?.value;
  }
}
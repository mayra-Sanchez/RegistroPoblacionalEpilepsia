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
 */
@Component({
  selector: 'app-clinico-form',
  templateUrl: './clinico-form.component.html',
  styleUrls: ['./clinico-form.component.css']
})
export class ClinicoFormComponent implements OnInit, OnDestroy {

  @Input() researchLayerId: string = '';
  @Input() initialData: any[] = [];
  @Output() next = new EventEmitter<any[]>();
  @Output() prev = new EventEmitter<void>();

  form: FormGroup;
  availableTypes: string[] = ['Entero', 'Real', 'Cadena', 'Lógico', 'Fecha'];
  filteredVariables: FormGroup[] = [];
  searchTerm: string = '';
  activeTypeFilter: string = '';
  completedVariables = 0;
  loading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();
  private currentValues: Record<string, any> = {};

  constructor(
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService
  ) {
    this.form = this.fb.group({
      variablesClinicas: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadFromLocalStorage();
    if (this.researchLayerId) {
      this.loadVariables();
    } else {
      this.availableTypes = [];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------------
  // Carga y manejo de variables
  // -----------------------------

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
            this.loadCurrentValues();
          } else {
            this.errorMessage = 'No se encontraron variables clínicas para esta capa';
          }
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Error al cargar las variables. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
  }

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
        if (displayType) uniqueDisplayTypes.add(displayType);
      });

    this.availableTypes = Array.from(uniqueDisplayTypes).sort((a, b) => {
      const order = ['Entero', 'Decimal', 'Texto', 'Opciones', 'Booleano', 'Fecha'];
      return order.indexOf(a) - order.indexOf(b);
    });

    this.applyFilters();
  }

  private saveCurrentValues(): void {
    this.currentValues = {};
    this.variablesClinicas.controls.forEach(control => {
      this.currentValues[control.get('id')?.value] = control.get('valor')?.value;
    });
  }

  private loadCurrentValues(): void {
    this.variablesClinicas.controls.forEach(control => {
      const saved = this.getSavedValue(control.get('id')?.value);
      control.get('valor')?.setValue(saved ?? null);
      this.currentValues[control.get('id')?.value] = saved ?? null;
    });
  }

  getSavedValue(variableId: string): any {
    if (this.initialData?.length > 0) {
      const initialVar = this.initialData.find(v => v.id === variableId);
      if (initialVar) return initialVar.valor;
    }
    const savedData = localStorage.getItem('clinicalFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const savedVar = parsedData.find((v: any) => v.id === variableId);
        if (savedVar) return savedVar.valor;
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    return null;
  }

  createVariableGroup(variable: Variable): FormGroup {
    const validators = variable.required ? [Validators.required] : [];
    const options = Array.isArray(variable.options) ? variable.options : [];

    let displayType = variable.type;
    if (options.length > 0) displayType = 'Opciones';
    else if (variable.type === 'Lógico') displayType = 'Booleano';
    else if (variable.type === 'Cadena') displayType = 'Texto';
    else if (variable.type === 'Real') displayType = 'Decimal';

    const initialValue = this.getSavedValue(variable.id) ?? null;

    return this.fb.group({
      id: [variable.id],
      variableName: [variable.variableName],
      description: [variable.description],
      type: [displayType],
      hasOptions: [options.length > 0],
      options: [options],
      required: [variable.required || false],
      valor: [initialValue, validators],
      selectionMode: ['single']
    });
  }

  saveToLocalStorage(): void {
    const values = this.variablesClinicas.controls.map(control => ({
      id: control.get('id')?.value,
      valor: control.get('valor')?.value
    }));
    localStorage.setItem('clinicalFormData', JSON.stringify(values));
  }

  loadFromLocalStorage(): void {
    const savedData = localStorage.getItem('clinicalFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && !this.initialData) this.initialData = parsedData;
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
  }

  // -----------------------------
  // Filtros y búsqueda
  // -----------------------------

  applyFilters(): void {
    this.filteredVariables = this.variablesClinicas.controls.filter(control => {
      const name = control.get('variableName')?.value?.toLowerCase() || '';
      const desc = control.get('description')?.value?.toLowerCase() || '';
      const type = control.get('type')?.value;

      const matchesSearch = this.searchTerm
        ? name.includes(this.searchTerm.toLowerCase()) || desc.includes(this.searchTerm.toLowerCase())
        : true;

      const matchesType = this.activeTypeFilter ? type === this.activeTypeFilter : true;

      return matchesSearch && matchesType;
    }) as FormGroup[];

    this.updateCompletedCount();
  }

  filterByType(type: string): void {
    this.activeTypeFilter = type;
    this.applyFilters();
  }

  clearTypeFilter(): void {
    this.activeTypeFilter = '';
    this.applyFilters();
  }

  private updateCompletedCount(): void {
    this.completedVariables = this.filteredVariables
      .filter(control => {
        const isRequired = control.get('required')?.value;
        const value = control.get('valor')?.value;
        return isRequired && (value !== null && value !== undefined && value !== '');
      }).length;
  }

  allRequiredFieldsFilled(): boolean {
    return this.variablesClinicas.controls.every(control => {
      if (control.get('required')?.value) {
        const value = control.get('valor')?.value;
        return value !== null && value !== undefined && value !== '';
      }
      return true;
    });
  }

  // -----------------------------
  // Eventos de formulario
  // -----------------------------

  onSubmit(): void {
    if (this.form.valid && this.allRequiredFieldsFilled()) {
      this.saveToLocalStorage();
      const currentValues = this.variablesClinicas.controls.map(control => {
        const frontendType = control.get('type')?.value;
        const backendType = this.mapToBackendType(frontendType);
        let value = control.get('valor')?.value;

        if (backendType === 'Number') {
          value = value !== null ? Number(value) : null;
        } else if (backendType === 'Date') {
          // 🔥 Asegurar formato YYYY-MM-DD
          if (value) {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              const year = dateObj.getFullYear();
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const day = dateObj.getDate().toString().padStart(2, '0');

              value = `${year}-${month}-${day}`;
              console.log('📅 Formatted date for clinical variable:', value);
            } else {
              value = null;
            }
          } else {
            value = null;
          }
        } else {
          value = value !== null ? String(value) : null;
        }

        return {
          id: control.get('id')?.value,
          value: value,
          type: backendType,
          researchLayerId: this.researchLayerId
        };
      });

      console.log('🔍 Clinical data before sending:', currentValues);
      this.next.emit(currentValues);
    } else {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor complete todos los campos requeridos';
    }
  }

  onPrevious(): void {
    this.saveToLocalStorage();
    this.prev.emit();
  }

  onInputChange(variableGroup: FormGroup) {
    variableGroup.get('valor')?.updateValueAndValidity();
    this.updateCompletedCount();
    this.saveToLocalStorage();
  }

  // -----------------------------
  // Helpers de UI
  // -----------------------------

  setSelectionMode(variableGroup: FormGroup, mode: 'single' | 'multiple'): void {
    variableGroup.get('selectionMode')?.setValue(mode);
    variableGroup.get('valor')?.setValue(null);
    this.onInputChange(variableGroup);
  }

  isOptionSelected(variableGroup: FormGroup, option: string): boolean {
    const currentValue = variableGroup.get('valor')?.value;
    return Array.isArray(currentValue) && currentValue.includes(option);
  }

  trackByOption(index: number, option: string): string {
    return option;
  }

  onMultiSelectChange(variableGroup: FormGroup, option: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentValue = [...(variableGroup.get('valor')?.value || [])];

    if (isChecked) {
      if (!currentValue.includes(option)) currentValue.push(option);
    } else {
      const index = currentValue.indexOf(option);
      if (index > -1) currentValue.splice(index, 1);
    }

    variableGroup.get('valor')?.setValue(currentValue.length > 0 ? currentValue : null);
    this.onInputChange(variableGroup);
  }

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

  trackByVariableId(index: number, item: FormGroup): string {
    return item.get('id')?.value;
  }

  mapToBackendType(frontendType: string): string {
    switch (frontendType) {
      case 'Entero':
      case 'Decimal':
        return 'Number';
      case 'Fecha':
        return 'Date';
      default:
        return 'String'; // texto, booleano, opciones, etc.
    }
  }


  get variablesClinicas(): FormArray {
    return this.form.get('variablesClinicas') as FormArray;
  }

}

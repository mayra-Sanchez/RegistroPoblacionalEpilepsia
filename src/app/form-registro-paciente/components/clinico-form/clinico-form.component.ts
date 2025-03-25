import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { Subject, takeUntil } from 'rxjs';

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
  @Input() researchLayerId: string = '';
  @Input() initialData: any[] = [];
  @Output() next = new EventEmitter<any[]>();
  @Output() prev = new EventEmitter<void>();

  form: FormGroup;
  availableTypes: string[] = ['Entero', 'Decimal', 'Texto', 'Booleano', 'Opciones', 'Fecha'];
  filteredVariables: FormGroup[] = [];
  searchTerm: string = '';
  activeTypeFilter: string = '';
  completedVariables = 0;
  loading = false;
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

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
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
          console.error('Error loading clinical variables:', err);
        }
      });
  }

  initializeForm(variables: Variable[]): void {
    const variablesArray = this.variablesClinicas;
    variablesArray.clear();

    variables
      .filter(v => v.isEnabled)
      .forEach(variable => {
        const variableGroup = this.createVariableGroup(variable);
        
        // Cargar valor inicial desde localStorage o input
        const savedValue = this.getSavedValue(variable.id);
        if (savedValue !== undefined && savedValue !== null) {
          variableGroup.patchValue({ valor: savedValue });
        }
        
        variablesArray.push(variableGroup);
      });

    this.applyFilters();
  }

  private getSavedValue(variableId: string): any {
    // Primero verificar localStorage
    const savedData = localStorage.getItem('clinicalFormData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const savedVar = parsedData.find((v: any) => v.id === variableId);
      if (savedVar) return savedVar.valor;
    }
    
    // Luego verificar initialData
    if (this.initialData) {
      const initialVar = this.initialData.find((v: any) => v.id === variableId);
      if (initialVar) return initialVar.valor;
    }
    
    return null;
  }

  createVariableGroup(variable: Variable): FormGroup {
    const validators = variable.required ? [Validators.required] : [];
    
    return this.fb.group({
      id: [variable.id],
      variableName: [variable.variableName],
      description: [variable.description],
      type: [variable.type],
      hasOptions: [variable.hasOptions],
      options: [variable.options || []],
      required: [variable.required || false],
      valor: [null, validators]
    });
  }

  private saveToLocalStorage(): void {
    const values = this.variablesClinicas.controls.map(control => ({
      id: control.get('id')?.value,
      valor: control.get('valor')?.value
    }));
    localStorage.setItem('clinicalFormData', JSON.stringify(values));
  }

  private loadFromLocalStorage(): void {
    const savedData = localStorage.getItem('clinicalFormData');
    if (savedData) {
      try {
        this.initialData = JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
  }

  get variablesClinicas(): FormArray {
    return this.form.get('variablesClinicas') as FormArray;
  }

  applyFilters(): void {
    let filtered = [...this.variablesClinicas.controls] as FormGroup[];
    
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

  allRequiredFieldsFilled(): boolean {
    return this.variablesClinicas.controls.every(control => {
      if (control.get('required')?.value) {
        const value = control.get('valor')?.value;
        return value !== null && value !== undefined && value !== '';
      }
      return true;
    });
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
    this.completedVariables = this.filteredVariables.filter(control => control.valid).length;
  }

  getPlaceholder(variableGroup: FormGroup): string {
    const type = variableGroup.get('type')?.value;
    const name = variableGroup.get('variableName')?.value;
    
    const placeholders: Record<string, string> = {
      'Entero': `Ingrese ${name} (número entero)`,
      'Decimal': `Ingrese ${name} (número decimal)`,
      'Texto': `Ingrese ${name}`,
      'Booleano': `Seleccione ${name}`,
      'Opciones': `Seleccione ${name}`,
      'Fecha': `Seleccione fecha para ${name}`
    };

    return placeholders[type] || `Ingrese ${name}`;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Entero': 'Número', 
      'Decimal': 'Decimal', 
      'Texto': 'Texto',
      'Booleano': 'Sí/No', 
      'Opciones': 'Opciones', 
      'Fecha': 'Fecha'
    };
    return labels[type] || type;
  }

  onSubmit(): void {
    if (this.form.valid && this.allRequiredFieldsFilled()) {
      this.saveToLocalStorage();
      const currentValues = this.variablesClinicas.controls.map(control => ({
        id: control.get('id')?.value,
        valor: control.get('valor')?.value
      }));
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
}
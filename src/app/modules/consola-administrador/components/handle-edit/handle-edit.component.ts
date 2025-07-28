import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-handle-edit',
  templateUrl: './handle-edit.component.html',
  styleUrls: ['./handle-edit.component.css']
})
export class HandleEditComponent implements OnInit {

  @Input() itemToEdit: any;
  @Input() editType: string = '';
  @Input() capas: any[] = [];
  @Output() saveChanges = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  editForm!: FormGroup;
  tieneOpciones: boolean = false;
  showPassword: boolean = false;
  private rolOriginal: string = '';
  selectedCapas: string[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    if (!this.itemToEdit) return;

    switch (this.editType) {
      case 'usuario':
        this.rolOriginal = this.itemToEdit.role;

        // Inicializar las capas seleccionadas
        this.selectedCapas = Array.isArray(this.itemToEdit.capaRawValue)
          ? [...this.itemToEdit.capaRawValue]
          : this.itemToEdit.capaRawValue
            ? [this.itemToEdit.capaRawValue]
            : [];

        this.editForm = this.fb.group({
          nombre: [this.itemToEdit.nombre, Validators.required],
          apellido: [this.itemToEdit.apellido, Validators.required],
          email: [this.itemToEdit.email, [Validators.required, Validators.email]],
          usuario: [this.itemToEdit.usuario, Validators.required],
          tipoDocumento: [{ value: this.itemToEdit.tipoDocumento, disabled: true }, Validators.required],
          documento: [this.itemToEdit.documento, Validators.required],
          fechaNacimiento: [this.itemToEdit.fechaNacimiento || ''],
          capas: [this.selectedCapas], // Usar el array de capas seleccionadas
          role: [this.itemToEdit.role, Validators.required],
          password: [''],
          lastPasswordUpdate: [
            this.itemToEdit.lastPasswordUpdate ||
            this.itemToEdit.attributes?.lastPasswordUpdate?.[0] ||
            'No registada'
          ]
        });
        break;

      case 'variable':
        this.tieneOpciones = Array.isArray(this.itemToEdit.options) && this.itemToEdit.options.length > 0;
        this.editForm = this.fb.group({
          variableName: [this.itemToEdit.variableName, Validators.required],
          description: [this.itemToEdit.description],
          type: [this.itemToEdit.type, Validators.required],
          researchLayerId: [this.itemToEdit.researchLayerId || this.capas[0]?.id, Validators.required],
          options: this.fb.array(
            this.tieneOpciones
              ? this.itemToEdit.options.map((opt: string) => this.fb.control(opt))
              : []
          )
        });
        break;

      case 'capa':
        this.editForm = this.fb.group({
          layerName: [this.itemToEdit.layerName, Validators.required],
          description: [this.itemToEdit.description],
          jefeNombre: [this.itemToEdit.layerBoss?.name || ''],
          jefeDocumento: [this.itemToEdit.layerBoss?.identificationNumber || '']
        });
        break;
    }
  }

  get opcionesArray(): FormArray {
    return this.editForm.get('options') as FormArray;
  }

  agregarOpcion(): void {
    this.opcionesArray.push(this.fb.control(''));
  }

  eliminarOpcion(index: number): void {
    this.opcionesArray.removeAt(index);
  }

  onTieneOpcionesChange(event: Event): void {
    this.tieneOpciones = (event.target as HTMLInputElement).checked;
    if (this.tieneOpciones) {
      if (this.opcionesArray.length === 0) {
        this.opcionesArray.push(this.fb.control(''));
      }
    } else {
      this.editForm.setControl('options', this.fb.array([]));
    }
  }

  confirmarCambioRol(): void {
    const nuevoRol = this.editForm.get('role')?.value;
    if (nuevoRol !== this.rolOriginal) {
      Swal.fire({
        icon: 'warning',
        title: 'Cambio de rol',
        text: 'Estás a punto de cambiar el rol de este usuario. ¿Estás segura?',
        confirmButtonText: 'Sí, continuar',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (!result.isConfirmed) {
          this.editForm.patchValue({ role: this.rolOriginal });
        }
      });
    }
  }

  guardarCambios(): void {
    if (this.editForm.invalid) return;

    const formValue = this.editForm.value;

    // Para usuarios, asegurar que capas sea un array
    if (this.editType === 'usuario') {
      formValue.capaRawValue = this.selectedCapas;
    }

    // Asegurar que los datos sean consistentes con itemToEdit
    if (this.editType === 'variable') {
      formValue.tieneOpciones = this.tieneOpciones;
      formValue.options = this.opcionesArray.value;
    }

    this.saveChanges.emit({ ...this.itemToEdit, ...formValue });
  }

  cerrarModal(): void {
    this.closeModal.emit();
  }

  getEditTypeIcon(): string {
    switch (this.editType) {
      case 'usuario': return 'fa-user-edit';
      case 'variable': return 'fa-pencil-alt';
      case 'capa': return 'fa-layer-group';
      default: return 'fa-edit';
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Método para manejar la selección/deselección de capas
  toggleCapaSelection(capaId: string): void {
    const index = this.selectedCapas.indexOf(capaId);
    if (index === -1) {
      this.selectedCapas.push(capaId);
    } else {
      this.selectedCapas.splice(index, 1);
    }
    this.editForm.patchValue({ capas: this.selectedCapas });
  }

  // Verificar si una capa está seleccionada
  isCapaSelected(capaId: string): boolean {
    // Verificar si la capa está en el array de capas seleccionadas
    return this.selectedCapas.includes(capaId);
  }

  private formatLastPasswordUpdate(dateString: string): string {
    if (!dateString) return 'No registrada';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES'); // Formato español
      // O para más control:
      // return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (e) {
      console.error('Error formateando fecha:', e);
      return dateString; // Devuelve el valor original si no se puede parsear
    }
  }
}

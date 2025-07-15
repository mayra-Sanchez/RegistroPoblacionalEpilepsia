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

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    if (!this.itemToEdit) return;

    switch (this.editType) {
      case 'usuario':
        this.rolOriginal = this.itemToEdit.role;
        this.editForm = this.fb.group({
          nombre: [this.itemToEdit.nombre, Validators.required],
          apellido: [this.itemToEdit.apellido, Validators.required],
          email: [this.itemToEdit.email, [Validators.required, Validators.email]],
          usuario: [this.itemToEdit.usuario, Validators.required],
          tipoDocumento: [{ value: this.itemToEdit.tipoDocumento, disabled: true }, Validators.required],
          documento: [this.itemToEdit.documento, Validators.required],
          fechaNacimiento: [this.itemToEdit.fechaNacimiento || ''],
          capaRawValue: [this.itemToEdit.capaRawValue || this.capas[0]?.id],
          role: [this.itemToEdit.role, Validators.required],
          password: ['']
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
}

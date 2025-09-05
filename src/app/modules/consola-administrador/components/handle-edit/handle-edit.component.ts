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
  mostrarTerminos: boolean = false;

  // guardamos el id "normalizado"
  private normalizedUserId?: string;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    if (!this.itemToEdit) return;

    // Normalizar/extraer id y capas desde la data entrante
    this.normalizedUserId = this.extractUserId(this.itemToEdit);
    this.selectedCapas = this.normalizeCapas(this.itemToEdit);

    switch (this.editType) {
      case 'usuario':
        this.rolOriginal = this.itemToEdit.role;

        this.editForm = this.fb.group({
          nombre: [this.itemToEdit.nombre || this.itemToEdit.firstName || '', Validators.required],
          apellido: [this.itemToEdit.apellido || this.itemToEdit.lastName || '', Validators.required],
          email: [this.itemToEdit.email || '', [Validators.required, Validators.email]],
          usuario: [this.itemToEdit.usuario || this.itemToEdit.username || '', Validators.required],
          // tipoDocumento lo mostramos readonly (disabled) para no permitir cambios aquí
          tipoDocumento: [{ value: this.itemToEdit.tipoDocumento || this.itemToEdit.identificationType || '', disabled: true }],
          documento: [this.itemToEdit.documento || this.itemToEdit.identificationNumber || '', Validators.required],
          fechaNacimiento: [this.itemToEdit.fechaNacimiento || this.itemToEdit.birthDate || ''],
          capas: [this.selectedCapas],
          role: [this.itemToEdit.role, Validators.required],
          password: [''],
          lastPasswordUpdate: [
            this.itemToEdit.lastPasswordUpdate ||
            this.itemToEdit.attributes?.lastPasswordUpdate?.[0] ||
            'No registrada'
          ],
          // en edición no forzamos requiredTrue (evita bloqueo si el usuario ya aceptó o no)
          acceptTermsAndConditions: [
            (this.itemToEdit.attributes?.acceptTermsAndConditions?.[0] === 'true') || false
          ]
        });
        break;

      case 'variable':
        this.tieneOpciones = Array.isArray(this.itemToEdit.options) && this.itemToEdit.options.length > 0;
        this.editForm = this.fb.group({
          variableName: [{ value: this.itemToEdit.variableName, disabled: true }, Validators.required],
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
          layerName: [{ value: this.itemToEdit.layerName, disabled: true }, Validators.required],
          description: [this.itemToEdit.description],
          jefeNombre: [this.itemToEdit.layerBoss?.name || ''],
          jefeDocumento: [this.itemToEdit.layerBoss?.identificationNumber || ''],
          jefeEmail: [this.itemToEdit.layerBoss?.email || '', [Validators.required, Validators.email]]
        });
        break;
    }

    console.log('[HandleEdit] itemToEdit:', this.itemToEdit);
    console.log('[HandleEdit] normalizedUserId:', this.normalizedUserId);
    console.log('[HandleEdit] selectedCapas:', this.selectedCapas);
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
        } else {
          // actualizar rolOriginal solo si confirmó
          this.rolOriginal = nuevoRol;
        }
      });
    }
  }

  abrirTerminos() {
    this.mostrarTerminos = true;
  }

  cerrarTerminos() {
    this.mostrarTerminos = false;
  }

  guardarCambios(): void {
    // validar formulario (getRawValue incluye campos deshabilitados)
    if (this.editForm.invalid) {
      Swal.fire('Formulario inválido', 'Revisa los campos obligatorios.', 'warning');
      return;
    }

    const formValue = this.editForm.getRawValue(); // incluye disabled values
    let payload: any;

    if (this.editType === 'usuario') {
      const userId = this.normalizedUserId;
      if (!userId) {
        Swal.fire('Error', 'No se encontró el ID del usuario a actualizar.', 'error');
        console.error('[HandleEdit] No userId disponible en itemToEdit:', this.itemToEdit);
        return;
      }

      payload = {
        firstName: formValue.nombre,
        lastName: formValue.apellido,
        email: formValue.email,
        username: formValue.usuario,
        // incluir password sólo si el usuario escribió una nueva (evita sobreescribir por vacío)
        ...(formValue.password ? { password: formValue.password } : {}),
        identificationType: formValue.tipoDocumento,
        identificationNumber: Number(formValue.documento),
        birthDate: this.normalizeDate(formValue.fechaNacimiento),
        researchLayer: Array.isArray(this.selectedCapas) ? this.selectedCapas : [],
        role: formValue.role,
        acceptTermsAndConditions: !!formValue.acceptTermsAndConditions
      };

      console.log('➡️ Guardar usuario');
      console.log('UserID (param):', userId);
      console.log('Payload (body):', payload);

      // Emitimos un objeto consistente: { userId, payload }
      this.saveChanges.emit({ userId, payload });
      return;
    }

    if (this.editType === 'variable') {
      payload = {
        ...this.itemToEdit,
        description: formValue.description,
        type: formValue.type,
        researchLayerId: formValue.researchLayerId,
        options: this.tieneOpciones ? formValue.options : []
      };

      console.log('➡️ Guardar variable');
      console.log('Payload:', payload);

      this.saveChanges.emit(payload);
      return;
    }

    if (this.editType === 'capa') {
      payload = {
        ...this.itemToEdit,
        description: formValue.description,
        layerBoss: {
          name: formValue.jefeNombre,
          identificationNumber: formValue.jefeDocumento,
          email: formValue.jefeEmail
        }
      };

      console.log('➡️ Guardar capa');
      console.log('Payload:', payload);

      this.saveChanges.emit(payload);
      return;
    }
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

  toggleCapaSelection(capaId: string): void {
    const index = this.selectedCapas.indexOf(capaId);
    if (index === -1) {
      this.selectedCapas.push(capaId);
    } else {
      this.selectedCapas.splice(index, 1);
    }
    // mantenemos el form sincronizado
    if (this.editForm) this.editForm.patchValue({ capas: this.selectedCapas });
  }

  isCapaSelected(capaId: string): boolean {
    return this.selectedCapas.includes(capaId);
  }

  // ------------ Helpers ------------
  private extractUserId(item: any): string | undefined {
    if (!item) return undefined;
    // campos más comunes
    const candidates = [
      item.id,
      item.userId,
      item._id,
      item.uuid,
      item.sub // en algunos JWT/objetos
    ];
    for (const c of candidates) {
      if (c) return String(c);
    }
    // attributes (Keycloak-like) donde el valor puede venir en arrays: attributes.userId[0]
    if (item.attributes) {
      const attrId = item.attributes.userId?.[0] || item.attributes.id?.[0] || item.attributes._id?.[0];
      if (attrId) return String(attrId);
    }
    return undefined;
  }

  private normalizeCapas(item: any): string[] {
    if (!item) return [];
    const raw = item.researchLayer ?? item.researchLayers ?? item.capaRawValue ?? item.capaId ?? item.capas;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      // array de strings o de objetos {id, nombre}
      return raw.map(r => typeof r === 'object' ? (r.id ?? r._id ?? r.value ?? '') : String(r)).filter(Boolean);
    }
    // string single
    if (typeof raw === 'string') return [raw];
    // objeto
    if (typeof raw === 'object') {
      // intentar extraer ids
      if (raw.id) return [String(raw.id)];
      if (raw._id) return [String(raw._id)];
    }
    return [];
  }

  private normalizeDate(dateStr: any): string | null {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

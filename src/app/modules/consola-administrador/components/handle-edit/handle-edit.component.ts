import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import Swal from 'sweetalert2';

/**
 * Componente reutilizable para manejar la edición de usuarios, variables y capas
 * Proporciona una interfaz consistente para diferentes tipos de edición
 */
@Component({
  selector: 'app-handle-edit',
  templateUrl: './handle-edit.component.html',
  styleUrls: ['./handle-edit.component.css']
})
export class HandleEditComponent implements OnInit {
  //#region Input Properties
  /** Item a editar (usuario, variable o capa) */
  @Input() itemToEdit: any;
  
  /** Tipo de edición: 'usuario', 'variable' o 'capa' */
  @Input() editType: string = '';
  
  /** Lista de capas disponibles para asignar */
  @Input() capas: any[] = [];
  //#endregion

  //#region Output Events
  /** Evento emitido al guardar los cambios */
  @Output() saveChanges = new EventEmitter<any>();
  
  /** Evento emitido al cerrar el modal */
  @Output() closeModal = new EventEmitter<void>();
  //#endregion

  //#region Propiedades del Componente
  /** Formulario reactivo para la edición */
  editForm!: FormGroup;
  
  /** Indica si la variable tiene opciones (para tipo 'variable') */
  tieneOpciones: boolean = false;
  
  /** Controla la visibilidad de la contraseña */
  showPassword: boolean = false;
  
  /** Rol original del usuario (para confirmación de cambios) */
  private rolOriginal: string = '';
  
  /** Capas seleccionadas para el usuario */
  selectedCapas: string[] = [];
  
  /** Controla la visibilidad del modal de términos */
  mostrarTerminos: boolean = false;
  
  /** ID normalizado del usuario */
  private normalizedUserId?: string;
  //#endregion

  //#region Constructor e Inicialización
  /**
   * Constructor del componente
   * @param fb FormBuilder para crear formularios reactivos
   */
  constructor(private fb: FormBuilder) { }

  /**
   * Inicialización del componente
   * Configura el formulario según el tipo de edición
   */
  ngOnInit(): void {
    if (!this.itemToEdit) {
      console.warn('No se proporcionó item para editar');
      return;
    }

    this.normalizedUserId = this.extractUserId(this.itemToEdit);
    this.selectedCapas = this.normalizeCapas(this.itemToEdit);

    this.initializeFormBasedOnType();
  }

  /**
   * Inicializa el formulario según el tipo de edición
   */
  private initializeFormBasedOnType(): void {
    switch (this.editType) {
      case 'usuario':
        this.initializeUsuarioForm();
        break;
      case 'variable':
        this.initializeVariableForm();
        break;
      case 'capa':
        this.initializeCapaForm();
        break;
      default:
        console.warn(`Tipo de edición no reconocido: ${this.editType}`);
    }
  }

  /**
   * Inicializa el formulario para edición de usuarios
   */
  private initializeUsuarioForm(): void {
    this.rolOriginal = this.itemToEdit.role;

    this.editForm = this.fb.group({
      nombre: [this.itemToEdit.nombre || this.itemToEdit.firstName || '', Validators.required],
      apellido: [this.itemToEdit.apellido || this.itemToEdit.lastName || '', Validators.required],
      email: [this.itemToEdit.email || '', [Validators.required, Validators.email]],
      usuario: [this.itemToEdit.usuario || this.itemToEdit.username || '', Validators.required],
      // tipoDocumento lo mostramos readonly (disabled) para no permitir cambios aquí
      tipoDocumento: [{ 
        value: this.itemToEdit.tipoDocumento || this.itemToEdit.identificationType || '', 
        disabled: true 
      }],
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
      acceptTermsAndConditions: [this.getAcceptTermsValue(this.itemToEdit)]
    });
  }

  /**
   * Inicializa el formulario para edición de variables
   */
  private initializeVariableForm(): void {
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
  }

  /**
   * Inicializa el formulario para edición de capas
   */
  private initializeCapaForm(): void {
    // Asegurarnos de que el email se carga correctamente
    const layerBossEmail = this.itemToEdit.layerBoss?.email || '';
    
    this.editForm = this.fb.group({
      layerName: [{ value: this.itemToEdit.layerName, disabled: true }, Validators.required],
      description: [this.itemToEdit.description || ''],
      jefeNombre: [this.itemToEdit.layerBoss?.name || ''],
      jefeDocumento: [this.itemToEdit.layerBoss?.identificationNumber || ''],
      jefeEmail: [layerBossEmail, [Validators.required, Validators.email]]
    });
  }
  //#endregion

  //#region Métodos de Utilidad para Formulario
  /**
   * Obtiene el valor de aceptación de términos
   * @param item Item del usuario
   * @returns Valor booleano para el campo de términos
   */
  private getAcceptTermsValue(item: any): boolean {
    // En una implementación real, verificaría si el usuario ya aceptó los términos
    return true; // Por defecto asumimos que ya aceptó para permitir edición
  }

  /**
   * Obtiene el FormArray de opciones (para variables)
   */
  get opcionesArray(): FormArray {
    return this.editForm.get('options') as FormArray;
  }

  /**
   * Agrega una nueva opción al array de opciones
   */
  agregarOpcion(): void {
    this.opcionesArray.push(this.fb.control('', Validators.required));
  }

  /**
   * Elimina una opción del array de opciones
   * @param index Índice de la opción a eliminar
   */
  eliminarOpcion(index: number): void {
    if (this.opcionesArray.length > 1) {
      this.opcionesArray.removeAt(index);
    } else {
      Swal.fire('Información', 'Debe haber al menos una opción', 'info');
    }
  }

  /**
   * Maneja el cambio en el checkbox de opciones
   * @param event Evento del checkbox
   */
  onTieneOpcionesChange(event: Event): void {
    this.tieneOpciones = (event.target as HTMLInputElement).checked;
    
    if (this.tieneOpciones) {
      if (this.opcionesArray.length === 0) {
        this.opcionesArray.push(this.fb.control('', Validators.required));
      }
    } else {
      this.editForm.setControl('options', this.fb.array([]));
    }
  }
  //#endregion

  //#region Métodos de Gestión de Usuarios
  /**
   * Confirma el cambio de rol del usuario
   */
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
          // Revertir al rol original si cancela
          this.editForm.patchValue({ role: this.rolOriginal });
        } else {
          // Actualizar rolOriginal solo si confirmó
          this.rolOriginal = nuevoRol;
        }
      });
    }
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  //#endregion

  //#region Métodos de Gestión de Términos y Condiciones
  /**
   * Abre el modal de términos y condiciones
   */
  abrirTerminos(): void {
    this.mostrarTerminos = true;
  }

  /**
   * Cierra el modal de términos y condiciones
   */
  cerrarTerminos(): void {
    this.mostrarTerminos = false;
  }

  /**
   * Maneja la aceptación de términos y condiciones
   */
  onAcceptTerms(): void {
    this.editForm.patchValue({ acceptTermsAndConditions: true });
    this.cerrarTerminos();
  }
  //#endregion

  //#region Métodos de Gestión de Capas
  /**
   * Alterna la selección de una capa
   * @param capaId ID de la capa a seleccionar/deseleccionar
   */
  toggleCapaSelection(capaId: string): void {
    const index = this.selectedCapas.indexOf(capaId);
    
    if (index === -1) {
      this.selectedCapas.push(capaId);
    } else {
      this.selectedCapas.splice(index, 1);
    }
    
    if (this.editForm) {
      this.editForm.patchValue({ capas: this.selectedCapas });
    }
  }

  /**
   * Verifica si una capa está seleccionada
   * @param capaId ID de la capa a verificar
   * @returns true si la capa está seleccionada
   */
  isCapaSelected(capaId: string): boolean {
    return this.selectedCapas.includes(capaId);
  }

  /**
   * Obtiene el nombre de una capa por su ID
   * @param capaId ID de la capa
   * @returns Nombre de la capa o 'Capa no encontrada'
   */
  getCapaName(capaId: string): string {
    const capa = this.capas.find(c => c.id === capaId);
    return capa?.layerName || 'Capa no encontrada';
  }
  //#endregion

  //#region Métodos Principales de Acción
  /**
   * Guarda los cambios del formulario
   */
  guardarCambios(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      Swal.fire('Formulario inválido', 'Revisa los campos obligatorios.', 'warning');
      return;
    }

    const formValue = this.editForm.getRawValue(); 
    
    switch (this.editType) {
      case 'usuario':
        this.guardarUsuario(formValue);
        break;
      case 'variable':
        this.guardarVariable(formValue);
        break;
      case 'capa':
        this.guardarCapa(formValue);
        break;
      default:
        console.error(`Tipo de edición no soportado: ${this.editType}`);
    }
  }

  /**
   * Prepara y emite los datos del usuario para guardar
   * @param formValue Valores del formulario
   */
  private guardarUsuario(formValue: any): void {
    const userId = this.normalizedUserId;
    
    if (!userId) {
      Swal.fire('Error', 'No se encontró el ID del usuario a actualizar.', 'error');
      console.error('[HandleEdit] No userId disponible en itemToEdit:', this.itemToEdit);
      return;
    }

    const payload = {
      firstName: formValue.nombre,
      lastName: formValue.apellido,
      email: formValue.email,
      username: formValue.usuario,
      ...(formValue.password ? { password: formValue.password } : {}),
      identificationType: formValue.tipoDocumento,
      identificationNumber: Number(formValue.documento),
      birthDate: this.normalizeDate(formValue.fechaNacimiento),
      researchLayer: Array.isArray(this.selectedCapas) ? this.selectedCapas : [],
      role: formValue.role,
      acceptTermsAndConditions: !!formValue.acceptTermsAndConditions
    };

    this.saveChanges.emit({ userId, payload });
  }

  /**
   * Prepara y emite los datos de la variable para guardar
   * @param formValue Valores del formulario
   */
  private guardarVariable(formValue: any): void {
    const payload = {
      ...this.itemToEdit,
      description: formValue.description,
      type: formValue.type,
      researchLayerId: formValue.researchLayerId,
      options: this.tieneOpciones ? formValue.options : []
    };

    this.saveChanges.emit(payload);
  }

  /**
   * Prepara y emite los datos de la capa para guardar
   * @param formValue Valores del formulario
   */
  private guardarCapa(formValue: any): void {
    const payload = {
      ...this.itemToEdit,
      description: formValue.description,
      layerBoss: {
        name: formValue.jefeNombre,
        identificationNumber: formValue.jefeDocumento,
        email: formValue.jefeEmail
      }
    };

    this.saveChanges.emit(payload);
  }

  /**
   * Cierra el modal de edición
   */
  cerrarModal(): void {
    if (this.editForm.dirty) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar. ¿Quieres salir sin guardar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'No, permanecer'
      }).then(result => {
        if (result.isConfirmed) {
          this.closeModal.emit();
        }
      });
    } else {
      this.closeModal.emit();
    }
  }
  //#endregion

  //#region Métodos de Utilidad para la UI
  /**
   * Obtiene el icono correspondiente al tipo de edición
   * @returns Clase del icono FontAwesome
   */
  getEditTypeIcon(): string {
    switch (this.editType) {
      case 'usuario': return 'fa-user-edit';
      case 'variable': return 'fa-pencil-alt';
      case 'capa': return 'fa-layer-group';
      default: return 'fa-edit';
    }
  }

  /**
   * Obtiene el título del modal según el tipo de edición
   * @returns Título del modal
   */
  getModalTitle(): string {
    switch (this.editType) {
      case 'usuario': return 'Editar Usuario';
      case 'variable': return 'Editar Variable';
      case 'capa': return 'Editar Capa de Investigación';
      default: return 'Editar';
    }
  }

  /**
   * Función trackBy para ngFor
   * @param index Índice del elemento
   * @returns Índice del elemento
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Verifica si el formulario es válido
   */
  get isFormValid(): boolean {
    return this.editForm?.valid || false;
  }

  /**
   * Verifica si el formulario tiene cambios sin guardar
   */
  get hasUnsavedChanges(): boolean {
    return this.editForm?.dirty || false;
  }
  //#endregion

  //#region Métodos de Normalización de Datos
  /**
   * Extrae el ID del usuario de diferentes estructuras de datos
   * @param item Item del que extraer el ID
   * @returns ID normalizado o undefined
   */
  private extractUserId(item: any): string | undefined {
    if (!item) return undefined;
    
    const candidates = [
      item.id,
      item.userId,
      item._id,
      item.uuid,
      item.sub
    ];
    
    for (const candidate of candidates) {
      if (candidate) return String(candidate);
    }
    
    if (item.attributes) {
      const attrId = item.attributes.userId?.[0] || item.attributes.id?.[0] || item.attributes._id?.[0];
      if (attrId) return String(attrId);
    }
    
    return undefined;
  }

  /**
   * Normaliza las capas desde diferentes estructuras de datos
   * @param item Item del que extraer las capas
   * @returns Array de IDs de capas
   */
  private normalizeCapas(item: any): string[] {
    if (!item) return [];
    
    const raw = item.researchLayer ?? item.researchLayers ?? item.capaRawValue ?? item.capaId ?? item.capas;
    if (!raw) return [];
    
    if (Array.isArray(raw)) {
      return raw.map(r => 
        typeof r === 'object' ? (r.id ?? r._id ?? r.value ?? '') : String(r)
      ).filter(Boolean);
    }
    
    if (typeof raw === 'string') return [raw];
    
    if (typeof raw === 'object') {
      if (raw.id) return [String(raw.id)];
      if (raw._id) return [String(raw._id)];
    }
    
    return [];
  }

  /**
   * Normaliza una fecha al formato YYYY-MM-DD
   * @param dateStr Valor de fecha a normalizar
   * @returns Fecha normalizada o null
   */
  private normalizeDate(dateStr: any): string | null {
    if (!dateStr) return null;
    
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  //#endregion

  //#region Métodos de Validación
  /**
   * Marca recursivamente todos los controles de un FormGroup como touched
   * @param formGroup Grupo de formulario a marcar
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName Nombre del campo
   * @returns Mensaje de error
   */
  getErrorMessage(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    
    if (control?.errors?.['required']) {
      return 'Este campo es requerido';
    }
    
    if (control?.errors?.['email']) {
      return 'El formato del email no es válido';
    }
    
    return 'Valor inválido';
  }
  //#endregion
}
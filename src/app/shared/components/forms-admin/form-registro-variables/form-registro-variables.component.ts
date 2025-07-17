import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import Swal from 'sweetalert2';

/**
 * Interfaz para representar una capa de investigación
 */
interface CapaInvestigacion {
  id: string;
  layerName: string;
}

/**
 * Componente para el registro de variables de investigación
 * 
 * Permite crear nuevas variables asociadas a capas de investigación,
 * con opciones configurables según el tipo de variable.
 * 
 * @example
 * <app-form-registro-variables (variableCreada)="recargarVariables()"></app-form-registro-variables>
 */
@Component({
  selector: 'app-form-registro-variables',
  templateUrl: './form-registro-variables.component.html',
  styleUrls: ['./form-registro-variables.component.css']
})
export class FormRegistroVariablesComponent implements OnInit {
  /**
   * Evento emitido cuando se crea una nueva variable
   */
  @Output() variableCreada = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  /**
   * Formulario reactivo para el registro de variables
   */
  form: FormGroup;

  mostrarCamposFaltantes: boolean = false;

  /**
   * Listado de capas de investigación disponibles
   */
  capasInvestigacion: CapaInvestigacion[] = [];

  /**
   * Tipos de variables disponibles
   */
  tipos = [
    { valor: 'Entero', descripcion: 'Ej: 1, 2, 3' },
    { valor: 'Real', descripcion: 'Ej: 1.5, 2.75, 3.14' },
    { valor: 'Cadena', descripcion: 'Ej: texto como "Juan", "Azul"' },
    { valor: 'Fecha', descripcion: 'Ej: 2023-04-01' },
    { valor: 'Lógico', descripcion: 'Ej: Verdadero o Falso' }
  ];


  /**
   * Constructor del componente
   * @param fb Servicio para construir formularios reactivos
   * @param variableService Servicio para operaciones con variables
   */
  constructor(
    private fb: FormBuilder,
    private variableService: ConsolaAdministradorService
  ) {
    this.form = this.fb.group({
      variableName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      type: ['', Validators.required],
      researchLayerId: ['', Validators.required],
      hasOptions: [false],
      options: this.fb.array([])
    });
  }

  /**
   * Método de inicialización del componente
   * Carga las capas de investigación disponibles
   */
  ngOnInit(): void {
    this.variableService.getAllLayers().subscribe({
      next: (data) => {
        this.capasInvestigacion = data;
      },
      error: (err) => {
        console.error('Error al obtener las capas:', err);
      }
    });
  }

  /**
   * Obtiene el FormArray de opciones
   */
  get options(): FormArray {
    return this.form.get('options') as FormArray;
  }

  /**
   * Agrega una nueva opción al formulario
   */
  agregarOpcion() {
    const nuevaOpcion = ''; // Por defecto está vacía al agregar
    const opcionesActuales = this.options.controls.map((ctrl) =>
      (ctrl.value || '').trim().toLowerCase()
    );

    if (opcionesActuales.includes(nuevaOpcion)) {
      Swal.fire({
        icon: 'warning',
        title: 'Opción duplicada',
        text: 'Ya existe una opción con el mismo nombre.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.options.push(this.fb.control('', [Validators.required, this.validarDuplicadoOpciones()]));
  }

  private validarDuplicadoOpciones() {
    return (control: any) => {
      const valor = (control.value || '').trim().toLowerCase();
      const existentes = this.options.controls
        .map((ctrl) => (ctrl.value || '').trim().toLowerCase());

      const repetidos = existentes.filter(v => v === valor).length;
      if (repetidos > 1) {
        return { duplicado: true };
      }
      return null;
    };
  }



  /**
   * Elimina una opción del formulario
   * @param index Índice de la opción a eliminar
   */
  eliminarOpcion(index: number) {
    this.options.removeAt(index);
  }

  /**
   * Maneja el cambio en el campo hasOptions
   * Limpia las opciones si se desactiva
   */
  onHasOptionsChange() {
    if (!this.form.value.hasOptions) {
      this.options.clear();
    }
  }


  /**
   * Crea una nueva variable
   * Valida el formulario y realiza la petición al servidor
   */
  crearVariable() {
    if (this.form.invalid) {
      const errores = this.getErroresFormulario();
      const mensaje = errores.length > 0
        ? `<ul style="text-align: left;">${errores.map(e => `<li>• ${e}</li>`).join('')}</ul>`
        : 'Complete todos los campos correctamente.';

      Swal.fire({
        title: 'Formulario incompleto',
        html: `
        <p>Faltan los siguientes campos por completar:</p>
        ${mensaje}
      `,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'swal2-border'
        }
      });
      return;
    }

    const formValue = this.form.value;
    const variableData = {
      variableName: formValue.variableName.trim(),
      description: formValue.description.trim(),
      type: formValue.type,
      researchLayerId: formValue.researchLayerId,
      options: formValue.hasOptions ? this.options.value : [],
      selectionType: formValue.hasOptions ? formValue.selectionType : null
    };

    // Validación: si tiene opciones, al menos una debe existir
    if (formValue.hasOptions && variableData.options.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'Debe agregar al menos una opción.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar registro?',
      text: '¿Estás seguro de registrar esta variable?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.variableService.crearVariable(variableData).subscribe({
          next: () => {
            this.mostrarExito();
            this.limpiarFormulario();
            this.variableCreada.emit();
          },
          error: (error) => {
            this.mostrarError(error);
          }
        });
      }
    });
  }


  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito() {
    Swal.fire({
      title: '¡Variable Creada! 🎉',
      html: `
        <div style="text-align: center;">
          <p>La variable ha sido registrada con éxito.</p>
          <img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" 
            alt="Éxito" style="width: 150px; margin-top: 10px;">
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
      background: '#f1f8ff',
      timer: 5000,
      timerProgressBar: true
    });
  }

  onCancel() {
    Swal.fire({
      title: '¿Cancelar registro?',
      text: '¿Estás seguro de que deseas cancelar el registro?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cancelar.emit();
      }
    });
  }

  /**
   * Muestra mensaje de error
   * @param error Error recibido
   */
  private mostrarError(error: any): void {
    console.error('Error al crear la variable:', error);

    let mensaje = 'Hubo un problema inesperado al registrar la variable.';

    if (error?.error?.message) {
      mensaje = error.error.message;
    } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
      mensaje = error.error.errors
        .map((e: any) => e.msg || e.message || 'Error desconocido')
        .join('\n');
    } else if (error?.message) {
      mensaje = error.message;
    }

    Swal.fire({
      title: 'Error al registrar',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }

  /**
   * Limpia el formulario
   */
  limpiarFormulario() {
    this.form.reset();
    this.options.clear();
  }

  /**
   * Verifica si un campo es inválido
   * @param campo Nombre del campo a verificar
   * @returns True si el campo es inválido y ha sido tocado
   */
  campoEsValido(campo: string): boolean {
    const control = this.form.get(campo);
    return control ? control.invalid && control.touched : false;
  }

  getErroresFormulario(): string[] {
    const errores: string[] = [];

    if (this.form.get('variableName')?.invalid) {
      errores.push('Nombre');
    }
    if (this.form.get('description')?.invalid) {
      errores.push('Descripción');
    }
    if (this.form.get('type')?.invalid) {
      errores.push('Tipo');
    }
    if (this.form.get('researchLayerId')?.invalid) {
      errores.push('Capa');
    }
    if (this.form.value.hasOptions && this.options.length === 0) {
      errores.push('Opciones');
    }

    return errores;
  }


  getErroresTooltip(): string | null {
    if (!this.form.invalid) return null;

    const errores = this.getErroresFormulario();
    return errores.length
      ? 'Faltan: ' + errores.join(', ')
      : 'Formulario incompleto';
  }

}
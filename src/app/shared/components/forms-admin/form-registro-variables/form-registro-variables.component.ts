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

  /**
   * Formulario reactivo para el registro de variables
   */
  form: FormGroup;

  /**
   * Listado de capas de investigación disponibles
   */
  capasInvestigacion: CapaInvestigacion[] = [];

  /**
   * Tipos de variables disponibles
   */
  tipos = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];

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
      description: ['', [Validators.required, Validators.minLength(5)]],
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
    this.options.push(this.fb.control('', Validators.required));
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
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Complete todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
  
    const formValue = this.form.value;
    const variableData = {
      variableName: formValue.variableName,
      description: formValue.description,
      type: formValue.type,
      researchLayerId: formValue.researchLayerId,
      options: formValue.hasOptions ? this.options.value : []
    };
  
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
          next: (response) => {
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

  /**
   * Muestra mensaje de error
   * @param error Error recibido
   */
  private mostrarError(error: any) {
    console.error('Error al crear la variable:', error);
    Swal.fire({
      title: 'Error',
      text: 'Hubo un problema al registrar la variable.',
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
}
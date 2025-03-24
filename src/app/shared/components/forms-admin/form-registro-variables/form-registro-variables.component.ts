import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import Swal from 'sweetalert2';

interface CapaInvestigacion {
  id: string;
  layerName: string;
}

@Component({
  selector: 'app-form-registro-variables',
  templateUrl: './form-registro-variables.component.html',
  styleUrls: ['./form-registro-variables.component.css']
})
export class FormRegistroVariablesComponent implements OnInit {
  @Output() variableCreada = new EventEmitter<void>();
  form: FormGroup;
  capasInvestigacion: CapaInvestigacion[] = [];
  tipos = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];

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

  get options(): FormArray {
    return this.form.get('options') as FormArray;
  }

  agregarOpcion() {
    this.options.push(this.fb.control('', Validators.required));
  }

  eliminarOpcion(index: number) {
    this.options.removeAt(index);
  }

  onHasOptionsChange() {
    if (!this.form.value.hasOptions) {
      this.options.clear();
    }
  }

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
  
    // Check if options are required but empty
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
            this.limpiarFormulario();
            this.variableCreada.emit();
          },
          error: (error) => {
            console.error('Error al crear la variable:', error);
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al registrar la variable.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  limpiarFormulario() {
    this.form.reset();
    this.options.clear();
  }

  campoEsValido(campo: string): boolean {
    const control = this.form.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}
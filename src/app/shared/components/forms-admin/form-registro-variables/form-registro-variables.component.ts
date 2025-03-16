import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalConfirmacionComponent } from '../../modal-confirmacion/modal-confirmacion.component';

interface CapaInvestigacion {
  id: string;
  nombreCapa: string;
}

@Component({
  selector: 'app-form-registro-variables',
  templateUrl: './form-registro-variables.component.html',
  styleUrls: ['./form-registro-variables.component.css']
})
export class FormRegistroVariablesComponent implements OnInit {
  form: FormGroup;
  capasInvestigacion: CapaInvestigacion[] = [];
  tipos = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];

  constructor(
    private fb: FormBuilder,
    private variableService: ConsolaAdministradorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      nombreVariable: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      tipo: ['', Validators.required],
      idCapaInvestigacion: ['', Validators.required],
      tieneOpciones: [false],
      opciones: this.fb.array([])
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

  get opciones(): FormArray {
    return this.form.get('opciones') as FormArray;
  }

  agregarOpcion() {
    this.opciones.push(this.fb.group({ opcion: ['', Validators.required] }));
  }

  eliminarOpcion(index: number) {
    this.opciones.removeAt(index);
  }

  onTieneOpcionesChange() {
    if (!this.form.value.tieneOpciones) {
      this.opciones.clear();
    }
  }

  crearVariable() {
    if (this.form.invalid) {
      this.snackBar.open('Formulario inválido. Complete todos los campos correctamente.', 'Cerrar', { duration: 3000 });
      return;
    }

    const variableData = {
      ...this.form.value,
      opciones: this.form.value.tieneOpciones ? this.opciones.value.map((o: any) => o.opcion) : []
    };

    if (variableData.tieneOpciones && variableData.opciones.length === 0) {
      this.snackBar.open('Debe agregar al menos una opción.', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('Datos enviados para crear variable:', variableData);

    const dialogRef = this.dialog.open(ModalConfirmacionComponent, {
      width: '300px',
      panelClass: 'custom-modal',
      data: {
        titulo: 'Confirmar variable',
        mensaje: '¿Estás seguro de registrar esta variable?'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.variableService.crearVariable(variableData).subscribe({
          next: (response) => {
            console.log('Variable registrada en el backend:', response);
            this.snackBar.open('Variable registrada con éxito', 'Cerrar', { duration: 3000 });
            this.limpiarFormulario();
          },
          error: (error) => {
            console.error('Error al crear la variable:', error);
            this.snackBar.open('Error al registrar la variable', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  limpiarFormulario() {
    this.form.reset();
    this.opciones.clear();
  }

  campoEsValido(campo: string): boolean {
    const control = this.form.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}

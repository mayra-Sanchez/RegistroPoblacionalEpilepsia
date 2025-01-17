import { Component, OnInit } from '@angular/core';
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
  nuevaVariable = {
    id: '',
    idCapaInvestigacion: '',
    nombreVariable: '',
    descripcion: '',
    tipo: ''
  };

  tipos = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];
  capasInvestigacion: CapaInvestigacion[] = [];  // Usar la interfaz aquí
  selectedLayerId: string = '';  // Definir la variable selectedLayerId

  constructor(private variableService: ConsolaAdministradorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Obtener todas las capas de investigación cuando se carga el componente
    this.variableService.getAllLayers().subscribe({
      next: (data) => {
        this.capasInvestigacion = data;
      },
      error: (err) => {
        console.error('Error al obtener las capas:', err);
      }
    });
  }

  // Manejar la selección de la capa de investigación
  onLayerSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement | null; // Asegúrate de que `event.target` no sea null
    if (selectElement) { // Comprueba si selectElement no es null
      this.selectedLayerId = selectElement.value; // Ahora TypeScript reconoce que `value` es válido
      this.nuevaVariable.idCapaInvestigacion = this.selectedLayerId;
      console.log('Capa seleccionada, ID:', this.selectedLayerId);
    } else {
      console.error('El evento no proviene de un <select> válido.');
    }
  }


  crearVariable() {
    const variableData = {
      id: this.nuevaVariable.id || '',
      idCapaInvestigacion: this.nuevaVariable.idCapaInvestigacion,
      nombreVariable: this.nuevaVariable.nombreVariable,
      descripcion: this.nuevaVariable.descripcion,
      tipo: this.nuevaVariable.tipo
    };

    console.log('Datos enviados para crear variable:', variableData);

    // Mostrar un diálogo de confirmación antes de enviar los datos
    const dialogRef = this.dialog.open(ModalConfirmacionComponent, {
      width: '300px',
      panelClass: 'custom-modal',
      data: { // Pasar los datos directamente
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
    this.nuevaVariable = {
      id: '',
      idCapaInvestigacion: '',
      nombreVariable: '',
      descripcion: '',
      tipo: ''
    };
    this.selectedLayerId = '';
  }
}
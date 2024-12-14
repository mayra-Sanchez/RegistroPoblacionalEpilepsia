import { Component } from '@angular/core';

@Component({
  selector: 'app-form-registro-variables',
  templateUrl: './form-registro-variables.component.html',
  styleUrls: ['./form-registro-variables.component.css']
})
export class FormRegistroVariablesComponent {
  // Modelo de datos para el formulario
  nuevaVariable = {
    nombre: '',
    descripcion: '',
    tipo: '',
    capaInvestigacion: ''
  };

  tipos = ['Tipo 1', 'Tipo 2', 'Tipo 3'];
  capasInvestigacion = ['Capa 1', 'Capa 2', 'Capa 3'];

  // Método para manejar el submit
  crearVariable() {
    console.log('Variable creada:', this.nuevaVariable);

    // Aquí puedes realizar el envío de los datos al backend
    // Ejemplo: this.variableService.crearVariable(this.nuevaVariable).subscribe(...)
    
    // Limpiar el formulario después de crear la variable
    this.nuevaVariable = {
      nombre: '',
      descripcion: '',
      tipo: '',
      capaInvestigacion: ''
    };
  }

}

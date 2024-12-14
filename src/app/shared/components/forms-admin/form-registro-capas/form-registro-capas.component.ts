import { Component } from '@angular/core';

@Component({
  selector: 'app-form-registro-capas',
  templateUrl: './form-registro-capas.component.html',
  styleUrls: ['./form-registro-capas.component.css']
})
export class FormRegistroCapasComponent {
  nuevaCapa = {
    nombre: '',
    descripcion: '',
    jefeCapa: '',
    identificacionJefe: ''
  };

  // Método para manejar el submit del formulario
  registrarCapa() {
    console.log('Capa registrada:', this.nuevaCapa);

    // Aquí puedes agregar la lógica para enviar los datos al backend
    // Ejemplo: this.capaService.registrarCapa(this.nuevaCapa).subscribe(...);

    // Limpiar el formulario después del registro
    this.nuevaCapa = {
      nombre: '',
      descripcion: '',
      jefeCapa: '',
      identificacionJefe: ''
    };
  }
}

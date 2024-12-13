import { Component } from '@angular/core';

@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent {
  selectedTab: string = 'inicioAdmin'; 
  
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  usuariosData = [
    { nombre: 'Lorem', apellido: 'Parra', documento: '12345', capa: 'Investigación de depresión', rol: 'Médico' },
    { nombre: 'Lorem', apellido: 'Ipsum', documento: '67890', capa: 'Investigación de ansiedad', rol: 'Médico' },
    { nombre: 'Carlos', apellido: 'López', documento: '11223', capa: 'Investigación de estrés', rol: 'Psicólogo' },
    { nombre: 'Ana', apellido: 'Gómez', documento: '44556', capa: 'Investigación de trauma', rol: 'Médico' },
    { nombre: 'Juan', apellido: 'Martínez', documento: '78901', capa: 'Investigación de ansiedad', rol: 'Psiquiatra' },
    { nombre: 'Elena', apellido: 'Rodríguez', documento: '23456', capa: 'Investigación de depresión', rol: 'Psicóloga' },
    { nombre: 'Pedro', apellido: 'Sánchez', documento: '34567', capa: 'Investigación de adicción', rol: 'Médico' },
    { nombre: 'María', apellido: 'Fernández', documento: '45678', capa: 'Investigación de estrés', rol: 'Psicóloga' },
    { nombre: 'Luis', apellido: 'Ramírez', documento: '56789', capa: 'Investigación de trauma', rol: 'Psiquiatra' },
    { nombre: 'Sofia', apellido: 'Pérez', documento: '67801', capa: 'Investigación de depresión', rol: 'Médico' },
  ];

  variablesData = [
    { nombre: 'Altura', descripcion: 'Numérico', capa: 'Depresión y epilepsia', tipo: 'númerico' },
    { nombre: 'Peso', descripcion: 'Numérico', capa: 'Estrés y ansiedad', tipo: 'númerico' },
    { nombre: 'Edad', descripcion: 'Numérico', capa: 'Estrés y trauma', tipo: 'númerico' },
    { nombre: 'Frecuencia cardiaca', descripcion: 'Numérico', capa: 'Ansiedad y depresión', tipo: 'númerico' },
    { nombre: 'Saturación de oxígeno', descripcion: 'Porcentaje', capa: 'Adicción y trauma', tipo: 'porcentaje' },
    { nombre: 'Temperatura corporal', descripcion: 'Grados Celsius', capa: 'Depresión y epilepsia', tipo: 'númerico' },
    { nombre: 'Presión arterial', descripcion: 'Numérico', capa: 'Estrés y ansiedad', tipo: 'númerico' },
    { nombre: 'Nivel de ansiedad', descripcion: 'Escala de 1 a 10', capa: 'Ansiedad y estrés', tipo: 'escala' },
    { nombre: 'Nivel de depresión', descripcion: 'Escala de 1 a 10', capa: 'Depresión y trauma', tipo: 'escala' },
    { nombre: 'Nivel de cortisol', descripcion: 'Nanogramos por decilitro', capa: 'Estrés y adicción', tipo: 'numérico' },
  ];

  capasData = [
    { nombre: 'Depresión y epilepsia', descripcion: 'Estudio sobre la relación entre depresión y epilepsia', jefe: 'Antonio' },
    { nombre: 'Estrés y ansiedad', descripcion: 'Investigación sobre los efectos del estrés y la ansiedad en la salud mental', jefe: 'Carlos' },
    { nombre: 'Trauma y adicción', descripcion: 'Investigación sobre el impacto del trauma y la adicción en los pacientes', jefe: 'Elena' },
    { nombre: 'Ansiedad y depresión', descripcion: 'Estudio sobre la comorbilidad de la ansiedad y la depresión', jefe: 'María' },
    { nombre: 'Estrés y trauma', descripcion: 'Investigación sobre la relación entre el estrés y el trauma psicológico', jefe: 'Luis' },
    { nombre: 'Estrés y adicción', descripcion: 'Estudio de cómo el estrés contribuye a la adicción', jefe: 'Juan' },
    { nombre: 'Depresión y trauma', descripcion: 'Investigación sobre la relación entre depresión y trauma psicológico', jefe: 'Sofía' },
    { nombre: 'Adicción y ansiedad', descripcion: 'Estudio sobre la comorbilidad de la ansiedad y la adicción', jefe: 'Pedro' },
    { nombre: 'Estrés y salud cardiovascular', descripcion: 'Investigación sobre el impacto del estrés en la salud cardiovascular', jefe: 'Antonio' },
    { nombre: 'Ansiedad y salud mental', descripcion: 'Investigación sobre los efectos de la ansiedad en la salud mental a largo plazo', jefe: 'Carlos' },
  ];

  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'apellido', header: 'Apellido' },
    { field: 'documento', header: 'Número de documento' },
    { field: 'capa', header: 'Capa de investigación' },
    { field: 'rol', header: 'Rol' }
  ];

  variablesColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'capa', header: 'Capa de investigación' },
    { field: 'tipo', header: 'Tipo' },
  ];

  capasColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'jefe', header: 'Jefe de capa' },
  ];

  handleView(row: any) {
    console.log('Ver', row);
  }

  handleEdit(row: any) {
    console.log('Editar', row);
  }

  handleDelete(row: any) {
    console.log('Eliminar', row);
  }

  crearNuevaVariable() {
    // Lógica para abrir un modal o navegar a un formulario
    console.log('Crear nueva variable');
    // Puedes usar Angular Material Dialog, Router, o alguna otra librería para el formulario
  }
  
  crearNuevoUsuario() {
    // Lógica para abrir un modal o navegar a un formulario
    console.log('Crear nueva variable');
    // Puedes usar Angular Material Dialog, Router, o alguna otra librería para el formulario
  }

  crearNuevaCapa() {
    // Lógica para abrir un modal o navegar a un formulario
    console.log('Crear nueva variable');
    // Puedes usar Angular Material Dialog, Router, o alguna otra librería para el formulario
  }
}


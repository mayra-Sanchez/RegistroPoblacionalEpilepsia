import { Component, OnInit } from '@angular/core';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent implements OnInit {
  // admin.component.ts
  selectedTab: string = 'inicioAdmin'; // Estado inicial
  isCreatingUser: boolean = false; // Nuevo estado para mostrar el formulario
  isCreatingVar: boolean = false;
  isCreatingCapa = false;
  capasData: any[] = [];
  variablesData: any[] = [];

  constructor(private consolaService: ConsolaAdministradorService, private router: Router) { }

  // Método para seleccionar pestaña y navegar
  onTabSelected(tab: string): void {
    const validTabs = ['inicioAdmin', 'gestionUsuarios', 'gestionVariables', 'gestionCapas'];
    if (validTabs.includes(tab)) {
      this.selectedTab = tab;
      this.router.navigate([`/administrador/${tab}`]);
    } else {
      console.error('Pestaña no válida:', tab);
      this.router.navigate(['/administrador/inicioAdmin']);
    }
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


  ngOnInit(): void {
    this.consolaService.getAllLayers().subscribe({
      next: (data: any[]) => {
        console.log('Capas obtenidas del backend:', data);
        this.capasData = data.map(capa => ({
          id: capa.id,               // Asegúrate de guardar el id
          nombreCapa: capa.nombreCapa,
          descripcion: capa.descripcion,
          jefe: capa.jefeCapa.nombre
        }));
      },
      error: (error) => {
        console.error('Error al cargar capas:', error);
        this.mostrarMensajeError('No se pudo cargar la información de las capas');
      }
    });
  
    // Cargar las variables
    this.consolaService.getAllVariables().subscribe({
      next: (data: any[]) => {
        console.log('Variables obtenidas del backend:', data);
        this.variablesData = data.map(variable => ({
          nombre: variable.nombreVariable,
          descripcion: variable.descripcion,
          capa: this.getCapaNombreById(variable.idCapaInvestigacion), // Obtener nombre de la capa con el ID
          tipo: variable.tipo
        }));
      },
      error: (error) => {
        console.error('Error al cargar variables:', error);
        this.mostrarMensajeError('No se pudo cargar la información de las variables');
      }
    });
  }
  
  // Método para obtener el nombre de la capa usando su idCapaInvestigacion
  getCapaNombreById(idCapaInvestigacion: string): string {
    const capa = this.capasData.find(capa => capa.id === idCapaInvestigacion); // Comparar con idCapaInvestigacion
    return capa ? capa.nombreCapa : 'Capa desconocida';
  }  

  mostrarMensajeError(mensaje: string): void {
    alert(mensaje); // Cambiar por un mecanismo más amigable si es necesario
  }

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
    this.isCreatingVar = true;
  }

  crearNuevoUsuario() {
    // Lógica para abrir un modal o navegar a un formulario
    console.log('Crear nueva user');
    this.isCreatingUser = true;
  }

  crearNuevaCapa() {
    // Lógica para abrir un modal o navegar a un formulario
    console.log('Crear nueva capa');
    this.isCreatingCapa = true;
  }
}


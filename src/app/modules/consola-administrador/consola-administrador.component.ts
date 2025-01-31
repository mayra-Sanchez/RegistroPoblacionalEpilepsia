import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent implements OnInit {
  // admin.component.ts
  selectedTab: string = 'inicioAdmin'; // Estado inicial
  isCreatingUser: boolean = false;
  isCreatingVar: boolean = false;
  isCreatingCapa: boolean = false;
  capasData: any[] = [];
  variablesData: any[] = [];
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private consolaService: ConsolaAdministradorService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCapasData();
    this.loadVariablesData();
    this.loadUsuariosData();

    // Escuchar actualizaciones en capas y variables
    this.consolaService.getCapasUpdatedListener().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadCapasData(); // Recargar datos de capas automáticamente
    });

    this.consolaService.getVariablesUpdatedListener().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadVariablesData(); // Recargar datos de variables automáticamente
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCapasData(): void {
    this.isLoading = true;
    this.consolaService.getAllLayers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.capasData = data.map(capa => ({
          id: capa.id,
          nombreCapa: capa.nombreCapa,
          descripcion: capa.descripcion,
          jefe: capa.jefeCapa.nombre
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.mostrarMensajeError('No se pudo cargar la información de las capas');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  loadVariablesData(): void {
    this.isLoading = true;
    this.consolaService.getAllVariables().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.variablesData = data.map(variable => ({
          nombre: variable.nombreVariable,
          descripcion: variable.descripcion,
          capa: this.getCapaNombreById(variable.idCapaInvestigacion),
          tipo: variable.tipo
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.mostrarMensajeError('No se pudo cargar la información de las variables');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Método para seleccionar pestaña y navegar
  onTabSelected(tab: string) {
    this.selectedTab = tab;
    this.isCreatingUser = false;
    this.isCreatingVar = false;
    this.isCreatingCapa = false;

    // Cargar los datos solo si la pestaña seleccionada es la correcta
    if (tab === 'gestionCapas') {
      this.loadCapasData(); // Recargar los datos de las capas
    } else if (tab === 'gestionVariables') {
      this.loadVariablesData(); // Recargar los datos de las variables
    } else if (tab === 'gestionUsuarios') {
      this.loadUsuariosData(); // Recargar los datos de los usuarios
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
    { field: 'nombreCapa', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'jefe', header: 'Jefe de capa' },
  ];


  loadUsuariosData(): void {
    // this.isLoading = true;
    // this.consolaService.getAllUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
    //   next: (data: any[]) => {
    //     this.usuariosData = data;
    //     this.cdr.detectChanges(); // Forzar la detección de cambios después de modificar usuariosData
    //   },
    //   error: (error) => {
    //     this.mostrarMensajeError('No se pudo cargar la información de los usuarios');
    //   },
    //   complete: () => {
    //     this.isLoading = false;
    //   }
    // });
  }

  // Método para obtener el nombre de la capa usando su idCapaInvestigacion
  getCapaNombreById(idCapaInvestigacion: string): string {
    const capa = this.capasData.find(capa => capa.id === idCapaInvestigacion);
    return capa ? capa.nombreCapa : 'Capa desconocida'; // Retorna un valor por defecto si no se encuentra
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
    this.isCreatingVar = true;
  }

  crearNuevoUsuario() {
    this.isCreatingUser = true;
  }

  crearNuevaCapa() {
    this.isCreatingCapa = true;
  }
}
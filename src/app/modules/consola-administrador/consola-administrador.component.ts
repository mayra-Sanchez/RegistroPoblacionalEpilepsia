<<<<<<< HEAD
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
=======
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
>>>>>>> ac7de9ff43f2940c3458cbcf02c824d9426ff789
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent implements OnInit, OnDestroy {
  selectedTab: string = 'inicioAdmin';
  isCreatingUser: boolean = false;
  isCreatingVar: boolean = false;
  isCreatingCapa: boolean = false;
  capasData: any[] = [];
  variablesData: any[] = [];
  usuariosData: any[] = [];
  isLoading: boolean = false;
  isEditingUser: boolean = false;
  userToEdit: any = null; 

  isViewing: boolean = false; // Controla la visibilidad del modal
  viewedItem: any = null; // Almacena el elemento seleccionado
  viewType: string = ''; // Guarda el tipo de elemento a visualizar


  private destroy$ = new Subject<void>();

  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'apellido', header: 'Apellido' },
    { field: 'email', header: 'Correo Electrónico' },
    { field: 'usuario', header: 'Usuario' },
    { field: 'tipoDocumento', header: 'Tipo de Documento' },
    { field: 'documento', header: 'Número de Documento' },
    { field: 'fechaNacimiento', header: 'Fecha de Nacimiento' },
    { field: 'capa', header: 'Capa de Investigación' },
    { field: 'rol', header: 'Rol' }
  ];
  
  variablesColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'capa', header: 'Capa de investigación' },
    { field: 'tipo', header: 'Tipo' }
  ];

  capasColumns = [
    { field: 'nombreCapa', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'jefe', header: 'Jefe de capa' }
  ];
  
  constructor(
    private consolaService: ConsolaAdministradorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCapasData();
    this.loadUsuariosData();
    this.loadVariablesData();

    this.consolaService.getCapasUpdatedListener().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadCapasData();
    });
    this.consolaService.getVariablesUpdatedListener().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadVariablesData();
    });
    this.consolaService.getUsuariosUpdatedListener().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadUsuariosData();
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
          jefe: capa.jefeCapa ? capa.jefeCapa.nombre : 'No asignado'
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
          id: variable.id,  // <-- Asegurar que el ID se almacena
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

<<<<<<< HEAD
  loadUsuariosData(): void {
    this.isLoading = true;
    this.consolaService.getAllUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.usuariosData = data.map(user => ({
          id: user.id, 
          nombre: user.firstName || 'Sin nombre',
          apellido: user.lastName || 'Sin apellido',
          email: user.email || 'No disponible',
          usuario: user.username || 'No disponible',
          tipoDocumento: user.identificationType || 'No especificado',
          documento: user.identificationNumber || 'No disponible',
          fechaNacimiento: user.birthDate || 'No especificada',
          capa: user.researchLayer || 'No asignada',
          rol: user.role || 'No especificado'
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.mostrarMensajeError('No se pudo cargar la información de los usuarios');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  
  getCapaNombreById(idCapaInvestigacion: string): string {
    const capa = this.capasData.find(capa => capa.id === idCapaInvestigacion);
    return capa ? capa.nombreCapa : 'Capa desconocida';
  }

  mostrarMensajeError(mensaje: string): void {
    alert(mensaje);
  }

=======

  // Método para seleccionar pestaña y navegar
>>>>>>> ac7de9ff43f2940c3458cbcf02c824d9426ff789
  onTabSelected(tab: string) {
    this.selectedTab = tab;
    this.isCreatingUser = false;
    this.isCreatingVar = false;
    this.isCreatingCapa = false;

    if (tab === 'gestionCapas') {
      this.loadCapasData();
    } else if (tab === 'gestionVariables') {
      this.loadVariablesData();
    } else if (tab === 'gestionUsuarios') {
      this.loadUsuariosData();
    }
  }
<<<<<<< HEAD
=======

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
>>>>>>> ac7de9ff43f2940c3458cbcf02c824d9426ff789

  handleView(event: any, tipo: string): void {
    this.viewedItem = event; // Guardar el elemento seleccionado
    this.viewType = tipo; // Guardar el tipo de elemento
    this.isViewing = true; // Mostrar el modal
    switch (tipo) {
      case 'usuario':
        this.verUsuario(event);
        break;
      case 'variable':
        this.verVariable(event);
        break;
      case 'capa':
        this.verCapa(event);
        break;
      default:
        console.error('Tipo de vista desconocido:', tipo);
    }
  }

<<<<<<< HEAD
  handleEdit(row: any) {
    this.isEditingUser = true;
    this.userToEdit = { ...row };
  }
  
  guardarEdicionUsuario(usuarioEditado: any) {
    const userId = usuarioEditado.id; 

    if (!userId) {
      this.mostrarMensajeError('Falta el ID de usuario.');
      return;
    }

    this.consolaService.updateUsuario(userId, usuarioEditado).subscribe({
      next: () => {
        this.isEditingUser = false;
        this.loadUsuariosData();
      },
      error: () => {
        this.mostrarMensajeError('No se pudo actualizar el usuario');
      }
    });
=======
  closeViewModal(): void {
    this.isViewing = false;
    this.viewedItem = null;
    this.viewType = '';
>>>>>>> ac7de9ff43f2940c3458cbcf02c824d9426ff789
  }
  

  verUsuario(usuario: any): void {
    console.log('Viendo usuario:', usuario);
    // Aquí podrías abrir un modal o navegar a una vista detallada
  }

  verVariable(variable: any): void {
    console.log('Viendo variable:', variable);
  }

  verCapa(capa: any): void {
    console.log('Viendo capa:', capa);
  }

  handleEdit(event: any, tipo: string): void {
    switch (tipo) {
      case 'usuario':
        this.editarUsuario(event);
        break;
      case 'variable':
        this.editarVariable(event);
        break;
      case 'capa':
        this.editarCapa(event);
        break;
      default:
        console.error('Tipo de edición desconocido:', tipo);
    }
  }

  editarUsuario(usuario: any): void {
    this.isCreatingUser = true;
    // Aquí puedes pasar el usuario a un formulario
    console.log('Editando usuario:', usuario);
  }

  editarVariable(variable: any): void {
    this.isCreatingVar = true;
    console.log('Editando variable:', variable);
  }

  editarCapa(capa: any): void {
    this.isCreatingCapa = true;
    console.log('Editando capa:', capa);
  }


  handleDelete(row: any) {
    const userId = row.id;

    if (!userId) {
      this.mostrarMensajeError('Error: Falta el ID del usuario.');
      return;
    }
    
    console.log(`Intentando eliminar usuario con ID: ${userId}`);

    this.consolaService.eliminarUsuario(userId).subscribe({
      next: () => {
        console.log(`Usuario ${userId} eliminado con éxito`);
        this.loadUsuariosData();
      },
      error: (error) => {
        console.error('Error al eliminar el usuario:', error);
        this.mostrarMensajeError(`Error al eliminar el usuario: ${error.message}`);
      }
    });
  }
<<<<<<< HEAD
  
  crearNuevaVariable() { this.isCreatingVar = true; }
  crearNuevoUsuario() { this.isCreatingUser = true; }
  crearNuevaCapa() { this.isCreatingCapa = true; }
}
=======

  crearNuevaCapa() {
    this.isCreatingCapa = true;
  }


}
>>>>>>> ac7de9ff43f2940c3458cbcf02c824d9426ff789

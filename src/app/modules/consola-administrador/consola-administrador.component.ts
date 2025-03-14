import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
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

  handleView(row: any) {
    console.log('Ver', row);
  }

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
  
  crearNuevaVariable() { this.isCreatingVar = true; }
  crearNuevoUsuario() { this.isCreatingUser = true; }
  crearNuevaCapa() { this.isCreatingCapa = true; }
}

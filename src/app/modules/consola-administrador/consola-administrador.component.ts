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

  isEditingCapa: boolean = false;
  capaToEdit: any = null;

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
  ) { }

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
          id: variable.id,
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

  onTabSelected(tab: string): void {
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

  handleView(event: any, tipo: string): void {
    this.viewedItem = event;
    this.viewType = tipo;
    this.isViewing = true;
  }

  handleEdit(row: any, tipo: string): void {
    if (tipo === 'usuario') {
      this.isEditingUser = true;
      this.userToEdit = { ...row };
    } else if (tipo === 'capa') {
      this.capaToEdit = { ...row }; // Clonar el objeto para evitar modificar directamente la referencia
      if (!this.capaToEdit.jefeCapa) {
        this.capaToEdit.jefeCapa = { nombre: '', numeroIdentificacion: '' };
      }
      this.isEditingCapa = true;
    }
  }

  guardarEdicionCapa(capaEditada: any): void {
    if (!capaEditada || !capaEditada.id) {
      alert('Error: Falta el ID de la capa.');
      return;
    }
  
    const capaPayload = {
      id: capaEditada.id,
      nombreCapa: capaEditada.nombreCapa,
      descripcion: capaEditada.descripcion,
      jefeCapa: {
        id: capaEditada.jefeCapa.id || null, // Asegurar ID
        nombre: capaEditada.jefeCapa.nombre,
        numeroIdentificacion: capaEditada.jefeCapa.numeroIdentificacion
      }
    };
  
    console.log('Datos enviados al backend:', capaPayload);
  
    this.consolaService.actualizarCapa(capaEditada.id, capaPayload).subscribe({
      next: () => {
        alert('Capa actualizada con éxito.');
        this.isEditingCapa = false;
        this.loadCapasData();
      },
      error: (error) => {
        console.error('Error al actualizar la capa:', error);
        alert('Error al actualizar la capa.');
      }
    });
  }
  

  guardarEdicionUsuario(usuarioEditado: any): void {
    if (!usuarioEditado.id) {
      this.mostrarMensajeError('Error: Falta el ID del usuario.');
      return;
    }

    this.consolaService.updateUsuario(usuarioEditado.id, usuarioEditado).subscribe({
      next: () => {
        this.mostrarMensajeError('Usuario actualizado con éxito.');
        this.isEditingUser = false; // Cierra el formulario de edición
        this.loadUsuariosData(); // Recarga la lista de usuarios
      },
      error: (error) => {
        console.error('Error al actualizar el usuario:', error);
        this.mostrarMensajeError('Error al actualizar el usuario.');
      }
    });
  }

  handleDelete(row: any): void {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este elemento?');
    if (confirmacion) {
      const id = String(row.id);
      if (this.selectedTab === 'gestionUsuarios') {
        this.consolaService.eliminarUsuario(id).subscribe({
          next: () => {
            this.loadUsuariosData();
          },
          error: (error) => {
            console.error('Error al eliminar el usuario:', error);
            this.mostrarMensajeError('Error al eliminar el usuario');
          }
        });
      } else if (this.selectedTab === 'gestionVariables') {
        this.consolaService.eliminarVariable(id).subscribe({
          next: () => {
            this.loadVariablesData();
          },
          error: (error) => {
            console.error('Error al eliminar la variable:', error);
            this.mostrarMensajeError('Error al eliminar la variable');
          }
        });
      } else if (this.selectedTab === 'gestionCapas') {
        this.consolaService.eliminarCapa(id).subscribe({
          next: () => {
            this.loadCapasData();
          },
          error: (error) => {
            console.error('Error al eliminar la capa:', error);
            this.mostrarMensajeError('Error al eliminar la capa');
          }
        });
      }
    }
  }

  closeViewModal(): void {
    this.isViewing = false;
    this.viewedItem = null;
    this.viewType = '';
  }

  crearNuevaVariable(): void {
    this.isCreatingVar = true;
  }

  crearNuevoUsuario(): void {
    this.isCreatingUser = true;
  }

  crearNuevaCapa(): void {
    this.isCreatingCapa = true;
  }
}
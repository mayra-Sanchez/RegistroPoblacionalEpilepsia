import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent implements OnInit, OnDestroy {

  selectedTab: string = 'inicioAdmin';
  activeTab: string = 'usuarios';

  usuarios: any[] = [];
  variables: any[] = [];
  capasData: any[] = [];
  variablesData: any[] = [];
  usuariosData: any[] = [];
  capas: any[] = [];

  isLoading: boolean = false;
  isCreatingUser: boolean = false;
  isCreatingVar: boolean = false;
  isCreatingCapa: boolean = false;
  isEditingUser: boolean = false;
  isEditingVar: boolean = false;
  isEditingCapa: boolean = false;
  isViewing: boolean = false;
  isEditingUserModal: boolean = false;

  userToEdit: any = null;
  varToEdit: any = null;
  capaToEdit: any = null;
  viewedItem: any = null;
  viewType: string = '';

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
    { field: 'jefeCapaNombre', header: 'Jefe de capa' }
  ];

  constructor(
    protected consolaService: ConsolaAdministradorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadInitialData();

    // Suscribirse a cambios en los datos
    this.consolaService.getDataUpdatedListener().pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.reloadData(); // Recargar datos cuando se notifique un cambio
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.consolaService.getAllLayers().subscribe({
      next: (data: any[]) => {
        this.capas = data;
        this.loadUsuariosData();
        this.loadCapasData();
        this.loadVariablesData();
      },
      error: (err) => {
        console.error('Error al obtener capas:', err);
        this.loadUsuariosData();
        this.loadCapasData();
        this.loadVariablesData();
      }
    });
  }

  loadCapasData(): void {
    this.isLoading = true;
    this.consolaService.getAllLayers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.capasData = data.map(capa => ({
          id: capa.id,
          nombreCapa: capa.nombreCapa,
          descripcion: capa.descripcion,
          jefeCapaNombre: capa.jefeCapa?.nombre || 'Sin asignar'
        }));
        this.capas = this.capasData;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener capas:', err);
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
          tipo: variable.tipo,
          tieneOpciones: variable.opciones && variable.opciones.length > 0,
          opciones: variable.opciones || []
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
        this.usuariosData = data.map(user => {
          const attrs = user.attributes || {};
          return {
            id: user.id,
            nombre: user.firstName || 'Sin nombre',
            apellido: user.lastName || 'Sin apellido',
            email: user.email || 'No disponible',
            usuario: user.username || 'No disponible',
            tipoDocumento: attrs.identificationType ? attrs.identificationType[0] : 'No especificado',
            documento: attrs.identificationNumber ? attrs.identificationNumber[0] : 'No disponible',
            fechaNacimiento: attrs.birthDate ? attrs.birthDate[0] : 'No especificada',
            capa: attrs.researchLayerId ? this.getCapaNombreById(attrs.researchLayerId[0]) : 'No asignada',
            rol: attrs.role ? attrs.role.map(this.transformarRol).join(', ') : 'No especificado',
            passwordActual: user.password
          };
        });
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

  getCapaNombreById(id: string): string {
    const capa = this.capas.find((c: any) => c.id === id);
    return capa ? capa.nombreCapa : 'Capa desconocida';
  }

  transformarRol(rol: string): string {
    const rolesMap: { [key: string]: string } = {
      'Admi': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador'
    };
    return rolesMap[rol] || rol;
  }

  mostrarMensajeError(mensaje: string): void {
    Swal.fire('Error', mensaje, 'error');
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
      this.isEditingUserModal = true;
      this.userToEdit = { ...row };
    } else if (tipo === 'capa') {
      this.capaToEdit = { ...row };
      this.isEditingCapa = true;
    } else if (tipo === 'variable') {
      this.varToEdit = { ...row };
      this.isEditingVar = true;
    }
  }

  cerrarModal(): void {
    this.isEditingVar = false;
    this.isEditingCapa = false;
    this.isEditingUserModal = false;
  }

  closeViewModal(): void {
    this.isViewing = false;
    this.viewedItem = null;
    this.viewType = '';
  }

  guardarEdicionVariable(variableEditada: any): void {
    if (!variableEditada || !variableEditada.id) {
      Swal.fire('Error', 'Falta el ID de la variable.', 'error');
      return;
    }

    const variablePayload = {
      id: variableEditada.id,
      nombreVariable: variableEditada.nombre,
      descripcion: variableEditada.descripcion,
      idCapaInvestigacion: variableEditada.capa,
      tipo: variableEditada.tipo,
      opciones: variableEditada.opciones || []
    };

    Swal.fire({
      title: '¿Guardar cambios?',
      text: 'Se actualizará la información de la variable',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consolaService.actualizarVariable(variablePayload).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Variable actualizada con éxito.', 'success');
            this.isEditingVar = false;
          },
          error: (error) => {
            console.error('Error al actualizar la variable:', error);
            Swal.fire('Error', 'Hubo un problema al actualizar la variable.', 'error');
          }
        });
      }
    });
  }

  guardarEdicionCapa(): void {
    if (!this.capaToEdit || !this.capaToEdit.id) {
      Swal.fire('Error', 'ID de la capa no proporcionado.', 'error');
      return;
    }

    const requestBody = {
      nombreCapa: this.capaToEdit.nombreCapa,
      descripcion: this.capaToEdit.descripcion,
      jefeCapa: this.capaToEdit.jefeCapa
    };

    Swal.fire({
      title: '¿Guardar cambios?',
      text: 'Se actualizará la información de la capa',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consolaService.actualizarCapa(this.capaToEdit.id, requestBody).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Capa actualizada con éxito.', 'success');
            this.isEditingCapa = false;
          },
          error: (error) => {
            console.error('Error al actualizar la capa:', error);
            Swal.fire('Error', 'Hubo un problema al actualizar la capa.', 'error');
          }
        });
      }
    });
  }

  guardarEdicionUsuario(usuarioEditado: any): void {
    if (!usuarioEditado.id) {
      Swal.fire('Error', 'Falta el ID del usuario.', 'error');
      return;
    }

    const usuarioPayload: any = {
      firstName: usuarioEditado.nombre,
      lastName: usuarioEditado.apellido,
      email: usuarioEditado.email,
      username: usuarioEditado.usuario,
      identificationType: usuarioEditado.tipoDocumento,
      identificationNumber: usuarioEditado.documento,
      birthDate: usuarioEditado.fechaNacimiento,
      researchLayer: usuarioEditado.capa,
      role: usuarioEditado.rol.split(', ')[0],
      password: usuarioEditado.password || usuarioEditado.passwordActual
    };

    Swal.fire({
      title: '¿Guardar cambios?',
      text: 'Se actualizará la información del usuario',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consolaService.updateUsuario(usuarioEditado.id, usuarioPayload).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Usuario actualizado con éxito.', 'success');
            this.isEditingUserModal = false;
          },
          error: (error) => {
            console.error('Error al actualizar el usuario:', error);
            Swal.fire('Error', 'Hubo un problema al actualizar el usuario.', 'error');
          }
        });
      }
    });
  }

  handleDelete(row: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = String(row.id);
        let eliminarObservable;

        switch (this.selectedTab) {
          case 'gestionUsuarios':
            eliminarObservable = this.consolaService.eliminarUsuario(id);
            break;
          case 'gestionVariables':
            eliminarObservable = this.consolaService.eliminarVariable(id);
            break;
          case 'gestionCapas':
            eliminarObservable = this.consolaService.eliminarCapa(id);
            break;
          default:
            console.error('Pestaña desconocida');
            return;
        }

        eliminarObservable.subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El elemento ha sido eliminado con éxito.', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            Swal.fire('Error', 'Hubo un problema al eliminar el elemento.', 'error');
          }
        });
      }
    });
  }

  reloadData(): void {
    switch (this.selectedTab) {
      case 'gestionUsuarios':
        this.loadUsuariosData();
        break;
      case 'gestionVariables':
        this.loadVariablesData();
        break;
      case 'gestionCapas':
        this.loadCapasData();
        break;
    }
    this.cdr.detectChanges(); // Forzar la actualización de la vista
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

  onTieneOpcionesChange() {
    if (!this.varToEdit.tieneOpciones) {
      this.varToEdit.opciones = [];
    } else if (this.varToEdit.opciones.length === 0) {
      this.varToEdit.opciones = [''];
    }
  }

  agregarOpcion() {
    this.varToEdit.opciones.push('');
  }

  eliminarOpcion(index: number) {
    this.varToEdit.opciones.splice(index, 1);
  }

  trackByIndex(index: number, item: any) {
    return index;
  }
}
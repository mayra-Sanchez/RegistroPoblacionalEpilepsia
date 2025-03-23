import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

/**
 * El componente ConsolaAdministradorComponent es una interfaz de administración que permite gestionar usuarios, variables y capas de investigación. 
 * Este componente se integra con un servicio (ConsolaAdministradorService) para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre 
 * estos elementos.
 */

@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent implements OnInit, OnDestroy {

  /* Cambio de pestañas */
  selectedTab: string = 'inicioAdmin';
  activeTab: string = 'usuarios';

  /* Datos */
  usuarios: any[] = [];
  variables: any[] = [];
  capasData: any[] = [];
  variablesData: any[] = [];
  usuariosData: any[] = [];
  capas: any[] = [];

  /* Elementos de edición, creación y visualización */
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
  tiposVariables: string[] = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];  // Agrega los tipos que necesites


  /* RxJS
  *Se utiliza para gestionar la desuscripción de observables y evitar fugas de memoria.
  */
  private destroy$ = new Subject<void>();

  /* Columnas de Tablas */
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

  /* Ciclo de Vida
  *Se ejecuta al inicializar el componente. Carga los datos iniciales y se suscribe a cambios en los datos.
  */
  ngOnInit(): void {
    this.loadInitialData();
    this.tiposVariables = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];


    this.consolaService.getDataUpdatedListener().pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.reloadData();
    });
  }

  /* Ciclo de Vida
  *Se ejecuta al destruir el componente. Limpia las suscripciones para evitar fugas de memoria.
  */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* Carga de Datos
  * Carga los datos iniciales de capas, usuarios y variables.
  */
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

  /* Carga de Datos
  * Carga los datos de las capas desde el servicio.
  */
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

  /* Carga de Datos
  * Carga los datos de las variables desde el servicio.
  */
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

  /* Carga de Datos
  * Carga los datos de los usuarios desde el servicio.
  */
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

  /* Carga de Datos
  * Recarga los datos según la pestaña seleccionada.
  */
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
    this.cdr.detectChanges();
  }

  /* Funciones de Utilidad
  * Devuelve el nombre de una capa basado en su ID.
  */
  getCapaNombreById(id: string): string {
    const capa = this.capas.find((c: any) => c.id === id);
    return capa ? capa.nombreCapa : 'Capa desconocida';
  }

  /* Funciones de Utilidad
  * Transforma un rol en un formato legible.
  */
  transformarRol(rol: string): string {
    const rolesMap: { [key: string]: string } = {
      'Admi': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador'
    };
    return rolesMap[rol] || rol;
  }

  /* Funciones de Utilidad
  * Muestra un mensaje de error utilizando SweetAlert2.
  */
  mostrarMensajeError(mensaje: string): void {
    Swal.fire('Error', mensaje, 'error');
  }

  /* Gestión de Pestañas
  * Cambia la pestaña seleccionada y carga los datos correspondientes.
  */
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

  /* Gestión de Modales
  * Abre el modal de visualización para un elemento.
  */
  handleView(event: any, tipo: string): void {
    this.viewedItem = event;
    this.viewType = tipo;
    this.isViewing = true;
  }

  /* Gestión de Modales
  * Abre el modal de edición para un elemento.
  */
  handleEdit(row: any, tipo: string): void {
    if (tipo === 'usuario') {
      this.isEditingUserModal = true;
      this.userToEdit = { ...row };
    } else if (tipo === 'capa') {
      this.capaToEdit = { ...row };
      this.isEditingCapa = true;
    } else if (tipo === 'variable') {
      this.varToEdit = { ...row };
      if (!this.tiposVariables.includes(this.varToEdit.tipo)) {
        this.varToEdit.tipo = this.tiposVariables[0];
      }
      this.isEditingVar = true;
    }
  }

  /* Gestión de Modales
  * Cierra el modal de visualización y edición.
  */
  cerrarModal(): void {
    this.isEditingVar = false;
    this.isEditingCapa = false;
    this.isEditingUserModal = false;
    this.isViewing = false;
    this.viewedItem = null;
    this.viewType = '';
  }

  /* Guardar Cambios
  * Guarda los cambios realizados en una variable.
  */
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

  /* Guardar Cambios
  * Guarda los cambios realizados en una capa.
  */
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

  /* Guardar Cambios
  * Guarda los cambios realizados en un usuario.
  */
  guardarEdicionUsuario(usuarioEditado: any): void {
    if (!usuarioEditado.id) {
      Swal.fire('Error', 'Falta el ID del usuario.', 'error');
      return;
    }
  
    const usuarioPayload: any = {
      firstName: usuarioEditado.nombre,
      lastName: usuarioEditado.apellido,
      email: usuarioEditado.email,
      identificationType: usuarioEditado.tipoDocumento,
      identificationNumber: usuarioEditado.documento,
      birthDate: usuarioEditado.fechaNacimiento,
      researchLayer: usuarioEditado.capa,
      role: usuarioEditado.rol.split(', ')[0],
      password: usuarioEditado.password ? usuarioEditado.password : "" // 👀 Siempre enviar el campo password
    };
    
  
    // Solo agregar contraseña si el usuario la ingresó
    if (usuarioEditado.password && usuarioEditado.password.trim() !== '') {
      usuarioPayload.password = usuarioEditado.password;
    }
  
    console.log("Datos enviados para actualizar usuario:", usuarioPayload); // 👀 Agregado
  
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
  

  /* Eliminar Elementos
  *  Elimina un elemento (usuario, variable o capa) después de confirmar.
  */
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

  /* Crear Nuevos Elementos
  * Abre el modal para crear una nueva variable.
  */
  crearNuevaVariable(): void {
    this.isCreatingVar = true;
  }

  /* Crear Nuevos Elementos
  *  Abre el modal para crear un nuevo usuario.
  */
  crearNuevoUsuario(): void {
    this.isCreatingUser = true;
  }

  /* Crear Nuevos Elementos
  * Abre el modal para crear una nueva capa.
  */
  crearNuevaCapa(): void {
    this.isCreatingCapa = true;
  }

  /* Gestión de Opciones (Variables)
  * Actualiza las opciones de una variable.
  */
  onTieneOpcionesChange() {
    if (!this.varToEdit.tieneOpciones) {
      this.varToEdit.opciones = [];
    } else if (this.varToEdit.opciones.length === 0) {
      this.varToEdit.opciones = [''];
    }
  }

  /* Gestión de Opciones (Variables)
  * Agrega una nueva opción a una variable.
  */
  agregarOpcion() {
    this.varToEdit.opciones.push('');
  }

  /* Gestión de Opciones (Variables)
  * Elimina una opción de una variable.
  */
  eliminarOpcion(index: number) {
    this.varToEdit.opciones.splice(index, 1);
  }

  /* Gestión de Opciones (Variables)
  *  Utilizado para mejorar el rendimiento en listas renderizadas.
  */
  trackByIndex(index: number, item: any) {
    return index;
  }
}
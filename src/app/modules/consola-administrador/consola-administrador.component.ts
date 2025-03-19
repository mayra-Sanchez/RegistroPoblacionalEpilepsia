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

  capasData: any[] = [];    // Datos para la tabla de capas
  variablesData: any[] = [];
  usuariosData: any[] = [];

  // Propiedad para almacenar todas las capas (para búsquedas y selects)
  capas: any[] = [];

  isLoading: boolean = false;

  isEditingUser: boolean = false;
  userToEdit: any = null;

  isEditingVar: boolean = false;
  varToEdit: any = null;

  isEditingCapa: boolean = false;
  capaToEdit: any = null;

  isViewing: boolean = false;
  viewedItem: any = null;
  viewType: string = '';

  // Modal para edición de usuario
  isEditingUserModal: boolean = false;

  private destroy$ = new Subject<void>();

  // Columnas para la tabla de usuarios
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
    private consolaService: ConsolaAdministradorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.consolaService.getAllLayers().subscribe({
      next: (data: any[]) => {
        this.capas = data;
        this.cdr.detectChanges();
        this.loadUsuariosData();
        this.loadCapasData(); // Cargar datos de capas
        this.loadVariablesData(); // Cargar datos de variables
      },
      error: (err) => {
        console.error('Error al obtener capas:', err);
        this.loadUsuariosData();
        this.loadCapasData();
        this.loadVariablesData();
      }
    });

    // Listeners para actualización de datos
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

  // Cargar data
  loadCapasData(): void {
    this.isLoading = true;
    this.consolaService.getAllLayers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        console.log('📊 Datos de capas recibidos:', data);

        this.capasData = data.map(capa => ({
          id: capa.id,
          nombreCapa: capa.nombreCapa,
          descripcion: capa.descripcion,
          jefeCapa: capa.jefeCapa
            ? {
              id: capa.jefeCapa.id ?? 1,
              nombre: capa.jefeCapa.nombre,
              numeroIdentificacion: capa.jefeCapa.numeroIdentificacion?.trim() || 'N/A'
            }
            : { id: 1, nombre: 'Sin asignar', numeroIdentificacion: 'N/A' },
          jefeCapaNombre: capa.jefeCapa?.nombre || 'Sin asignar' // 👀 Nuevo campo solo para la tabla
        }));


        console.log('✅ Capas procesadas:', this.capasData);

        this.capas = this.capasData;
        this.cdr.detectChanges(); // Forzar actualización en la vista
      },
      error: (err) => {
        console.error('❌ Error al obtener capas:', err);
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

  transformarRol(rol: string): string {
    const rolesMap: { [key: string]: string } = {
      'Admi': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador'
    };
    return rolesMap[rol] || rol; // Si no está en el mapa, mantiene el valor original
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
            passwordActual: user.password // Guardamos la contraseña actual para reutilizarla si no se cambia
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
    if (!this.capas || this.capas.length === 0) {
      return id || 'Capa desconocida';
    }
    const capa = this.capas.find((c: any) => c.id === id);
    return capa ? capa.nombreCapa : 'Capa desconocida';
  }

  mostrarMensajeError(mensaje: string): void {
    alert(mensaje);
  }

  //Cambio de pestañas
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

  // Ver
  handleView(event: any, tipo: string): void {
    this.viewedItem = event;
    this.viewType = tipo;
    this.isViewing = true;
  }

  //Editar
  handleEdit(row: any, tipo: string): void {
    if (tipo === 'usuario') {
      this.isEditingUserModal = true;
      this.userToEdit = { ...row };
    } else if (tipo === 'capa') {
      this.capaToEdit = { ...row };

      console.log('Antes de normalizar:', this.capaToEdit);

      // Si jefeCapa es undefined, se asigna un objeto vacío para evitar errores
      this.capaToEdit.jefeCapa = this.capaToEdit.jefeCapa || { id: null, nombre: '', numeroIdentificacion: '' };

      console.log('Después de normalizar:', this.capaToEdit);

      this.isEditingCapa = true;

    } else if (tipo === 'variable') {
      this.isEditingVar = true;
      this.varToEdit = { ...row };
    }
  }

  // Modal para edición de variable y ver
  abrirModal(variable: any) {
    this.varToEdit = { ...variable };
    this.isEditingVar = true;
  }

  cerrarModal() {
    this.isEditingVar = false;
  }

  cerrarModalEdicionUsuario(): void {
    this.isEditingUserModal = false;
    this.userToEdit = null;
  }

  closeViewModal(): void {
    this.isViewing = false;
    this.viewedItem = null;
    this.viewType = '';
  }

  // Guardar lo que se editó
  guardarEdicionVariable(variableEditada: any): void {
    if (!variableEditada || !variableEditada.id) {
      alert('Error: Falta el ID de la variable.');
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
    this.consolaService.actualizarVariable(variablePayload).subscribe({
      next: () => {
        alert('Variable actualizada con éxito.');
        this.isEditingVar = false;
        this.loadVariablesData();
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al actualizar la variable:', error);
        alert('Error al actualizar la variable.');
      }
    });
  }

  guardarEdicionCapa(): void {
    if (!this.capaToEdit || !this.capaToEdit.id) {
      console.error('❌ Error: ID de la capa no proporcionado.');
      alert('Error: ID de la capa no proporcionado.');
      return;
    }

    const requestBody = {
      nombreCapa: this.capaToEdit.nombreCapa + " ",
      descripcion: this.capaToEdit.descripcion?.trim() || '',
      jefeCapa: {
        id: this.capaToEdit.jefeCapa?.id ?? 1,
        nombre: this.capaToEdit.jefeCapa?.nombre?.trim() || 'N/A',
        numeroIdentificacion: this.capaToEdit.jefeCapa?.numeroIdentificacion?.trim() || 'N/A'
      }
    };

    console.log('🔹 Enviando request para actualizar capa:', JSON.stringify(requestBody, null, 2));

    this.consolaService.actualizarCapa(this.capaToEdit.id, requestBody)
      .subscribe({
        next: () => {
          alert('✅ Capa actualizada con éxito.');
          this.isEditingCapa = false;
          this.loadCapasData();
        },
        error: (error) => {
          console.error('❌ Error en la actualización:', error);
          alert(`Error al actualizar la capa: ${error.message || 'Ver consola para más detalles'}`);
        }
      });
  }

  // guardarEdicionUsuario(usuarioEditado: any): void {
  //   if (!usuarioEditado.id) {
  //     this.mostrarMensajeError('Error: Falta el ID del usuario.');
  //     return;
  //   }

  //   const usuarioPayload = {
  //     firstName: usuarioEditado.nombre,
  //     lastName: usuarioEditado.apellido,
  //     email: usuarioEditado.email,
  //     username: usuarioEditado.usuario,
  //     password: '', // No enviamos contraseña, solo si es necesaria
  //     identificationType: usuarioEditado.tipoDocumento || '',
  //     identificationNumber: usuarioEditado.documento || '',
  //     birthDate: usuarioEditado.fechaNacimiento || '',
  //     researchLayer: usuarioEditado.capa || '',
  //     role: usuarioEditado.rol.split(', ').map((r: string) => r.trim())[0] || '' // Enviar solo un string, no un array
  //   };

  //   console.log('Datos a actualizar para usuario:', JSON.stringify(usuarioPayload, null, 2));

  //   this.consolaService.updateUsuario(usuarioEditado.id, usuarioPayload).subscribe({
  //     next: () => {
  //       alert('Usuario actualizado con éxito.');
  //       this.isEditingUserModal = false;
  //       this.loadUsuariosData();
  //     },
  //     error: (error) => {
  //       console.error('Error al actualizar el usuario:', error);
  //       this.mostrarMensajeError('Error al actualizar el usuario.');
  //     }
  //   });
  // }


  // Eliminar

  guardarEdicionUsuario(usuarioEditado: any): void {
    if (!usuarioEditado.id) {
      this.mostrarMensajeError('Error: Falta el ID del usuario.');
      return;
    }

    const usuarioPayload: any = {
      firstName: usuarioEditado.nombre,
      lastName: usuarioEditado.apellido,
      email: usuarioEditado.email,
      username: usuarioEditado.usuario,
      identificationType: usuarioEditado.tipoDocumento || '',
      identificationNumber: usuarioEditado.documento || '',
      birthDate: usuarioEditado.fechaNacimiento || '',
      researchLayer: usuarioEditado.capa || '',
      role: usuarioEditado.rol.split(', ').map((r: string) => r.trim())[0] || '',
      password: usuarioEditado.password && usuarioEditado.password.trim() !== ''
        ? usuarioEditado.password  // Nueva contraseña ingresada
        : usuarioEditado.passwordActual // Mantiene la actual si no se cambia
    };

    console.log('Datos a actualizar para usuario:', JSON.stringify(usuarioPayload, null, 2));

    this.consolaService.updateUsuario(usuarioEditado.id, usuarioPayload).subscribe({
      next: () => {
        alert('Usuario actualizado con éxito.');
        this.isEditingUserModal = false;
        this.loadUsuariosData();
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

  // Crear 
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

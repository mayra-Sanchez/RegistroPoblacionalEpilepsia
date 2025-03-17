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
    { field: 'jefeCapa.nombre', header: 'Jefe de capa' }
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
        this.capasData = data.map(capa => ({
          id: capa.id,
          nombreCapa: capa.nombreCapa,
          descripcion: capa.descripcion,
          jefeCapa: capa.jefeCapa ? {
            id: capa.jefeCapa.id ?? 1,
            nombre: capa.jefeCapa.nombre ?? '',
            numeroIdentificacion: capa.jefeCapa.numeroIdentificacion ?? ''
          } : { id: 1, nombre: '', numeroIdentificacion: '' }
        }));
        // Actualizamos también la lista general de capas
        this.capas = this.capasData;
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
          // Extraemos atributos personalizados (si existen)
          const attrs = user.attributes || {};
          const identificationType = attrs.identificationType ? attrs.identificationType[0] : 'No especificado';
          const identificationNumber = attrs.identificationNumber ? attrs.identificationNumber[0] : 'No disponible';
          const birthDate = attrs.birthDate ? attrs.birthDate[0] : 'No especificada';
          const researchLayer = attrs.researchLayer ? attrs.researchLayer[0] : 'No asignada';

          return {
            id: user.id,
            nombre: user.firstName || 'Sin nombre',
            apellido: user.lastName || 'Sin apellido',
            email: user.email || 'No disponible',
            usuario: user.username || 'No disponible',
            tipoDocumento: identificationType,
            documento: identificationNumber,
            fechaNacimiento: birthDate,
            // Si researchLayer es distinto a "No asignada", se transforma a nombre usando getCapaNombreById
            capa: researchLayer !== 'No asignada' ? this.getCapaNombreById(researchLayer) : 'No asignada',
            rol: user.realmRoles ? user.realmRoles.join(', ') : 'No especificado'
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
      // Para editar usuario abrimos un modal
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
      nombreCapa: this.capaToEdit.nombreCapa  + " ",
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
  
  guardarEdicionUsuario(usuarioEditado: any): void {
    if (!usuarioEditado.id) {
      this.mostrarMensajeError('Error: Falta el ID del usuario.');
      return;
    }
    console.log('Datos a actualizar para usuario:', JSON.stringify(usuarioEditado, null, 2));
    this.consolaService.updateUsuario(usuarioEditado.id, usuarioEditado).subscribe({
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

  // Eliminar
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

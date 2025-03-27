import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from 'src/app/login/services/auth.service';
interface Registro {
  tipo: string;
  data: any;
  orderIndex: number; // ✅ Definir la propiedad orderIndex
}

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
  username: string = '';

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
  todosLosUsuarios: any[] = [];

  ultimosUsuarios: any[] = [];
  ultimosRegistros: Registro[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  displayedColumns: string[] = ['tipo', 'nombre', 'fecha'];
  tiposVariables: string[] = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];  // Agrega los tipos que necesites

  // Nuevas variables para métricas y actividad
  totalUsuarios: number = 0;
  totalCapas: number = 0;
  totalVariables: number = 0;
  actividadReciente: { fecha: string; mensaje: string }[] = [];
  notificaciones: string[] = [];

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
    { field: 'capa', header: 'Capa de Investigación', 
      formatter: (value: string, row: any) => this.getCapaNombreById(row.capaId) },
    { field: 'rol', header: 'Rol' }
  ];

  variablesColumns = [
    { field: 'variableName', header: 'Nombre' },
    { field: 'description', header: 'Descripción' },
    { field: 'type', header: 'Tipo' },
    { field: 'capaNombre', header: 'Capa' } // Usamos el campo calculado
  ];

  capasColumns = [
    { field: 'nombreCapa', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'jefeCapaNombre', header: 'Jefe de capa' }
  ];

  constructor(
    protected consolaService: ConsolaAdministradorService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  /* Ciclo de Vida
  *Se ejecuta al inicializar el componente. Carga los datos iniciales y se suscribe a cambios en los datos.
  */
  ngOnInit(): void {
    this.loadInitialData();
    this.tiposVariables = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];
    this.updateDashboard();
    this.cargarUsuarios();
    this.cargarUltimosRegistros();
    this.username = this.authService.getUsername();

    this.consolaService.getDataUpdatedListener().pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.reloadData();
      this.updateDashboard();
      this.cargarUltimosRegistros();
      this.cargarUsuarios();
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
  
    this.consolaService.getAllLayers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.capasData = data.map(capa => ({
          id: capa.id,
          nombreCapa: capa.layerName,
          descripcion: capa.description,
          jefeCapa: capa.layerBoss || {},
          jefeCapaNombre: capa.layerBoss?.name || 'Sin asignar',
          jefeIdentificacion: capa.layerBoss?.identificationNumber || 'Sin asignar'
        }));
  
        this.capas = this.capasData;
        this.totalCapas = this.capasData.length;
        this.cdr.detectChanges();
  
        // Ahora que ya tenemos las capas, cargamos usuarios y variables
        this.loadUsuariosData();
        this.loadVariablesData();
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
  * Carga los datos de las capas desde el servicio.
  */
  loadCapasData(): void {
    this.isLoading = true;
    this.consolaService.getAllLayers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.capasData = data.map(capa => ({
          id: capa.id,
          nombreCapa: capa.layerName,
          descripcion: capa.description,
          jefeCapa: capa.layerBoss || {},
          jefeCapaNombre: capa.layerBoss?.name || 'Sin asignar',
          jefeIdentificacion: capa.layerBoss?.identificationNumber || 'Sin asignar'
        }));
        this.capas = this.capasData;
        this.totalCapas = this.capasData.length;
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
          ...variable,
          capaNombre: this.getCapaNombreByIdVariables(variable.researchLayerId) // Agregamos este campo
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
          const capaValue = attrs.researchLayerId?.[0]; // Obtener el valor de researchLayerId
          
          return {
            id: user.id,
            nombre: user.firstName || 'Sin nombre',
            apellido: user.lastName || 'Sin apellido',
            email: user.email || 'No disponible',
            usuario: user.username || 'No disponible',
            tipoDocumento: attrs.identificationType ? attrs.identificationType[0] : 'No especificado',
            documento: attrs.identificationNumber ? attrs.identificationNumber[0] : 'No disponible',
            fechaNacimiento: attrs.birthDate ? attrs.birthDate[0] : 'No especificada',
            capa: this.getCapaNombreById(capaValue), // Usar el valor directamente
            capaRawValue: capaValue, // Guardar el valor original
            rol: attrs.role ? attrs.role.map(this.transformarRol).join(', ') : 'No especificado',
            passwordActual: user.password
          };
        });
        this.cdr.detectChanges();
        this.totalUsuarios = this.usuariosData.length;
        this.updateDashboard();
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


  // Cargar datos del dashboard
  updateDashboard(): void {
    // Obtener métricas
    this.totalUsuarios = this.usuariosData.length;
    this.totalCapas = this.capasData.length;
    this.totalVariables = this.variablesData.length;

    this.cdr.detectChanges();
  }

  cargarUsuarios() {
    this.consolaService.getAllUsuarios().subscribe(data => {
      // Guardar TODOS los usuarios para la exportación
      this.todosLosUsuarios = data.map(user => ({
        nombre: `${user.firstName || 'Desconocido'} ${user.lastName || ''}`.trim(),
        rol: user.attributes?.role ? user.attributes.role[0] : 'No especificado',
        email: user.email || 'No disponible'
      }));

      // Ordenar usuarios por fecha de creación (más recientes primero)
      const usuariosOrdenados = data.sort((a, b) => b.createdTimestamp - a.createdTimestamp);

      // Tomar los últimos 2 usuarios creados para "Accesos Rápidos"
      this.ultimosUsuarios = usuariosOrdenados.slice(0, 5).map(user => ({
        nombre: `${user.firstName || 'Desconocido'} ${user.lastName || ''}`.trim(),
        rol: user.attributes?.role ? user.attributes.role[0] : 'No especificado',
        email: user.email || 'No disponible',
        detalles: {
          nombre: user.firstName || 'Desconocido',
          apellido: user.lastName || '',
          username: user.username || 'No disponible',
          email: user.email || 'No disponible',
          documento: user.attributes?.identificationNumber ? user.attributes.identificationNumber[0] : 'No disponible',
          tipoDocumento: user.attributes?.identificationType ? user.attributes.identificationType[0] : 'No especificado',
          fechaNacimiento: user.attributes?.birthDate ? user.attributes.birthDate[0] : 'No especificada',
          capa: user.attributes?.researchLayerId ? this.getCapaNombreById(user.attributes.researchLayerId[0]) : 'No asignada',
          rol: user.attributes?.role ? user.attributes.role.join(', ') : 'No especificado'
        }
      }));

      console.log('📌 Últimos 2 usuarios cargados:', this.ultimosUsuarios);
      console.log('📌 Todos los usuarios para exportar:', this.todosLosUsuarios);
    });
  }

  /**
   * Función que exporta los usuarios registrados
   * @returns Download csv
   */
  exportarCSV() {
    if (!this.todosLosUsuarios.length) {
      console.warn('⚠️ No hay usuarios para exportar.');
      return;
    }

    const encabezados = "Nombre;Rol;Email\n";

    const filas = this.todosLosUsuarios
      .map(u => `${u.nombre};${u.rol};${u.email}`)
      .join("\n");

    const csvContent = encabezados + filas;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('✅ Archivo CSV generado con éxito.');
  }

  /**
   * Ultimos registros de capa, variables y usuarios
   */
  cargarUltimosRegistros() {
    this.consolaService.getAllUsuarios().subscribe(usuarios => {
      console.log('Usuarios obtenidos:', usuarios);

      const ultimosUsuarios: Registro[] = usuarios.map((usuario, index) => ({
        tipo: 'usuario',
        data: usuario,
        orderIndex: index
      }));

      this.consolaService.getAllLayers().subscribe(capas => {
        console.log('Capas obtenidas:', capas);

        const ultimasCapas: Registro[] = capas.map((capa, index) => ({
          tipo: 'capa',
          data: capa,
          orderIndex: index
        }));

        this.consolaService.getAllVariables().subscribe(variables => {
          console.log('Variables obtenidas:', variables);

          const ultimasVariables: Registro[] = variables.map((variable, index) => ({
            tipo: 'variable',
            data: variable,
            orderIndex: index
          }));

          // 🔹 Combinar todos los registros
          this.ultimosRegistros = [...ultimosUsuarios, ...ultimasCapas, ...ultimasVariables];

          // 🔹 Ordenar de más reciente a más antiguo
          this.ultimosRegistros.sort((a, b) => b.orderIndex - a.orderIndex);

          console.log('📌 Últimos registros ordenados:', this.ultimosRegistros);

          // Inicializar el dataSource con los registros ordenados
          this.dataSource = new MatTableDataSource(this.ultimosRegistros);
          this.dataSource.paginator = this.paginator;

          this.cdr.detectChanges(); // ✅ Forzar actualización de la vista
        });
      });
    });
  }

  /* Funciones de Utilidad
  * Devuelve el nombre de una capa basado en su ID.
  */
  getCapaNombreById(idOrName: string): string {
    if (!idOrName || idOrName === 'undefined' || idOrName === 'null') return 'Sin asignar';
    
    // Si el valor ya es un nombre de capa (como en tus datos actuales)
    if (typeof idOrName === 'string' && !idOrName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return idOrName; // Ya es un nombre, lo devolvemos directamente
    }
    
    // Buscar por ID en diferentes formatos
    const capa = this.capas.find(c => 
      c.id === idOrName || 
      c._id === idOrName || 
      c.layerId === idOrName
    );
    
    return capa ? (capa.layerName || capa.nombreCapa || 'Capa sin nombre') : 'Capa no encontrada';
  }

  getCapaNombreByIdVariables(id: number): string {
    const capa = this.capas?.find(c => c.id === id);
    return capa ? capa.nombreCapa : 'Capa no encontrada';
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

  handleViewUser(event: any, tipo: string): void {
    this.viewedItem = event;
    this.viewType = tipo;
    this.isViewing = true;
  }

  /* Gestión de Modales
  * Abre el modal de visualización para un elemento.
  */
  handleView(event: any, tipo: string): void {
    console.log('📌 handleView recibido:', event);

    if (!event) {
      console.error('🚨 Error: event es undefined o null');
      return;
    }

    if (tipo === 'usuario') {
      if (!event.detalles) {
        console.error('🚨 Error: event.detalles es undefined');
        return;
      }
      this.viewedItem = event.detalles;
    } else {
      this.viewedItem = event;
    }

    console.log('📌 Datos en viewedItem:', this.viewedItem);

    this.viewType = tipo;
    this.isViewing = true;
  }


  /* Gestión de Modales
  * Abre el modal de edición para un elemento.
  */
  handleEdit(row: any, tipo: string): void {
    if (tipo === 'usuario') {
      this.isEditingUserModal = true;
      this.userToEdit = { 
        ...row,
        firstName: row.nombre,
        lastName: row.apellido,
        email: row.email,
        username: row.usuario,
        identificationType: row.tipoDocumento,
        identificationNumber: row.documento,
        birthDate: row.fechaNacimiento,
        researchLayerId: row.capaRawValue, // Usar el valor original
        role: row.rol.split(', ')[0],
        password: row.passwordActual
      };
    } else if (tipo === 'capa') {
      this.capaToEdit = {
        ...row,
        nombreCapa: row.layerName || row.nombreCapa,
        descripcion: row.description || row.descripcion,
        jefeCapaNombre: row.layerBoss?.name || row.jefeCapaNombre,
        jefeIdentificacion: row.layerBoss?.identificationNumber || row.jefeIdentificacion
      };
      this.isEditingCapa = true;
    } else if (tipo === 'variable') {
      this.varToEdit = {
        ...row,
        variableName: row.variableName,
        description: row.description,
        type: row.type,  // Asegurar que el tipo se asigne correctamente
        researchLayerId: row.researchLayerId,  // Asegurar que el ID de capa se asigne
        options: row.options || [],
        tieneOpciones: (row.options && row.options.length > 0)
      };
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
      variableName: variableEditada.variableName,
      description: variableEditada.description,
      researchLayerId: variableEditada.researchLayerId,
      type: variableEditada.type,
      options: variableEditada.tieneOpciones ? variableEditada.options.filter((opt: string) => opt.trim() !== '') : []
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
            this.loadVariablesData();
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
      layerName: this.capaToEdit.nombreCapa,
      description: this.capaToEdit.descripcion,
      layerBoss: {
        id: this.capaToEdit.jefeCapa?.id || 0,
        name: this.capaToEdit.jefeCapaNombre,
        identificationNumber: this.capaToEdit.jefeIdentificacion
      }
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
            this.loadCapasData(); // Refresh the data
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
    this.selectedTab = 'gestionVariables'; // Cambia a la pestaña de gestión de variables
    this.isCreatingVar = true;
  }

  /* Crear Nuevos Elementos
  *  Abre el modal para crear un nuevo usuario.
  */
  crearNuevoUsuario(): void {
    this.selectedTab = 'gestionUsuarios'; // Cambia a la pestaña de gestión de usuarios
    this.isCreatingUser = true;
  }

  /* Crear Nuevos Elementos
  * Abre el modal para crear una nueva capa.
  */
  crearNuevaCapa(): void {
    this.selectedTab = 'gestionCapas'; // Cambia a la pestaña de gestión de capas
    this.isCreatingCapa = true;
  }

  /* Gestión de Opciones (Variables)
  * Actualiza las opciones de una variable.
  */
  onTieneOpcionesChange() {
    if (!this.varToEdit.tieneOpciones) {
      this.varToEdit.options = [];
    } else if (!this.varToEdit.options || this.varToEdit.options.length === 0) {
      this.varToEdit.options = [''];
    }
  }

  agregarOpcion() {
    this.varToEdit.options.push('');
  }

  eliminarOpcion(index: number) {
    this.varToEdit.options.splice(index, 1);
  }

  /* Gestión de Opciones (Variables)
  *  Utilizado para mejorar el rendimiento en listas renderizadas.
  */
  trackByIndex(index: number, item: any) {
    return index;
  }
}
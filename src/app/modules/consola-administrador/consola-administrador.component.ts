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
  fechaCreacion: number;
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
  displayedColumns: string[] = ['tipo', 'detalles', 'fecha'];
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
    {
      field: 'capa', 
      header: 'Capa de Investigación',
      formatter: (value: string, row: any) => this.getCapaNombreById(row.capaRawValue)
    },
    { 
      field: 'rolDisplay', 
      header: 'Rol' 
    },
    { 
      field: 'enabled', 
      header: 'Estado',
      formatter: (value: boolean) => value ? 'Habilitado' : 'Deshabilitado',
      type: 'boolean' // Añadimos esto para manejo especial
    }
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
      },
      error: (err) => {
        console.error('Error al obtener capas:', err);
        this.mostrarMensajeError('No se pudo cargar la información de las capas');
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
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
        console.log("📊 Datos obtenidos después de actualizar:", data); // Verifica si type está correcto
        this.variablesData = data.map(variable => ({
          ...variable,
          capaNombre: this.getCapaNombreByIdVariables(variable.researchLayerId)
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
// En loadUsuariosData() del ConsolaAdministradorComponent
loadUsuariosData(): void {
  this.isLoading = true;
  this.consolaService.getAllUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
    next: (data: any[]) => {
      this.usuariosData = data.map(user => {
        const attrs = user.attributes || {};
        const capaValue = attrs.researchLayerId?.[0];
        const roles = attrs.role || [];
        const mainRole = roles[0] || 'No especificado';

        return {
          id: user.id,
          nombre: user.firstName || 'Sin nombre',
          apellido: user.lastName || 'Sin apellido',
          email: user.email || 'No disponible',
          usuario: user.username || 'No disponible',
          tipoDocumento: attrs.identificationType ? attrs.identificationType[0] : 'No especificado',
          documento: attrs.identificationNumber ? attrs.identificationNumber[0] : 'No disponible',
          fechaNacimiento: attrs.birthDate ? attrs.birthDate[0] : 'No especificada',
          capa: this.getCapaNombreByIdVariables(capaValue),
          capaRawValue: capaValue,
          rol: mainRole,
          rolDisplay: this.transformarString(mainRole),
          passwordActual: user.password,
          enabled: this.transformarString(user.enabled) // Asegura que sea booleano
        };
      });
      this.cdr.detectChanges();
    },
    error: () => this.mostrarMensajeError('No se pudo cargar la información de los usuarios'),
    complete: () => this.isLoading = false
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
  updateDashboard(): void {
    this.totalUsuarios = this.usuariosData.length;
    this.totalCapas = this.capasData.length;
    this.totalVariables = this.variablesData.length;

    this.cdr.detectChanges();
  }
  cargarUsuarios() {
    this.consolaService.getAllUsuarios().subscribe(data => {
      this.todosLosUsuarios = data.map(user => ({
        nombre: `${user.firstName || 'Desconocido'} ${user.lastName || ''}`.trim(),
        rol: user.attributes?.role ? user.attributes.role[0] : 'No especificado',
        email: user.email || 'No disponible'
      }));

      const usuariosOrdenados = data.sort((a, b) => b.createdTimestamp - a.createdTimestamp);

      this.ultimosUsuarios = usuariosOrdenados.slice(0, 5).map(user => {
        const attrs = user.attributes || {};
        const capaValue = attrs.researchLayerId?.[0];

        return {
          nombre: `${user.firstName || 'Desconocido'} ${user.lastName || ''}`.trim(),
          rol: attrs.role ? attrs.role[0] : 'No especificado',
          email: user.email || 'No disponible',
          detalles: {
            nombre: user.firstName || 'Desconocido',
            apellido: user.lastName || '',
            username: user.username || 'No disponible',
            email: user.email || 'No disponible',
            documento: attrs.identificationNumber ? attrs.identificationNumber[0] : 'No disponible',
            tipoDocumento: attrs.identificationType ? attrs.identificationType[0] : 'No especificado',
            fechaNacimiento: attrs.birthDate ? attrs.birthDate[0] : 'No especificada',
            capaRawValue: capaValue, // Asegurar que tenemos el ID de la capa
            rol: attrs.role ? attrs.role[0] : 'No especificado'
          }
        };
      });
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
   * Carga y ordena los últimos registros de usuarios, capas y variables por fecha de creación
   */
  cargarUltimosRegistros() {
    this.consolaService.getAllUsuarios().subscribe(usuarios => {
      const ultimosUsuarios: Registro[] = usuarios.map(usuario => ({
        tipo: 'usuario',
        data: usuario,
        // Usamos createdTimestamp para usuarios
        fechaCreacion: usuario.createdTimestamp
      }));

      this.consolaService.getAllLayers().subscribe(capas => {
        const ultimasCapas: Registro[] = capas.map(capa => ({
          tipo: 'capa',
          data: capa,
          // Convertimos createdAt a timestamp para capas
          fechaCreacion: new Date(capa.createdAt).getTime()
        }));

        this.consolaService.getAllVariables().subscribe(variables => {
          const ultimasVariables: Registro[] = variables.map(variable => ({
            tipo: 'variable',
            data: variable,
            // Convertimos createdAt a timestamp para variables
            fechaCreacion: new Date(variable.createdAt).getTime()
          }));

          // Combinar todos los registros
          this.ultimosRegistros = [...ultimosUsuarios, ...ultimasCapas, ...ultimasVariables];

          // Ordenar de más reciente a más antiguo por fechaCreacion
          this.ultimosRegistros.sort((a, b) => b.fechaCreacion - a.fechaCreacion);

          // Inicializar el dataSource con los registros ordenados
          this.dataSource = new MatTableDataSource(this.ultimosRegistros);
          this.dataSource.paginator = this.paginator;

          this.cdr.detectChanges();
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
  /* Funciones de Utilidad
  * Devuelve el nombre de una capa basado en su ID - MISMA FUNCION PERO DIFERENTE 
  */
  getCapaNombreByIdVariables(id: number): string {
    const capa = this.capas?.find(c => c.id === id);
    return capa ? capa.nombreCapa : 'Capa no encontrada';
  }
  /* Funciones de Utilidad
  * Transforma un rol en un formato legible.
  */
  transformarString(string: string): string {
    const stingMap: { [key: string]: string } = {
      'Admin': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador',
      'true': 'Activo',
      'false': 'Inactivo'
    };
    return stingMap[string] || string;
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
    console.log('Datos del usuario al hacer clic:', event); // Para depuración

    if (tipo === 'usuario') {
      this.viewedItem = {
        ...event.detalles,
        researchLayerId: event.detalles.capaRawValue || event.detalles.researchLayerId,
        role: event.detalles.rol || event.detalles.role,
        // Asegurar que todos los campos necesarios estén presentes
        nombre: event.detalles.nombre || event.nombre,
        apellido: event.detalles.apellido || '',
        email: event.detalles.email || event.email,
        usuario: event.detalles.username || '',
        tipoDocumento: event.detalles.tipoDocumento || '',
        documento: event.detalles.documento || '',
        fechaNacimiento: event.detalles.fechaNacimiento || ''
      };
    } else {
      this.viewedItem = event;
    }

    console.log('Datos preparados para la vista:', this.viewedItem); // Para depuración
    this.viewType = tipo;
    this.isViewing = true;
  }
  /* Gestión de Modales
  * Abre el modal de edición para un elemento.
  */
  handleEdit(row: any, tipo: string): void {
    if (tipo === 'usuario') {
      this.isEditingUserModal = true;

      // Manejo consistente del rol
      let rawRole = row.rol;
      if (Array.isArray(row.attributes?.role)) {
        rawRole = row.attributes.role[0];
      } else if (typeof row.rol === 'string' && row.rol.includes(',')) {
        rawRole = row.rol.split(', ')[0];
      }

      this.userToEdit = {
        id: row.id,
        nombre: row.nombre || row.firstName,
        apellido: row.apellido || row.lastName,
        email: row.email,
        usuario: row.usuario || row.username,
        tipoDocumento: row.tipoDocumento || row.identificationType,
        documento: row.documento || row.identificationNumber,
        fechaNacimiento: row.fechaNacimiento || row.birthDate,
        researchLayerId: row.capaRawValue || row.capa,
        role: rawRole,
        password: row.passwordActual || ''
      };
    } else if (tipo === 'capa') {
      this.capaToEdit = {
        id: row.id,
        layerName: row.layerName || row.nombreCapa,
        description: row.description || row.descripcion,
        layerBoss: {
          id: row.layerBoss?.id || 1,
          name: row.layerBoss?.name || row.jefeCapaNombre || '',
          identificationNumber: row.layerBoss?.identificationNumber || row.jefeIdentificacion || ''
        }
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

  toggleUserStatus(user: any): void {
    const userId = user.id;
    const isEnabled = user.enabled;
    const action = isEnabled ? 'deshabilitar' : 'habilitar';

    Swal.fire({
      title: `¿Estás seguro de ${action} este usuario?`,
      text: `El usuario ${user.nombre} ${user.apellido} será ${action}do.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const operation$ = isEnabled
          ? this.consolaService.disableUser(userId)
          : this.consolaService.enableUser(userId);

        operation$.subscribe({
          next: () => {
            Swal.fire(
              '¡Éxito!',
              `El usuario ha sido ${action}do correctamente.`,
              'success'
            );
            // Actualizar el estado local del usuario
            user.enabled = !isEnabled;
            this.loadUsuariosData(); // Recargar datos para asegurar consistencia
          },
          error: (error) => {
            console.error(`Error al ${action} usuario:`, error);
            Swal.fire(
              'Error',
              `No se pudo ${action} el usuario.`,
              'error'
            );
          }
        });
      }
    });
  }
  /* Gestión de Modales
  * Cierra el modal de visualización y edición.
  */
  cerrarModal(event?: any): void {
    this.isEditingVar = false;
    this.isEditingCapa = false;
    this.isEditingUserModal = false;
    this.isViewing = false;
    this.viewedItem = null;
    this.viewType = '';

    if (event?.success) {
      this.loadCapasData();
      this.loadUsuariosData();
      this.loadVariablesData();
    }
  }
  /* Guardar Cambios
  * Guarda los cambios realizados en una variable.
  */
  guardarEdicionVariable(variableEditada: any): void {
    console.log('Variable editada recibida:', variableEditada);

    const variablePayload = {
      id: variableEditada.id,
      variableName: variableEditada.variableName,
      description: variableEditada.description,
      researchLayerId: variableEditada.researchLayerId,
      type: variableEditada.type, // Verificar si se mantiene
      options: variableEditada.tieneOpciones ? variableEditada.options.filter((opt: string) => opt.trim() !== '') : []
    };
    this.consolaService.actualizarVariable(variablePayload).subscribe({
      next: () => {
        console.log('Variable actualizada correctamente.');
        this.isEditingVar = false;
        this.loadVariablesData();
      },
      error: (error) => {
        console.error('Error al actualizar la variable:', error);
      }
    });
  }
  /* Guardar Cambios
  * Guarda los cambios realizados en una capa.
  */
  guardarEdicionCapa(updatedCapa: any) {
    if (!updatedCapa || !updatedCapa.id) {
      console.error('Datos de capa inválidos:', updatedCapa);
      return;
    }

    const capaData = {
      id: updatedCapa.id,
      layerName: updatedCapa.layerName,
      description: updatedCapa.description,
      layerBoss: {
        id: updatedCapa.layerBoss?.id || 1,
        name: updatedCapa.layerBoss?.name || '',
        identificationNumber: updatedCapa.layerBoss?.identificationNumber || ''
      }
    };

    this.consolaService.actualizarCapa(capaData.id, capaData).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Capa actualizada correctamente', 'success');
        this.cerrarModal(true);
      },
      error: (error) => {
        console.error('Error al actualizar capa:', error);
        Swal.fire('Error', 'No se pudo actualizar la capa', 'error');
      }
    });
  }
  /* Guardar Cambios
  * Guarda los cambios realizados en un usuario.
  */
  guardarEdicionUsuario(usuarioEditado: any): void {
    if (!usuarioEditado?.id) {
      Swal.fire('Error', 'Falta el ID del usuario.', 'error');
      return;
    }

    // Preparar el payload según lo que espera el servicio
    const usuarioPayload = {
      firstName: usuarioEditado.nombre,
      lastName: usuarioEditado.apellido,
      email: usuarioEditado.email,
      username: usuarioEditado.usuario,
      identificationType: usuarioEditado.tipoDocumento,
      identificationNumber: usuarioEditado.documento,
      birthDate: usuarioEditado.fechaNacimiento,
      researchLayer: usuarioEditado.capaRawValue || usuarioEditado.researchLayerId,
      role: usuarioEditado.role,
      password: usuarioEditado.password || '' // Solo se envía si hay cambio
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
          next: (updatedUser) => {
            Swal.fire('Éxito', 'Usuario actualizado con éxito.', 'success');
            this.isEditingUserModal = false;

            // Actualizar el usuario en la lista local
            const index = this.usuariosData.findIndex(u => u.id === usuarioEditado.id);
            if (index !== -1) {
              this.usuariosData[index] = {
                ...this.usuariosData[index],
                nombre: updatedUser.firstName || usuarioEditado.nombre,
                apellido: updatedUser.lastName || usuarioEditado.apellido,
                email: updatedUser.email || usuarioEditado.email,
                usuario: updatedUser.username || usuarioEditado.usuario,
                tipoDocumento: updatedUser.identificationType || usuarioEditado.tipoDocumento,
                documento: updatedUser.identificationNumber || usuarioEditado.documento,
                fechaNacimiento: updatedUser.birthDate || usuarioEditado.fechaNacimiento,
                capaRawValue: updatedUser.researchLayer || usuarioEditado.capaRawValue,
                rol: updatedUser.role || usuarioEditado.role,
                rolDisplay: this.transformarString(updatedUser.role || usuarioEditado.role)
              };

              // Forzar la actualización de la vista
              this.usuariosData = [...this.usuariosData];
            }

            // Recargar datos del servidor para asegurar consistencia
            this.loadUsuariosData();
          },
          error: (error) => {
            console.error('Error al actualizar el usuario:', error);
            Swal.fire('Error', error.error?.message || 'Hubo un problema al actualizar el usuario.', 'error');
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
}
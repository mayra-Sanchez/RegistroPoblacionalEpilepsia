import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { ConsolaAdministradorService } from '../../services/consola-administrador.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';
import { saveAs } from 'file-saver';

/**
 * Interfaz para el tipo Registro que representa un item en el historial de actividad
 */
interface Registro {
  tipo: string;
  data: any;
  fechaCreacion: number;
  capas?: string[];
}

/**
 * Componente principal de la consola de administración
 * 
 * Este componente proporciona una interfaz completa para gestionar:
 * - Usuarios del sistema
 * - Variables de investigación
 * - Capas de investigación
 * - Registros de datos
 * 
 * Incluye funcionalidades CRUD completas para cada entidad.
 */
@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent implements OnInit, OnDestroy {

  /* -------------------- Configuración de UI -------------------- */

  /**
   * Pestaña actualmente seleccionada en la interfaz
   * @default 'inicioAdmin'
   * Valores posibles:
   * - 'inicioAdmin': Dashboard principal
   * - 'gestionUsuarios': Gestión de usuarios
   * - 'gestionVariables': Gestión de variables
   * - 'gestionCapas': Gestión de capas
   * - 'gestionRegistrosCapas': Gestión de registros
   */
  selectedTab: string = 'inicioAdmin';

  /**
   * Pestaña activa para resaltado visual
   * @default 'usuarios'
   */
  activeTab: string = 'usuarios';

  /* -------------------- Propiedades de datos -------------------- */

  /**
   * Lista completa de usuarios
   */
  usuarios: any[] = [];

  /**
   * Lista completa de variables
   */
  variables: any[] = [];

  /**
   * Datos de capas formateados para visualización
   */
  capasData: any[] = [];

  /**
   * Datos de variables formateados para visualización
   */
  variablesData: any[] = [];

  /**
   * Datos de usuarios formateados para visualización
   */
  usuariosData: any[] = [];

  /**
   * Lista completa de capas
   */
  capas: any[] = [];

  /**
   * Datos de registros de capas
   */
  registrosCapasData: any[] = [];

  /**
   * Total de registros de capas disponibles
   */
  totalRegistrosCapas: number = 0;

  /**
   * Estado de carga para registros de capas
   */
  loadingRegistrosCapas: boolean = false;

  /**
   * Datos adicionales de registros
   */
  registrosData: any[] = [];

  /**
   * Estado general de carga
   */
  loading = false;

  /**
   * Nombre de usuario del administrador actual
   */
  username: string = '';

  /**
   * Datos para filtrado
   */
  estadoSeleccionado: string = '';
  usuariosDataOriginal: any[] = [];
  capaSeleccionada: string = '';
  variablesDataOriginal: any[] = [];


  /* -------------------- Estados de UI -------------------- */

  /**
   * Indica si se está cargando datos
   */
  isLoading: boolean = false;

  /**
   * Estados para modales de creación
   */
  isCreatingUser: boolean = false;
  isCreatingVar: boolean = false;
  isCreatingCapa: boolean = false;

  /**
   * Estados para modales de edición
   */
  isEditingUser: boolean = false;
  isEditingVar: boolean = false;
  isEditingCapa: boolean = false;

  /**
   * Estados para modales de visualización
   */
  isViewing: boolean = false;
  isEditingUserModal: boolean = false;

  /**
   * Datos temporales para edición/visualización
   */
  userToEdit: any = null;
  varToEdit: any = null;
  capaToEdit: any = null;
  viewedItem: any = null;
  viewType: string = '';

  /**
   * Lista completa de usuarios para exportación
   */
  todosLosUsuarios: any[] = [];

  /* -------------------- Datos de actividad -------------------- */

  /**
   * Últimos usuarios registrados
   */
  ultimosUsuarios: any[] = [];

  /**
   * Historial de actividad reciente
   */
  ultimosRegistros: Registro[] = [];

  /**
   * Referencia al paginador de la tabla
   */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /**
   * Fuente de datos para la tabla de actividad
   */
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  /**
   * Columnas a mostrar en la tabla de actividad
   */
  displayedColumns: string[] = ['tipo', 'detalles', 'fecha'];

  /**
   * Tipos de variables disponibles
   */
  tiposVariables: string[] = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];

  /* -------------------- Métricas del sistema -------------------- */

  /**
   * Total de usuarios registrados
   */
  totalUsuarios: number = 0;

  /**
   * Total de capas registradas
   */
  totalCapas: number = 0;

  /**
   * Total de variables registradas
   */
  totalVariables: number = 0;

  /**
   * Actividad reciente del sistema
   */
  actividadReciente: { fecha: string; mensaje: string }[] = [];

  /**
   * Notificaciones del sistema
   */
  notificaciones: string[] = [];

  /* -------------------- Gestión de observables -------------------- */

  /**
   * Subject para manejar la desuscripción de observables
   */
  private destroy$ = new Subject<void>();

  /* -------------------- Configuración de tablas -------------------- */

  /**
   * Configuración de columnas para tabla de usuarios
   */
  usuariosColumns = [
    { field: 'nombre', header: 'NOMBRE' },
    { field: 'apellido', header: 'APELLIDO' },
    { field: 'email', header: 'CORREO ELECTRÓNICO' },
    { field: 'usuario', header: 'USUARIO' },
    { field: 'capa', header: 'CAPA DE INVESTIGACIÓN' },
    { field: 'rolDisplay', header: 'ROL' },
    {
      field: 'enabled',
      header: 'ESTADO',
      formatter: (value: boolean) => value ? 'ACTIVO' : 'INACTIVO'
    }
  ];

  /**
   * Configuración de columnas para tabla de variables
   */
  variablesColumns = [
    { field: 'variableName', header: 'Nombre' },
    { field: 'description', header: 'Descripción' },
    { field: 'type', header: 'Tipo' },
    { field: 'capaNombre', header: 'Capa' }
  ];

  /**
   * Configuración de columnas para tabla de capas
   */
  capasColumns = [
    { field: 'id', header: 'ID' },
    { field: 'nombreCapa', header: 'Nombre de la Capa' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'jefeCapaNombre', header: 'Jefe de Capa' },
    { field: 'jefeIdentificacion', header: 'Identificación del Jefe' },
  ];

  /**
   * Configuración de columnas para tabla de registros de capas
   */
  registrosCapasColumns = [
    { field: 'registerId', header: 'ID Registro' },
    { field: 'registerDate', header: 'Fecha Registro' },
    { field: 'patientBasicInfo.name', header: 'Nombre Paciente' },
    { field: 'patientIdentificationNumber', header: 'ID Paciente' },
    { field: 'patientBasicInfo.sex', header: 'Sexo' },
    { field: 'patientBasicInfo.age', header: 'Edad' },
    { field: 'healthProfessional.name', header: 'Profesional' },
    {
      field: 'registerInfo',
      header: 'Variables',
      formatter: (registerInfo: any[]) =>
        registerInfo.reduce((acc, layer) => acc + (layer.variablesInfo?.length || 0), 0).toString()
    }
  ];


  /**
   * Constructor del componente
   * @param consolaService Servicio para operaciones de administración
   * @param router Servicio de enrutamiento
   * @param cdr Servicio para detección de cambios
   * @param authService Servicio de autenticación
   */
  constructor(
    protected consolaService: ConsolaAdministradorService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  /* -------------------- Métodos del ciclo de vida -------------------- */

  /**
   * Inicialización del componente
   * - Carga datos iniciales
   * - Configura tipos de variables
   * - Actualiza dashboard
   * - Carga usuarios y registros
   * - Obtiene nombre de usuario
   * - Suscribe a actualizaciones
   */
  ngOnInit(): void {
    this.loadInitialData();
    this.tiposVariables = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];
    this.updateDashboard();
    this.cargarUsuarios();
    this.cargarUltimosRegistros();
    this.username = this.authService.getUsername();
    this.loadVariablesData();
    this.obtenerUsuarios();

    this.consolaService.getDataUpdatedListener().pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.reloadData();
      this.updateDashboard();
      this.cargarUltimosRegistros();
      this.cargarUsuarios();
      this.loadVariablesData();
    });
  }

  /**
   * Limpieza al destruir el componente
   * - Cancela suscripciones
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* -------------------- Métodos de carga de datos -------------------- */

  /**
   * Carga los datos iniciales del sistema
   * - Capas de investigación
   * - Usuarios
   * - Variables
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
        this.updateDashboard();
        this.totalCapas = this.capasData.length;
        this.cdr.detectChanges();

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

  obtenerUsuarios() {
    this.consolaService.getAllUsuarios().subscribe({
      next: (usuarios) => {
        this.usuariosDataOriginal = usuarios;
        this.usuariosData = [...usuarios];
      },
      error: (err) => {
        console.error('Error al obtener usuarios', err);
      }
    });
  }

  filtrarUsuariosPorEstado() {
    if (!this.estadoSeleccionado) {
      this.usuariosData = [...this.usuariosDataOriginal];
      return;
    }

    const esActivo = this.estadoSeleccionado === 'activo';
    this.usuariosData = this.usuariosDataOriginal.filter(user => user.enabled === esActivo);
  }

  /**
   * Carga los datos de capas desde el servicio
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
        this.updateDashboard();
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

  /**
   * Carga los datos de variables desde el servicio
   */
  loadVariablesData(): void {
    this.isLoading = true;

    this.consolaService.getAllVariables().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        const variables = data.map(variable => {
          return {
            ...variable,
            capaNombre: this.getCapaNombreByIdVariables(variable.researchLayerId)
          };
        });

        this.variablesData = variables;
        this.variablesDataOriginal = [...variables]; // 👈 Copia para filtros

        this.updateDashboard();
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

  filtrarVariablesPorCapa() {
    if (!this.capaSeleccionada) {
      this.variablesData = [...this.variablesDataOriginal];
    } else {
      this.variablesData = this.variablesDataOriginal.filter(
        variable => variable.researchLayerId === this.capaSeleccionada
      );
    }
  }


  /**
   * Carga los datos de usuarios desde el servicio
   */
  loadUsuariosData(): void {
    this.isLoading = true;
    this.consolaService.getAllUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        const usuariosProcesados = data.map(user => {
          const attrs = user.attributes || {};
          const capaValues = attrs.researchLayerId || []; // Ahora es un array
          const roles = attrs.role || [];
          const mainRole = roles[0] || 'No especificado';

          // Obtener nombres de todas las capas
          const nombresCapas = capaValues.map((capaId: string) =>
            this.getCapaNombreByIdVariables(capaId)
          ).filter(Boolean); // Filtrar valores nulos/undefined

          return {
            id: user.id,
            nombre: user.firstName || 'Sin nombre',
            apellido: user.lastName || 'Sin apellido',
            email: user.email || 'No disponible',
            usuario: user.username || 'No disponible',
            tipoDocumento: attrs.identificationType ? attrs.identificationType[0] : 'No especificado',
            documento: attrs.identificationNumber ? attrs.identificationNumber[0] : 'No disponible',
            fechaNacimiento: attrs.birthDate ? attrs.birthDate[0] : 'No especificada',
            capa: nombresCapas.join(', '), // Mostrar todas las capas separadas por coma
            capas: nombresCapas, // Guardar como array para posible uso futuro
            capaRawValue: capaValues, // Guardar los IDs originales
            rol: mainRole,
            rolDisplay: this.transformarString(mainRole),
            passwordActual: user.password,
            enabled: user.enabled,
            estado: this.transformarString(user.enabled),
            lastPasswordUpdate: attrs.lastPasswordUpdate ? attrs.lastPasswordUpdate[0] : 'No registrada',
            attributes: attrs,
          };
        });

        this.usuariosData = usuariosProcesados;
        this.usuariosDataOriginal = [...usuariosProcesados];
        this.updateDashboard();
        this.cdr.detectChanges();
      },
      error: () => this.mostrarMensajeError('No se pudo cargar la información de los usuarios'),
      complete: () => this.isLoading = false
    });
  }

  /**
   * Carga los registros de capas con paginación
   * @param page Número de página (opcional, default 0)
   * @param size Tamaño de página (opcional, default 10)
   */
  loadRegistrosCapas(page: number = 0, size: number = 10): void {
    this.loadingRegistrosCapas = true;
    this.consolaService.getRegistrosCapas(page, size).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.registrosCapasData = response.registers.map((register: any) => ({
          ...register,
          // Transformaciones adicionales si son necesarias
        }));
        this.totalRegistrosCapas = response.totalElements;
        this.loadingRegistrosCapas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener registros de capas:', err);
        this.mostrarMensajeError('No se pudo cargar la información de registros de capas');
        this.loadingRegistrosCapas = false;
        this.registrosCapasData = [];
        this.totalRegistrosCapas = 0;
      }
    });
  }

  /**
   * Recarga los datos según la pestaña seleccionada
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
      case 'gestionRegistrosCapas':
        this.loadRegistrosCapas();
        break;
    }
    this.cdr.detectChanges();
  }

  /**
   * Actualiza las métricas del dashboard
   */
  updateDashboard(): void {
    this.totalUsuarios = this.usuariosData?.length || 0;
    this.totalCapas = this.capasData?.length || 0;
    this.totalVariables = this.variablesData?.length || 0;
    this.cdr.detectChanges();
  }

  /**
   * Carga todos los usuarios para el dashboard
   */
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
            capaRawValue: capaValue,
            rol: attrs.role ? attrs.role[0] : 'No especificado'
          }
        };
      });
    });
  }

  /**
   * Exporta los usuarios a un archivo CSV
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
  }

  /**
   * Carga el historial de actividad reciente
   */
  cargarUltimosRegistros() {
    this.consolaService.getAllUsuarios().subscribe(usuarios => {
      const ultimosUsuarios: Registro[] = usuarios.map(usuario => ({
        tipo: 'usuario',
        data: usuario,
        fechaCreacion: usuario.createdTimestamp
      }));

      this.consolaService.getAllLayers().subscribe(capas => {
        const ultimasCapas: Registro[] = capas.map(capa => ({
          tipo: 'capa',
          data: capa,
          fechaCreacion: new Date(capa.createdAt).getTime()
        }));

        this.consolaService.getAllVariables().subscribe(variables => {
          const ultimasVariables: Registro[] = variables.map(variable => ({
            tipo: 'variable',
            data: variable,
            fechaCreacion: new Date(variable.createdAt).getTime()
          }));

          this.ultimosRegistros = [...ultimosUsuarios, ...ultimasCapas, ...ultimasVariables];
          this.ultimosRegistros.sort((a, b) => b.fechaCreacion - a.fechaCreacion);

          this.dataSource = new MatTableDataSource(this.ultimosRegistros);
          this.dataSource.paginator = this.paginator;
          this.cdr.detectChanges();
        });
      });
    });
  }

  /* -------------------- Métodos para registros de capas -------------------- */

  /**
   * Maneja el cambio de página en la tabla de registros
   * @param event Evento de paginación
   */
  onPageChangeRegistros(event: any): void {
    this.loadRegistrosCapas(event.page, event.size);
  }

  /**
   * Maneja la visualización de un registro
   * @param event Registro a visualizar
   */
  handleViewRegistro(event: any): void {
    this.viewedItem = event;
    this.viewType = 'registro';
    this.isViewing = true;
  }

  /**
   * Maneja la eliminación de un registro
   * @param event Registro a eliminar
   */
  handleDeleteRegistro(registro: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar el registro ${registro.registerId}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consolaService.deleteRegistroCapa(registro.registerId).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El registro ha sido eliminado.', 'success');
            this.loadRegistrosCapas();
          },
          error: (err) => {
            console.error('Error al eliminar registro:', err);
            this.mostrarMensajeError('No se pudo eliminar el registro.');
          }
        });
      }
    });
  }

  /* -------------------- Métodos de utilidad -------------------- */

  /**
   * Obtiene el nombre de una capa por su ID
   * @param idOrName ID o nombre de la capa
   * @returns Nombre de la capa o mensaje predeterminado
   */
  getCapaNombreById(idOrName: string): string {
    if (!idOrName || idOrName === 'undefined' || idOrName === 'null') {
      return 'Ninguna'; // <-- cambiar de "Sin asignar" a "Ninguna"
    }

    const allCapas = [...(this.capas || []), ...(this.capasData || [])];
    const capa = allCapas.find(c =>
      c.id === idOrName || c._id === idOrName || c.layerId === idOrName
    );

    if (capa) {
      return capa.layerName || capa.nombreCapa || 'Ninguna'; // <-- aquí también
    }

    return 'Ninguna'; // <-- y aquí
  }



  /**
   * Obtiene el nombre de una capa por su ID (para variables)
   * @param id ID de la capa
   * @returns Nombre de la capa o mensaje predeterminado
   */
  getCapaNombreByIdVariables(id: string | number): string {
    const idStr = String(id);

    const capa = this.capasData?.find(c =>
      String(c.id) === idStr || String(c._id) === idStr
    );

    if (!capa) {
      const capaAlternativa = this.capas?.find(c =>
        String(c.id) === idStr || String(c._id) === idStr
      );
      return capaAlternativa ? capaAlternativa.nombreCapa || 'Ninguna' : 'Ninguna'; // <-- aquí
    }

    return capa.nombreCapa || 'Ninguna'; // <-- aquí también
  }


  /**
   * Transforma valores de texto a formatos más legibles
   * @param value Texto a transformar
   * @returns Texto transformado o el original si no hay coincidencia
   */
  transformarString(value: string): string {
    const stringMap: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'Admin': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador',
      'true': 'Activo',
      'false': 'Inactivo'
    };
    return stringMap[value] || value;
  }


  /**
   * Muestra un mensaje de error usando SweetAlert2
   * @param mensaje Mensaje a mostrar
   */
  mostrarMensajeError(mensaje: string): void {
    Swal.fire('Error', mensaje, 'error');
  }

  /* -------------------- Métodos de navegación -------------------- */

  /**
   * Maneja el cambio de pestaña
   * @param tab Pestaña seleccionada
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
    } else if (tab === 'gestionRegistrosCapas') {
      this.loadRegistrosCapas();
    }
  }

  /* -------------------- Métodos de visualización -------------------- */

  /**
   * Maneja la visualización de un usuario
   * @param event Evento del click
   * @param tipo Tipo de elemento a visualizar
   */
  handleViewUser(event: any, tipo: string): void {
    this.viewedItem = event;
    this.viewType = tipo;
    this.isViewing = true;
  }

  /**
   * Maneja la visualización de un elemento
   * @param event Evento del click
   * @param tipo Tipo de elemento (usuario, variable, capa)
   */
  handleView(event: any, tipo: string): void {
    if (tipo === 'usuario') {
      this.viewedItem = {
        ...event.detalles,
        researchLayerId: event.detalles.capaRawValue || event.detalles.researchLayerId || [],
        role: event.detalles.rol || event.detalles.role,
        nombre: event.detalles.nombre || event.nombre,
        apellido: event.detalles.apellido || '',
        email: event.detalles.email || event.email,
        usuario: event.detalles.username || '',
        tipoDocumento: event.detalles.tipoDocumento || '',
        documento: event.detalles.documento || '',
        fechaNacimiento: event.detalles.fechaNacimiento || '',
        attributes: event.detalles.attributes || event.attributes || {} // Make sure attributes are passed
      };
    } else {
      this.viewedItem = event;
    }

    this.viewType = tipo;
    this.isViewing = true;
  }

  /* -------------------- Métodos de edición -------------------- */

  /**
   * Maneja la edición de un elemento
   * @param row Fila a editar
   * @param tipo Tipo de elemento (usuario, variable, capa)
   */
  handleEdit(row: any, tipo: string): void {
    if (tipo === 'usuario') {
      this.isEditingUserModal = true;

      let rawRole = row.rol;
      if (Array.isArray(row.attributes?.role)) {
        rawRole = row.attributes.role[0];
      } else if (typeof row.rol === 'string' && row.rol.includes(',')) {
        rawRole = row.rol.split(', ')[0];
      }

      // Asegurar que capaRawValue sea un array
      const capaRawValue = Array.isArray(row.capaRawValue)
        ? row.capaRawValue
        : row.capaRawValue
          ? [row.capaRawValue]
          : [];

      // Obtener lastPasswordUpdate correctamente
      const lastUpdate = row.attributes?.lastPasswordUpdate?.[0] ||
        row.lastPasswordUpdate ||
        'No registrada';

      this.userToEdit = {
        id: row.id,
        nombre: row.nombre || row.firstName,
        apellido: row.apellido || row.lastName,
        email: row.email,
        usuario: row.usuario || row.username,
        tipoDocumento: row.tipoDocumento || row.identificationType,
        documento: row.documento || row.identificationNumber,
        fechaNacimiento: row.fechaNacimiento || row.birthDate,
        capaRawValue: Array.isArray(row.capaRawValue) ? row.capaRawValue :
          (row.capaRawValue ? [row.capaRawValue] : []),
        role: row.rol || row.attributes?.role?.[0],
        password: row.passwordActual || '',
        lastPasswordUpdate: lastUpdate,  // <-- Aquí está el cambio clave
        attributes: row.attributes || {} // Pasamos todos los atributos
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
        type: row.type,
        researchLayerId: row.researchLayerId,
        options: row.options || [],
        tieneOpciones: (row.options && row.options.length > 0)
      };
      this.isEditingVar = true;
    }
  }

  /**
   * Cambia el estado de un usuario (habilitar/deshabilitar)
   * @param user Usuario a modificar
   */
  toggleUserStatus(user: any): void {
    const userId = user.id;
    const isEnabled = user.enabled;
    const action = isEnabled ? 'Deshabilitado' : 'Habilitado';

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
              `El usuario ha sido ${action} correctamente.`,
              'success'
            );
            user.enabled = !isEnabled;
            this.usuariosData = [...this.usuariosData];
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

  /* -------------------- Métodos de cierre de modales -------------------- */

  /**
   * Cierra los modales abiertos
   * @param event Evento opcional con información de cierre
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

  /* -------------------- Métodos de guardado -------------------- */

  /**
   * Guarda los cambios en una variable
   * @param variableEditada Variable con los cambios
   */
  /**
   * Guarda los cambios en una variable
   * @param variableEditada Variable con los cambios
   */
  guardarEdicionVariable(variableEditada: any): void {
    if (!variableEditada?.id) {
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
            Swal.fire('Éxito', 'Variable actualizada correctamente', 'success');
            this.isEditingVar = false;
            this.loadVariablesData();
          },
          error: (error) => {
            console.error('Error al actualizar la variable:', error);
            Swal.fire('Error', 'No se pudo actualizar la variable', 'error');
          }
        });
      }
    });
  }

  /**
   * Guarda los cambios en una capa
   * @param updatedCapa Capa con los cambios
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
    });
  }

  /**
   * Guarda los cambios en un usuario
   * @param usuarioEditado Usuario con los cambios
   */
  guardarEdicionUsuario(usuarioEditado: any): void {
    if (!usuarioEditado?.id) {
      Swal.fire('Error', 'Falta el ID del usuario.', 'error');
      return;
    }

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
      password: usuarioEditado.password || '',
      // Añade esto para actualizar la fecha cuando se cambia la contraseña
      ...(usuarioEditado.password && {
        attributes: {
          lastPasswordUpdate: [new Date().toISOString()]
        }
      })
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

            // Actualiza la fecha de última modificación localmente
            if (usuarioEditado.password) {
              usuarioEditado.lastPasswordUpdate = new Date().toISOString();
            }

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
                rolDisplay: this.transformarString(updatedUser.role || usuarioEditado.role),
                lastPasswordUpdate: updatedUser.attributes?.lastPasswordUpdate?.[0] || usuarioEditado.lastPasswordUpdate,
              };

              this.usuariosData = [...this.usuariosData];
            }

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

  /* -------------------- Métodos de eliminación -------------------- */
  obtenerTipoElemento(): string {
    switch (this.selectedTab) {
      case 'gestionUsuarios': return 'usuario';
      case 'gestionVariables': return 'variable';
      case 'gestionCapas': return 'capa de investigación';
      default: return 'elemento';
    }
  }

  obtenerNombreElemento(row: any): string {
    return row.username || row.variableName || row.nombreCapa || 'sin nombre';
  }

  mostrarSwalConfirmacion(row: any, advertenciaHtml: string, onConfirm: () => void): void {
    Swal.fire({
      title: `¿Eliminar ${this.obtenerTipoElemento()}?`,
      html: `
      <p>¿Deseas eliminar <strong>${this.obtenerNombreElemento(row)}</strong>?</p>
      ${advertenciaHtml}
      <p class="text-danger">Esta acción no se puede deshacer.</p>
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      }
    });
  }


  /**
   * Maneja la eliminación de un elemento
   * @param row Fila a eliminar
   */
  handleDelete(row: any): void {
    const id = String(row.id);
    let eliminarObservable: Observable<any>;
    let titulo = '¿Eliminar elemento?';
    const nombre = row.nombre || row.nombreCapa || row.variableName || 'este elemento';
    const advertencias: string[] = [];

    const ejecutarEliminacion = () => {
      Swal.fire({
        title: titulo,
        html: `
        <p>¿Confirma que desea eliminar <strong>${nombre}</strong>?</p>
        ${advertencias.length > 0 ? `
          <div style="text-align:left; max-height:250px; overflow:auto;">
            <strong>Advertencias:</strong>
            <ul>${advertencias.map(a => `<li>⚠️ ${a}</li>`).join('')}</ul>
          </div>` : ''}
        <p style="margin-top:10px;">Esta acción no se puede deshacer.</p>
      `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed && eliminarObservable) {
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
    };

    // Casos por pestaña
    switch (this.selectedTab) {
      case 'gestionUsuarios':
        eliminarObservable = this.consolaService.eliminarUsuario(id);
        titulo = '¿Eliminar usuario?';
        break;

      case 'gestionVariables':
        eliminarObservable = this.consolaService.eliminarVariable(id);
        titulo = '¿Eliminar variable?';

        this.consolaService.getVariableById(id).subscribe({
          next: (variable) => {
            if (variable?.researchLayerId) {
              // Si tenemos el ID de la capa, buscamos sus detalles
              this.consolaService.getLayerById(variable.researchLayerId).subscribe({
                next: (capa) => {
                  const nombreCapa = capa?.layerName || 'una capa';
                  advertencias.push(`Está asociada a la capa "${nombreCapa}".`);
                  ejecutarEliminacion();
                },
                error: () => {
                  advertencias.push('Está asociada a una capa (no se pudo obtener el nombre).');
                  ejecutarEliminacion();
                }
              });
            } else {
              advertencias.push('No está asociada a ninguna capa.');
              ejecutarEliminacion();
            }
          },
          error: () => {
            advertencias.push('No se pudo verificar la capa asociada.');
            ejecutarEliminacion();
          }
        });
        return;

      case 'gestionCapas':
        eliminarObservable = this.consolaService.eliminarCapa(id);
        titulo = '¿Eliminar capa?';

        // Buscar variables asociadas
        this.consolaService.getAllVariables().subscribe({
          next: (vars) => {
            const asociadas = vars.filter(v => v.researchLayerId === id);
            if (asociadas.length > 0) {
              const nombresVars = asociadas.map(v => v.variableName).join(', ');
              advertencias.push(`Variables asociadas: ${nombresVars}`);
            }

            // Buscar usuarios asignados
            this.consolaService.getAllUsuarios().subscribe({
              next: (users) => {
                const usuariosConCapa = users.filter(u => u.researchLayer === id);
                if (usuariosConCapa.length > 0) {
                  const nombresUsuarios = usuariosConCapa.map(u => u.email || u.username).join(', ');
                  advertencias.push(`Usuarios asignados: ${nombresUsuarios}`);
                }

                ejecutarEliminacion();
              },
              error: () => {
                advertencias.push('No se pudo verificar los usuarios asignados.');
                ejecutarEliminacion();
              }
            });
          },
          error: () => {
            advertencias.push('No se pudo verificar las variables asociadas.');
            ejecutarEliminacion();
          }
        });
        return;

      default:
        console.error('Pestaña desconocida');
        return;
    }

    // Ejecutar si no hay llamadas asíncronas
    ejecutarEliminacion();
  }


  mostrarExito(): void {
    Swal.fire('¡Eliminado!', 'El elemento ha sido eliminado con éxito.', 'success');
  }

  mostrarError(error: any): void {
    console.error('Error al eliminar:', error);
    let mensaje = 'Hubo un error inesperado.';

    if (error?.error?.message) {
      mensaje = error.error.message;
    } else if (typeof error?.error === 'string') {
      mensaje = error.error;
    }

    Swal.fire('Error', mensaje, 'error');
  }



  /* -------------------- Métodos de creación -------------------- */

  /**
   * Abre el modal para crear nueva variable
   */
  crearNuevaVariable(): void {
    this.selectedTab = 'gestionVariables';
    this.isCreatingVar = true;
  }

  /**
   * Abre el modal para crear nuevo usuario
   */
  crearNuevoUsuario(): void {
    this.selectedTab = 'gestionUsuarios';
    this.isCreatingUser = true;
  }

  /**
   * Abre el modal para crear nueva capa
   */
  crearNuevaCapa(): void {
    this.selectedTab = 'gestionCapas';
    this.isCreatingCapa = true;
  }

  // Método para manejar cuando se crea un usuario exitosamente
  onUsuarioCreado() {
    this.volverAGestionUsuarios();
    this.loadUsuariosData(); // Recargar la lista de usuarios
    this.updateDashboard(); // Actualizar métricas
  }

  // Método para volver a la vista principal
  volverAGestionUsuarios() {
    this.isCreatingUser = false;
    this.isEditingUser = false;
    this.isEditingUserModal = false;
  }

  onVariableCreado() {
    this.volverAGestionVariables();
    this.loadVariablesData(); // Recargar la lista de usuarios
    this.updateDashboard(); // Actualizar métricas
  }

  // Método para volver a la vista principal
  volverAGestionVariables() {
    this.isCreatingVar = false;
    this.isEditingCapa = false;
  }

  onCapaCreado() {
    this.volverAGestionCapa();
    this.loadCapasData(); // Recargar la lista de usuarios
    this.updateDashboard(); // Actualizar métricas
  }

  // Método para volver a la vista principal
  volverAGestionCapa() {
    this.isCreatingCapa = false;
    this.isEditingCapa = false;
  }

  exportarUsuarios() {
    // Lógica de exportación de usuarios
    const csv = this.convertToCSV(this.usuariosData);
    this.downloadCSV(csv, 'usuarios.csv');
  }

  exportarVariables() {
    const csv = this.convertToCSV(this.variablesData);
    this.downloadCSV(csv, 'variables.csv');
  }

  exportarCapas() {
    const csv = this.convertToCSV(this.capasData);
    this.downloadCSV(csv, 'capas.csv');
  }

  // Utilidades
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = data.map(row => headers.map(field => `"${row[field] ?? ''}"`).join(','));
    return [headers.join(','), ...csvRows].join('\r\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    link.click();
  }

  downloadAllDocuments(): void {
    this.loadingRegistrosCapas = true; // opcional: mostrar spinner
    this.consolaService.downloadAllDocuments().subscribe({
      next: (blob: Blob) => {
        const fileName = `todos_los_documentos_${new Date().toISOString()}.zip`;
        saveAs(blob, fileName);
        this.loadingRegistrosCapas = false;
      },
      error: (err) => {
        console.error('Error descargando documentos', err);
        this.loadingRegistrosCapas = false;
        alert('No se pudo descargar los documentos');
      }
    });
  }

}
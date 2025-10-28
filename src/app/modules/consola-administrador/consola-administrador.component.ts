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
import { ConsolaRegistroService } from 'src/app/services/register.service';

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
 * - Historial de operaciones
 * 
 * Incluye funcionalidades CRUD completas para cada entidad, exportación de datos
 * y un dashboard con métricas del sistema.
 */
@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent implements OnInit, OnDestroy {

  // ============================
  // CONFIGURACIÓN DE INTERFAZ
  // ============================

  /**
   * Pestaña actualmente seleccionada en la interfaz
   * @default 'inicioAdmin'
   * Valores posibles:
   * - 'inicioAdmin': Dashboard principal
   * - 'gestionUsuarios': Gestión de usuarios
   * - 'gestionVariables': Gestión de variables
   * - 'gestionCapas': Gestión de capas
   * - 'historialRegistros': Gestión de registros
   */
  selectedTab: string = 'inicioAdmin';

  /**
   * Pestaña activa para resaltado visual
   * @default 'usuarios'
   */
  activeTab: string = 'usuarios';

  // ============================
  // PROPIEDADES DE DATOS
  // ============================

  /** Lista completa de usuarios */
  usuarios: any[] = [];

  /** Lista completa de variables */
  variables: any[] = [];

  /** Datos de capas formateados para visualización */
  capasData: any[] = [];

  /** Datos de variables formateados para visualización */
  variablesData: any[] = [];

  /** Datos de usuarios formateados para visualización */
  usuariosData: any[] = [];

  /** Lista completa de capas */
  capas: any[] = [];

  /** Datos de registros de capas */
  registrosCapasData: any[] = [];

  /** Total de registros de capas disponibles */
  totalRegistrosCapas: number = 0;

  /** Estado de carga para registros de capas */
  loadingRegistrosCapas: boolean = false;

  /** Datos adicionales de registros */
  registrosData: any[] = [];

  /** Datos del historial de registros */
  historialRegistrosData: any[] = [];

  /** Total de elementos en el historial */
  totalHistorialRegistros: number = 0;

  /** Estado de carga para historial */
  loadingHistorialRegistros: boolean = false;

  /** Capa seleccionada para filtrar historial */
  capaSeleccionadaHistorial: string = '';

  // ============================
  // ESTADOS DE UI
  // ============================

  /** Estado general de carga */
  loading: boolean = false;

  /** Indica si se está cargando datos */
  isLoading: boolean = false;

  /** Estados para modales de creación */
  isCreatingUser: boolean = false;
  isCreatingVar: boolean = false;
  isCreatingCapa: boolean = false;

  /** Estados para modales de edición */
  isEditingUser: boolean = false;
  isEditingVar: boolean = false;
  isEditingCapa: boolean = false;

  /** Estados para modales de visualización */
  isViewing: boolean = false;
  isEditingUserModal: boolean = false;

  // ============================
  // DATOS TEMPORALES
  // ============================

  /** Datos temporales para edición/visualización */
  userToEdit: any = null;
  varToEdit: any = null;
  capaToEdit: any = null;
  viewedItem: any = null;
  viewType: string = '';
  registroToDelete: any = null;

  /** Lista completa de usuarios para exportación */
  todosLosUsuarios: any[] = [];

  /** Registro completo cargado para el historial */
  registroCompleto: any = null;

  /** Estado de carga del registro completo */
  loadingRegistroCompleto: boolean = false;

  // ============================
  // DATOS DE ACTIVIDAD
  // ============================

  /** Últimos usuarios registrados */
  ultimosUsuarios: any[] = [];

  /** Historial de actividad reciente */
  ultimosRegistros: Registro[] = [];

  /** Nombre de usuario del administrador actual */
  username: string = '';

  /** Datos para filtrado */
  estadoSeleccionado: string = '';
  usuariosDataOriginal: any[] = [];
  capaSeleccionada: string = '';
  variablesDataOriginal: any[] = [];

  // ============================
  // MÉTRICAS DEL SISTEMA
  // ============================

  /** Total de usuarios registrados */
  totalUsuarios: number = 0;

  /** Total de capas registradas */
  totalCapas: number = 0;

  /** Total de variables registradas */
  totalVariables: number = 0;

  /** Actividad reciente del sistema */
  actividadReciente: { fecha: string; mensaje: string }[] = [];

  /** Notificaciones del sistema */
  notificaciones: string[] = [];

  // ============================
  // CONFIGURACIÓN DE TABLAS
  // ============================

  /** Configuración de columnas para tabla de usuarios */
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

  /** Configuración de columnas para tabla de variables */
  variablesColumns = [
    { field: 'variableName', header: 'Nombre' },
    { field: 'description', header: 'Descripción' },
    { field: 'type', header: 'Tipo' },
    { field: 'capaNombre', header: 'Capa' }
  ];

  /** Configuración de columnas para tabla de capas */
  capasColumns = [
    { field: 'id', header: 'ID' },
    { field: 'nombreCapa', header: 'Nombre de la Capa' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'jefeCapaNombre', header: 'Jefe de Capa' },
    { field: 'jefeIdentificacion', header: 'Identificación del Jefe' },
  ];

  /** Configuración de columnas para tabla de historial */
  historialRegistrosColumns = [
    {
      field: 'registerId',
      header: 'ID Registro',
      formatter: (value: string) => value ? value.substring(0, 8) + '...' : 'N/A'
    },
    { field: 'changedBy', header: 'Modificado Por' },
    {
      field: 'changedAt',
      header: 'Fecha Modificación',
      formatter: (value: string) => this.formatDate(value)
    },
    {
      field: 'operation',
      header: 'Operación',
      formatter: (value: string) => this.translateOperation(value)
    },
    { field: 'patientIdentificationNumber', header: 'ID Paciente' },
    {
      field: 'isResearchLayerGroup.researchLayerName',
      header: 'Capa de Investigación'
    },
    {
      field: 'isResearchLayerGroup.variables',
      header: 'Variables',
      formatter: (variables: any[]) => variables?.length?.toString() || '0'
    }
  ];

  // ============================
  // COMPONENTES DE UI
  // ============================

  /** Referencia al paginador de la tabla */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /** Fuente de datos para la tabla de actividad */
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  /** Columnas a mostrar en la tabla de actividad */
  displayedColumns: string[] = ['tipo', 'detalles', 'fecha'];

  /** Tipos de variables disponibles */
  tiposVariables: string[] = ['Entero', 'Real', 'Cadena', 'Fecha', 'Lógico'];

  // ============================
  // GESTIÓN DE OBSERVABLES
  // ============================

  /** Subject para manejar la desuscripción de observables */
  private destroy$ = new Subject<void>();

  // ============================
  // CONSTRUCTOR
  // ============================

  /**
   * Constructor del componente
   * @param consolaService Servicio para operaciones de administración
   * @param router Servicio de enrutamiento
   * @param cdr Servicio para detección de cambios
   * @param authService Servicio de autenticación
   * @param registroService Servicio para operaciones de registro
   */
  constructor(
    protected consolaService: ConsolaAdministradorService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private registroService: ConsolaRegistroService
  ) { }

  // ============================
  // MÉTODOS DEL CICLO DE VIDA
  // ============================

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

  // ============================
  // MÉTODOS DE CARGA DE DATOS
  // ============================

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

  /**
   * Obtiene todos los usuarios del sistema
   */
  obtenerUsuarios(): void {
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

  /**
   * Carga los datos de capas desde el servicio
   */
  loadCapasData(): void {
    this.isLoading = true;
    this.consolaService.getAllLayers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        this.capasData = data.map(capa => {
          return {
            id: capa.id,
            nombreCapa: capa.layerName,
            descripcion: capa.description,
            jefeCapa: capa.layerBoss || {},
            jefeCapaNombre: capa.layerBoss?.name || 'Sin asignar',
            jefeIdentificacion: capa.layerBoss?.identificationNumber || 'Sin asignar',
            layerBoss: capa.layerBoss ? {
              ...capa.layerBoss,
              email: capa.layerBoss.email || ''
            } : {}
          };
        });

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
        this.variablesDataOriginal = [...variables];
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

  /**
   * Carga los datos de usuarios desde el servicio
   */
  loadUsuariosData(): void {
    this.isLoading = true;
    this.consolaService.getAllUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any[]) => {
        const usuariosProcesados = data.map(user => {
          const attrs = user.attributes || {};
          const capaValues = attrs.researchLayerId || [];
          const roles = attrs.role || [];
          const mainRole = roles[0] || 'No especificado';

          const nombresCapas = capaValues.map((capaId: string) =>
            this.getCapaNombreByIdVariables(capaId)
          ).filter(Boolean);

          return {
            id: user.id,
            nombre: user.firstName || 'Sin nombre',
            apellido: user.lastName || 'Sin apellido',
            email: user.email || 'No disponible',
            usuario: user.username || 'No disponible',
            tipoDocumento: attrs.identificationType ? attrs.identificationType[0] : 'No especificado',
            documento: attrs.identificationNumber ? attrs.identificationNumber[0] : 'No disponible',
            fechaNacimiento: attrs.birthDate ? attrs.birthDate[0] : 'No especificada',
            capa: nombresCapas.join(', '),
            capas: nombresCapas,
            capaRawValue: capaValues,
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
   * Carga el historial de registros con paginación
   * @param page Número de página (por defecto 0)
   * @param size Tamaño de página (por defecto 10)
   */
loadHistorialRegistros(page: number = 0, size: number = 10): void {
  if (!this.capaSeleccionadaHistorial) {
    this.historialRegistrosData = [];
    this.totalHistorialRegistros = 0;
    this.loadingHistorialRegistros = false;
    return;
  }

  const userEmail = this.authService.getUserEmail();

  if (!userEmail) {
    this.mostrarMensajeError('No se pudo identificar el email del usuario actual');
    this.loadingHistorialRegistros = false;
    return;
  }

  this.loadingHistorialRegistros = true;

  // ✅ Usar los parámetros de paginación correctamente
  this.consolaService.getRegisterHistory(
    this.capaSeleccionadaHistorial,
    userEmail,
    page,  // ✅ Página actual (0-based)
    size,  // ✅ Tamaño de página
    'changedAt',
    'DESC'
  ).pipe(takeUntil(this.destroy$)).subscribe({
    next: (response: any) => {
      console.log('📊 Respuesta del historial:', {
        paginaSolicitada: page,
        tamañoSolicitado: size,
        datosRecibidos: response.data?.length,
        totalElementos: response.totalElements
      });

      if (response && response.data) {
        this.historialRegistrosData = response.data;
        this.totalHistorialRegistros = response.totalElements || 0;

        if (this.historialRegistrosData.length === 0) {
          this.mostrarMensajeInfo('No se encontraron registros en el historial para esta capa');
        }
      } else {
        console.warn('⚠️ Respuesta sin datos:', response);
        this.historialRegistrosData = [];
        this.totalHistorialRegistros = 0;
      }

      this.loadingHistorialRegistros = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('❌ Error al obtener historial de registros:', err);
      this.mostrarMensajeError('No se pudo cargar el historial de registros');
      this.loadingHistorialRegistros = false;
      this.historialRegistrosData = [];
      this.totalHistorialRegistros = 0;
      this.cdr.detectChanges();
    }
  });
}

// ✅ Método mejorado para manejar cambios de página
onPageChangeHistorial(event: any): void {
  console.log('🔄 Cambio de página en historial:', event);
  
  // Convertir a página 0-based para el servidor
  const page = event.page - 1; // ✅ El componente DataTable usa 1-based, el servidor usa 0-based
  const size = event.size;
  
  this.loadHistorialRegistros(page, size);
}

// ✅ Método para manejar cambio de capa
onCapaSeleccionadaChange(): void {
  if (this.capaSeleccionadaHistorial) {
    // ✅ Resetear a primera página cuando cambia la capa
    this.loadHistorialRegistros(0, 10);
  } else {
    this.historialRegistrosData = [];
    this.totalHistorialRegistros = 0;
  }
}

  /**
   * Carga la información completa del registro para el historial
   */
  loadRegistroCompleto(): void {
    if (!this.viewedItem?.registerId) {
      console.warn('No hay registerId para cargar el registro completo');
      return;
    }

    const patientIdentificationNumber = this.viewedItem?.patientIdentificationNumber;
    const researchLayerId = this.viewedItem?.isResearchLayerGroup?.researchLayerId;

    if (!patientIdentificationNumber || !researchLayerId) {
      console.warn('Faltan datos necesarios para cargar el registro completo:', {
        patientIdentificationNumber,
        researchLayerId
      });
      return;
    }

    this.loadingRegistroCompleto = true;

    this.registroService.getActualRegisterByPatient(patientIdentificationNumber, researchLayerId).subscribe({
      next: (registro) => {
        this.registroCompleto = registro;
        this.loadingRegistroCompleto = false;
      },
      error: (err) => {
        console.error('Error al cargar registro completo:', err);
        this.registroCompleto = null;
        this.loadingRegistroCompleto = false;
      }
    });
  }

  // ============================
  // MÉTODOS DE FILTRADO
  // ============================

  /**
   * Filtra usuarios por estado (activo/inactivo)
   */
  filtrarUsuariosPorEstado(): void {
    if (!this.estadoSeleccionado) {
      this.usuariosData = [...this.usuariosDataOriginal];
      return;
    }

    const esActivo = this.estadoSeleccionado === 'activo';
    this.usuariosData = this.usuariosDataOriginal.filter(user => user.enabled === esActivo);
  }

  /**
   * Filtra variables por capa seleccionada
   */
  filtrarVariablesPorCapa(): void {
    if (!this.capaSeleccionada) {
      this.variablesData = [...this.variablesDataOriginal];
    } else {
      this.variablesData = this.variablesDataOriginal.filter(
        variable => variable.researchLayerId === this.capaSeleccionada
      );
    }
  }

  // ============================
  // MÉTODOS DE UTILIDAD
  // ============================

  /**
   * Obtiene el nombre de una capa por su ID
   * @param idOrName ID o nombre de la capa
   * @returns Nombre de la capa o mensaje predeterminado
   */
  getCapaNombreById(idOrName: string): string {
    if (!idOrName || idOrName === 'undefined' || idOrName === 'null') {
      return 'Ninguna';
    }

    const allCapas = [...(this.capas || []), ...(this.capasData || [])];
    const capa = allCapas.find(c =>
      c.id === idOrName || c._id === idOrName || c.layerId === idOrName
    );

    if (capa) {
      return capa.layerName || capa.nombreCapa || 'Ninguna';
    }

    return 'Ninguna';
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
      return capaAlternativa ? capaAlternativa.nombreCapa || 'Ninguna' : 'Ninguna';
    }

    return capa.nombreCapa || 'Ninguna';
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
   * Formatea la fecha para mejor visualización
   * @param dateString Fecha en formato string
   * @returns Fecha formateada
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Traduce las operaciones al español
   * @param operation Operación en inglés
   * @returns Operación traducida
   */
  private translateOperation(operation: string): string {
    const translations: { [key: string]: string } = {
      'REGISTER_CREATED_SUCCESSFULL': 'Registro Creado',
      'UPDATE_RESEARCH_LAYER': 'Capa Actualizada',
      'VARIABLE_UPDATED': 'Variable Actualizada',
      'PATIENT_INFO_UPDATED': 'Información Paciente Actualizada'
    };

    return translations[operation] || operation;
  }

  // ============================
  // MÉTODOS DE ACTUALIZACIÓN
  // ============================

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
      case 'historialRegistros':
        if (this.capaSeleccionadaHistorial) {
          this.loadHistorialRegistros();
        }
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
  cargarUsuarios(): void {
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
   * Carga el historial de actividad reciente
   */
  cargarUltimosRegistros(): void {
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

  // ============================
  // MÉTODOS DE NAVEGACIÓN
  // ============================

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
    } else if (tab === 'historialRegistros') {
      this.historialRegistrosData = [];
      this.totalHistorialRegistros = 0;
    }
  }

  // ============================
  // MÉTODOS DE VISUALIZACIÓN
  // ============================

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
        attributes: event.detalles.attributes || event.attributes || {}
      };
    } else {
      this.viewedItem = event;
    }

    this.viewType = tipo;
    this.isViewing = true;
  }

  /**
   * Maneja la visualización de detalles del historial
   * @param event Registro del historial a visualizar
   */
  handleViewHistorial(event: any): void {
    this.viewedItem = {
      ...event,
      tipo: 'historial',
      detallesCompletos: this.prepararDetallesHistorial(event)
    };
    this.viewType = 'historial';
    this.isViewing = true;
  }

  /**
   * Prepara los detalles del historial para visualización
   * @param registro Registro del historial
   * @returns Detalles formateados del historial
   */
  private prepararDetallesHistorial(registro: any): any {
    return {
      id: registro.registerId,
      paciente: {
        identificacion: registro.patientIdentificationNumber,
        tipoIdentificacion: registro.patientIdentificationType || 'No especificado'
      },
      capa: {
        id: registro.isResearchLayerGroup?.researchLayerId,
        nombre: registro.isResearchLayerGroup?.researchLayerName || 'N/A'
      },
      operacion: this.translateOperation(registro.operation),
      modificadoPor: registro.changedBy,
      fechaModificacion: this.formatDate(registro.changedAt),
      variables: registro.isResearchLayerGroup?.variables?.map((variable: any) => ({
        nombre: variable.name,
        tipo: variable.type,
        valor: variable.valueAsString || variable.valueAsNumber || 'N/A'
      })) || []
    };
  }

  // ============================
  // MÉTODOS DE EDICIÓN
  // ============================

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

      const capaRawValue = Array.isArray(row.capaRawValue)
        ? row.capaRawValue
        : row.capaRawValue
          ? [row.capaRawValue]
          : [];

      const lastUpdate =
        row.attributes?.lastPasswordUpdate?.[0] ||
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
        capaRawValue: capaRawValue,
        role: rawRole,
        password: row.passwordActual || '',
        lastPasswordUpdate: lastUpdate,
        attributes: row.attributes || {},
        acceptTermsAndConditions: true
      };

    } else if (tipo === 'capa') {
      this.capaToEdit = {
        id: row.id,
        layerName: row.layerName || row.nombreCapa,
        description: row.description || row.descripcion,
        layerBoss: {
          id: row.layerBoss?.id || 1,
          name: row.layerBoss?.name || row.jefeCapaNombre || '',
          identificationNumber:
            row.layerBoss?.identificationNumber || row.jefeIdentificacion || '',
          email: row.layerBoss?.email || row.jefeEmail || ''
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
        tieneOpciones: row.options && row.options.length > 0
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
      text: `El usuario ${user.nombre} ${user.apellido} será ${action}.`,
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

  // ============================
  // MÉTODOS DE GUARDADO
  // ============================

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
  guardarEdicionCapa(updatedCapa: any): void {
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
  guardarEdicionUsuario(usuarioEditado: { userId: string, payload: any }): void {
    if (!usuarioEditado?.userId) {
      Swal.fire('Error', 'Falta el ID del usuario.', 'error');
      console.error('[guardarEdicionUsuario] No se recibió userId:', usuarioEditado);
      return;
    }

    const userId = usuarioEditado.userId;
    const usuarioPayload = {
      ...usuarioEditado.payload,
      ...(usuarioEditado.payload.password && {
        attributes: {
          ...usuarioEditado.payload.attributes,
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
        this.consolaService.updateUsuario(userId, usuarioPayload).subscribe({
          next: (updatedUser) => {
            Swal.fire('Éxito', 'Usuario actualizado con éxito.', 'success');
            this.isEditingUserModal = false;

            if (usuarioPayload.password) {
              usuarioPayload.lastPasswordUpdate = new Date().toISOString();
            }

            const index = this.usuariosData.findIndex(u => u.id === userId || u.userId === userId || u._id === userId);
            if (index !== -1) {
              this.usuariosData[index] = {
                ...this.usuariosData[index],
                nombre: updatedUser.firstName || this.usuariosData[index].nombre,
                apellido: updatedUser.lastName || this.usuariosData[index].apellido,
                email: updatedUser.email || this.usuariosData[index].email,
                usuario: updatedUser.username || this.usuariosData[index].usuario,
                tipoDocumento: updatedUser.identificationType || this.usuariosData[index].tipoDocumento,
                documento: updatedUser.identificationNumber || this.usuariosData[index].documento,
                fechaNacimiento: updatedUser.birthDate || this.usuariosData[index].fechaNacimiento,
                capaRawValue: updatedUser.researchLayer || this.usuariosData[index].capaRawValue,
                rol: updatedUser.role || this.usuariosData[index].rol,
                rolDisplay: this.transformarString(updatedUser.role || this.usuariosData[index].rol),
                lastPasswordUpdate: updatedUser.attributes?.lastPasswordUpdate?.[0] || usuarioPayload.lastPasswordUpdate,
                acceptTermsAndConditions: updatedUser.acceptTermsAndConditions ?? usuarioPayload.acceptTermsAndConditions
              };

              this.usuariosData = [...this.usuariosData];
            }

            this.loadUsuariosData();
          },
          error: (error) => {
            console.error('[guardarEdicionUsuario] Error al actualizar:', error);
            Swal.fire('Error', error.error?.message || 'Hubo un problema al actualizar el usuario.', 'error');
          }
        });
      }
    });
  }

  // ============================
  // MÉTODOS DE ELIMINACIÓN
  // ============================

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

        this.consolaService.getAllVariables().subscribe({
          next: (vars) => {
            const asociadas = vars.filter(v => v.researchLayerId === id);
            if (asociadas.length > 0) {
              const nombresVars = asociadas.map(v => v.variableName).join(', ');
              advertencias.push(`Variables asociadas: ${nombresVars}`);
            }

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

    ejecutarEliminacion();
  }

  /**
   * Maneja la eliminación de un registro del historial
   * @param registro Registro a eliminar
   */
  handleDeleteHistorial(registro: any): void {
    this.registroToDelete = registro;

    Swal.fire({
      title: '¿Eliminar registro del historial?',
      html: `
            <p>Estás a punto de eliminar permanentemente este registro del historial:</p>
            <div style="text-align: left; background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <strong>ID Registro:</strong> ${registro.registerId}<br>
                <strong>Paciente:</strong> ${registro.patientIdentificationNumber}<br>
                <strong>Capa:</strong> ${registro.isResearchLayerGroup?.researchLayerName || 'N/A'}<br>
                <strong>Fecha:</strong> ${this.formatDate(registro.changedAt)}
            </div>
            <p class="text-danger"><strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer y eliminará permanentemente el registro del historial.</p>
        `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'custom-swal-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarEliminacionHistorial(registro);
      }
    });
  }

  /**
   * Ejecuta la eliminación de un registro del historial
   * @param registro Registro a eliminar
   */
  private ejecutarEliminacionHistorial(registro: any): void {
    this.registroService.deleteRegisterHistory(registro.registerId).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El registro ha sido eliminado del historial correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        this.loadHistorialRegistros();
      },
      error: (error) => {
        console.error('Error al eliminar registro del historial:', error);

        let mensajeError = 'No se pudo eliminar el registro del historial';
        if (error.error?.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        Swal.fire('Error', mensajeError, 'error');
      }
    });
  }

  /**
   * Maneja la eliminación de un registro
   * @param registro Registro a eliminar
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
            this.loadHistorialRegistros();
          },
          error: (err) => {
            console.error('Error al eliminar registro:', err);
            this.mostrarMensajeError('No se pudo eliminar el registro.');
          }
        });
      }
    });
  }

  // ============================
  // MÉTODOS DE CREACIÓN
  // ============================

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

  // ============================
  // MÉTODOS DE NAVEGACIÓN MODALES
  // ============================

  /**
   * Maneja cuando se crea un usuario exitosamente
   */
  onUsuarioCreado(): void {
    this.volverAGestionUsuarios();
    this.loadUsuariosData();
    this.updateDashboard();
  }

  /**
   * Vuelve a la vista principal de gestión de usuarios
   */
  volverAGestionUsuarios(): void {
    this.isCreatingUser = false;
    this.isEditingUser = false;
    this.isEditingUserModal = false;
  }

  /**
   * Maneja cuando se crea una variable exitosamente
   */
  onVariableCreado(): void {
    this.volverAGestionVariables();
    this.loadVariablesData();
    this.updateDashboard();
  }

  /**
   * Vuelve a la vista principal de gestión de variables
   */
  volverAGestionVariables(): void {
    this.isCreatingVar = false;
    this.isEditingCapa = false;
  }

  /**
   * Maneja cuando se crea una capa exitosamente
   */
  onCapaCreado(): void {
    this.volverAGestionCapa();
    this.loadCapasData();
    this.updateDashboard();
  }

  /**
   * Vuelve a la vista principal de gestión de capas
   */
  volverAGestionCapa(): void {
    this.isCreatingCapa = false;
    this.isEditingCapa = false;
  }

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

  // ============================
  // MÉTODOS DE EXPORTACIÓN
  // ============================

  /**
   * Exporta los usuarios a un archivo CSV
   */
  exportarCSV(): void {
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
   * Exporta usuarios a CSV
   */
  exportarUsuarios(): void {
    const csv = this.convertToCSV(this.usuariosData);
    this.downloadCSV(csv, 'usuarios.csv');
  }

  /**
   * Exporta variables a CSV
   */
  exportarVariables(): void {
    const csv = this.convertToCSV(this.variablesData);
    this.downloadCSV(csv, 'variables.csv');
  }

  /**
   * Exporta capas a CSV
   */
  exportarCapas(): void {
    const csv = this.convertToCSV(this.capasData);
    this.downloadCSV(csv, 'capas.csv');
  }

  /**
   * Descarga todos los documentos del sistema
   */
  downloadAllDocuments(): void {
    this.loadingRegistrosCapas = true;
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

  // ============================
  // MÉTODOS UTILITARIOS
  // ============================

  /**
   * Convierte datos a formato CSV
   * @param data Datos a convertir
   * @returns String en formato CSV
   */
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = data.map(row => headers.map(field => `"${row[field] ?? ''}"`).join(','));
    return [headers.join(','), ...csvRows].join('\r\n');
  }

  /**
   * Descarga un archivo CSV
   * @param csv Contenido CSV
   * @param filename Nombre del archivo
   */
  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    link.click();
  }

  /**
   * Muestra un mensaje de información
   * @param mensaje Mensaje a mostrar
   */
  mostrarMensajeInfo(mensaje: string): void {
    Swal.fire('Información', mensaje, 'info');
  }

  /**
   * Muestra un mensaje de error usando SweetAlert2
   * @param mensaje Mensaje a mostrar
   */
  mostrarMensajeError(mensaje: string): void {
    Swal.fire('Error', mensaje, 'error');
  }

  /**
   * Obtiene el tipo de elemento según la pestaña seleccionada
   * @returns Tipo de elemento
   */
  obtenerTipoElemento(): string {
    switch (this.selectedTab) {
      case 'gestionUsuarios': return 'usuario';
      case 'gestionVariables': return 'variable';
      case 'gestionCapas': return 'capa de investigación';
      default: return 'elemento';
    }
  }

  /**
   * Obtiene el nombre de un elemento
   * @param row Fila del elemento
   * @returns Nombre del elemento
   */
  obtenerNombreElemento(row: any): string {
    return row.username || row.variableName || row.nombreCapa || 'sin nombre';
  }
}
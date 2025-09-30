import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ConsolaInvestigadorService } from 'src/app/services/consola-investigador.service';
import { AuthService } from 'src/app/services/auth.service';
import { ResearchLayer, PatientBasicInfo } from '../../../consola-registro/interfaces';
import { ResearchLayerHistory, ResearchVariable } from '../../../../services/consola-investigador.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { BaseChartDirective } from 'ng2-charts';

// ============================
// INTERFACES Y TIPOS
// ============================

/**
 * Tipo que define las dimensiones disponibles para los gráficos
 */
type ChartDimension = 'sex' | 'education' | 'economic' | 'marital' | 'crisis' | 'currentCity' | 'hometown' | 'caregiver' | 'ageGroup' | 'operations';

/**
 * Tipo que define las direcciones de tendencia
 */
type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Interfaz para las tarjetas de resumen del dashboard
 */
interface SummaryCard {
  title: string;
  value: number;
  icon: string;
  trend: TrendDirection;
  change: number;
  description?: string;
}

/**
 * Interfaz para las etiquetas de dimensiones
 */
interface DimensionLabels {
  [key: string]: string;
}

/**
 * Componente de gráficas y dashboard para investigadores
 * 
 * Este componente proporciona visualizaciones interactivas de datos de investigación,
 * incluyendo gráficos demográficos, geográficos, temporales y operacionales.
 * 
 * @example
 * <app-graficas-inicio 
 *   [researchLayerId]="selectedLayerId">
 * </app-graficas-inicio>
 */
@Component({
  selector: 'app-graficas-inicio',
  templateUrl: './graficas-inicio.component.html',
  styleUrls: ['./graficas-inicio.component.css'],
  providers: [BaseChartDirective]
})
export class GraficasInicioComponent implements OnInit, AfterViewInit, OnDestroy {

  // ============================
  // REFERENCES A ELEMENTOS DEL DOM
  // ============================

  @ViewChild('chartCanvas1') chartCanvas1?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas2') chartCanvas2?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas3') chartCanvas3?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas4') chartCanvas4?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas5') chartCanvas5?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas6') chartCanvas6?: ElementRef<HTMLCanvasElement>;
  @ViewChild('customRangeDialog') customRangeDialog?: TemplateRef<any>;

  // ============================
  // PROPIEDADES DE CONFIGURACIÓN
  // ============================

  /** Indica si el modo oscuro está activado */
  isDarkMode = false;

  /** ID de la capa de investigación recibida como input */
  @Input() researchLayerId: string | null = null;

  /** Rango de tiempo seleccionado para filtrar datos */
  selectedTimeRange = '30';

  /** Opciones de rangos de tiempo disponibles */
  timeRanges = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
    { value: '365', label: 'Último año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  /** Fecha de inicio para rango personalizado */
  customRangeStart: Date | null = null;

  /** Fecha de fin para rango personalizado */
  customRangeEnd: Date | null = null;

  // ============================
  // PROPIEDADES DE DATOS
  // ============================

  /** Historial de la capa de investigación */
  historialCapa: ResearchLayerHistory[] = [];

  /** Registros actuales procesados */
  currentRegisters: any[] = [];

  /** Capa de investigación actual */
  currentResearchLayer: ResearchLayer | null = null;

  /** Lista de capas disponibles para el usuario */
  availableLayers: ResearchLayer[] = [];

  /** ID de la capa seleccionada */
  selectedLayerId: string | null = null;

  // ============================
  // CONFIGURACIÓN DE GRÁFICOS
  // ============================

  /** Datos para el gráfico 1 (Distribución por Sexo) */
  chartData1: ChartConfiguration['data'] = { labels: [], datasets: [] };

  /** Datos para el gráfico 2 (Estado de Crisis) */
  chartData2: ChartConfiguration['data'] = { labels: [], datasets: [] };

  /** Datos para el gráfico 3 (Ciudades Principales) */
  chartData3: ChartConfiguration['data'] = { labels: [], datasets: [] };

  /** Datos para el gráfico 4 (Nivel Educativo) */
  chartData4: ChartConfiguration['data'] = { labels: [], datasets: [] };

  /** Datos para el gráfico 5 (Evolución Temporal) */
  chartData5: ChartConfiguration['data'] = { labels: [], datasets: [] };

  /** Datos para el gráfico 6 (Distribución por Edad) */
  chartData6: ChartConfiguration['data'] = { labels: [], datasets: [] };

  /** Tipo de gráfico para cada visualización */
  chartType1: ChartType = 'bar';
  chartType2: ChartType = 'pie';
  chartType3: ChartType = 'bar';
  chartType4: ChartType = 'pie';
  chartType5: ChartType = 'line';
  chartType6: ChartType = 'bar';

  /** Opciones para gráficos de barras */
  readonly barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => this.formatTooltip(context)
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  /** Opciones para gráficos circulares */
  readonly pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => this.formatTooltip(context)
        }
      },
      datalabels: {
        formatter: (value, ctx) => {
          const data = ctx.chart.data.datasets[0].data as number[];
          const total = data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return percentage > 5 ? `${percentage}%` : '';
        },
        color: '#fff',
        font: { weight: 'bold' }
      }
    }
  };

  /** Opciones para gráficos de líneas */
  readonly lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // ============================
  // TARJETAS DE RESUMEN
  // ============================

  /** Tarjetas de resumen del dashboard */
  summaryCards: SummaryCard[] = [
    { title: 'Total de Operaciones', value: 0, icon: 'assessment', trend: 'neutral', change: 0, description: 'Todas las operaciones realizadas' },
    { title: 'Registros Únicos', value: 0, icon: 'people', trend: 'neutral', change: 0, description: 'Pacientes únicos registrados' },
    { title: 'Operaciones este Mes', value: 0, icon: 'event_available', trend: 'neutral', change: 0, description: 'Operaciones del mes actual' },
    { title: 'Actualizaciones', value: 0, icon: 'update', trend: 'neutral', change: 0, description: 'Registros actualizados' },
    { title: 'Tasa de Crecimiento', value: 0, icon: 'trending_up', trend: 'neutral', change: 0, description: 'Crecimiento mensual' },
    { title: 'Edad Promedio', value: 0, icon: 'cake', trend: 'neutral', change: 0, description: 'Edad promedio de pacientes' }
  ];

  // ============================
  // CONFIGURACIÓN Y ESTADOS
  // ============================

  /** Etiquetas para las dimensiones de los gráficos */
  readonly dimensionLabels: DimensionLabels = {
    sex: 'Sexo',
    education: 'Nivel Educativo',
    economic: 'Nivel Socioeconómico',
    marital: 'Estado Civil',
    crisis: 'Estado de Crisis',
    currentCity: 'Ciudad Actual',
    hometown: 'Ciudad de Origen',
    caregiver: 'Tiene Cuidador',
    ageGroup: 'Grupo de Edad',
    operations: 'Tipo de Operación'
  };

  /** Paletas de colores para los gráficos */
  private readonly colorPalettes = {
    primary: ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#607D8B', '#00BCD4', '#FF9800'],
    pastel: ['#A5D6A7', '#90CAF9', '#FFF59D', '#EF9A9A', '#CE93D8', '#B0BEC5', '#80DEEA', '#FFCC80'],
    vibrant: ['#E91E63', '#3F51B5', '#009688', '#FF5722', '#673AB7', '#795548', '#2196F3', '#FF9800']
  };

  /** Estado de carga */
  loading = false;

  /** Mensaje de error */
  errorMessage = '';

  /** Subject para manejar la desuscripción de observables */
  private destroy$ = new Subject<void>();

  // ============================
  // CONSTRUCTOR
  // ============================

  /**
   * Constructor del componente
   * @param investigadorService Servicio para operaciones de investigación
   * @param authService Servicio de autenticación
   * @param dialog Servicio de diálogos de Angular Material
   */
  constructor(
    private investigadorService: ConsolaInvestigadorService,
    private authService: AuthService,
    public dialog: MatDialog
  ) {
    // Registrar plugins de Chart.js
    import('chart.js').then(({ Chart }) => {
      Chart.register(...registerables, ChartDataLabels);
    });
  }

  // ============================
  // MÉTODOS DEL CICLO DE VIDA
  // ============================

  /**
   * Inicialización del componente
   * - Carga capa específica si se proporciona ID
   * - O carga capas disponibles del usuario
   */
  ngOnInit(): void {
    if (this.researchLayerId) {
      this.selectedLayerId = this.researchLayerId;
      this.loadResearchLayerDetails(this.researchLayerId);
    } else {
      this.loadAvailableLayers();
    }
  }

  /**
   * Después de inicializar la vista
   * - No se necesita renderizado manual, ng2-charts lo maneja automáticamente
   */
  ngAfterViewInit(): void {
    // No need to manually render charts; ng2-charts handles this
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
  // MÉTODOS PÚBLICOS - INTERACCIÓN DE USUARIO
  // ============================

  /**
   * Alterna entre modo claro y oscuro
   */
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const host = document.querySelector('app-graficas-inicio');
    if (host) {
      if (this.isDarkMode) {
        host.classList.add('dark-mode');
      } else {
        host.classList.remove('dark-mode');
      }
    }
  }

  /**
   * Descarga un gráfico específico como imagen PNG
   * @param chartNumber Número del gráfico a descargar (1-6)
   */
  downloadChart(chartNumber: number): void {
    const canvasMap: { [key: number]: ElementRef<HTMLCanvasElement> | undefined } = {
      1: this.chartCanvas1,
      2: this.chartCanvas2,
      3: this.chartCanvas3,
      4: this.chartCanvas4,
      5: this.chartCanvas5,
      6: this.chartCanvas6
    };

    const canvas = canvasMap[chartNumber];
    if (canvas?.nativeElement) {
      try {
        const url = canvas.nativeElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `grafica-${chartNumber}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = url;
        link.click();
      } catch (error) {
        console.error(`Error downloading chart ${chartNumber}:`, error);
      }
    } else {
      console.warn(`Canvas for chart ${chartNumber} is not available.`);
    }
  }

  /**
   * Alterna el tipo de gráfico para una visualización específica
   * @param chartNumber Número del gráfico a alternar (1-6)
   */
  toggleChartType(chartNumber: number): void {
    const chartTypes: ChartType[] = ['bar', 'pie', 'line', 'doughnut'];
    let currentType: ChartType;

    switch (chartNumber) {
      case 1: currentType = this.chartType1; break;
      case 2: currentType = this.chartType2; break;
      case 3: currentType = this.chartType3; break;
      case 4: currentType = this.chartType4; break;
      case 6: currentType = this.chartType6; break;
      default: return;
    }

    const currentIndex = chartTypes.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % chartTypes.length;
    const nextType = chartTypes[nextIndex];

    switch (chartNumber) {
      case 1: this.chartType1 = nextType; break;
      case 2: this.chartType2 = nextType; break;
      case 3: this.chartType3 = nextType; break;
      case 4: this.chartType4 = nextType; break;
      case 6: this.chartType6 = nextType; break;
    }
  }

  /**
   * Maneja el cambio de rango de tiempo
   * @param value Valor del rango seleccionado
   */
  onTimeRangeChange(value: string): void {
    if (value === 'custom') {
      if (this.customRangeDialog) {
        const dialogRef = this.dialog.open(this.customRangeDialog);
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.selectedTimeRange = 'custom';
            this.filterDataByDateRange();
          }
        });
      } else {
        console.warn('Custom range dialog template is not available.');
      }
    } else {
      this.selectedTimeRange = value;
      this.filterDataByDateRange();
    }
  }

  /**
   * Aplica el rango personalizado seleccionado
   */
  applyCustomRange(): void {
    if (this.customRangeStart && this.customRangeEnd) {
      this.filterDataByDateRange();
    } else {
      console.warn('Custom date range is incomplete.');
    }
  }

  /**
   * Exporta todos los gráficos como imágenes PNG
   */
  exportAllCharts(): void {
    for (let i = 1; i <= 6; i++) {
      setTimeout(() => {
        this.downloadChart(i);
      }, i * 500);
    }
  }

  /**
   * Selecciona una capa de investigación específica
   * @param layerId ID de la capa a seleccionar
   */
  selectLayer(layerId: string): void {
    if (!layerId) return;

    const layerExists = this.availableLayers.some(l => l.id === layerId);
    if (!layerExists) {
      this.handleError('La capa seleccionada no está disponible para este usuario');
      return;
    }

    this.selectedLayerId = layerId;
    localStorage.setItem('selectedResearchLayerId', layerId);
    this.currentResearchLayer = this.availableLayers.find(l => l.id === layerId) || null;

    if (this.currentResearchLayer) {
      this.loadResearchLayerHistory(layerId);
    } else {
      this.loadResearchLayerDetails(layerId);
    }
  }

  // ============================
  // MÉTODOS PÚBLICOS - INFORMACIÓN
  // ============================

  /**
   * Obtiene la etiqueta del rango de tiempo seleccionado
   * @returns Etiqueta del rango de tiempo
   */
  getSelectedTimeRangeLabel(): string {
    const range = this.timeRanges.find(r => r.value === this.selectedTimeRange);
    return range ? range.label : 'Seleccionar período';
  }

  /**
   * Obtiene la fecha de la última actualización
   * @returns Fecha formateada de la última actualización
   */
  getUltimaActualizacion(): string {
    if (this.historialCapa.length === 0) return 'N/A';
    const ultima = this.historialCapa.reduce((latest, current) => {
      return new Date(current.changedAt) > new Date(latest.changedAt) ? current : latest;
    });
    return new Date(ultima.changedAt).toLocaleDateString();
  }

  /**
   * Obtiene el número de registros únicos
   * @returns Número de registros únicos
   */
  getNumeroRegistrosUnicos(): number {
    return this.getRegistrosUnicos(this.historialCapa).length;
  }

  /**
   * Obtiene el color de la tarjeta según la tendencia
   * @param trend Tendencia a evaluar
   * @returns Color hexadecimal correspondiente
   */
  getCardColor(trend: string): string {
    const colors = { 'up': '#4CAF50', 'down': '#F44336', 'neutral': '#FF9800' };
    return colors[trend as keyof typeof colors] || colors.neutral;
  }

  // ============================
  // MÉTODOS PRIVADOS - CARGA DE DATOS
  // ============================

  /**
   * Carga las capas de investigación disponibles para el usuario
   */
  async loadAvailableLayers(): Promise<void> {
    try {
      this.loading = true;
      this.errorMessage = '';

      const email = this.authService.getUserEmail();
      if (!email) throw new Error('No se pudo obtener el email del usuario');

      const users = await this.authService.obtenerUsuarioAutenticado(email).toPromise();
      if (!users?.[0]) throw new Error('Datos de usuario no encontrados');

      const layerIds = users[0].attributes?.researchLayerId || [];
      if (layerIds.length === 0) throw new Error('El usuario no tiene capas de investigación asignadas');

      const layers = await Promise.all(
        layerIds.map((id: string) => this.investigadorService.obtenerCapaPorId(id).toPromise())
      );
      this.availableLayers = layers.filter(l => l !== null) as ResearchLayer[];

      const savedLayerId = localStorage.getItem('selectedResearchLayerId');
      const initialLayerId = savedLayerId && this.availableLayers.some(l => l.id === savedLayerId)
        ? savedLayerId
        : this.availableLayers[0].id;

      this.selectLayer(initialLayerId);
    } catch (error) {
      console.error('Error al cargar capas disponibles:', error);
      this.handleError('Error al cargar las capas de investigación disponibles');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carga los detalles de una capa de investigación específica
   * @param layerId ID de la capa a cargar
   */
  loadResearchLayerDetails(layerId: string): void {
    this.investigadorService.obtenerCapaPorId(layerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (layer: ResearchLayer) => {
          this.currentResearchLayer = layer;
          this.loadResearchLayerHistory(layerId);
        },
        error: (err) => {
          this.handleError('Error al cargar los datos de la capa de investigación', err);
        }
      });
  }

  /**
   * Carga el historial de una capa de investigación
   * @param layerId ID de la capa a cargar
   */
  private loadResearchLayerHistory(layerId: string): void {
    const userEmail = this.authService.getUserEmail();

    if (!userEmail) {
      this.handleError('No se pudo obtener el email del usuario para la autenticación');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.investigadorService.obtenerHistorialCapaInvestigacion(
      layerId,
      userEmail,
      0,
      1000,
      'changedAt',
      'DESC'
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.historialCapa = response.data || [];
        this.loadCurrentRegisters(layerId);
      },
      error: (err) => {
        this.handleError('Error al cargar el historial de la capa', err);
        this.loading = false;
      }
    });
  }

  /**
   * Carga los registros actuales para la capa
   * @param layerId ID de la capa
   */
  private loadCurrentRegisters(layerId: string): void {
    const uniqueRegisterIds = [...new Set(this.historialCapa.map(item => item.registerId))];

    if (uniqueRegisterIds.length === 0) {
      this.processHistoryData(this.historialCapa);
      return;
    }

    const requests = uniqueRegisterIds.map(registerId => {
      const historyItem = this.historialCapa.find(item => item.registerId === registerId);
      if (!historyItem) return null;

      return this.investigadorService.obtenerRegistroActual(
        historyItem.patientIdentificationNumber,
        layerId
      ).pipe(takeUntil(this.destroy$));
    }).filter(req => req !== null);

    if (requests.length === 0) {
      this.processHistoryData(this.historialCapa);
      return;
    }

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        this.currentRegisters = responses.filter(res => res !== null);
        this.processCurrentData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar registros actuales:', err);
        this.processHistoryData(this.historialCapa);
        this.loading = false;
      }
    });
  }

  // ============================
  // MÉTODOS PRIVADOS - PROCESAMIENTO DE DATOS
  // ============================

  /**
   * Procesa los datos actuales para actualizar visualizaciones
   */
  private processCurrentData(): void {
    this.updateSummaryCards(this.currentRegisters);
    this.prepareAllChartData(this.currentRegisters);
  }

  /**
   * Procesa datos del historial para actualizar visualizaciones
   * @param historial Historial a procesar
   */
  private processHistoryData(historial: ResearchLayerHistory[]): void {
    const registrosUnicos = this.getRegistrosUnicos(historial);
    const registers = this.convertHistoryToRegisters(registrosUnicos);
    this.updateSummaryCards(registers);
    this.prepareAllChartData(registers);
  }

  /**
   * Prepara todos los gráficos con los datos proporcionados
   * @param registers Registros a visualizar
   */
  private prepareAllChartData(registers: any[]): void {
    if (!registers || registers.length === 0) {
      this.setEmptyCharts();
      return;
    }

    this.prepareDemographicCharts(registers);
    this.prepareGeographicCharts(registers);
    this.prepareTemporalCharts(registers);
    this.prepareOperationalCharts();
  }

  /**
   * Prepara gráficos demográficos
   * @param registers Registros a procesar
   */
  private prepareDemographicCharts(registers: any[]): void {
    const sexData = this.groupByDimension(registers, 'sex');
    this.chartData1 = {
      labels: Object.keys(sexData),
      datasets: [{
        label: 'Distribución por Sexo',
        data: Object.values(sexData),
        backgroundColor: this.colorPalettes.primary
      }]
    };

    const crisisData = this.groupByDimension(registers, 'crisis');
    this.chartData2 = {
      labels: Object.keys(crisisData),
      datasets: [{
        data: Object.values(crisisData),
        backgroundColor: this.colorPalettes.vibrant,
        label: 'Estado de Crisis'
      }]
    };
  }

  /**
   * Prepara gráficos geográficos
   * @param registers Registros a procesar
   */
  private prepareGeographicCharts(registers: any[]): void {
    const cityData = this.groupByDimension(registers, 'currentCity');
    const topCities = this.getTopItems(cityData, 5);
    this.chartData3 = {
      labels: Object.keys(topCities),
      datasets: [{
        label: 'Ciudades Principales',
        data: Object.values(topCities),
        backgroundColor: this.colorPalettes.pastel
      }]
    };

    const educationData = this.groupByDimension(registers, 'education');
    this.chartData4 = {
      labels: Object.keys(educationData),
      datasets: [{
        data: Object.values(educationData),
        backgroundColor: this.colorPalettes.primary,
        label: 'Nivel Educativo'
      }]
    };
  }

  /**
   * Prepara gráficos temporales
   * @param registers Registros a procesar
   */
  private prepareTemporalCharts(registers: any[]): void {
    const timelineData = this.getTimelineData();
    this.chartData5 = {
      labels: timelineData.labels,
      datasets: [{
        label: 'Registros por Mes',
        data: timelineData.data,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        fill: true
      }]
    };

    const ageData = this.groupByAge(registers);
    this.chartData6 = {
      labels: Object.keys(ageData),
      datasets: [{
        label: 'Distribución por Edad',
        data: Object.values(ageData),
        backgroundColor: this.colorPalettes.vibrant
      }]
    };
  }

  /**
   * Prepara gráficos operacionales (reservado para futuras implementaciones)
   */
  private prepareOperationalCharts(): void {
    // Add operational charts if needed
  }

  /**
   * Establece gráficos vacíos cuando no hay datos
   */
  private setEmptyCharts(): void {
    const emptyMessage = 'No hay datos disponibles';

    this.chartData1 = {
      labels: [emptyMessage],
      datasets: [{
        label: 'Distribución por Sexo',
        data: [1],
        backgroundColor: ['#e0e0e0']
      }]
    };

    this.chartData2 = {
      labels: [emptyMessage],
      datasets: [{
        label: 'Estado de Crisis',
        data: [1],
        backgroundColor: ['#e0e0e0']
      }]
    };

    this.chartData3 = {
      labels: [emptyMessage],
      datasets: [{
        label: 'Ciudades Principales',
        data: [1],
        backgroundColor: ['#e0e0e0']
      }]
    };

    this.chartData4 = {
      labels: [emptyMessage],
      datasets: [{
        label: 'Nivel Educativo',
        data: [1],
        backgroundColor: ['#e0e0e0']
      }]
    };

    this.chartData5 = {
      labels: [emptyMessage],
      datasets: [{
        label: 'Evolución de Registros',
        data: [1],
        borderColor: '#e0e0e0',
        backgroundColor: 'rgba(224, 224, 224, 0.1)',
        borderWidth: 2,
        fill: true
      }]
    };

    this.chartData6 = {
      labels: [emptyMessage],
      datasets: [{
        label: 'Distribución por Edad',
        data: [1],
        backgroundColor: ['#e0e0e0']
      }]
    };
  }

  // ============================
  // MÉTODOS PRIVADOS - UTILIDADES DE DATOS
  // ============================

  /**
   * Agrupa registros por grupos de edad
   * @param registers Registros a agrupar
   * @returns Objeto con conteos por grupo de edad
   */
  private groupByAge(registers: any[]): Record<string, number> {
    const ageGroups: Record<string, number> = {
      '0-18': 0,
      '19-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61+': 0
    };

    registers.forEach(register => {
      if (register.patientBasicInfo?.age) {
        const age = register.patientBasicInfo.age;
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 30) ageGroups['19-30']++;
        else if (age <= 45) ageGroups['31-45']++;
        else if (age <= 60) ageGroups['46-60']++;
        else ageGroups['61+']++;
      }
    });

    return Object.fromEntries(
      Object.entries(ageGroups).filter(([_, count]) => count > 0)
    );
  }

  /**
   * Obtiene datos de línea de tiempo para los últimos meses
   * @returns Objeto con etiquetas y datos de la línea de tiempo
   */
  private getTimelineData(): { labels: string[], data: number[] } {
    const last6Months = this.getLastMonths(6);
    const monthlyData: Record<string, number> = {};

    last6Months.forEach(month => {
      monthlyData[month.label] = this.historialCapa.filter(item => {
        const itemDate = new Date(item.changedAt);
        return itemDate.getMonth() === month.month && itemDate.getFullYear() === month.year;
      }).length;
    });

    return {
      labels: Object.keys(monthlyData),
      data: Object.values(monthlyData)
    };
  }

  /**
   * Obtiene los últimos N meses
   * @param count Número de meses a obtener
   * @returns Array de objetos con información de meses
   */
  private getLastMonths(count: number): { month: number, year: number, label: string }[] {
    const months = [];
    const date = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      });
    }

    return months;
  }

  /**
   * Obtiene los elementos más frecuentes de un conjunto de datos
   * @param data Datos a analizar
   * @param limit Límite de elementos a retornar
   * @returns Objeto con los elementos más frecuentes
   */
  private getTopItems(data: Record<string, number>, limit: number): Record<string, number> {
    const entries = Object.entries(data);
    entries.sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(entries.slice(0, limit));
  }

  /**
   * Agrupa registros por una dimensión específica
   * @param registers Registros a agrupar
   * @param dimension Dimensión por la cual agrupar
   * @returns Objeto con conteos por categoría de la dimensión
   */
  private groupByDimension(registers: any[], dimension: ChartDimension): Record<string, number> {
    return registers.reduce((acc: Record<string, number>, register) => {
      const value = this.getDimensionValue(dimension, register.patientBasicInfo || {}, register);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Obtiene el valor de una dimensión específica de un registro
   * @param dimension Dimensión a obtener
   * @param patientInfo Información del paciente
   * @param register Registro completo
   * @returns Valor de la dimensión formateado
   */
  private getDimensionValue(dimension: ChartDimension, patientInfo: any, register: any): string {
    switch (dimension) {
      case 'sex': return patientInfo.sex || 'No especificado';
      case 'education': return this.getEducationLabel(patientInfo.educationLevel);
      case 'economic': return this.getEconomicStatusLabel(patientInfo.economicStatus);
      case 'marital': return this.getMaritalStatusLabel(patientInfo.maritalStatus);
      case 'crisis': return patientInfo.crisisStatus || 'No especificado';
      case 'currentCity': return patientInfo.currentCity || 'No especificado';
      case 'hometown': return patientInfo.hometown || 'No especificado';
      case 'caregiver': return register.caregiver ? 'Con cuidador' : 'Sin cuidador';
      default: return 'No especificado';
    }
  }

  // ============================
  // MÉTODOS PRIVADOS - ACTUALIZACIÓN DE UI
  // ============================

  /**
   * Actualiza las tarjetas de resumen con datos actuales
   * @param registers Registros para calcular métricas
   */
  private updateSummaryCards(registers: any[]): void {
    const totalOperations = this.historialCapa.length;
    const uniqueRegisters = this.getRegistrosUnicos(this.historialCapa).length;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const thisMonthOperations = this.historialCapa.filter(item => {
      const opDate = new Date(item.changedAt);
      return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
    }).length;

    const updateOperations = this.historialCapa.filter(item =>
      item.operation !== 'REGISTER_CREATED_SUCCESSFULL'
    ).length;

    const prevMonthOperations = this.historialCapa.filter(item => {
      const opDate = new Date(item.changedAt);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return opDate.getMonth() === prevMonth && opDate.getFullYear() === prevYear;
    }).length;

    const monthChange = prevMonthOperations > 0
      ? Math.round(((thisMonthOperations - prevMonthOperations) / prevMonthOperations) * 100)
      : thisMonthOperations > 0 ? 100 : 0;

    const ages = registers
      .map(r => r.patientBasicInfo?.age)
      .filter(age => age && !isNaN(age));
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    this.summaryCards = [
      {
        title: 'Total de Operaciones',
        value: totalOperations,
        icon: 'assessment',
        trend: totalOperations > 0 ? 'up' : 'neutral',
        change: 10,
        description: 'Todas las operaciones realizadas'
      },
      {
        title: 'Registros Únicos',
        value: uniqueRegisters,
        icon: 'people',
        trend: uniqueRegisters > 0 ? 'up' : 'neutral',
        change: 5,
        description: 'Pacientes únicos registrados'
      },
      {
        title: 'Operaciones este Mes',
        value: thisMonthOperations,
        icon: 'event_available',
        trend: this.getTrendDirection(monthChange),
        change: Math.abs(monthChange),
        description: 'Operaciones del mes actual'
      },
      {
        title: 'Actualizaciones',
        value: updateOperations,
        icon: 'update',
        trend: updateOperations > 0 ? 'up' : 'neutral',
        change: 8,
        description: 'Registros actualizados'
      },
      {
        title: 'Tasa de Crecimiento',
        value: monthChange,
        icon: 'trending_up',
        trend: this.getTrendDirection(monthChange),
        change: Math.abs(monthChange),
        description: 'Crecimiento mensual'
      },
      {
        title: 'Edad Promedio',
        value: averageAge,
        icon: 'cake',
        trend: 'neutral',
        change: 0,
        description: 'Edad promedio de pacientes'
      }
    ];
  }

  /**
   * Filtra los datos según el rango de tiempo seleccionado
   */
  private filterDataByDateRange(): void {
    let filteredHistorial = [...this.historialCapa];

    if (this.selectedTimeRange !== 'all') {
      if (this.selectedTimeRange === 'custom') {
        if (this.customRangeStart && this.customRangeEnd) {
          filteredHistorial = filteredHistorial.filter(item => {
            const itemDate = new Date(item.changedAt);
            return itemDate >= this.customRangeStart! && itemDate <= this.customRangeEnd!;
          });
        }
      } else {
        const days = parseInt(this.selectedTimeRange, 10);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredHistorial = filteredHistorial.filter(item => {
          const itemDate = new Date(item.changedAt);
          return itemDate >= cutoffDate;
        });
      }
    }

    this.processHistoryData(filteredHistorial);
  }

  // ============================
  // MÉTODOS PRIVADOS - TRANSFORMACIÓN DE DATOS
  // ============================

  /**
   * Obtiene registros únicos del historial
   * @param historial Historial completo
   * @returns Array de registros únicos
   */
  private getRegistrosUnicos(historial: ResearchLayerHistory[]): ResearchLayerHistory[] {
    const registrosUnicos = new Map<string, ResearchLayerHistory>();
    historial.forEach(item => {
      if (!registrosUnicos.has(item.registerId) ||
        new Date(item.changedAt) > new Date(registrosUnicos.get(item.registerId)!.changedAt)) {
        registrosUnicos.set(item.registerId, item);
      }
    });
    return Array.from(registrosUnicos.values());
  }

  /**
   * Convierte historial a formato de registros
   * @param historial Historial a convertir
   * @returns Array de registros formateados
   */
  private convertHistoryToRegisters(historial: ResearchLayerHistory[]): any[] {
    return historial.map(item => ({
      id: item.registerId,
      registerDate: item.changedAt,
      operation: item.operation,
      patientBasicInfo: {
        sex: this.extractVariableValue(item.isResearchLayerGroup.variables, 'sex') || 'No especificado',
        educationLevel: this.extractVariableValue(item.isResearchLayerGroup.variables, 'education') || 'No especificado',
        economicStatus: this.extractVariableValue(item.isResearchLayerGroup.variables, 'economic') || 'No especificado',
        maritalStatus: this.extractVariableValue(item.isResearchLayerGroup.variables, 'marital') || 'No especificado',
        crisisStatus: this.extractVariableValue(item.isResearchLayerGroup.variables, 'crisis') || 'No especificado',
        currentCity: this.extractVariableValue(item.isResearchLayerGroup.variables, 'currentCity') || 'No especificado',
        hometown: this.extractVariableValue(item.isResearchLayerGroup.variables, 'hometown') || 'No especificado',
        age: this.extractAgeFromVariables(item.isResearchLayerGroup.variables)
      },
      caregiver: this.extractVariableValue(item.isResearchLayerGroup.variables, 'caregiver') === 'true',
    }));
  }

  /**
   * Extrae la edad de las variables del registro
   * @param variables Variables del registro
   * @returns Edad extraída o null
   */
  private extractAgeFromVariables(variables: ResearchVariable[]): number | null {
    const ageVariable = variables.find(v =>
      v.name.toLowerCase().includes('edad') || v.name.toLowerCase().includes('age')
    );
    return ageVariable?.valueAsNumber || null;
  }

  /**
   * Extrae el valor de una variable específica
   * @param variables Variables del registro
   * @param variableName Nombre de la variable a extraer
   * @returns Valor de la variable o null
   */
  private extractVariableValue(variables: ResearchVariable[], variableName: string): string | null {
    const variable = variables.find(v =>
      v.name.toLowerCase().includes(variableName.toLowerCase())
    );
    return variable?.valueAsString || variable?.valueAsNumber?.toString() || null;
  }

  // ============================
  // MÉTODOS PRIVADOS - FORMATEO Y UTILIDADES
  // ============================

  /**
   * Formatea el tooltip de los gráficos
   * @param context Contexto del tooltip
   * @returns Texto formateado del tooltip
   */
  private formatTooltip(context: any): string {
    const label = context.dataset.label || '';
    const value = context.raw as number;
    const data = context.dataset.data as number[];
    const total = data.reduce((a, b) => a + b, 0);
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return `${label}: ${value} (${percentage}%)`;
  }

  /**
   * Obtiene la etiqueta formateada para nivel educativo
   * @param value Valor del nivel educativo
   * @returns Etiqueta formateada
   */
  private getEducationLabel(value?: string): string {
    const labels: Record<string, string> = {
      'primaria': 'Primaria', 'secundaria': 'Secundaria', 'tecnico': 'Técnico',
      'universitario': 'Universitario', 'postgrado': 'Postgrado', 'ninguno': 'Ninguno'
    };
    return value ? labels[value] || value : 'No especificado';
  }

  /**
   * Obtiene la etiqueta formateada para estado económico
   * @param value Valor del estado económico
   * @returns Etiqueta formateada
   */
  private getEconomicStatusLabel(value?: string): string {
    const labels: Record<string, string> = {
      'bajo': 'Bajo', 'medio_bajo': 'Medio bajo', 'medio': 'Medio',
      'medio_alto': 'Medio alto', 'alto': 'Alto'
    };
    return value ? labels[value] || value : 'No especificado';
  }

  /**
   * Obtiene la etiqueta formateada para estado civil
   * @param value Valor del estado civil
   * @returns Etiqueta formateada
   */
  private getMaritalStatusLabel(value?: string): string {
    const labels: Record<string, string> = {
      'soltero': 'Soltero/a', 'casado': 'Casado/a', 'divorciado': 'Divorciado/a',
      'viudo': 'Viudo/a', 'union_libre': 'Unión libre'
    };
    return value ? labels[value] || value : 'No especificado';
  }

  /**
   * Obtiene la dirección de tendencia basada en un cambio porcentual
   * @param change Cambio porcentual
   * @returns Dirección de la tendencia
   */
  private getTrendDirection(change: number): TrendDirection {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }

  /**
   * Maneja errores de la aplicación
   * @param message Mensaje de error
   * @param error Error opcional
   */
  private handleError(message: string, error?: any): void {
    console.error(message, error);
    this.errorMessage = message;
    this.loading = false;
  }
}
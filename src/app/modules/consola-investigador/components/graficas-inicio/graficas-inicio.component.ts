import { Component, OnInit, ViewChild, ElementRef, OnDestroy, TemplateRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ConsolaRegistroService } from 'src/app/services/consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import { ResearchLayer } from '../../../consola-registro/interfaces';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Subject, takeUntil } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

/**
 * Tipo que define las posibles dimensiones para agrupar datos en los gráficos
 */
type ChartDimension = 'sex' | 'education' | 'economic' | 'marital' | 'crisis' | 'currentCity' | 'hometown' | 'caregiver';

/**
 * Tipo que define las posibles direcciones de tendencia para las tarjetas resumen
 */
type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Interfaz para las tarjetas resumen del dashboard
 */
interface SummaryCard {
  title: string;
  value: number;
  icon: string;
  trend: TrendDirection;
  change: number;
}

/**
 * Interfaz para la información básica del paciente
 */
interface PatientBasicInfo {
  name?: string;
  sex?: string;
  birthDate?: string | null;
  age?: number;
  educationLevel?: string;
  economicStatus?: string;
  maritalStatus?: string;
  crisisStatus?: string;
  currentCity?: string;
  hometown?: string;
}

/**
 * Interfaz completa para los registros de pacientes
 */
export interface Register {
  registerId: string;
  id?: string;
  registerDate: string;
  updateRegisterDate: string | null;
  patientIdentificationNumber: number;
  patientIdentificationType: string;
  variablesRegister: any[];
  patientBasicInfo: {
    name: string;
    sex: string;
    birthDate: string | null;
    age: number;
    email: string;
    phoneNumber: string;
    deathDate: string | null;
    economicStatus: string;
    educationLevel: string;
    maritalStatus: string;
    hometown: string;
    currentCity: string;
    firstCrisisDate: string;
    crisisStatus: string;
    hasCaregiver?: boolean;
  };
  caregiver: {
    name: string;
    identificationType: string;
    identificationNumber: number;
    age: number;
    educationLevel: string;
    occupation: string;
  } | null;
  healthProfessional: {
    id: string;
    name: string;
    identificationNumber: number;
  } | null;
}

/**
 * Interfaz para las etiquetas de dimensiones traducidas
 */
interface DimensionLabels {
  [key: string]: string;
}

@Component({
  selector: 'app-graficas-inicio',
  templateUrl: './graficas-inicio.component.html',
  styleUrls: ['./graficas-inicio.component.css']
})
export class GraficasInicioComponent implements OnInit, OnDestroy {
  // Referencias a elementos del DOM
  @ViewChild('chartCanvas1') chartCanvas1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas2') chartCanvas2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMenuTrigger1') chartMenuTrigger1!: MatMenuTrigger;
  @ViewChild('chartMenuTrigger2') chartMenuTrigger2!: MatMenuTrigger;
  @ViewChild('customRangeDialog') customRangeDialog!: TemplateRef<any>;

  // Estado del componente
  isDarkMode = false;
  allRegisters: Register[] = [];
  
  // Datos para gráficos
  chartData1: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartData2: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Opciones de configuración para gráficos de barras
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

  // Opciones de configuración para gráficos de torta
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

  // Tipos de gráficos iniciales
  chartType1: ChartType = 'bar';
  chartType2: ChartType = 'pie';

  // Tarjetas resumen con valores iniciales
  summaryCards: SummaryCard[] = [
    { title: 'Pacientes Registrados', value: 0, icon: 'people', trend: 'neutral', change: 0 },
    { title: 'Crisis Activas', value: 0, icon: 'warning', trend: 'neutral', change: 0 },
    { title: 'Nuevos este Mes', value: 0, icon: 'event_available', trend: 'neutral', change: 0 },
    { title: 'Con Cuidador', value: 0, icon: 'accessibility', trend: 'neutral', change: 0 }
  ];

  // Mapeo de dimensiones a etiquetas traducidas
  readonly dimensionLabels: DimensionLabels = {
    sex: 'Sexo',
    education: 'Nivel Educativo',
    economic: 'Nivel Socioeconómico',
    marital: 'Estado Civil',
    crisis: 'Estado de Crisis',
    currentCity: 'Ciudad Actual',
    hometown: 'Ciudad de Origen',
    caregiver: 'Tiene Cuidador'
  };

  // Configuración de rangos de tiempo para filtros
  selectedTimeRange = '30';
  timeRanges = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
    { value: 'custom', label: 'Personalizado' }
  ];
  customRangeStart: Date | null = null;
  customRangeEnd: Date | null = null;

  // Estado de la capa de investigación actual
  currentResearchLayer: ResearchLayer | null = null;
  loading = false;
  errorMessage = '';
  
  // Instancias de gráficos y sujeto para manejo de suscripciones
  private chart1: Chart | null = null;
  private chart2: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private registerService: ConsolaRegistroService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    // Registra los componentes necesarios de Chart.js
    Chart.register(...registerables, ChartDataLabels);
  }

  /**
   * Método del ciclo de vida: Inicialización del componente
   */
  ngOnInit(): void {
    this.loadCurrentResearchLayer();
  }

  /**
   * Método del ciclo de vida: Destrucción del componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  /**
   * Destruye las instancias de gráficos para liberar memoria
   */
  private destroyCharts(): void {
    if (this.chart1) {
      this.chart1.destroy();
      this.chart1 = null;
    }
    if (this.chart2) {
      this.chart2.destroy();
      this.chart2 = null;
    }
  }

  /**
   * Formatea el tooltip para mostrar valores y porcentajes
   * @param context Contexto del tooltip de Chart.js
   * @returns Cadena formateada para el tooltip
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
   * Carga la capa de investigación del usuario actual
   */
  loadCurrentResearchLayer(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.getCurrentUserResearchLayer()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (researchLayerId: string | null) => {
          if (!researchLayerId) {
            this.handleError('El usuario no tiene asignada una capa de investigación');
            return;
          }
          this.loadResearchLayerDetails(researchLayerId);
        },
        error: (err) => {
          this.handleError('Error al obtener la información del usuario', err);
        }
      });
  }

  /**
   * Carga los detalles de la capa de investigación
   * @param layerId ID de la capa de investigación
   */
  private loadResearchLayerDetails(layerId: string): void {
    this.registerService.obtenerCapaPorId(layerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (layer: ResearchLayer) => {
          this.currentResearchLayer = layer;
          this.loadInitialData();
        },
        error: (err) => {
          this.handleError('Error al cargar los datos de la capa de investigación', err);
        }
      });
  }

  /**
   * Maneja errores mostrando un mensaje y registrando en consola
   * @param message Mensaje de error para mostrar al usuario
   * @param error Objeto de error opcional para logging
   */
  private handleError(message: string, error?: any): void {
    console.error(message, error);
    this.errorMessage = message;
    this.loading = false;
  }

  /**
   * Carga los datos iniciales de registros médicos
   */
  loadInitialData(): void {
    if (!this.currentResearchLayer?.id) {
      this.handleError('No se ha configurado la capa de investigación');
      return;
    }

    this.loading = true;

    this.registerService.obtenerRegistrosPorCapa(
      this.currentResearchLayer.id,
      0,
      1000,
      'registerDate',
      'DESC'
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { registers: Register[] }) => {
          this.allRegisters = response.registers || [];
          this.prepareDashboardData(this.allRegisters);
          this.loading = false;
        },
        error: (err) => {
          this.handleError('Error al cargar los registros médicos', err);
        }
      });
  }

  /**
   * Prepara los datos para el dashboard (tarjetas y gráficos)
   * @param registers Array de registros médicos
   */
  private prepareDashboardData(registers: Register[]): void {
    this.updateSummaryCards(registers);
    this.prepareChartData(registers);
    this.renderCharts();
  }

  /**
   * Prepara los datos para los gráficos
   * @param registers Array de registros médicos
   */
  private prepareChartData(registers: Register[]): void {
    // Gráfica 1: Distribución por sexo
    const sexData = this.groupByDimension(registers, 'sex');
    this.chartData1 = {
      labels: Object.keys(sexData),
      datasets: [{
        label: 'Distribución por Sexo',
        data: Object.values(sexData),
        backgroundColor: ['#4CAF50', '#2196F3', '#9E9E9E']
      }]
    };

    // Gráfica 2: Distribución por estado de crisis
    const crisisData = this.groupByDimensionWithMapping(registers, 'crisis', {
      'activa': 'Activa',
      'inactiva': 'Inactiva',
      'controlada': 'Controlada'
    });

    this.chartData2 = {
      labels: Object.keys(crisisData),
      datasets: [{
        data: Object.values(crisisData),
        backgroundColor: ['#FFC107', '#F44336', '#9C27B0', '#607D8B', '#00BCD4'],
        label: 'Estado de Crisis'
      }]
    };
  }

  /**
   * Agrupa registros por dimensión aplicando un mapeo de valores
   * @param registers Array de registros médicos
   * @param dimension Dimensión por la que agrupar
   * @param valueMap Mapeo de valores para traducción/estandarización
   * @returns Objeto con conteos agrupados por valores mapeados
   */
  private groupByDimensionWithMapping(
    registers: Register[], 
    dimension: ChartDimension,
    valueMap: Record<string, string>
  ): Record<string, number> {
    return registers.reduce((acc: Record<string, number>, register) => {
      const rawValue = this.getDimensionValue(dimension, register.patientBasicInfo || {}, register);
      const mappedValue = valueMap[rawValue.toLowerCase()] || rawValue;
      acc[mappedValue] = (acc[mappedValue] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Actualiza las tarjetas resumen con datos actuales
   * @param registers Array de registros médicos
   */
  private updateSummaryCards(registers: Register[]): void {
    const totalPatients = registers.length;
    
    // Contar crisis activas
    const withCrisis = registers.filter(r => {
      const status = r.patientBasicInfo?.crisisStatus?.toLowerCase();
      return status === 'activa' || status === 'active';
    }).length;
    
    const withCaregiver = registers.filter(r => r.caregiver).length;

    // Calcular pacientes del mes actual
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const thisMonthPatients = registers.filter(r => {
      const regDate = new Date(r.registerDate);
      return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
    }).length;

    // Calcular tendencias comparando con el mes anterior
    const prevMonthPatients = registers.filter(r => {
      const regDate = new Date(r.registerDate);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return regDate.getMonth() === prevMonth && regDate.getFullYear() === prevYear;
    }).length;

    const monthChange = prevMonthPatients > 0
      ? Math.round(((thisMonthPatients - prevMonthPatients) / prevMonthPatients) * 100)
      : 0;

    // Actualizar las tarjetas
    this.summaryCards = [
      {
        title: 'Pacientes Registrados',
        value: totalPatients,
        icon: 'people',
        trend: totalPatients > 0 ? 'up' : 'neutral',
        change: 10
      },
      {
        title: 'Crisis Activas',
        value: withCrisis,
        icon: 'warning',
        trend: withCrisis > 0 ? 'down' : 'neutral',
        change: 5
      },
      {
        title: 'Nuevos este Mes',
        value: thisMonthPatients,
        icon: 'event_available',
        trend: this.getTrendDirection(monthChange),
        change: Math.abs(monthChange)
      },
      {
        title: 'Con Cuidador',
        value: withCaregiver,
        icon: 'accessibility',
        trend: withCaregiver > 0 ? 'up' : 'neutral',
        change: 8
      }
    ];
  }

  /**
   * Determina la dirección de la tendencia basada en el cambio porcentual
   * @param change Porcentaje de cambio
   * @returns Dirección de la tendencia (up, down, neutral)
   */
  private getTrendDirection(change: number): TrendDirection {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }

  /**
   * Renderiza los gráficos con los datos actuales
   */
  private renderCharts(): void {
    this.destroyCharts();

    // Renderizar gráfico 1
    const ctx1 = this.chartCanvas1?.nativeElement?.getContext('2d');
    if (ctx1) {
      this.chart1 = new Chart(ctx1, {
        type: this.chartType1,
        data: this.chartData1,
        options: this.chartType1 === 'bar' ? this.barChartOptions : this.pieChartOptions
      });
    }

    // Renderizar gráfico 2
    const ctx2 = this.chartCanvas2?.nativeElement?.getContext('2d');
    if (ctx2) {
      this.chart2 = new Chart(ctx2, {
        type: this.chartType2,
        data: this.chartData2,
        options: this.chartType2 === 'pie' ? this.pieChartOptions : this.barChartOptions
      });
    }
  }

  /**
   * Agrupa registros por una dimensión específica
   * @param registers Array de registros médicos
   * @param dimension Dimensión por la que agrupar
   * @returns Objeto con conteos agrupados por valores de la dimensión
   */
  private groupByDimension(registers: Register[], dimension: ChartDimension): Record<string, number> {
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
   * @returns Valor formateado de la dimensión
   */
  private getDimensionValue(dimension: ChartDimension, patientInfo: PatientBasicInfo, register: Register): string {
    switch (dimension) {
      case 'sex':
        return patientInfo.sex || 'No especificado';
      case 'education':
        return this.getEducationLabel(patientInfo.educationLevel);
      case 'economic':
        return this.getEconomicStatusLabel(patientInfo.economicStatus);
      case 'marital':
        return this.getMaritalStatusLabel(patientInfo.maritalStatus);
      case 'crisis':
        return patientInfo.crisisStatus || 'No especificado';
      case 'currentCity':
        return patientInfo.currentCity || 'No especificado';
      case 'hometown':
        return patientInfo.hometown || 'No especificado';
      case 'caregiver':
        return register.caregiver ? 'Con cuidador' : 'Sin cuidador';
      default:
        return 'No especificado';
    }
  }

  /**
   * Obtiene la etiqueta traducida para el nivel educativo
   * @param value Valor del nivel educativo
   * @returns Etiqueta traducida o valor original si no hay traducción
   */
  private getEducationLabel(value?: string): string {
    const labels: Record<string, string> = {
      'primaria': 'Primaria',
      'secundaria': 'Secundaria',
      'tecnico': 'Técnico',
      'universitario': 'Universitario',
      'postgrado': 'Postgrado',
      'ninguno': 'Ninguno'
    };
    return value ? labels[value] || value : 'No especificado';
  }

  /**
   * Obtiene la etiqueta traducida para el nivel socioeconómico
   * @param value Valor del nivel socioeconómico
   * @returns Etiqueta traducida o valor original si no hay traducción
   */
  private getEconomicStatusLabel(value?: string): string {
    const labels: Record<string, string> = {
      'bajo': 'Bajo',
      'medio_bajo': 'Medio bajo',
      'medio': 'Medio',
      'medio_alto': 'Medio alto',
      'alto': 'Alto'
    };
    return value ? labels[value] || value : 'No especificado';
  }

  /**
   * Obtiene la etiqueta traducida para el estado civil
   * @param value Valor del estado civil
   * @returns Etiqueta traducida o valor original si no hay traducción
   */
  private getMaritalStatusLabel(value?: string): string {
    const labels: Record<string, string> = {
      'soltero': 'Soltero/a',
      'casado': 'Casado/a',
      'divorciado': 'Divorciado/a',
      'viudo': 'Viudo/a',
      'union_libre': 'Unión libre'
    };
    return value ? labels[value] || value : 'No especificado';
  }

  /**
   * Obtiene el color CSS para una tarjeta basado en su tendencia
   * @param trend Dirección de la tendencia
   * @returns Color CSS correspondiente
   */
  getCardColor(trend: string): string {
    const colors = {
      'up': 'var(--success-color)',
      'down': 'var(--error-color)',
      'neutral': 'var(--accent-primary)'
    };
    return colors[trend as keyof typeof colors] || colors.neutral;
  }

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
   * Descarga un gráfico como imagen PNG
   * @param chartNumber Número del gráfico a descargar (1 o 2)
   */
  downloadChart(chartNumber: number): void {
    const chart = chartNumber === 1 ? this.chart1 : this.chart2;
    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.download = `grafica-${chartNumber}.png`;
      link.href = url;
      link.click();
    }
  }

  /**
   * Alterna el tipo de gráfico entre barras y torta
   * @param chartNumber Número del gráfico a alternar (1 o 2)
   */
  toggleChartType(chartNumber: number): void {
    if (chartNumber === 1) {
      this.chartType1 = this.chartType1 === 'bar' ? 'pie' : 'bar';
    } else {
      this.chartType2 = this.chartType2 === 'pie' ? 'bar' : 'pie';
    }
    this.renderCharts();
  }

  /**
   * Obtiene la etiqueta del rango de tiempo seleccionado
   * @returns Etiqueta del rango de tiempo
   */
  getSelectedTimeRangeLabel(): string {
    const range = this.timeRanges.find(r => r.value === this.selectedTimeRange);
    return range ? range.label : 'Seleccionar período';
  }

  /**
   * Maneja el cambio en el selector de rango de tiempo
   * @param value Valor del rango seleccionado
   */
  onTimeRangeChange(value: string): void {
    if (value === 'custom') {
      const dialogRef = this.dialog.open(this.customRangeDialog);
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.selectedTimeRange = 'custom';
          this.filterDataByDateRange();
        }
      });
    } else {
      this.selectedTimeRange = value;
      this.filterDataByDateRange();
    }
  }

  /**
   * Aplica un rango de fechas personalizado
   */
  applyCustomRange(): void {
    if (this.customRangeStart && this.customRangeEnd) {
      this.filterDataByDateRange();
    }
  }

  /**
   * Filtra los datos según el rango de tiempo seleccionado
   */
  filterDataByDateRange(): void {
    let filteredRegisters = [...this.allRegisters];
    
    if (this.selectedTimeRange !== 'all') {
      if (this.selectedTimeRange === 'custom') {
        if (this.customRangeStart && this.customRangeEnd) {
          filteredRegisters = filteredRegisters.filter(register => {
            const registerDate = new Date(register.registerDate);
            return registerDate >= this.customRangeStart! && registerDate <= this.customRangeEnd!;
          });
        }
      } else {
        const days = parseInt(this.selectedTimeRange, 10);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        filteredRegisters = filteredRegisters.filter(register => {
          const registerDate = new Date(register.registerDate);
          return registerDate >= cutoffDate;
        });
      }
    }
    
    this.prepareDashboardData(filteredRegisters);
  }
}
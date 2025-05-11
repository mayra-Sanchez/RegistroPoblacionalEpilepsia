import { Component, OnInit, ViewChild, ElementRef, OnDestroy, TemplateRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import { ResearchLayer } from '../../../consola-registro/interfaces';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Subject, takeUntil } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

type ChartDimension = 'sex' | 'education' | 'economic' | 'marital' | 'crisis' | 'currentCity' | 'hometown' | 'caregiver';
type TrendDirection = 'up' | 'down' | 'neutral';

interface SummaryCard {
  title: string;
  value: number;
  icon: string;
  trend: TrendDirection;
  change: number;
}

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

interface DimensionLabels {
  [key: string]: string;
}

@Component({
  selector: 'app-graficas-inicio',
  templateUrl: './graficas-inicio.component.html',
  styleUrls: ['./graficas-inicio.component.css']
})
export class GraficasInicioComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas1') chartCanvas1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas2') chartCanvas2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMenuTrigger1') chartMenuTrigger1!: MatMenuTrigger;
  @ViewChild('chartMenuTrigger2') chartMenuTrigger2!: MatMenuTrigger;
  @ViewChild('customRangeDialog') customRangeDialog!: TemplateRef<any>;

  isDarkMode = false;
  allRegisters: Register[] = [];
  
  // Datos para gráficos
  chartData1: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartData2: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Opciones de gráficos
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

  chartType1: ChartType = 'bar';
  chartType2: ChartType = 'pie';

  // Tarjetas resumen con valores iniciales
  summaryCards: SummaryCard[] = [
    { title: 'Pacientes Registrados', value: 0, icon: 'people', trend: 'neutral', change: 0 },
    { title: 'Crisis Activas', value: 0, icon: 'warning', trend: 'neutral', change: 0 },
    { title: 'Nuevos este Mes', value: 0, icon: 'event_available', trend: 'neutral', change: 0 },
    { title: 'Con Cuidador', value: 0, icon: 'accessibility', trend: 'neutral', change: 0 }
  ];

  // Dimensiones y traducciones
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

  // Filtro de tiempo
  selectedTimeRange = '30';
  timeRanges = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
    { value: 'custom', label: 'Personalizado' }
  ];
  customRangeStart: Date | null = null;
  customRangeEnd: Date | null = null;

  currentResearchLayer: ResearchLayer | null = null;
  loading = false;
  errorMessage = '';
  private chart1: Chart | null = null;
  private chart2: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private registerService: ConsolaRegistroService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    Chart.register(...registerables, ChartDataLabels);
  }

  ngOnInit(): void {
    this.loadCurrentResearchLayer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

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

  private formatTooltip(context: any): string {
    const label = context.dataset.label || '';
    const value = context.raw as number;
    const data = context.dataset.data as number[];
    const total = data.reduce((a, b) => a + b, 0);
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return `${label}: ${value} (${percentage}%)`;
  }

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

  private handleError(message: string, error?: any): void {
    console.error(message, error);
    this.errorMessage = message;
    this.loading = false;
  }

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
          console.log('Datos recibidos:', this.allRegisters); // Para depuración
          this.prepareDashboardData(this.allRegisters);
          this.loading = false;
        },
        error: (err) => {
          this.handleError('Error al cargar los registros médicos', err);
        }
      });
  }

  private prepareDashboardData(registers: Register[]): void {
    this.updateSummaryCards(registers);
    this.prepareChartData(registers);
    this.renderCharts();
  }

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

    // Gráfica 2: Distribución por estado de crisis - Versión corregida
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

  private updateSummaryCards(registers: Register[]): void {
    const totalPatients = registers.length;
    
    // Contar crisis activas - versión más robusta
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

    // Calcular tendencias
    const prevMonthPatients = registers.filter(r => {
      const regDate = new Date(r.registerDate);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return regDate.getMonth() === prevMonth && regDate.getFullYear() === prevYear;
    }).length;

    const monthChange = prevMonthPatients > 0
      ? Math.round(((thisMonthPatients - prevMonthPatients) / prevMonthPatients) * 100)
      : 0;

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

  private getTrendDirection(change: number): TrendDirection {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }

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

  private groupByDimension(registers: Register[], dimension: ChartDimension): Record<string, number> {
    return registers.reduce((acc: Record<string, number>, register) => {
      const value = this.getDimensionValue(dimension, register.patientBasicInfo || {}, register);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

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

  getCardColor(trend: string): string {
    const colors = {
      'up': 'var(--success-color)',
      'down': 'var(--error-color)',
      'neutral': 'var(--accent-primary)'
    };
    return colors[trend as keyof typeof colors] || colors.neutral;
  }

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

  // Métodos para los menús de gráficos
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

  toggleChartType(chartNumber: number): void {
    if (chartNumber === 1) {
      this.chartType1 = this.chartType1 === 'bar' ? 'pie' : 'bar';
    } else {
      this.chartType2 = this.chartType2 === 'pie' ? 'bar' : 'pie';
    }
    this.renderCharts();
  }

  // Métodos para el filtro de tiempo
  getSelectedTimeRangeLabel(): string {
    const range = this.timeRanges.find(r => r.value === this.selectedTimeRange);
    return range ? range.label : 'Seleccionar período';
  }

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

  applyCustomRange(): void {
    if (this.customRangeStart && this.customRangeEnd) {
      this.filterDataByDateRange();
    }
  }

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
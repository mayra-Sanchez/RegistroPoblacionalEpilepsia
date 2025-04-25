import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import { ResearchLayer } from '../../../consola-registro/interfaces';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Definir tipos e interfaces
type ChartDimension = 'sex' | 'education' | 'economic' | 'marital' | 'crisis' | 'currentCity' | 'hometown' | 'caregiver';

interface SummaryCard {
  title: string;
  value: number;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
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

@Component({
  selector: 'app-graficas-inicio',
  templateUrl: './graficas-inicio.component.html',
  styleUrls: ['./graficas-inicio.component.css']
})
export class GraficasInicioComponent implements OnInit {
  @ViewChild('chartCanvas1') chartCanvas1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas2') chartCanvas2!: ElementRef<HTMLCanvasElement>;

  // Datos para gráficos
  chartData1: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartData2: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartData3: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Opciones de gráficos
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
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
    }
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
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
  chartType3: ChartType = 'line';

  // Tarjetas resumen
  summaryCards: SummaryCard[] = [
    { title: 'Pacientes Registrados', value: 0, icon: 'people', trend: 'up', change: 0 },
    { title: 'Crisis Activas', value: 0, icon: 'warning', trend: 'down', change: 0 },
    { title: 'Nuevos este Mes', value: 0, icon: 'event_available', trend: 'neutral', change: 0 },
    { title: 'Con Cuidador', value: 0, icon: 'accessibility', trend: 'up', change: 0 }
  ];

  // Dimensiones y traducciones
  dimensionLabels = {
    sex: 'Sexo',
    education: 'Nivel Educativo',
    economic: 'Nivel Socioeconómico',
    marital: 'Estado Civil',
    crisis: 'Estado de Crisis',
    currentCity: 'Ciudad Actual',
    hometown: 'Ciudad de Origen',
    caregiver: 'Tiene Cuidador'
  };

  currentResearchLayer: ResearchLayer | null = null;
  loading = false;
  errorMessage = '';
  private chart1: Chart | null = null;
  private chart2: Chart | null = null;

  constructor(
    private registerService: ConsolaRegistroService,
    private authService: AuthService
  ) {
    Chart.register(...registerables, ChartDataLabels);
  }

  ngOnInit(): void {
    this.loadCurrentResearchLayer();
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

    this.authService.getCurrentUserResearchLayer().subscribe({
      next: (researchLayerId: string | null) => {
        if (!researchLayerId) {
          this.errorMessage = 'El usuario no tiene asignada una capa de investigación';
          this.loading = false;
          return;
        }

        this.registerService.obtenerCapaPorId(researchLayerId).subscribe({
          next: (layer: ResearchLayer) => {
            this.currentResearchLayer = layer;
            this.loadInitialData();
          },
          error: (err) => {
            console.error('Error al cargar la capa:', err);
            this.errorMessage = 'Error al cargar los datos de la capa de investigación';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener la capa:', err);
        this.errorMessage = 'Error al obtener la información del usuario';
        this.loading = false;
      }
    });
  }

  loadInitialData(): void {
    if (!this.currentResearchLayer?.id) {
      this.errorMessage = 'No se ha configurado la capa de investigación';
      return;
    }

    this.loading = true;

    this.registerService.obtenerRegistrosPorCapa(
      this.currentResearchLayer.id,
      0,
      1000,
      'registerDate',
      'DESC'
    ).subscribe({
      next: (response: any) => {
        this.prepareDashboardData(response.registers || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading registers:', err);
        this.errorMessage = 'Failed to load medical records';
        this.loading = false;
      }
    });
  }

  prepareDashboardData(registers: any[]): void {
    // Actualizar tarjetas resumen
    this.updateSummaryCards(registers);
    
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

    // Gráfica 2: Distribución por tipo de crisis
    const crisisData = this.groupByDimension(registers, 'crisis');
    this.chartData2 = {
      labels: Object.keys(crisisData),
      datasets: [{
        data: Object.values(crisisData),
        backgroundColor: ['#FFC107', '#F44336', '#9C27B0', '#607D8B'],
        label: 'Tipos de Crisis'
      }]
    };

    // Renderizar gráficos
    this.renderCharts();
  }

  private updateSummaryCards(registers: any[]): void {
    const totalPatients = registers.length;
    const withCrisis = registers.filter(r => r.patientBasicInfo?.crisisStatus === 'activa').length;
    const withCaregiver = registers.filter(r => r.caregiver).length;
    
    // Obtener registros del mes actual (ejemplo simplificado)
    const currentMonth = new Date().getMonth();
    const thisMonthPatients = registers.filter(r => {
      const regDate = new Date(r.registerDate);
      return regDate.getMonth() === currentMonth;
    }).length;

    this.summaryCards = [
      { title: 'Pacientes Registrados', value: totalPatients, icon: 'people', trend: 'up', change: 12 },
      { title: 'Crisis Activas', value: withCrisis, icon: 'warning', trend: 'down', change: 5 },
      { title: 'Nuevos este Mes', value: thisMonthPatients, icon: 'event_available', trend: 'neutral', change: 0 },
      { title: 'Con Cuidador', value: withCaregiver, icon: 'accessibility', trend: 'up', change: 8 }
    ];
  }

  private renderCharts(): void {
    // Destruir gráficos existentes
    if (this.chart1) this.chart1.destroy();
    if (this.chart2) this.chart2.destroy();

    // Renderizar gráfico 1
    const ctx1 = this.chartCanvas1?.nativeElement?.getContext('2d');
    if (ctx1) {
      this.chart1 = new Chart(ctx1, {
        type: this.chartType1,
        data: this.chartData1,
        options: this.barChartOptions
      });
    }

    // Renderizar gráfico 2
    const ctx2 = this.chartCanvas2?.nativeElement?.getContext('2d');
    if (ctx2) {
      this.chart2 = new Chart(ctx2, {
        type: this.chartType2,
        data: this.chartData2,
        options: this.pieChartOptions
      });
    }
  }

  private groupByDimension(registers: any[], dimension: ChartDimension): Record<string, number> {
    return registers.reduce((acc: Record<string, number>, register: any) => {
      const patientInfo = register.patientBasicInfo || {};
      let key: string;
      
      switch(dimension) {
        case 'sex':
          key = patientInfo.sex || 'No especificado';
          break;
        case 'education':
          key = this.getEducationLabel(patientInfo.educationLevel);
          break;
        case 'economic':
          key = this.getEconomicStatusLabel(patientInfo.economicStatus);
          break;
        case 'marital':
          key = this.getMaritalStatusLabel(patientInfo.maritalStatus);
          break;
        case 'crisis':
          key = patientInfo.crisisStatus || 'No especificado';
          break;
        case 'currentCity':
          key = patientInfo.currentCity || 'No especificado';
          break;
        case 'hometown':
          key = patientInfo.hometown || 'No especificado';
          break;
        case 'caregiver':
          key = register.caregiver ? 'Con cuidador' : 'Sin cuidador';
          break;
        default:
          key = 'No especificado';
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private getEducationLabel(value: string | undefined): string {
    if (!value) return 'No especificado';
    
    const labels: Record<string, string> = {
      'primaria': 'Primaria',
      'secundaria': 'Secundaria',
      'tecnico': 'Técnico',
      'universitario': 'Universitario',
      'postgrado': 'Postgrado',
      'ninguno': 'Ninguno'
    };
    return labels[value] || value;
  }

  private getEconomicStatusLabel(value: string | undefined): string {
    if (!value) return 'No especificado';
    
    const labels: Record<string, string> = {
      'bajo': 'Bajo',
      'medio_bajo': 'Medio bajo',
      'medio': 'Medio',
      'medio_alto': 'Medio alto',
      'alto': 'Alto'
    };
    return labels[value] || value;
  }

  private getMaritalStatusLabel(value: string | undefined): string {
    if (!value) return 'No especificado';
    
    const labels: Record<string, string> = {
      'soltero': 'Soltero/a',
      'casado': 'Casado/a',
      'divorciado': 'Divorciado/a',
      'viudo': 'Viudo/a',
      'union_libre': 'Unión libre'
    };
    return labels[value] || value;
  }

  ngOnDestroy(): void {
    if (this.chart1) this.chart1.destroy();
    if (this.chart2) this.chart2.destroy();
  }

  getCardColor(trend: string): string {
    switch(trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#607D8B';
    }
  }
}
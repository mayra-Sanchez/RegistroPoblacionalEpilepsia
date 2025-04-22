import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import { ResearchLayer } from '../../../consola-registro/interfaces';

type ChartDimension = 'sex' | 'education' | 'economic' | 'marital' | 'crisis' | 'currentCity' | 'hometown' | 'caregiver';

@Component({
  selector: 'app-graficas-inicio',
  templateUrl: './graficas-inicio.component.html',
  styleUrls: ['./graficas-inicio.component.css']
})
export class GraficasInicioComponent implements OnInit {
  chartData1: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartData2: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            const data = context.dataset.data as number[];
            const total = data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  chartType1: ChartType = 'bar';
  chartType2: ChartType = 'pie';

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

  constructor(
    private registerService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCurrentResearchLayer();
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
      0, // page
      1000, // size (grande para obtener todos los registros)
      'registerDate',
      'DESC'
    ).subscribe({
      next: (response: any) => {
        this.prepareCharts(response.registers || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading registers:', err);
        this.errorMessage = 'Failed to load medical records';
        this.loading = false;
      }
    });
  }

  prepareCharts(registers: any[]): void {
    // Gráfica 1: Distribución por sexo y estado de crisis
    const sexData = this.groupByDimension(registers, 'sex');
    const crisisData = this.groupByDimension(registers, 'crisis');
    
    this.chartData1 = {
      labels: Object.keys(sexData),
      datasets: [
        {
          label: this.dimensionLabels['sex'],
          data: Object.values(sexData),
          backgroundColor: ['#4CAF50', '#2196F3'] // Verde y azul
        },
        {
          label: this.dimensionLabels['crisis'],
          data: Object.keys(sexData).map(() => Object.values(crisisData).reduce((a, b) => a + b, 0) / Object.keys(crisisData).length),
          backgroundColor: ['#FFC107'] // Amarillo
        }
      ]
    };

    // Gráfica 2: Distribución por nivel educativo
    const educationData = this.groupByDimension(registers, 'education');
    this.chartData2 = {
      labels: Object.keys(educationData),
      datasets: [{
        data: Object.values(educationData),
        backgroundColor: ['#FFC107', '#4CAF50', '#2196F3', '#F44336', '#9C27B0', '#607D8B'],
        label: this.dimensionLabels['education']
      }]
    };
  }

  private groupByDimension(registers: any[], dimension: ChartDimension): Record<string, number> {
    return registers.reduce((acc: Record<string, number>, register: any) => {
      const patientInfo = register.patientBasicInfo;
      let key: string;
      
      switch(dimension) {
        case 'sex':
          key = patientInfo?.sex || 'No especificado';
          break;
        case 'education':
          key = this.getEducationLabel(patientInfo?.educationLevel);
          break;
        case 'economic':
          key = this.getEconomicStatusLabel(patientInfo?.economicStatus);
          break;
        case 'marital':
          key = this.getMaritalStatusLabel(patientInfo?.maritalStatus);
          break;
        case 'crisis':
          key = patientInfo?.crisisStatus || 'No especificado';
          break;
        case 'currentCity':
          key = patientInfo?.currentCity || 'No especificado';
          break;
        case 'hometown':
          key = patientInfo?.hometown || 'No especificado';
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

  private getEducationLabel(value: string): string {
    const labels: Record<string, string> = {
      'primaria': 'Primaria',
      'secundaria': 'Secundaria',
      'tecnico': 'Técnico',
      'universitario': 'Universitario',
      'postgrado': 'Postgrado',
      'ninguno': 'Ninguno'
    };
    return value in labels ? labels[value] : value;
  }

  private getEconomicStatusLabel(value: string): string {
    const labels: Record<string, string> = {
      'bajo': 'Bajo',
      'medio_bajo': 'Medio bajo',
      'medio': 'Medio',
      'medio_alto': 'Medio alto',
      'alto': 'Alto'
    };
    return value in labels ? labels[value] : value;
  }

  private getMaritalStatusLabel(value: string): string {
    const labels: Record<string, string> = {
      'soltero': 'Soltero/a',
      'casado': 'Casado/a',
      'divorciado': 'Divorciado/a',
      'viudo': 'Viudo/a',
      'union_libre': 'Unión libre'
    };
    return value in labels ? labels[value] : value;
  }
}
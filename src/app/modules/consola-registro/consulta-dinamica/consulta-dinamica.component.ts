import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConsolaRegistroService } from '../services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import { Register, ResearchLayer } from '../interfaces';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import ChartDataLabels from 'chartjs-plugin-datalabels';

type CrisisStatus = 'Activa' | 'Remisión' | 'Estable' | 'Crítica' | 'Recuperado' | string;
type ChartDimension = 'sex' | 'education' | 'economic' | 'marital' | 'crisis' | 'currentCity' | 'hometown' | 'caregiver';

interface PatientBasicInfo {
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
  caregiver?: {
    name: string;
    identificationType: string;
    identificationNumber: number;
    age: number;
    educationLevel: string;
    occupation: string;
  };
}

interface PatientStat {
  sex: string;
  age: number;
  crisisStatus: CrisisStatus;
  registerDate: Date;
  variables: string[];
  educationLevel: string;
  economicStatus: string;
  maritalStatus: string;
  hometown: string;
  currentCity: string;
  hasCaregiver: boolean;
  caregiverEducation: string;
  caregiverOccupation: string;
  firstCrisisDate?: string;
}

@Component({
  selector: 'app-consulta-dinamica',
  templateUrl: './consulta-dinamica.component.html',
  styleUrls: ['./consulta-dinamica.component.css']
})
export class ConsultaDinamicaComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  allRegisters: Register[] = [];
  filteredRegisters: Register[] = [];
  filteredData = new MatTableDataSource<PatientStat>([]);
  currentChart: Chart | null = null;

  filters = {
    patientName: '',
    variableName: '',
    minAge: null as number | null,
    maxAge: null as number | null,
    sex: '',
    crisisStatus: '' as string,
    dateRange: { start: null as Date | null, end: null as Date | null },
    ageRange: [0, 100] as [number, number],
    educationLevel: '',
    economicStatus: '',
    maritalStatus: '',
    hometown: '',
    currentCity: '',
    hasCaregiver: null as boolean | null,
    caregiverEducation: '',
    caregiverOccupation: ''
  };

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  viewType: 'chart' | 'table' = 'table';
  chartType: ChartType = 'bar';
  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            const data = context.dataset.data as number[];
            const total = data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
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
          stepSize: 1
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 0
      }
    }
  };

  availableDimensions: ChartDimension[] = [
    'sex', 'education', 'economic', 'marital', 'crisis', 'currentCity', 'hometown', 'caregiver'
  ];

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

  displayedColumns: string[] = [
    'sex', 'age', 'status', 'date', 'educationLevel',
    'economicStatus', 'maritalStatus', 'city', 'hasCaregiver', 'variables'
  ];

  selectedDimension1: ChartDimension = 'sex';
  selectedDimension2: ChartDimension | null = null;
  showComparison: boolean = false;

  availableChartTypes: ChartType[] = ['bar', 'pie', 'doughnut', 'line', 'radar'];
  chartColors = ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#607D8B', '#795548'];

  currentResearchLayer: ResearchLayer | null = null;
  loading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private registerService: ConsolaRegistroService,
    private authService: AuthService
  ) {
    Chart.register(...registerables, ChartDataLabels);
  }

  ngOnInit(): void {
    this.loadCurrentResearchLayer();
    this.updateChartOptions();
  }

  ngAfterViewInit() {
    this.filteredData.paginator = this.paginator;
    this.filteredData.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroyChart();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private destroyChart(): void {
    if (this.currentChart) {
      this.currentChart.destroy();
      this.currentChart = null;
    }
  }

  updateChartOptions() {
    const isCircular = this.chartType === 'pie' || this.chartType === 'doughnut';
    const isBar = this.chartType === 'bar';
    const isLine = this.chartType === 'line';

    const baseOptions: ChartConfiguration['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 14
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          enabled: true,
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
        },
        datalabels: {
          display: false
        }
      }
    };

    if (isCircular) {
      baseOptions.plugins = {
        ...baseOptions.plugins,
        datalabels: {
          display: true,
          formatter: (value: number, ctx: any) => {
            const datasets = ctx.chart?.data?.datasets;
            if (!datasets || !datasets[ctx.datasetIndex]?.data) return '';

            const data = datasets[ctx.datasetIndex].data as number[];
            const total = data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return percentage > 5 ? `${percentage}%` : '';
          },
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12
          }
        }
      };

      baseOptions.elements = {
        arc: {
          borderWidth: 1,
          borderColor: '#fff'
        }
      };
    }

    if (isBar) {
      baseOptions.scales = {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          },
          grid: {
            color: '#e0e0e0'
          }
        }
      };

      baseOptions.elements = {
        bar: {
          borderRadius: 4,
          borderWidth: 0
        }
      };
    }

    if (isLine) {
      baseOptions.scales = {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          },
          grid: {
            color: '#e0e0e0'
          }
        }
      };

      baseOptions.elements = {
        line: {
          tension: 0.4,
          borderWidth: 2,
          fill: false
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          backgroundColor: '#fff',
          borderWidth: 2
        }
      };
    }

    this.chartOptions = baseOptions;
  }

  changeChartType(type: ChartType): void {
    this.destroyChart();
    this.chartType = type;
    this.updateChartOptions();
    this.prepareChartData();
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.currentChart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options: this.chartOptions
    });
  }

  loadCurrentResearchLayer(): void {
    this.loading = true;

    this.authService.getCurrentUserResearchLayer().pipe(
      takeUntil(this.destroy$)
    ).subscribe((researchLayerId: string | null) => {
      if (!researchLayerId) {
        this.errorMessage = 'El usuario no tiene asignada una capa de investigación';
        this.loading = false;
        return;
      }

      this.registerService.obtenerCapaPorId(researchLayerId).subscribe({
        next: (layer: ResearchLayer) => {
          this.currentResearchLayer = layer;
          this.loadInitialData();
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error al cargar la capa:', err);
          this.errorMessage = 'Error al cargar los datos de la capa de investigación';
          this.loading = false;
        }
      });
    }, (err: any) => {
      console.error('Error al obtener la capa:', err);
      this.errorMessage = 'Error al obtener la información del usuario';
      this.loading = false;
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
      this.currentPage,
      this.pageSize,
      'registerDate',
      'DESC'
    ).subscribe({
      next: (response: any) => {
        this.allRegisters = response.registers || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading registers:', err);
        this.errorMessage = 'Failed to load medical records';
        this.loading = false;
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInitialData();
  }

  getEducationLabel(value: string): string {
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

  getEconomicStatusLabel(value: string): string {
    const labels: Record<string, string> = {
      'bajo': 'Bajo',
      'medio_bajo': 'Medio bajo',
      'medio': 'Medio',
      'medio_alto': 'Medio alto',
      'alto': 'Alto'
    };
    return value in labels ? labels[value] : value;
  }

  getMaritalStatusLabel(value: string): string {
    const labels: Record<string, string> = {
      'soltero': 'Soltero/a',
      'casado': 'Casado/a',
      'divorciado': 'Divorciado/a',
      'viudo': 'Viudo/a',
      'union_libre': 'Unión libre'
    };
    return value in labels ? labels[value] : value;
  }

  applyFilters(): void {
    this.filteredRegisters = this.allRegisters.filter(register => {
      const patientInfo = register.patientBasicInfo as PatientBasicInfo;
      const caregiverInfo = register.caregiver;

      // Filtros existentes
      if (this.filters.sex && patientInfo?.sex !== this.filters.sex) return false;

      const age = patientInfo?.age;
      if (this.filters.minAge !== null && (age === undefined || age < this.filters.minAge)) return false;
      if (this.filters.maxAge !== null && (age === undefined || age > this.filters.maxAge)) return false;

      if (this.filters.crisisStatus && patientInfo?.crisisStatus !== this.filters.crisisStatus) {
        return false;
      }

      if (this.filters.educationLevel && patientInfo?.educationLevel !== this.filters.educationLevel) {
        return false;
      }

      if (this.filters.economicStatus && patientInfo?.economicStatus !== this.filters.economicStatus) {
        return false;
      }

      if (this.filters.maritalStatus && patientInfo?.maritalStatus !== this.filters.maritalStatus) {
        return false;
      }

      if (this.filters.hometown &&
        !patientInfo?.hometown?.toLowerCase().includes(this.filters.hometown.toLowerCase())) {
        return false;
      }

      if (this.filters.currentCity &&
        !patientInfo?.currentCity?.toLowerCase().includes(this.filters.currentCity.toLowerCase())) {
        return false;
      }

      if (this.filters.hasCaregiver !== null) {
        const hasCaregiver = !!register.caregiver;
        if (hasCaregiver !== this.filters.hasCaregiver) return false;
      }

      // Nuevos filtros para el cuidador
      if (this.filters.caregiverEducation && caregiverInfo?.educationLevel !== this.filters.caregiverEducation) {
        return false;
      }

      if (this.filters.caregiverOccupation && 
          caregiverInfo?.occupation && 
          !caregiverInfo.occupation.toLowerCase().includes(this.filters.caregiverOccupation.toLowerCase())) {
        return false;
      }

      if (this.filters.dateRange.start || this.filters.dateRange.end) {
        const registerDate = new Date(register.registerDate);
        if (this.filters.dateRange.start && registerDate < this.filters.dateRange.start) return false;
        if (this.filters.dateRange.end) {
          const endDate = new Date(this.filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (registerDate > endDate) return false;
        }
      }

      return true;
    });

    const data = this.filteredRegisters.map(register => {
      const patientInfo = register.patientBasicInfo as PatientBasicInfo;
      const caregiverInfo = register.caregiver;

      return {
        sex: patientInfo?.sex || 'No especificado',
        age: patientInfo?.age || 0,
        crisisStatus: patientInfo?.crisisStatus || 'No especificado',
        registerDate: new Date(register.registerDate),
        variables: register.variablesRegister.map(v => v.variableName || ''),
        educationLevel: patientInfo?.educationLevel || 'No especificado',
        economicStatus: patientInfo?.economicStatus || 'No especificado',
        maritalStatus: patientInfo?.maritalStatus || 'No especificado',
        hometown: patientInfo?.hometown || 'No especificado',
        currentCity: patientInfo?.currentCity || 'No especificado',
        hasCaregiver: !!register.caregiver,
        caregiverEducation: caregiverInfo?.educationLevel || 'No especificado',
        caregiverOccupation: caregiverInfo?.occupation || 'No especificado',
        firstCrisisDate: patientInfo?.firstCrisisDate
      };
    });

    this.filteredData.data = data;
    this.totalElements = data.length;

    if (this.paginator) {
      this.filteredData.paginator = this.paginator;
    }
    if (this.sort) {
      this.filteredData.sort = this.sort;
    }

    this.prepareChartData();
  }

  prepareChartData(): void {
    if (this.viewType !== 'chart') {
      this.destroyChart();
      return;
    }

    const dimension1Data = this.groupByDimension(this.selectedDimension1);

    if (this.showComparison && this.selectedDimension2) {
      const dimension2Data = this.groupByDimension(this.selectedDimension2);
      this.chartData = this.createComparisonChart(dimension1Data, dimension2Data);
    } else {
      this.chartData = this.createSingleDimensionChart(dimension1Data, this.selectedDimension1);
    }

    this.renderChart();
  }

  private groupByDimension(dimension: ChartDimension): Record<string, number> {
    return this.filteredData.data.reduce((acc: Record<string, number>, patient: PatientStat) => {
      let key: string;

      switch (dimension) {
        case 'sex':
          key = patient.sex;
          break;
        case 'education':
          key = this.getEducationLabel(patient.educationLevel);
          break;
        case 'economic':
          key = this.getEconomicStatusLabel(patient.economicStatus);
          break;
        case 'marital':
          key = this.getMaritalStatusLabel(patient.maritalStatus);
          break;
        case 'crisis':
          key = patient.crisisStatus;
          break;
        case 'currentCity':
          key = patient.currentCity;
          break;
        case 'hometown':
          key = patient.hometown;
          break;
        case 'caregiver':
          key = patient.hasCaregiver ? 'Con cuidador' : 'Sin cuidador';
          break;
        default:
          key = 'No especificado';
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private createSingleDimensionChart(data: Record<string, number>, dimension: ChartDimension): ChartConfiguration['data'] {
    const labels = Object.keys(data);
    const isBar = this.chartType === 'bar';
    const isPie = this.chartType === 'pie' || this.chartType === 'doughnut';
    const isLine = this.chartType === 'line';

    return {
      labels: labels,
      datasets: [{
        data: Object.values(data),
        backgroundColor: isBar ? this.chartColors[0] :
          isLine ? 'transparent' :
            this.chartColors.slice(0, labels.length),
        borderColor: isLine ? this.chartColors[0] : '#fff',
        borderWidth: isPie ? 1 : isLine ? 2 : 0,
        pointBackgroundColor: isLine ? '#fff' : undefined,
        pointBorderColor: isLine ? this.chartColors[0] : undefined,
        pointBorderWidth: isLine ? 2 : undefined,
        pointRadius: isLine ? 4 : undefined,
        pointHoverRadius: isLine ? 6 : undefined,
        label: this.dimensionLabels[dimension],
        fill: false
      }]
    };
  }

  private createComparisonChart(
    data1: Record<string, number>,
    data2: Record<string, number>
  ): ChartConfiguration['data'] {
    const allLabels = Array.from(new Set([...Object.keys(data1), ...Object.keys(data2)]));

    const backgroundColors = allLabels.map((_, i) => {
      return this.chartColors[i % this.chartColors.length];
    });

    return {
      labels: allLabels,
      datasets: [
        {
          label: this.dimensionLabels[this.selectedDimension1],
          data: allLabels.map(label => data1[label] || 0),
          backgroundColor: this.chartType === 'line' ? 'transparent' : backgroundColors,
          borderColor: backgroundColors[0],
          borderWidth: this.chartType === 'line' ? 2 : 1,
          pointBackgroundColor: '#fff',
          pointBorderColor: backgroundColors[0],
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: this.dimensionLabels[this.selectedDimension2!],
          data: allLabels.map(label => data2[label] || 0),
          backgroundColor: this.chartType === 'line' ? 'transparent' : backgroundColors.map(color => this.adjustColorOpacity(color, 0.6)),
          borderColor: backgroundColors[1],
          borderWidth: this.chartType === 'line' ? 2 : 1,
          pointBackgroundColor: '#fff',
          pointBorderColor: backgroundColors[1],
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }

  private adjustColorOpacity(color: string, opacity: number): string {
    if (color.startsWith('rgba')) return color;

    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  exportToCSV(): void {
    const headers = [
      'Sexo', 'Edad', 'Estado de crisis', 'Fecha registro',
      'Nivel educativo', 'Nivel socioeconómico', 'Estado civil',
      'Ciudad', 'Tiene cuidador', 'Variables'
    ];

    const csvContent = [
      headers.join(','),
      ...this.filteredData.data.map(p => [
        p.sex,
        p.age,
        p.crisisStatus,
        p.registerDate.toISOString().split('T')[0],
        this.getEducationLabel(p.educationLevel),
        this.getEconomicStatusLabel(p.economicStatus),
        this.getMaritalStatusLabel(p.maritalStatus),
        p.currentCity,
        p.hasCaregiver ? 'Sí' : 'No',
        `"${p.variables.join(', ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `estadisticas_epilepsia_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportToExcel(): void {
    const data = this.filteredData.data.map(p => ({
      'Sexo': p.sex,
      'Edad': p.age,
      'Estado de crisis': p.crisisStatus,
      'Fecha registro': p.registerDate.toISOString().split('T')[0],
      'Nivel educativo': this.getEducationLabel(p.educationLevel),
      'Nivel socioeconómico': this.getEconomicStatusLabel(p.economicStatus),
      'Estado civil': this.getMaritalStatusLabel(p.maritalStatus),
      'Ciudad': p.currentCity,
      'Tiene cuidador': p.hasCaregiver ? 'Sí' : 'No',
      'Variables': p.variables.join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estadísticas Epilepsia');
    XLSX.writeFile(workbook, `estadisticas_epilepsia_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const title = 'Reporte de Epilepsia - Estadísticas';

    doc.setFontSize(18);
    doc.text(title, 14, 15);

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = this.filteredData.data.map(p => [
      p.sex,
      p.age.toString(),
      p.crisisStatus,
      p.registerDate.toISOString().split('T')[0],
      this.getEducationLabel(p.educationLevel),
      this.getEconomicStatusLabel(p.economicStatus),
      this.getMaritalStatusLabel(p.maritalStatus),
      p.currentCity,
      p.hasCaregiver ? 'Sí' : 'No',
      p.variables.join(', ')
    ]);

    autoTable(doc, {
      head: [['Sexo', 'Edad', 'Estado', 'Fecha', 'Educación', 'Nivel Socioeconómico', 'Estado Civil', 'Ciudad', 'Cuidador', 'Variables']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 }
    });

    doc.save(`reporte_epilepsia_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  resetFilters(): void {
    this.filters = {
      patientName: '',
      variableName: '',
      minAge: null,
      maxAge: null,
      sex: '',
      crisisStatus: '',
      dateRange: { start: null, end: null },
      ageRange: [0, 100],
      educationLevel: '',
      economicStatus: '',
      maritalStatus: '',
      hometown: '',
      currentCity: '',
      hasCaregiver: null,
      caregiverEducation: '',
      caregiverOccupation: ''
    };
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'activa': return '#4CAF50';
      case 'remisión': return '#FFC107';
      case 'estable': return '#2196F3';
      case 'crítica': return '#F44336';
      case 'recuperado': return '#9C27B0';
      default: return '#9E9E9E';
    }
  }

  exportChartAsImage(): void {
    if (!this.currentChart) {
      console.warn('No chart to export');
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    if (canvas) {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'grafico_epilepsia.png';
      link.href = image;
      link.click();
    }
  }

  toggleView(view: 'chart' | 'table'): void {
    this.viewType = view;
    if (view === 'chart') {
      this.prepareChartData();
    } else {
      this.destroyChart();
    }
  }
}
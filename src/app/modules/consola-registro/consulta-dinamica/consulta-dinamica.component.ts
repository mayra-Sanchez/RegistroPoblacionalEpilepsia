import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConsolaRegistroService } from '../services/consola-registro.service';
import { ChartConfiguration, ChartType, ChartDataset } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import { Register, ResearchLayer } from '../interfaces';
import { AuthService } from 'src/app/login/services/auth.service';

@Component({
  selector: 'app-consulta-dinamica',
  templateUrl: './consulta-dinamica.component.html',
  styleUrls: ['./consulta-dinamica.component.css']
})
export class ConsultaDinamicaComponent implements OnInit, OnDestroy {
  // Data
  allRegisters: Register[] = [];
  filteredRegisters: Register[] = [];

  // Filters
  filters = {
    patientName: '',
    variableName: '',
    minAge: null as number | null,
    maxAge: null as number | null,
    sex: '',
    crisisStatus: '',
    dateRange: { start: null as Date | null, end: null as Date | null }
  };

  // Visualization
  viewType: 'chart' | 'table' = 'chart';
  chartType: ChartType = 'bar';
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  chartData: { labels: string[], datasets: ChartDataset[] } = {
    labels: [],
    datasets: []
  };

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Current research layer
  currentResearchLayer: ResearchLayer | null = null;
  loading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private registerService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCurrentResearchLayer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentResearchLayer(): void {
    this.loading = true;
    const userResearchLayerId = this.authService.getCurrentUserResearchLayerId();

    if (!userResearchLayerId) {
      this.errorMessage = 'No se pudo determinar la capa de investigación del usuario';
      this.loading = false;
      return;
    }

    this.registerService.obtenerCapaPorId(userResearchLayerId).subscribe({
      next: (layer) => {
        this.currentResearchLayer = layer;
        this.loadInitialData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la capa de investigación:', err);
        this.errorMessage = 'Error al cargar la capa de investigación del usuario';
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
      this.currentPage,
      this.pageSize,
      'registerDate',
      'DESC'
    ).subscribe({
      next: (response) => {
        // Usar response.registers en lugar de response.content
        this.allRegisters = response.registers;
        this.applyFilters();
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.handleDataError(err);
      }
    });
}

  private handleDataResponse(response: any): void {
    this.allRegisters = response.registers || response.content || [];
    this.applyFilters();
    this.totalElements = response.totalElements || 0;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    this.loading = false;
  }

  private handleDataError(err: any): void {
    console.error('Error loading registers:', err);
    this.errorMessage = 'Failed to load medical records';
    this.loading = false;
  }

  applyFilters(): void {
    if (!this.allRegisters.length) return;

    this.filteredRegisters = this.allRegisters.filter(register => {
      // Patient name filter (case insensitive)
      if (this.filters.patientName &&
        !register.patientBasicInfo?.name?.toLowerCase().includes(this.filters.patientName.toLowerCase())) {
        return false;
      }

      // Variable name filter
      if (this.filters.variableName &&
        !register.variablesRegister.some(v =>
          v.variableName?.toLowerCase().includes(this.filters.variableName.toLowerCase()))) {
        return false;
      }

      // Age filters
      const age = register.patientBasicInfo?.age;
      if (this.filters.minAge !== null && (age === undefined || age < this.filters.minAge)) {
        return false;
      }
      if (this.filters.maxAge !== null && (age === undefined || age > this.filters.maxAge)) {
        return false;
      }

      // Sex filter
      if (this.filters.sex && register.patientBasicInfo?.sex !== this.filters.sex) {
        return false;
      }

      // Crisis status filter
      if (this.filters.crisisStatus && register.patientBasicInfo?.crisisStatus !== this.filters.crisisStatus) {
        return false;
      }

      // Date range filter
      if (this.filters.dateRange.start || this.filters.dateRange.end) {
        const registerDate = new Date(register.registerDate);

        if (this.filters.dateRange.start && registerDate < this.filters.dateRange.start) {
          return false;
        }
        if (this.filters.dateRange.end && registerDate > this.filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });

    this.prepareVisualizationData();
    this.totalElements = this.filteredRegisters.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    this.currentPage = 0; // Reset to first page when filters change
  }

  prepareVisualizationData(): void {
    if (this.viewType === 'chart') {
      this.prepareChartData();
    }
  }

  prepareChartData(): void {
    if (this.currentResearchLayer) {
      this.prepareResearchLayerChart();
    } else {
      this.prepareDefaultChart();
    }
  }

  prepareDefaultChart(): void {
    // Group by sex
    const sexCounts = this.filteredRegisters.reduce((acc, register) => {
      const sex = register.patientBasicInfo?.sex || 'Unknown';
      acc[sex] = (acc[sex] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by crisis status
    const crisisCounts = this.filteredRegisters.reduce((acc, register) => {
      const status = register.patientBasicInfo?.crisisStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Prepare datasets based on chart type
    if (this.chartType === 'pie' || this.chartType === 'doughnut') {
      this.chartData = {
        labels: Object.keys(sexCounts),
        datasets: [{
          data: Object.values(sexCounts),
          label: 'Patients by Sex',
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ],
          borderWidth: 1
        }]
      };
    } else {
      // For bar/line charts, show both sex and crisis status
      this.chartData = {
        labels: ['Distribution'],
        datasets: [
          ...Object.entries(sexCounts).map(([sex, count]) => ({
            label: `Sex: ${sex}`,
            data: [count],
            backgroundColor: this.getColorForCategory(sex)
          })),
          ...Object.entries(crisisCounts).map(([status, count]) => ({
            label: `Status: ${status}`,
            data: [count],
            backgroundColor: this.getColorForCategory(status)
          }))
        ]
      };
    }
  }

  prepareResearchLayerChart(): void {
    const layerName = this.currentResearchLayer?.layerName || 'Current Layer';

    // Count variables in the current research layer
    const variableCounts = this.filteredRegisters.reduce((acc, register) => {
      register.variablesRegister
        .filter(v => v.researchLayerId === this.currentResearchLayer?.id)
        .forEach(v => {
          const varName = v.variableName || 'Unnamed Variable';
          acc[varName] = (acc[varName] || 0) + 1;
        });
      return acc;
    }, {} as Record<string, number>);

    this.chartData = {
      labels: Object.keys(variableCounts),
      datasets: [{
        data: Object.values(variableCounts),
        label: `Variables in ${layerName}`,
        backgroundColor: Object.keys(variableCounts).map((_, i) =>
          `hsl(${(i * 360 / Object.keys(variableCounts).length)}, 70%, 50%)`),
        borderWidth: 1
      }]
    };
  }

  private getColorForCategory(category: string): string {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsla(${h}, 70%, 50%, 0.7)`;
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadInitialData();
  }

  resetFilters(): void {
    this.filters = {
      patientName: '',
      variableName: '',
      minAge: null,
      maxAge: null,
      sex: '',
      crisisStatus: '',
      dateRange: { start: null, end: null }
    };
    this.loadInitialData();
  }

  onDateRangeChange(): void {
    if (this.filters.dateRange.start && this.filters.dateRange.end) {
      const endDate = new Date(this.filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      this.filters.dateRange.end = endDate;
    }
    this.applyFilters();
  }

  exportToCSV(): void {
    const headers = ['Patient', 'Sex', 'Age', 'Crisis Status', 'Register Date', 'Variables'];
    const csvContent = [
      headers.join(','),
      ...this.filteredRegisters.map(reg => {
        const variables = reg.variablesRegister.map(v => v.variableName).join('; ');
        return [
          `"${reg.patientBasicInfo?.name || ''}"`,
          reg.patientBasicInfo?.sex || '',
          reg.patientBasicInfo?.age || '',
          reg.patientBasicInfo?.crisisStatus || '',
          reg.registerDate,
          `"${variables}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `medical_records_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return status.toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^a-z-]/g, '');
  }

  getVariableColor(variableName: string | undefined): string {
    if (!variableName) return '#cccccc';
    let hash = 0;
    for (let i = 0; i < variableName.length; i++) {
      hash = variableName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 80%)`;
  }
}
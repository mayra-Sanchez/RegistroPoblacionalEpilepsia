import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import { Register, ResearchLayer } from '../../../consola-registro/interfaces';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { format } from 'date-fns';

type ChartDimension = 'sex' | 'educationLevel' | 'economicStatus' | 'maritalStatus' | 'crisisStatus' | 'location' | 'hometown' | 'currentCity' | 'hasCaregiver';

interface PatientStat {
  id: string;
  name: string;
  sex: string;
  age: number;
  ageGroup: string;
  educationLevel: string;
  economicStatus: string;
  maritalStatus: string;
  crisisStatus: string;
  location: string;
  registerDate: Date;
  variables: string[];
  caregiverName: string;
  professionalName: string;
  hometown: string;
  currentCity: string;
  firstCrisisDate: string | null;
  deathDate: string | null;
  hasCaregiver: boolean;
}

interface Filters {
  sex: string;
  minAge: number | null;
  maxAge: number | null;
  crisisStatus: string;
  educationLevel: string;
  economicStatus: string;
  maritalStatus: string;
  location: string;
  dateRange: { start: Date | null; end: Date | null };
  deathDateRange: { start: Date | null; end: Date | null };
  hometown: string;
  currentCity: string;
  firstCrisisDateRange: { start: Date | null; end: Date | null };
  hasCaregiver: boolean | null;
  caregiverAge: { min: number | null; max: number | null };
  caregiverEducationLevel: string;
  caregiverOccupation: string;
  variables: string[];
}

@Component({
  selector: 'app-consulta-datos',
  templateUrl: './consulta-datos.component.html',
  styleUrls: ['./consulta-datos.component.css']
})
export class ConsultaDatosComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  allRegisters: Register[] = [];
  filteredRegisters: Register[] = [];
  filteredData = new MatTableDataSource<PatientStat>([]);
  currentChart: Chart | null = null;

  filters: Filters = {
    sex: '',
    minAge: null,
    maxAge: null,
    crisisStatus: '',
    educationLevel: '',
    economicStatus: '',
    maritalStatus: '',
    location: '',
    dateRange: { start: null, end: null },
    deathDateRange: { start: null, end: null },
    hometown: '',
    currentCity: '',
    firstCrisisDateRange: { start: null, end: null },
    hasCaregiver: null,
    caregiverAge: { min: null, max: null },
    caregiverEducationLevel: '',
    caregiverOccupation: '',
    variables: []
  };

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  viewType: 'chart' | 'table' = 'table';
  chartType: ChartType = 'bar';
  effectiveChartType: ChartType = 'bar';
  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {};
  chartErrorMessage: string | null = null;

  availableDimensions: ChartDimension[] = [
    'sex', 'educationLevel', 'economicStatus', 'maritalStatus', 'crisisStatus', 
    'location', 'hometown', 'currentCity', 'hasCaregiver'
  ];

  dimensionLabels: { [key: string]: string } = {
    sex: 'Sexo',
    educationLevel: 'Nivel Educativo',
    economicStatus: 'Nivel Socioeconómico',
    maritalStatus: 'Estado Civil',
    crisisStatus: 'Estado de Crisis',
    location: 'Ubicación',
    hometown: 'Ciudad de Origen',
    currentCity: 'Ciudad Actual',
    hasCaregiver: 'Tiene Cuidador'
  };

  displayedColumns: string[] = [
    'sex', 'age', 'ageGroup', 'educationLevel', 'economicStatus', 
    'maritalStatus', 'crisisStatus', 'location', 'hometown', 
    'currentCity', 'firstCrisisDate', 'deathDate', 'hasCaregiver'
  ];

  selectedDimension1: ChartDimension = 'sex';
  selectedDimension2: ChartDimension | null = null;
  showComparison = false;

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
    const isCircular = this.effectiveChartType === 'pie' || this.effectiveChartType === 'doughnut';
    const isBar = this.effectiveChartType === 'bar';
    const isLine = this.effectiveChartType === 'line';
  
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 14 },
            padding: 20,
            usePointStyle: true
          }
        },
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
        },
        datalabels: {
          display: isCircular,
          formatter: (value: number, ctx: any) => {
            const datasets = ctx.chart?.data?.datasets;
            if (!datasets || !datasets[ctx.datasetIndex]?.data) return '';
            const data = datasets[ctx.datasetIndex].data as number[];
            const total = data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return percentage > 5 ? `${percentage}%` : '';
          },
          color: '#fff',
          font: { weight: 'bold', size: 12 }
        }
      },
      scales: isBar || isLine ? {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
          title: { display: isLine, text: 'Tiempo' },
          stacked: isBar && this.showComparison,
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 12 } },
          grid: { color: '#e0e0e0' },
          title: { display: true, text: 'Cantidad' },
          stacked: isBar && this.showComparison,
        }
      } : undefined,
      elements: {
        bar: { borderRadius: 4, borderWidth: 0 },
        line: { tension: 0.4, borderWidth: 2, fill: false },
        point: { radius: 4, hoverRadius: 6, backgroundColor: '#fff', borderWidth: 2 },
        arc: isCircular ? { borderWidth: 1, borderColor: '#fff' } : undefined
      }
    };
  }

  changeChartType(type: ChartType): void {
    this.chartType = type;
    this.destroyChart();
    this.updateChartOptions();
    this.prepareChartData();
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement) {
      console.error('Chart canvas element not found.');
      this.chartErrorMessage = 'No se encontró el elemento canvas para el gráfico.';
      return;
    }
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for chart canvas.');
      this.chartErrorMessage = 'No se pudo obtener el contexto 2D para el canvas del gráfico.';
      return;
    }

    console.log('Rendering Chart - Effective Chart Type:', this.effectiveChartType);
    console.log('Rendering Chart - Chart Data:', this.chartData);

    if (!this.chartData.labels?.length || !this.chartData.datasets?.length) {
      console.warn('Invalid chart data: labels or datasets are empty.');
      this.chartErrorMessage = 'No hay datos para mostrar en el gráfico. Ajuste los filtros o verifique los datos.';
      return;
    }

    if (this.chartData.datasets.every(dataset => dataset.data.every(value => value === 0))) {
      console.warn('All dataset values are zero.');
      this.chartErrorMessage = 'Todos los valores en el gráfico son cero. Ajuste los filtros o verifique los datos.';
      return;
    }

    this.chartErrorMessage = null;

    this.currentChart = new Chart(ctx, {
      type: this.effectiveChartType,
      data: this.chartData,
      options: this.chartOptions
    });
  }

  loadCurrentResearchLayer(): void {
    this.loading = true;
    this.authService.getCurrentUserResearchLayer().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (researchLayerId: string | null) => {
        if (!researchLayerId) {
          this.errorMessage = 'No tiene asignada una capa de investigación';
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
            this.errorMessage = 'Error al cargar los datos de investigación';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener la capa:', err);
        this.errorMessage = 'Error al obtener información del usuario';
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
      next: (response: any) => {
        this.allRegisters = response.registers || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading registers:', err);
        this.errorMessage = 'Error al cargar registros médicos';
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInitialData();
  }

  applyFilters(): void {
    console.log('Applying Filters - Current Filters:', JSON.stringify(this.filters, null, 2));
    console.log('All Registers:', this.allRegisters);

    this.filteredRegisters = this.allRegisters.filter(register => {
      const patientInfo = register.patientBasicInfo;
      const caregiver = register.caregiver;

      console.log('Filtering Register:', {
        registerId: register.registerId,
        registerDate: register.registerDate,
        hasCaregiver: !!register.caregiver
      });

      if (this.filters.sex && patientInfo?.sex !== this.filters.sex) return false;
      if (this.filters.minAge !== null && patientInfo?.age < this.filters.minAge) return false;
      if (this.filters.maxAge !== null && patientInfo?.age > this.filters.maxAge) return false;
      if (this.filters.crisisStatus && patientInfo?.crisisStatus !== this.filters.crisisStatus) return false;
      if (this.filters.educationLevel && patientInfo?.educationLevel !== this.filters.educationLevel) return false;
      if (this.filters.economicStatus && patientInfo?.economicStatus !== this.filters.economicStatus) return false;
      if (this.filters.maritalStatus && patientInfo?.maritalStatus !== this.filters.maritalStatus) return false;
      if (this.filters.location && patientInfo?.currentCity !== this.filters.location) return false;
      if (this.filters.dateRange.start || this.filters.dateRange.end) {
        const registerDate = new Date(register.registerDate);
        if (this.filters.dateRange.start && registerDate < this.filters.dateRange.start) return false;
        if (this.filters.dateRange.end) {
          const endDate = new Date(this.filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (registerDate > endDate) return false;
        }
      }

      if (this.filters.deathDateRange.start && this.filters.deathDateRange.end && patientInfo?.deathDate) {
        const deathDate = new Date(patientInfo.deathDate);
        if (deathDate < this.filters.deathDateRange.start || deathDate > this.filters.deathDateRange.end) return false;
      }
      if (this.filters.hometown && patientInfo?.hometown !== this.filters.hometown) return false;
      if (this.filters.currentCity && patientInfo?.currentCity !== this.filters.currentCity) return false;
      if (this.filters.firstCrisisDateRange.start && this.filters.firstCrisisDateRange.end && patientInfo?.firstCrisisDate) {
        const firstCrisisDate = new Date(patientInfo.firstCrisisDate);
        if (firstCrisisDate < this.filters.firstCrisisDateRange.start || firstCrisisDate > this.filters.firstCrisisDateRange.end) return false;
      }

      if (this.filters.hasCaregiver !== null) {
        const hasCaregiver = !!register.caregiver;
        if (hasCaregiver !== this.filters.hasCaregiver) return false;
      }

      if (caregiver) {
        if (this.filters.caregiverAge.min !== null && caregiver.age < this.filters.caregiverAge.min) return false;
        if (this.filters.caregiverAge.max !== null && caregiver.age > this.filters.caregiverAge.max) return false;
        if (this.filters.caregiverEducationLevel && caregiver.educationLevel !== this.filters.caregiverEducationLevel) return false;
        if (this.filters.caregiverOccupation && caregiver.occupation !== this.filters.caregiverOccupation) return false;
      } else if (
        this.filters.caregiverEducationLevel ||
        this.filters.caregiverOccupation ||
        (this.filters.caregiverAge.min !== null || this.filters.caregiverAge.max !== null)
      ) {
        return false;
      }

      if (this.filters.variables.length > 0) {
        const registerVariables = register.variablesRegister?.map(v => v.variableName) || [];
        if (!this.filters.variables.every(v => registerVariables.includes(v))) return false;
      }

      return true;
    });

    this.filteredData.data = this.filteredRegisters.map(register => {
      const patientInfo = register.patientBasicInfo;

      const patientStat = {
        id: register.registerId,
        name: patientInfo?.name || 'No especificado',
        sex: patientInfo?.sex || 'No especificado',
        age: patientInfo?.age || 0,
        ageGroup: this.getAgeGroup(patientInfo?.age || 0),
        educationLevel: patientInfo?.educationLevel || 'No especificado',
        economicStatus: patientInfo?.economicStatus || 'No especificado',
        maritalStatus: patientInfo?.maritalStatus || 'No especificado',
        crisisStatus: patientInfo?.crisisStatus || 'No especificado',
        location: patientInfo?.currentCity || 'No especificado',
        registerDate: new Date(register.registerDate),
        variables: register.variablesRegister?.map(v => v.variableName) || [],
        caregiverName: register.caregiver?.name || 'No especificado',
        professionalName: register.healthProfessional?.name || 'No especificado',
        hometown: patientInfo?.hometown || 'No especificado',
        currentCity: patientInfo?.currentCity || 'No especificado',
        firstCrisisDate: patientInfo?.firstCrisisDate || null,
        deathDate: patientInfo?.deathDate || null,
        hasCaregiver: !!register.caregiver
      };

      console.log('Mapped PatientStat:', patientStat);
      return patientStat;
    });

    console.log('Filtered Data:', this.filteredData.data);

    this.totalElements = this.filteredData.data.length;
    this.filteredData.paginator = this.paginator;
    this.filteredData.sort = this.sort;
    this.prepareChartData();
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return '0-17';
    if (age < 30) return '18-29';
    if (age < 45) return '30-44';
    if (age < 60) return '45-59';
    return '60+';
  }

  private groupByDimension(dimension: ChartDimension): Record<string, number> {
    return this.filteredData.data.reduce((acc: Record<string, number>, patient: PatientStat) => {
      let key: string;

      switch (dimension) {
        case 'sex': key = patient.sex; break;
        case 'educationLevel': key = patient.educationLevel; break;
        case 'economicStatus': key = patient.economicStatus; break;
        case 'maritalStatus': key = patient.maritalStatus; break;
        case 'crisisStatus': key = patient.crisisStatus; break;
        case 'location': key = patient.location; break;
        case 'hometown': key = patient.hometown; break;
        case 'currentCity': key = patient.currentCity; break;
        case 'hasCaregiver': key = patient.hasCaregiver ? 'Sí' : 'No'; break;
        default: key = 'No especificado';
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  prepareChartData(): void {
    if (this.viewType !== 'chart') {
      this.destroyChart();
      return;
    }

    this.destroyChart();
    this.chartErrorMessage = null;

    if (this.chartType === 'line') {
      this.chartData = this.createLineChartData();
    } else if (this.showComparison && this.selectedDimension2) {
      const dimension1Data = this.groupByDimension(this.selectedDimension1);
      const dimension2Data = this.groupByDimension(this.selectedDimension2);
      this.chartData = this.createComparisonChart(dimension1Data, dimension2Data);
      this.effectiveChartType = this.chartType;
    } else {
      const dimension1Data = this.groupByDimension(this.selectedDimension1);
      this.chartData = this.createSingleDimensionChart(dimension1Data, this.selectedDimension1);
      this.effectiveChartType = this.chartType;
    }

    this.renderChart();
  }

  private createLineChartData(): ChartConfiguration['data'] {
    const timeField = 'registerDate';
    const aggregateBy: 'month' | 'day' = 'month';
    const dateMap: { [timeKey: string]: { [dimensionValue: string]: number } } = {};
  
    console.log('Creating Line Chart - Filtered Data:', this.filteredData.data);
  
    if (!this.filteredData.data.length) {
      console.warn('No filtered data available to create line chart.');
      this.chartErrorMessage = 'No hay datos filtrados para mostrar. Ajuste los filtros.';
      return { labels: [], datasets: [] };
    }
  
    this.filteredData.data.forEach(patient => {
      let date: Date | null = null;
      if (timeField === 'registerDate') {
        date = patient.registerDate;
      } else if (timeField === 'firstCrisisDate') {
        date = patient.firstCrisisDate ? new Date(patient.firstCrisisDate) : null;
      }
  
      if (!date || isNaN(date.getTime())) {
        console.warn(`Invalid date for patient in field ${timeField}:`, patient[timeField]);
        return;
      }
  
      let timeKey: string;
      if (aggregateBy === 'month') {
        timeKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else {
        timeKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      }
  
      const dimensionValue = this.getDimensionValue(patient, this.selectedDimension1);
  
      console.log(`Patient - Date: ${date.toISOString()}, TimeKey: ${timeKey}, Dimension (${this.selectedDimension1}): ${dimensionValue}`);
  
      if (!dateMap[timeKey]) dateMap[timeKey] = {};
      dateMap[timeKey][dimensionValue] = (dateMap[timeKey][dimensionValue] || 0) + 1;
    });
  
    console.log('Date Map:', dateMap);
  
    if (Object.keys(dateMap).length === 0) {
      console.warn('No data available for line chart after aggregation.');
      this.chartErrorMessage = 'No se encontraron datos para el gráfico de líneas después de la agregación.';
      return { labels: [], datasets: [] };
    }
  
    const labels = Object.keys(dateMap).sort().map(date => {
      if (aggregateBy === 'month') {
        const [year, month] = date.split('-');
        const formattedLabel = format(new Date(+year, +month - 1), 'MMM yyyy');
        console.log(`Label for ${date}: ${formattedLabel}`);
        return formattedLabel;
      } else {
        const [year, month, day] = date.split('-');
        const formattedLabel = format(new Date(+year, +month - 1, +day), 'MMM d yyyy');
        console.log(`Label for ${date}: ${formattedLabel}`);
        return formattedLabel;
      }
    });
  
    const uniqueValues = [...new Set(this.filteredData.data.map(patient => 
      this.getDimensionValue(patient, this.selectedDimension1)))];
  
    if (uniqueValues.length === 0) {
      console.warn('No unique dimension values found for selectedDimension1:', this.selectedDimension1);
      this.chartErrorMessage = 'No se encontraron valores únicos para la dimensión seleccionada.';
      return { labels: [], datasets: [] };
    }
  
    console.log('Unique Values:', uniqueValues);
  
    if (this.showComparison && this.selectedDimension2) {
      const secondaryValues = [...new Set(this.filteredData.data.map(patient => 
        this.getDimensionValue(patient, this.selectedDimension2 as ChartDimension)))];
  
      if (secondaryValues.length === 0) {
        console.warn('No unique dimension values found for selectedDimension2:', this.selectedDimension2);
        this.chartErrorMessage = 'No se encontraron valores únicos para la dimensión secundaria seleccionada.';
        return { labels, datasets: [] };
      }
  
      console.log('Secondary Values:', secondaryValues);
  
      const datasets = secondaryValues.flatMap((secondaryValue, secIndex) =>
        uniqueValues.map((primaryValue, primIndex) => {
          const colorIndex = (primIndex + secIndex) % this.chartColors.length;
          return {
            label: `${primaryValue} (${secondaryValue})`,
            data: labels.map((_, i) => {
              const timeKey = Object.keys(dateMap).sort()[i];
              return this.filteredData.data.filter(patient => {
                let date: Date | null = null;
                if (timeField === 'registerDate') {
                  date = patient.registerDate;
                } else if (timeField === 'firstCrisisDate') {
                  date = patient.firstCrisisDate ? new Date(patient.firstCrisisDate) : null;
                }
  
                if (!date || isNaN(date.getTime())) {
                  return false;
                }
  
                let patientTimeKey: string;
                if (aggregateBy === 'month') {
                  patientTimeKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                } else {
                  patientTimeKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                }
  
                return patientTimeKey === timeKey &&
                       this.getDimensionValue(patient, this.selectedDimension1) === primaryValue &&
                       this.getDimensionValue(patient, this.selectedDimension2 as ChartDimension) === secondaryValue;
              }).length;
            }),
            borderColor: this.chartColors[colorIndex],
            backgroundColor: this.adjustColorOpacity(this.chartColors[colorIndex], 0.2),
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#fff',
            pointBorderColor: this.chartColors[colorIndex],
            pointBorderWidth: 2,
            barThickness: labels.length < 2 ? 20 : undefined,
            barPercentage: labels.length < 2 ? 0.5 : undefined, // Narrower bars if switched to bar chart
            categoryPercentage: labels.length < 2 ? 0.8 : undefined,
          };
        })
      );
  
      if (labels.length < 2) {
        console.warn('Line chart requires at least 2 time points. Switching to bar chart.');
        this.chartErrorMessage = 'El gráfico de líneas requiere al menos 2 puntos temporales. Mostrando gráfico de barras.';
        this.effectiveChartType = 'bar';
        this.updateChartOptions();
        return { labels, datasets };
      }
  
      this.effectiveChartType = this.chartType;
      console.log('Final Chart Data (Comparison):', { labels, datasets });
      return { labels, datasets };
    }
  
    const datasets = uniqueValues.map((value, index) => ({
      label: value,
      data: labels.map((_, i) => dateMap[Object.keys(dateMap).sort()[i]]?.[value] || 0),
      borderColor: this.chartColors[index % this.chartColors.length],
      backgroundColor: this.adjustColorOpacity(this.chartColors[index % this.chartColors.length], 0.2),
      fill: false,
      tension: 0.4,
      pointBackgroundColor: '#fff',
      pointBorderColor: this.chartColors[index % this.chartColors.length],
      pointBorderWidth: 2,
      barThickness: labels.length < 2 ? undefined : undefined,
      barPercentage: labels.length < 2 ? 0.9 : undefined, // Default if switched to bar chart
      categoryPercentage: labels.length < 2 ? 0.8 : undefined,
    }));
  
    if (labels.length < 2) {
      console.warn('Line chart requires at least 2 time points. Switching to bar chart.');
      this.chartErrorMessage = 'El gráfico de líneas requiere al menos 2 puntos temporales. Mostrando gráfico de barras.';
      this.effectiveChartType = 'bar';
      this.updateChartOptions();
      return { labels, datasets };
    }
  
    this.effectiveChartType = this.chartType;
    console.log('Final Chart Data:', { labels, datasets });
    return { labels, datasets };
  }

  private getDimensionValue(patient: PatientStat, dimension: ChartDimension): string {
    switch (dimension) {
      case 'sex': return patient.sex;
      case 'educationLevel': return patient.educationLevel;
      case 'economicStatus': return patient.economicStatus;
      case 'maritalStatus': return patient.maritalStatus;
      case 'crisisStatus': return patient.crisisStatus;
      case 'location': return patient.location;
      case 'hometown': return patient.hometown;
      case 'currentCity': return patient.currentCity;
      case 'hasCaregiver': return patient.hasCaregiver ? 'Sí' : 'No';
      default: return 'No especificado';
    }
  }

  private createSingleDimensionChart(data: Record<string, number>, dimension: ChartDimension): ChartConfiguration['data'] {
    const labels = Object.keys(data);
    const isBar = this.effectiveChartType === 'bar';
    const isPie = this.effectiveChartType === 'pie' || this.effectiveChartType === 'doughnut';
    const isLine = this.effectiveChartType === 'line';
  
    return {
      labels: labels,
      datasets: [{
        data: Object.values(data),
        backgroundColor: isBar ? this.chartColors[0] :
                         isPie ? this.chartColors.slice(0, labels.length) :
                         'transparent',
        borderColor: isLine || isBar ? this.chartColors[0] : '#fff',
        borderWidth: isPie ? 1 : isLine ? 2 : 0,
        pointBackgroundColor: isLine ? '#fff' : undefined,
        pointBorderColor: isLine ? this.chartColors[0] : undefined,
        label: this.dimensionLabels[dimension],
        fill: false,
        barThickness: isBar ? undefined : undefined,
        barPercentage: isBar ? 0.9 : undefined, // Default when not comparing
        categoryPercentage: isBar ? 0.8 : undefined,
      }]
    };
  }

  private createComparisonChart(data1: Record<string, number>, data2: Record<string, number>): ChartConfiguration['data'] {
    const primaryLabels = Object.keys(data1);
    const secondaryValues = Object.keys(data2);
  
    const datasets = secondaryValues.map((secondaryValue, index) => {
      const color = this.chartColors[index % this.chartColors.length];
      return {
        label: `${this.dimensionLabels[this.selectedDimension2!]}: ${secondaryValue}`,
        data: primaryLabels.map(primaryLabel => {
          const count = this.filteredData.data.filter(patient => 
            this.getDimensionValue(patient, this.selectedDimension1) === primaryLabel &&
            this.getDimensionValue(patient, this.selectedDimension2 as ChartDimension) === secondaryValue
          ).length;
          return count;
        }),
        backgroundColor: this.adjustColorOpacity(color, this.effectiveChartType === 'line' ? 0.2 : 1),
        borderColor: color,
        borderWidth: this.effectiveChartType === 'line' ? 2 : 1,
        barThickness: this.effectiveChartType === 'bar' ? 20 : undefined,
        barPercentage: this.effectiveChartType === 'bar' ? 0.5 : undefined, // Narrower bars when comparing
        categoryPercentage: this.effectiveChartType === 'bar' ? 0.8 : undefined,
      };
    });
  
    return {
      labels: primaryLabels,
      datasets: datasets,
    };
  }

  private adjustColorOpacity(color: string, opacity: number): string {
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  onDimension1Change(): void {
    this.destroyChart();
    this.prepareChartData();
  }

  onDimension2Change(): void {
    if (this.showComparison) {
      this.destroyChart();
      this.prepareChartData();
    }
  }

  exportToCSV(): void {
    const headers = [
      'ID', 'Nombre', 'Sexo', 'Edad', 'Grupo Edad', 'Educación', 'Nivel Socioeconómico',
      'Estado Civil', 'Estado Crisis', 'Ubicación', 'Ciudad Origen', 'Ciudad Actual',
      'Fecha Primera Crisis', 'Fecha Fallecimiento', 'Tiene Cuidador', 'Cuidador', 'Profesional'
    ];

    const csvContent = [
      headers.join(','),
      ...this.filteredData.data.map(p => [
        p.id,
        `"${p.name}"`,
        p.sex,
        p.age,
        p.ageGroup,
        p.educationLevel,
        p.economicStatus,
        p.maritalStatus,
        p.crisisStatus,
        p.location,
        p.hometown,
        p.currentCity,
        p.firstCrisisDate || '',
        p.deathDate || '',
        p.hasCaregiver ? 'Sí' : 'No',
        p.caregiverName,
        p.professionalName
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `datos_pacientes_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportToExcel(): void {
    const data = this.filteredData.data.map(p => ({
      'ID': p.id,
      'Nombre': p.name,
      'Sexo': p.sex,
      'Edad': p.age,
      'Grupo de Edad': p.ageGroup,
      'Nivel Educativo': p.educationLevel,
      'Nivel Socioeconómico': p.economicStatus,
      'Estado Civil': p.maritalStatus,
      'Estado de Crisis': p.crisisStatus,
      'Ubicación': p.location,
      'Ciudad de Origen': p.hometown,
      'Ciudad Actual': p.currentCity,
      'Fecha Primera Crisis': p.firstCrisisDate || '',
      'Fecha Fallecimiento': p.deathDate || '',
      'Tiene Cuidador': p.hasCaregiver ? 'Sí' : 'No',
      'Cuidador': p.caregiverName,
      'Profesional': p.professionalName
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Pacientes');
    XLSX.writeFile(workbook, `datos_pacientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Pacientes', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = this.filteredData.data.map(p => [
      p.id,
      p.name,
      p.sex,
      p.age.toString(),
      p.ageGroup,
      p.educationLevel,
      p.economicStatus,
      p.maritalStatus,
      p.crisisStatus,
      p.location,
      p.hometown,
      p.currentCity,
      p.firstCrisisDate || '',
      p.deathDate || '',
      p.hasCaregiver ? 'Sí' : 'No'
    ]);

    autoTable(doc, {
      head: [[
        'ID', 'Nombre', 'Sexo', 'Edad', 'Grupo Edad', 'Educación', 'Nivel Socio',
        'Estado Civil', 'Crisis', 'Ubicación', 'Ciudad Origen', 'Ciudad Actual',
        'Fecha Crisis', 'Fecha Fallecimiento', 'Cuidador'
      ]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 }
    });

    doc.save(`reporte_pacientes_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportChartAsImage(): void {
    if (!this.currentChart) return;
    const canvas = this.chartCanvas.nativeElement;
    if (canvas) {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'grafico_pacientes.png';
      link.href = image;
      link.click();
    }
  }

  resetFilters(): void {
    this.filters = {
      sex: '',
      minAge: null,
      maxAge: null,
      crisisStatus: '',
      educationLevel: '',
      economicStatus: '',
      maritalStatus: '',
      location: '',
      dateRange: { start: null, end: null },
      deathDateRange: { start: null, end: null },
      hometown: '',
      currentCity: '',
      firstCrisisDateRange: { start: null, end: null },
      hasCaregiver: null,
      caregiverAge: { min: null, max: null },
      caregiverEducationLevel: '',
      caregiverOccupation: '',
      variables: []
    };
    this.applyFilters();
  }

  toggleView(view: 'chart' | 'table'): void {
    this.viewType = view;
    if (view === 'chart') {
      this.prepareChartData();
    } else {
      this.destroyChart();
    }
  }

  viewPatientDetails(patientId: string): void {
    console.log('Ver detalles del paciente:', patientId);
  }

  getUniqueCrisisStatuses(): string[] {
    return [...new Set(this.allRegisters.map(r => r.patientBasicInfo.crisisStatus))].filter(s => s && s !== 'No especificado').sort();
  }

  getUniqueEducationLevels(): string[] {
    return [...new Set(this.allRegisters.map(r => r.patientBasicInfo.educationLevel))].filter(e => e && e !== 'No especificado').sort();
  }

  getUniqueEconomicStatuses(): string[] {
    return [...new Set(this.allRegisters.map(r => r.patientBasicInfo.economicStatus))].filter(e => e && e !== 'No especificado').sort();
  }

  getUniqueMaritalStatuses(): string[] {
    return [...new Set(this.allRegisters.map(r => r.patientBasicInfo.maritalStatus))].filter(m => m && m !== 'No especificado').sort();
  }

  getUniqueLocations(): string[] {
    return [...new Set(this.allRegisters.map(r => r.patientBasicInfo.currentCity))].filter(l => l && l !== 'No especificado').sort();
  }

  getUniqueHometowns(): string[] {
    return [...new Set(this.allRegisters.map(r => r.patientBasicInfo.hometown))].filter(h => h).sort();
  }

  getUniqueCurrentCities(): string[] {
    return [...new Set(this.allRegisters.map(r => r.patientBasicInfo.currentCity))].filter(c => c).sort();
  }

  getUniqueCaregiverEducationLevels(): string[] {
    return [...new Set(this.allRegisters
      .filter(r => r.caregiver)
      .map(r => r.caregiver!.educationLevel))].filter(e => e).sort();
  }

  getUniqueCaregiverOccupations(): string[] {
    return [...new Set(this.allRegisters
      .filter(r => r.caregiver)
      .map(r => r.caregiver!.occupation))].filter(o => o).sort();
  }

  getChartTypeName(type: string): string {
    const chartNames: { [key: string]: string } = {
      'bar': 'Barras',
      'line': 'Líneas',
      'pie': 'Torta',
      'doughnut': 'Donut',
      'radar': 'Radar'
    };
    return chartNames[type] || type;
  }
}
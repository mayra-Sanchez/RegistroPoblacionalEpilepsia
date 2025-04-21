import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
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

  allRegisters: Register[] = [];
  filteredRegisters: Register[] = [];
  filteredData = new MatTableDataSource<PatientStat>([]);

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
    hasCaregiver: null as boolean | null
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
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
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
  ) { }

  ngOnInit(): void {
    this.loadCurrentResearchLayer();
  }

  ngAfterViewInit() {
    this.filteredData.paginator = this.paginator;
    this.filteredData.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        firstCrisisDate: patientInfo?.firstCrisisDate
      };
    });

    this.filteredData.data = data;
    this.totalElements = data.length;
    
    this.filteredData.paginator = this.paginator;
    this.filteredData.sort = this.sort;

    this.prepareChartData();
  }

  prepareChartData(): void {
    if (this.viewType !== 'chart') return;

    const dimension1Data = this.groupByDimension(this.selectedDimension1);
    
    if (this.showComparison && this.selectedDimension2) {
      const dimension2Data = this.groupByDimension(this.selectedDimension2);
      this.chartData = this.createComparisonChart(dimension1Data, dimension2Data);
    } else {
      this.chartData = this.createSingleDimensionChart(dimension1Data, this.selectedDimension1);
    }
  }

  private groupByDimension(dimension: ChartDimension): Record<string, number> {
    return this.filteredData.data.reduce((acc: Record<string, number>, patient: PatientStat) => {
      let key: string;
      
      switch(dimension) {
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
    return {
      labels: labels,
      datasets: [{
        data: Object.values(data),
        backgroundColor: this.chartColors.slice(0, labels.length),
        label: this.dimensionLabels[dimension]
      }]
    };
  }

  private createComparisonChart(
    data1: Record<string, number>, 
    data2: Record<string, number>
  ): ChartConfiguration['data'] {
    const allLabels = new Set([...Object.keys(data1), ...Object.keys(data2)]);
    const labels = Array.from(allLabels);
    
    return {
      labels: labels,
      datasets: [
        {
          label: this.dimensionLabels[this.selectedDimension1],
          data: labels.map(label => data1[label] || 0),
          backgroundColor: this.chartColors[0]
        },
        {
          label: this.dimensionLabels[this.selectedDimension2!],
          data: labels.map(label => data2[label] || 0),
          backgroundColor: this.chartColors[1]
        }
      ]
    };
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
      hasCaregiver: null
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
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'grafico_epilepsia.png';
      link.href = image;
      link.click();
    }
  }
}
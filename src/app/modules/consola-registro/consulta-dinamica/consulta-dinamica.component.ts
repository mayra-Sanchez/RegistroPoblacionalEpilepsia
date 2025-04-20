import { Component, OnInit, OnDestroy } from '@angular/core';
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

interface PatientStat {
  sex: string;
  age: number;
  crisisStatus: 'Activa' | 'Remisión' | 'Estable' | 'Crítica' | 'Recuperado';
  registerDate: Date;
  variables: string[];
}

@Component({
  selector: 'app-consulta-dinamica',
  templateUrl: './consulta-dinamica.component.html',
  styleUrls: ['./consulta-dinamica.component.css']
})
export class ConsultaDinamicaComponent implements OnInit, OnDestroy {
  allRegisters: Register[] = [];
  filteredRegisters: Register[] = [];
  filteredData: PatientStat[] = [];

  filters = {
    patientName: '',
    variableName: '',
    minAge: null as number | null,
    maxAge: null as number | null,
    sex: '',
    crisisStatus: '' as '' | 'Activa' | 'Remisión' | 'Estable' | 'Crítica' | 'Recuperado',
    dateRange: { start: null as Date | null, end: null as Date | null },
    ageRange: [0, 100] as [number, number]
  };

  currentPage = 0;
  pageSize = 5;

  viewType: 'chart' | 'table' = 'chart';
  chartType: ChartType = 'bar';
  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true }
    }
  };

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
        this.allRegisters = response.registers || response.content || [];
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

  applyFilters(): void {
    this.filteredRegisters = this.allRegisters.filter(register => {
      if (this.filters.sex && register.patientBasicInfo?.sex !== this.filters.sex) return false;

      const age = register.patientBasicInfo?.age;
      if (this.filters.minAge !== null && (age === undefined || age < this.filters.minAge)) return false;
      if (this.filters.maxAge !== null && (age === undefined || age > this.filters.maxAge)) return false;

      if (this.filters.crisisStatus && 
          register.patientBasicInfo?.crisisStatus !== this.filters.crisisStatus) {
        return false;
      }

      const registerDate = new Date(register.registerDate);
      if (this.filters.dateRange.start && registerDate < this.filters.dateRange.start) return false;
      if (this.filters.dateRange.end && registerDate > this.filters.dateRange.end) return false;

      return true;
    });

    this.filteredData = this.filteredRegisters.map(register => ({
      sex: register.patientBasicInfo?.sex || '',
      age: register.patientBasicInfo?.age || 0,
      crisisStatus: register.patientBasicInfo?.crisisStatus as any || 'Estable',
      registerDate: new Date(register.registerDate),
      variables: register.variablesRegister.map(v => v.variableName || '')
    }));

    this.prepareChartData();
  }

  prepareChartData(): void {
    if (this.viewType !== 'chart') return;

    const crisisData = this.groupByCrisisStatus();
    const sexData = this.groupBySex();

    if (this.chartType === 'pie' || this.chartType === 'doughnut') {
      this.chartData = {
        labels: Object.keys(crisisData),
        datasets: [{
          data: Object.values(crisisData),
          backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#2196F3'],
          label: 'Pacientes por estado de crisis'
        }]
      };
    } else {
      this.chartData = {
        labels: ['Distribución'],
        datasets: [
          {
            label: 'Femenino',
            data: [sexData['femenino'] || 0],
            backgroundColor: '#E91E63'
          },
          {
            label: 'Masculino',
            data: [sexData['masculino'] || 0],
            backgroundColor: '#3F51B5'
          }
        ]
      };
    }
  }

  private groupByCrisisStatus(): Record<string, number> {
    return this.filteredData.reduce((acc: Record<string, number>, patient: PatientStat) => {
      acc[patient.crisisStatus] = (acc[patient.crisisStatus] || 0) + 1;
      return acc;
    }, {});
  }

  private groupBySex(): Record<string, number> {
    return this.filteredData.reduce((acc: Record<string, number>, patient: PatientStat) => {
      acc[patient.sex] = (acc[patient.sex] || 0) + 1;
      return acc;
    }, {});
  }

  exportToCSV(): void {
    const headers = ['Sexo', 'Edad', 'Estado de crisis', 'Fecha registro', 'Variables'];
    const csvContent = [
      headers.join(','),
      ...this.filteredData.map(p => [
        p.sex,
        p.age,
        p.crisisStatus,
        p.registerDate.toISOString().split('T')[0],
        `"${p.variables.join(', ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `estadisticas_epilepsia_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportToExcel(): void {
    const data = this.filteredData.map(p => ({
      'Sexo': p.sex,
      'Edad': p.age,
      'Estado de crisis': p.crisisStatus,
      'Fecha registro': p.registerDate.toISOString().split('T')[0],
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

    const tableData = this.filteredData.map(p => [
      p.sex,
      p.age.toString(),
      p.crisisStatus,
      p.registerDate.toISOString().split('T')[0],
      p.variables.join(', ')
    ]);

    autoTable(doc, {
      head: [['Sexo', 'Edad', 'Estado', 'Fecha', 'Variables']],
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
      ageRange: [0, 100]
    };
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Activa': return '#4CAF50';
      case 'Remisión': return '#FFC107';
      case 'Estable': return '#F44336';
      case 'Crítica': return '#2196F3';
      case 'Recuperado': return '#2196G7';
      default: return '#9E9E9E';
    }
  }
}


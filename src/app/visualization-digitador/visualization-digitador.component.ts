import { Component } from '@angular/core';

@Component({
  selector: 'app-visualization-digitador',
  templateUrl: './visualization-digitador.component.html',
  styleUrls: ['./visualization-digitador.component.css']
})
export class VisualizationDigitadorComponent {
  // Filtros
  filters = {
    gender: null,
    minAge: 0,
    maxAge: 100,
  };

  crisisStates = ['Libre de crisis', 'Epilepsia', 'Epilepsia activa', 'Remota'];
  selectedStates: string[] = [];

  // Tipo de gráfica
  selectedChartType = 'bar';
  chartOptions: any;

  // Métodos para manejar filtros
  toggleCrisisState(state: string, event: Event) {
    if ((event.target as HTMLInputElement).checked) {
      this.selectedStates.push(state);
    } else {
      this.selectedStates = this.selectedStates.filter((s) => s !== state);
    }
    this.updateChartOptions();
  }

  // Actualizar tipo de gráfica
  updateChartType() {
    this.updateChartOptions();
  }

  // Actualizar opciones del gráfico
  updateChartOptions() {
    this.chartOptions = {
      xAxis: {
        data: ['Libre de crisis', 'Epilepsia', 'Epilepsia activa', 'Remota'],
      },
      yAxis: {},
      series: [
        {
          name: 'Hombres',
          type: this.selectedChartType,
          data: [65, 8, 90, 81],
        },
        {
          name: 'Mujeres',
          type: this.selectedChartType,
          data: [21, 48, 40, 19],
        },
      ],
    };
  }

  // Guardar consulta
  saveQuery() {
    console.log('Consulta guardada:', this.filters, this.selectedStates);
  }

  // Exportar datos
  exportData() {
    console.log('Exportando datos...');
  }

  ngOnInit() {
    this.updateChartOptions();
  }
}

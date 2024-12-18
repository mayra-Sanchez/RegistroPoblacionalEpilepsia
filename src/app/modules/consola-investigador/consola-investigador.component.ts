import { Component } from '@angular/core';

@Component({
  selector: 'app-consola-investigador',
  templateUrl: './consola-investigador.component.html',
  styleUrls: ['./consola-investigador.component.css']
})
export class ConsolaInvestigadorComponent {
  selectedTab: string = 'inicioInvestigador'; 
  
  consultasData = [
    { 
      nombre: 'Depresión y epilepsia', 
      tipoVisualizacion: 'Gráfico de barras', 
      fechaGuardada: '13 de Junio del 2024', 
      filtros: 'mujer, 20 años, epilepsia activa' 
    },
    { 
      nombre: 'Impacto del estrés en adultos', 
      tipoVisualizacion: 'Gráfico de líneas', 
      fechaGuardada: '22 de Agosto del 2024', 
      filtros: 'hombre, 35 años, diagnóstico de estrés moderado' 
    },
    { 
      nombre: 'Trastornos de sueño en jóvenes', 
      tipoVisualizacion: 'Gráfico de pastel', 
      fechaGuardada: '5 de Julio del 2024', 
      filtros: 'jóvenes, 18-25 años, diagnóstico de insomnio' 
    },
    { 
      nombre: 'Ansiedad por regiones', 
      tipoVisualizacion: 'Mapa de calor', 
      fechaGuardada: '15 de Septiembre del 2024', 
      filtros: 'hombres y mujeres, todas las edades, ansiedad diagnosticada, Colombia' 
    },
    { 
      nombre: 'Efectos secundarios de medicamentos', 
      tipoVisualizacion: 'Gráfico de barras apiladas', 
      fechaGuardada: '1 de Octubre del 2024', 
      filtros: 'mujeres, 30-40 años, en tratamiento con antidepresivos' 
    },
    { 
      nombre: 'Patrones de actividad física en pacientes', 
      tipoVisualizacion: 'Gráfico de dispersión', 
      fechaGuardada: '18 de Diciembre del 2024', 
      filtros: 'hombres, 25-50 años, diagnóstico de obesidad' 
    }
  ];  

  consultasColumns = [
    { field: 'nombre', header: 'Nombre de la consulta' },
    { field: 'tipoVisualizacion', header: 'Tipo de visualización' },
    { field: 'fechaGuardada', header: 'Guardado el' },
    { field: 'filtros', header: 'Filtros' }
  ];

  handleView(row: any) {
    console.log('Ver', row);
  }

  handleEdit(row: any) {
    console.log('Editar', row);
  }

  handleDelete(row: any) {
    console.log('Eliminar', row);
  }

  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }
}

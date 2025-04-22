import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaInvestigadorRoutingModule } from './consola-investigador-routing.module';
import { ConsolaInvestigadorComponent } from './consola-investigador.component';
import { NavbarInvestigadorComponent } from '../../shared/components/navbars/navbar-investigador/navbar-investigador.component';
import { TableVerConsultasComponent } from '../../shared/components/table-ver-consultas/table-ver-consultas.component';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { GraficasInicioComponent } from './components/graficas-inicio/graficas-inicio.component';
import { ConsultaDatosComponent } from './components/consulta-datos/consulta-datos.component';

// Módulos adicionales necesarios para las gráficas
import { NgChartsModule } from 'ng2-charts';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    ConsolaInvestigadorComponent,
    NavbarInvestigadorComponent,
    TableVerConsultasComponent,
    GraficasInicioComponent,
    ConsultaDatosComponent,
  ],
  imports: [
    CommonModule,
    ConsolaInvestigadorRoutingModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    
    // Módulos adicionales para las gráficas
    NgChartsModule, // Necesario para Chart.js
    MatCardModule, // Para los contenedores de las gráficas
    MatProgressSpinnerModule, // Para el spinner de carga
    MatIconModule // Para íconos (como el de error)
  ]
})
export class ConsolaInvestigadorModule { }
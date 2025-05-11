import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaInvestigadorRoutingModule } from './consola-investigador-routing.module';
import { ConsolaInvestigadorComponent } from './consola-investigador.component';
import { NavbarInvestigadorComponent } from '../../shared/components/navbars/navbar-investigador/navbar-investigador.component';
import { TableVerConsultasComponent } from '../../shared/components/table-ver-consultas/table-ver-consultas.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { HttpClientModule } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';

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
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,

    // Módulos adicionales para las gráficas
    NgChartsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    HttpClientModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatOptionModule,
    MatButtonToggleModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatCheckboxModule,
    MatMenuModule,
    MatExpansionModule,
    MatDialogModule
  ]
})
export class ConsolaInvestigadorModule { }
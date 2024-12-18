import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaInvestigadorRoutingModule } from './consola-investigador-routing.module';
import { ConsolaInvestigadorComponent } from './consola-investigador.component';
import { NavbarInvestigadorComponent } from '../../shared/components/navbars/navbar-investigador/navbar-investigador.component';
import { TableVerConsultasComponent } from '../../shared/components/table-ver-consultas/table-ver-consultas.component';
import { FormsModule } from '@angular/forms'; // Asegúrate de que FormsModule esté importado
import { MatTableModule } from '@angular/material/table'; // Asegúrate de que MatTableModule esté importado
import { MatPaginatorModule } from '@angular/material/paginator'; // Importa MatPaginatorModule
import { MatSortModule } from '@angular/material/sort';

@NgModule({
  declarations: [
    ConsolaInvestigadorComponent,
    NavbarInvestigadorComponent,
    TableVerConsultasComponent,
  ],
  imports: [
    CommonModule,
    ConsolaInvestigadorRoutingModule,
    FormsModule, // Asegúrate de que FormsModule esté aquí
    MatTableModule, // Asegúrate de que MatTableModule esté aquí
    MatPaginatorModule, // Asegúrate de que MatPaginatorModule esté aquí
    MatSortModule, // Asegúrate de que MatSortModule esté aquí
  ]
})
export class ConsolaInvestigadorModule { }

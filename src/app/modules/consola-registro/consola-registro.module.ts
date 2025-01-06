import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaRegistroRoutingModule } from './consola-registro-routing.module';
import { ConsolaRegistroComponent } from './consola-registro.component';
import { NavbarRegistroComponent } from '../../shared/components/navbars/navbar-registro/navbar-registro.component';
import { FormRegistroPacienteComponent } from '../../form-registro-paciente/form-registro-paciente.component';
import { TableVerUsuariosComponent } from '../../shared/components/table-ver-usuarios/table-ver-usuarios.component';
import { FormsModule } from '@angular/forms'; // Asegúrate de que FormsModule esté importado
import { MatTableModule } from '@angular/material/table'; // Asegúrate de que MatTableModule esté importado
import { MatPaginatorModule } from '@angular/material/paginator'; // Importa MatPaginatorModule
import { MatSortModule } from '@angular/material/sort';
import { VisualizationDigitadorComponent } from '../../visualization-digitador/visualization-digitador.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { NgxEchartsModule } from 'ngx-echarts';

@NgModule({
  declarations: [
    ConsolaRegistroComponent,
    NavbarRegistroComponent,
    FormRegistroPacienteComponent,
    TableVerUsuariosComponent,
    VisualizationDigitadorComponent
  ],
  imports: [
    CommonModule,
    ConsolaRegistroRoutingModule, 
    FormsModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatSliderModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ]
})
export class ConsolaRegistroModule { }

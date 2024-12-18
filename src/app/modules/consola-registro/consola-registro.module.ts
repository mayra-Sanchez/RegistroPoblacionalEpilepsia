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

@NgModule({
  declarations: [
    ConsolaRegistroComponent,
    NavbarRegistroComponent,
    FormRegistroPacienteComponent,
    TableVerUsuariosComponent
  ],
  imports: [
    CommonModule,
    ConsolaRegistroRoutingModule, 
    FormsModule, // Asegúrate de que FormsModule esté aquí
    MatTableModule, // Asegúrate de que MatTableModule esté aquí
    MatPaginatorModule, // Asegúrate de que MatPaginatorModule esté aquí
    MatSortModule, // Asegúrate de que MatSortModule esté aquí
  ]
})
export class ConsolaRegistroModule { }

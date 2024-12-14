import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaAdministradorRoutingModule } from './consola-administrador-routing.module';
import { ConsolaAdministradorComponent } from './consola-administrador.component';
import { NavbarAdminComponent } from '../../shared/components/navbar-admin/navbar-admin.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { FormsModule } from '@angular/forms'; // Asegúrate de que FormsModule esté importado
import { MatTableModule } from '@angular/material/table'; // Asegúrate de que MatTableModule esté importado
import { MatPaginatorModule } from '@angular/material/paginator'; // Importa MatPaginatorModule
import { MatSortModule } from '@angular/material/sort'; // Importa MatSortModule

@NgModule({
  declarations: [
    ConsolaAdministradorComponent,
    NavbarAdminComponent,
    TableComponent,
  ],
  imports: [
    CommonModule,
    ConsolaAdministradorRoutingModule,
    FormsModule, // Asegúrate de que FormsModule esté aquí
    MatTableModule, // Asegúrate de que MatTableModule esté aquí
    MatPaginatorModule, // Asegúrate de que MatPaginatorModule esté aquí
    MatSortModule, // Asegúrate de que MatSortModule esté aquí
  ]
})
export class AdminModule { }

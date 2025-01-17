import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaAdministradorRoutingModule } from './consola-administrador-routing.module';
import { ConsolaAdministradorComponent } from './consola-administrador.component';
import { NavbarAdminComponent } from '../../shared/components/navbars/navbar-admin/navbar-admin.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { FormsModule } from '@angular/forms'; // Asegúrate de que FormsModule esté importado
import { MatTableModule } from '@angular/material/table'; // Asegúrate de que MatTableModule esté importado
import { MatPaginatorModule } from '@angular/material/paginator'; // Importa MatPaginatorModule
import { MatSortModule } from '@angular/material/sort';
import { FormRegistroUsuarioComponent } from '../../shared/components/forms-admin/form-registro-usuario/form-registro-usuario.component';
import { FormRegistroVariablesComponent } from '../../shared/components/forms-admin/form-registro-variables/form-registro-variables.component';
import { FormRegistroCapasComponent } from '../../shared/components/forms-admin/form-registro-capas/form-registro-capas.component'; // Importa MatSortModule
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ConsolaAdministradorComponent,
    NavbarAdminComponent,
    TableComponent,
    FormRegistroUsuarioComponent,
    FormRegistroVariablesComponent,
    FormRegistroCapasComponent,
  ],
  imports: [
    CommonModule,
    ConsolaAdministradorRoutingModule,
    FormsModule, // Asegúrate de que FormsModule esté aquí
    MatTableModule, // Asegúrate de que MatTableModule esté aquí
    MatPaginatorModule, // Asegúrate de que MatPaginatorModule esté aquí
    MatSortModule, // Asegúrate de que MatSortModule esté aquí
    HttpClientModule,
    ReactiveFormsModule,
  ]
})
export class AdminModule { }

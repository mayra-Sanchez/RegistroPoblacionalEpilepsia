import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaAdministradorRoutingModule } from './consola-administrador-routing.module';
import { ConsolaAdministradorComponent } from './consola-administrador.component';
import { NavbarAdminComponent } from '../../shared/components/navbar-admin/navbar-admin.component';


@NgModule({
  declarations: [
    ConsolaAdministradorComponent,
    NavbarAdminComponent,
  ],
  imports: [
    CommonModule,
    ConsolaAdministradorRoutingModule
  ]
})
export class AdminModule { }

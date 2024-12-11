import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaAdministradorRoutingModule } from './consola-administrador-routing.module';
import { ConsolaAdministradorComponent } from './consola-administrador.component';


@NgModule({
  declarations: [
    ConsolaAdministradorComponent
  ],
  imports: [
    CommonModule,
    ConsolaAdministradorRoutingModule
  ]
})
export class AdminModule { }

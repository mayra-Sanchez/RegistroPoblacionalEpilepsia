import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaRegistroRoutingModule } from './consola-registro-routing.module';
import { ConsolaRegistroComponent } from './consola-registro.component';
import { NavbarRegistroComponent } from '../../navbar-registro/navbar-registro.component';


@NgModule({
  declarations: [
    ConsolaRegistroComponent,
    NavbarRegistroComponent
  ],
  imports: [
    CommonModule,
    ConsolaRegistroRoutingModule
  ]
})
export class ConsolaRegistroModule { }

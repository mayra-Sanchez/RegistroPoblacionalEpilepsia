import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaInvestigadorRoutingModule } from './consola-investigador-routing.module';
import { ConsolaInvestigadorComponent } from './consola-investigador.component';
import { NavbarInvestigadorComponent } from '../../shared/components/navbars/navbar-investigador/navbar-investigador.component';


@NgModule({
  declarations: [
    ConsolaInvestigadorComponent,
    NavbarInvestigadorComponent,
  ],
  imports: [
    CommonModule,
    ConsolaInvestigadorRoutingModule
  ]
})
export class ConsolaInvestigadorModule { }

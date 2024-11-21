import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaInvestigadorRoutingModule } from './consola-investigador-routing.module';
import { ConsolaInvestigadorComponent } from './consola-investigador.component';


@NgModule({
  declarations: [
    ConsolaInvestigadorComponent
  ],
  imports: [
    CommonModule,
    ConsolaInvestigadorRoutingModule
  ]
})
export class ConsolaInvestigadorModule { }

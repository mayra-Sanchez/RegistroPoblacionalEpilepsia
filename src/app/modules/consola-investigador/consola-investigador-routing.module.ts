import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsolaInvestigadorComponent } from './consola-investigador.component';

const routes: Routes = [{ path: '', component: ConsolaInvestigadorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsolaInvestigadorRoutingModule { }

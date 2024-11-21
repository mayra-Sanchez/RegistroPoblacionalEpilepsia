import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsolaRegistroComponent } from './consola-registro.component';

const routes: Routes = [{ path: '', component: ConsolaRegistroComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsolaRegistroRoutingModule { }

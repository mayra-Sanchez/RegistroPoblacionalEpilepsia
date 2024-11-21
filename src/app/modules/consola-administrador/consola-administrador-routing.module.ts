import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsolaAdministradorComponent } from './consola-administrador.component';

const routes: Routes = [{ path: '', component: ConsolaAdministradorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsolaAdministradorRoutingModule { }

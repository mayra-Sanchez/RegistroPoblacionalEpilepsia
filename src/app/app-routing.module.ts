import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  {
    path: 'registro',
    loadChildren: () =>
      import('./modules/consola-registro/consola-registro.module').then(
        (m) => m.ConsolaRegistroModule
      ),
  },
  {
    path: 'administrador',
    loadChildren: () =>
      import('./modules/consola-administrador/consola-administrador.module').then(
        (m) => m.AdminModule
      ),
  },
  {
    path: 'investigador',
    loadChildren: () =>
      import('./modules/consola-investigador/consola-investigador.module').then(
        (m) => m.ConsolaInvestigadorModule
      ),
  },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
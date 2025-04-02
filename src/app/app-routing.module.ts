import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './authGuard';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  {
    path: 'registro',
    loadChildren: () =>
      import('./modules/consola-registro/consola-registro.module').then((m) => m.ConsolaRegistroModule),
    canActivate: [AuthGuard],
    data: { roles: ['Doctor_client_role'] },
  },
  {
    path: 'administrador',
    loadChildren: () => import('./modules/consola-administrador/consola-administrador.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { roles: ['Admin_client_role' ,'SuperAdmin_client_role'] }
  },
  {
    path: 'investigador',
    loadChildren: () =>
      import('./modules/consola-investigador/consola-investigador.module').then((m) => m.ConsolaInvestigadorModule),
    canActivate: [AuthGuard],
    data: { roles: ['Researcher_client_role'] },
  },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

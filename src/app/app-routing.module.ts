import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PasswordRecoveryComponent } from './login/password-recovery/password-recovery.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'password-recovery', component: PasswordRecoveryComponent },
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
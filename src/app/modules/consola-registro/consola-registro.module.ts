import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsolaRegistroRoutingModule } from './consola-registro-routing.module';
import { ConsolaRegistroComponent } from './consola-registro.component';
import { NavbarRegistroComponent } from '../../shared/components/navbars/navbar-registro/navbar-registro.component';
import { FormRegistroPacienteComponent } from '../../form-registro-paciente/form-registro-paciente.component';
import { TableVerUsuariosComponent } from '../../shared/components/table-ver-usuarios/table-ver-usuarios.component';
import { FormsModule } from '@angular/forms'; // Asegúrate de que FormsModule esté importado
import { MatTableModule } from '@angular/material/table'; // Asegúrate de que MatTableModule esté importado
import { MatPaginatorModule } from '@angular/material/paginator'; // Importa MatPaginatorModule
import { MatSortModule } from '@angular/material/sort';
import { ReactiveFormsModule } from '@angular/forms';
import { ClinicoFormComponent } from 'src/app/form-registro-paciente/components/clinico-form/clinico-form.component';
import { ProfesionalFormComponent } from 'src/app/form-registro-paciente/components/profesional-form/profesional-form.component';
import { CuidadorFormComponent } from 'src/app/form-registro-paciente/components/cuidador-form/cuidador-form.component';
import { SignaturePadComponent } from 'src/app/form-registro-paciente/components/signature-form/signature-form.component';
import { PacienteFormComponent } from 'src/app/form-registro-paciente/components/paciente-form/paciente-form.component';
import { ViewRegistroModalComponent } from './view-registro-modal/view-registro-modal.component';
import { EditRegistroModalComponent } from './edit-registro-modal/edit-registro-modal.component';
@NgModule({
  declarations: [
    ConsolaRegistroComponent,
    NavbarRegistroComponent,
    FormRegistroPacienteComponent,
    TableVerUsuariosComponent,
    ClinicoFormComponent,
    ProfesionalFormComponent,
    SignaturePadComponent,
    CuidadorFormComponent,
    PacienteFormComponent,
    ViewRegistroModalComponent,
    EditRegistroModalComponent,
  ],
  imports: [
    CommonModule,
    ConsolaRegistroRoutingModule, 
    FormsModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    ReactiveFormsModule
  ]
})
export class ConsolaRegistroModule { }

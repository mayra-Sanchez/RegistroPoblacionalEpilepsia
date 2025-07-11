import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { ConsultaDinamicaComponent } from './consulta-dinamica/consulta-dinamica.component';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BuscarProfesionalModalComponent } from './components/buscar-profesional-modal/buscar-profesional-modal.component';
import { BuscarPacienteModalComponent } from './components/buscar-paciente-modal/buscar-paciente-modal.component';
import { NgChartsModule } from 'ng2-charts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
    ConsultaDinamicaComponent,
    BuscarProfesionalModalComponent,
    BuscarPacienteModalComponent,
  ],
  imports: [
    CommonModule,
    ConsolaRegistroRoutingModule, 
    FormsModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    ReactiveFormsModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgChartsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatOptionModule,
    MatButtonToggleModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatCheckboxModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ConsolaRegistroModule { }

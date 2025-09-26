import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsolaRegistroRoutingModule } from './consola-registro-routing.module';
import { ConsolaRegistroComponent } from './consola-registro.component';
import { NavbarRegistroComponent } from '../../shared/components/navbars/navbar-registro/navbar-registro.component';
import { TableVerUsuariosComponent } from '../../shared/components/table-ver-usuarios/table-ver-usuarios.component';
import { FormsModule } from '@angular/forms'; // Asegúrate de que FormsModule esté importado
import { MatTableModule } from '@angular/material/table'; // Asegúrate de que MatTableModule esté importado
import { MatPaginatorModule } from '@angular/material/paginator'; // Importa MatPaginatorModule
import { MatSortModule } from '@angular/material/sort';
import { ReactiveFormsModule } from '@angular/forms';
import { ConsultaDinamicaComponent } from './consulta-dinamica/consulta-dinamica.component';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { SafeUrlPipe } from 'src/app/pipes/safeUrl.pipe';
import { ConsentimientoInformadoComponent } from './components/consentimiento-informado/consentimiento-informado.component';
import { ViewRegistroModalComponent } from './components/view-registro-modal/view-registro-modal.component';
import { RegistroPacienteComponent } from './components/registro-paciente/registro-paciente.component';
import { EditRegistroModalComponent } from './components/edit-registro-modal/edit-registro-modal.component';
import { VersionamientoModalComponent } from './components/versionamiento-modal/versionamiento-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
@NgModule({
  declarations: [
    ConsolaRegistroComponent,
    NavbarRegistroComponent,
    TableVerUsuariosComponent,
    ConsultaDinamicaComponent,
    FileSizePipe,
    SafeUrlPipe,
    ConsentimientoInformadoComponent,
    RegistroPacienteComponent,
    EditRegistroModalComponent,
    ViewRegistroModalComponent,
    VersionamientoModalComponent
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
    MatCheckboxModule,
    MatDialogModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    FileSizePipe,
    SafeUrlPipe
  ]
})
export class ConsolaRegistroModule { }

import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ModalConfirmacionComponent } from './shared/components/modal-confirmacion/modal-confirmacion.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ManualComponent } from './shared/manual/manual.component';
import { LoginComponent } from './shared/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './Guard/auth.interceptor';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { SafePipe } from './pipes/safe.pipe';
import { InicioSectionComponent } from './home/sections/inicio-section/inicio-section.component';
import { SistemaSectionComponent } from './home/sections/sistema-section/sistema-section.component';
import { ContactoSectionComponent } from './home/sections/contacto-section/contacto-section.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { TerminosModalComponent } from './home/sections/contacto-section/modal/terminos-modal.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    NavbarComponent,
    HomeComponent,
    ModalConfirmacionComponent,
    ManualComponent,
    LoginComponent,
    SafePipe,
    InicioSectionComponent,
    SistemaSectionComponent,
    ContactoSectionComponent,
    TerminosModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatChipsModule,
    NgbModule,
      CommonModule,             
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
  exports: [
    SafePipe
  ]
})
export class AppModule { }

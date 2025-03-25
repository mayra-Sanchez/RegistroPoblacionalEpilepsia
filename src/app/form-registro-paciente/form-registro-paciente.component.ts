import { Component, OnInit } from '@angular/core';
import { ConsolaRegistroService } from '../modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';

@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements OnInit {
  pasoActual = 1;
  tieneCuidador = false;
  clinicalData: any[] = [];
  currentResearchLayerId: string = '';
  formData: any = {}; // Objeto para almacenar todos los datos del formulario

  constructor(
    private consolaService: ConsolaRegistroService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserResearchLayer();
  }

  private loadUserResearchLayer(): void {
    const email = this.authService.getUserEmail();
    if (!email) return;

    this.consolaService.obtenerUsuarioAutenticado(email).subscribe({
      next: (response) => {
        if (response?.[0]?.attributes?.researchLayerId?.[0]) {
          const nombreCapa = response[0].attributes.researchLayerId[0];
          this.loadResearchLayerId(nombreCapa);
        }
      },
      error: (err) => console.error('Error al cargar usuario:', err)
    });
  }

  private loadResearchLayerId(nombreCapa: string): void {
    this.consolaService.buscarCapaPorNombre(nombreCapa).subscribe({
      next: (capa) => {
        if (capa.id) {
          this.currentResearchLayerId = capa.id;
        }
      },
      error: (err) => console.error('Error al cargar capa:', err)
    });
  }

  // Método para guardar datos cuando se avanza de paso
  onNextFromChild(formData: any) {
    this.formData = { ...this.formData, ...formData };
    this.siguientePaso();
  }

  siguientePaso(): void {
    this.pasoActual++;
  }

  pasoAnterior(): void {
    this.pasoActual--;
  }

  onRegister(formData: any): void {
    const completeData = { ...this.formData, ...formData };
    this.consolaService.registrarRegistro(completeData).subscribe({
      next: (response) => console.log('Registro exitoso', response),
      error: (error) => console.error('Error en el registro', error)
    });
  }

  // Al recibir datos del formulario clínico
  handleClinicalData(data: any[]): void {
    this.clinicalData = data;
    this.siguientePaso();
  }

  // Al volver al paso clínico
  getInitialClinicalData(): any[] {
    return this.clinicalData;
  }
}
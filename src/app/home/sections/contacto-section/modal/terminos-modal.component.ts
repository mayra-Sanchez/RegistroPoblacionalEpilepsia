import { Component, OnInit } from '@angular/core';
import { TerminosService } from 'src/app/services/terminos.service';

@Component({
  selector: 'app-terminos-modal',
  templateUrl: './terminos-modal.component.html',
  styleUrls: ['./terminos-modal.component.css']
})
export class TerminosModalComponent implements OnInit {
  contenido: string = '';
  cargando = true;
  fechaActual: Date = new Date();

  constructor(private terminosService: TerminosService) {}

  ngOnInit(): void {
    this.cargarTerminos();
  }

  private cargarTerminos(): void {
    this.terminosService.getTerminos().subscribe({
      next: (res) => {
        this.contenido = this.formatearContenido(res.termsAndConditionsInfo);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando términos:', error);
        this.contenido = this.getMensajeError();
        this.cargando = false;
      }
    });
  }

  private formatearContenido(contenido: string): string {
    // Asegurar que el contenido tenga formato HTML básico
    if (!contenido.includes('<')) {
      return `<div class="contenido-simple">${contenido.replace(/\n/g, '<br>')}</div>`;
    }
    return contenido;
  }

  private getMensajeError(): string {
    return `
      <div class="error-message">
        <h3>⚠️ Error al cargar los términos</h3>
        <p>No fue posible cargar los términos y condiciones en este momento.</p>
        <p>Por favor, intente nuevamente más tarde o contacte al administrador del sistema.</p>
      </div>
    `;
  }
}
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

  constructor(private terminosService: TerminosService) {}

  ngOnInit(): void {
    this.terminosService.getTerminos().subscribe({
      next: (res) => {
        this.contenido = res.termsAndConditionsInfo;
        this.cargando = false;
      },
      error: () => {
        this.contenido = 'No fue posible cargar los términos y condiciones.';
        this.cargando = false;
      }
    });
  }
}

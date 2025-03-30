import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ConsolaAdministradorService } from '../../services/consola-administrador.service';

@Component({
  selector: 'app-handle-view',
  templateUrl: './handle-view.component.html',
  styleUrls: ['./handle-view.component.css']
})
export class HandleViewComponent implements OnInit {
  @Input() viewedItem: any;
  @Input() viewType: string = '';
  @Output() closeModal = new EventEmitter<void>();
  
  capas: any[] = [];

  constructor(private consolaService: ConsolaAdministradorService) {}

  ngOnInit(): void {
    this.cargarCapas();
  }

  cargarCapas(): void {
    this.consolaService.getAllLayers().subscribe({
      next: (data) => {
        this.capas = data.map(capa => ({
          id: capa.id,
          nombreCapa: capa.layerName
        }));
      },
      error: (err) => console.error('Error al cargar capas:', err)
    });
  }

  cerrarModal(): void {
    this.closeModal.emit();
  }

  getTipoDocumento(tipo: string): string {
    const tipos: {[key: string]: string} = {
      'CC': 'Cédula de Ciudadanía',
      'TI': 'Tarjeta de Identidad',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte'
    };
    return tipos[tipo] || tipo;
  }

  getNombreCapa(id: string): string {
    if (!id) return 'Sin asignar';
    const capa = this.capas.find(c => c.id === id);
    return capa ? capa.nombreCapa : 'Capa no encontrada';
  }

  getRolFormateado(rol: string): string {
    const rolesMap: {[key: string]: string} = {
      'Admin': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador',
      'Admin_client_role': 'Administrador'
    };
    return rolesMap[rol] || rol;
  }
}
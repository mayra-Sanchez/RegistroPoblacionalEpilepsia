import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ConsolaAdministradorService } from '../../../../services/consola-administrador.service';

/**
 * Componente para visualización detallada de elementos
 */
@Component({
  selector: 'app-handle-view',
  templateUrl: './handle-view.component.html',
  styleUrls: ['./handle-view.component.css']
})
export class HandleViewComponent implements OnInit, OnChanges {

  /* -------------------- Inputs y Outputs -------------------- */

  @Input() viewedItem: any;
  @Input() viewType: string = '';
  @Output() closeModal = new EventEmitter<void>();

  /* -------------------- Propiedades del componente -------------------- */

  capas: any[] = [];
  variablesAsociadas: any[] = [];
  filteredVariables: any[] = [];
  paginatedVariables: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];

  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Postgrado' }
  ];

  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' }
  ];

  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio Bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio Alto' },
    { value: 'alto', label: 'Alto' }
  ];

  constructor(private consolaService: ConsolaAdministradorService) { }

  /* -------------------- Ciclo de Vida -------------------- */

  ngOnInit(): void {
    this.cargarCapas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewedItem'] && this.viewType === 'capa') {
      const capaId = this.viewedItem?.id || this.viewedItem?.capaId || this.viewedItem?.researchLayerId;
      if (capaId) {
        this.loadVariablesPorCapa(capaId);
      }
    }
  }

  loadVariablesPorCapa(capaId: string): void {
    if (!capaId) return;

    this.consolaService.obtenerVariablesPorCapa(capaId).subscribe({
      next: (variables) => {
        this.variablesAsociadas = variables;
        this.filteredVariables = [...variables];
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error al cargar variables de la capa:', err);
      }
    });
  }

  filterVariables(): void {
    if (!this.searchTerm) {
      this.filteredVariables = [...this.variablesAsociadas];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredVariables = this.variablesAsociadas.filter(variable => 
        variable.variableName.toLowerCase().includes(term) ||
        (variable.description && variable.description.toLowerCase().includes(term)) ||
        variable.type.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVariables.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedVariables = this.filteredVariables.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }
  

  /* -------------------- Carga de Datos -------------------- */

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

  /* -------------------- Utilidades -------------------- */

  cerrarModal(): void {
    this.closeModal.emit();
  }

  getTipoDocumento(tipo: string): string {
    const tipos: { [key: string]: string } = {
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
    const rolesMap: { [key: string]: string } = {
      'Admin': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador',
      'Admin_client_role': 'Administrador'
    };
    return rolesMap[rol] || rol;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  }

  getLabel(options: any[], value: string): string {
    if (!value) return '';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  hasCaregiverData(caregiver: any): boolean {
    return caregiver && (
      caregiver.name ||
      caregiver.identificationType ||
      caregiver.identificationNumber ||
      caregiver.age ||
      caregiver.educationLevel ||
      caregiver.occupation
    );
  }
}

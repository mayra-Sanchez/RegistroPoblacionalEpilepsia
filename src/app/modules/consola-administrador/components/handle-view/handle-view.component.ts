import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ConsolaAdministradorService } from '../../services/consola-administrador.service';

/**
 * Componente para visualización detallada de elementos
 * 
 * Este componente muestra información detallada de:
 * - Usuarios
 * - Variables
 * - Capas de investigación
 * - Registros
 * 
 * Recibe los datos a mostrar como input y emite eventos para cerrar el modal.
 */
@Component({
  selector: 'app-handle-view',
  templateUrl: './handle-view.component.html',
  styleUrls: ['./handle-view.component.css']
})
export class HandleViewComponent implements OnInit {

  /* -------------------- Inputs y Outputs -------------------- */

  /**
   * Elemento a visualizar (usuario, variable, capa o registro)
   */
  @Input() viewedItem: any;

  /**
   * Tipo de elemento a visualizar
   * Valores posibles: 'usuario', 'variable', 'capa', 'registro'
   */
  @Input() viewType: string = '';

  /**
   * Evento emitido al cerrar el modal
   */
  @Output() closeModal = new EventEmitter<void>();

  /* -------------------- Propiedades del componente -------------------- */

  /**
   * Lista de capas de investigación para mostrar en selects
   */
  capas: any[] = [];

  /**
   * Opciones para tipo de identificación
   */
  tiposIdentificacion = [
    { value: 'cc', label: 'Cédula de Ciudadanía' },
    { value: 'ti', label: 'Tarjeta de Identidad' },
    { value: 'ce', label: 'Cédula de Extranjería' },
    { value: 'pa', label: 'Pasaporte' }
  ];

  /**
   * Opciones para género
   */
  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }
  ];

  /**
   * Opciones para nivel de educación
   */
  nivelesEducacion = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'universitario', label: 'Universitario' },
    { value: 'postgrado', label: 'Postgrado' }
  ];

  /**
   * Opciones para estado civil
   */
  estadosCiviles = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' }
  ];

  /**
   * Opciones para estado económico
   */
  estadosEconomicos = [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio_bajo', label: 'Medio Bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'medio_alto', label: 'Medio Alto' },
    { value: 'alto', label: 'Alto' }
  ];

  /**
   * Constructor del componente
   * @param consolaService Servicio para obtener datos de capas
   */
  constructor(private consolaService: ConsolaAdministradorService) { }

  /* -------------------- Métodos del ciclo de vida -------------------- */

  /**
   * Inicialización del componente
   * - Carga la lista de capas
   */
  ngOnInit(): void {
    this.cargarCapas();
  }

  /* -------------------- Métodos de carga de datos -------------------- */

  /**
   * Carga las capas de investigación desde el servicio
   */
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

  /* -------------------- Métodos de UI -------------------- */

  /**
   * Cierra el modal de visualización
   */
  cerrarModal(): void {
    this.closeModal.emit();
  }

  /* -------------------- Métodos de formateo de datos -------------------- */

  /**
   * Obtiene el nombre completo de un tipo de documento
   * @param tipo Abreviatura del tipo de documento
   * @returns Nombre completo del tipo de documento
   */
  getTipoDocumento(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'CC': 'Cédula de Ciudadanía',
      'TI': 'Tarjeta de Identidad',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte'
    };
    return tipos[tipo] || tipo;
  }

  /**
   * Obtiene el nombre de una capa por su ID
   * @param id ID de la capa
   * @returns Nombre de la capa o mensaje predeterminado
   */
  getNombreCapa(id: string): string {
    if (!id) return 'Sin asignar';
    const capa = this.capas.find(c => c.id === id);
    return capa ? capa.nombreCapa : 'Capa no encontrada';
  }

  /**
   * Formatea un rol para mostrarlo de manera más legible
   * @param rol Rol a formatear
   * @returns Rol formateado
   */
  getRolFormateado(rol: string): string {
    const rolesMap: { [key: string]: string } = {
      'Admin': 'Administrador',
      'Doctor': 'Doctor',
      'Researcher': 'Investigador',
      'Admin_client_role': 'Administrador'
    };
    return rolesMap[rol] || rol;
  }

  /**
   * Formatea una fecha para mostrarla de manera legible
   * @param dateString Fecha en formato string
   * @returns Fecha formateada o mensaje predeterminado
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  }

  /**
   * Obtiene el label correspondiente a un valor en una lista de opciones
   * @param options Lista de opciones
   * @param value Valor a buscar
   * @returns Label correspondiente o el valor original si no se encuentra
   */
  getLabel(options: any[], value: string): string {
    if (!value) return '';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  /**
   * Verifica si un cuidador tiene datos para mostrar
   * @param caregiver Objeto con datos del cuidador
   * @returns true si el cuidador tiene datos, false en caso contrario
   */
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
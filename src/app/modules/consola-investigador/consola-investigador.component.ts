import { Component } from '@angular/core';

/**
 * Componente principal de la consola del investigador
 * 
 * Este componente sirve como contenedor principal para las diferentes
 * funcionalidades disponibles para los investigadores en el sistema.
 * Maneja la navegación entre las distintas secciones mediante un sistema de pestañas.
 * 
 * @example
 * <app-consola-investigador></app-consola-investigador>
 * 
 * @remarks
 * Las pestañas disponibles son:
 * - 'inicioInvestigador': Dashboard principal con gráficas y resumen
 * - Otras pestañas específicas para investigación
 */
@Component({
  selector: 'app-consola-investigador',
  templateUrl: './consola-investigador.component.html',
  styleUrls: ['./consola-investigador.component.css']
})
export class ConsolaInvestigadorComponent {
  
  // ============================
  // PROPIEDADES DEL COMPONENTE
  // ============================

  /**
   * Pestaña actualmente seleccionada en la interfaz
   * @default 'inicioInvestigador'
   * 
   * Controla qué sección del componente se muestra actualmente.
   * Los valores posibles dependen de la implementación específica
   * de las pestañas en la plantilla HTML.
   */
  selectedTab: string = 'inicioInvestigador';

  // ============================
  // MÉTODOS PÚBLICOS
  // ============================

  /**
   * Maneja el cambio de pestaña en la interfaz
   * 
   * Este método se ejecuta cuando el usuario selecciona una pestaña diferente
   * en la interfaz, actualizando la vista para mostrar el contenido correspondiente.
   * 
   * @param tab - Identificador de la pestaña seleccionada
   * 
   * @example
   * // Cuando el usuario hace clic en una pestaña
   * onTabSelected('gestionDatos');
   * 
   * @remarks
   * El método simplemente actualiza la propiedad selectedTab,
   * lo que activa el cambio de vista mediante ngSwitch o ngIf en la plantilla.
   */
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }
}
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Componente para incrustar y controlar un dashboard de Superset/Apache en un iframe.
 * 
 * Características principales:
 * - Carga dinámica con prevención de caché
 * - Ajuste automático de tamaño (responsive)
 * - Soporte para pantalla completa
 * - Manejo de errores y estados de carga
 * - Integración con parámetros nativos de Superset
 */
@Component({
  selector: 'app-consulta-dinamica',
  templateUrl: './consulta-dinamica.component.html',
  styleUrls: ['./consulta-dinamica.component.css']
})
export class ConsultaDinamicaComponent implements OnInit, AfterViewInit, OnDestroy {
  // Referencia al iframe que contiene el dashboard
  @ViewChild('dashboardIframe') iframe!: ElementRef<HTMLIFrameElement>;

  // Referencia al contenedor padre del iframe
  @ViewChild('dashboardContainer') container!: ElementRef<HTMLDivElement>;

  // Configuración de URL base y parámetros para Superset
  private readonly baseUrl = 'http://localhost/superset/dashboard/1/';
  private readonly urlParams = {
    native_filters_key: 'FQJrh8mZkCMHkCpQypf0Elfot1_usqt0KOXnIOkTBawwr_Xm3bjq-KDjcsCaC60P',
    standalone: 'true',       // Modo simplificado sin controles de Superset
    show_filters: '0',        // Oculta filtros
    show_title: '0',          // Oculta título
    show_edit_button: '0',    // Oculta botón de edición
    width: '100%',            // Ancho responsive
    height: '100%'            // Alto responsive
  };

  // Propiedades públicas del estado del componente
  dashboardUrl: SafeResourceUrl;  // URL sanitizada para el iframe
  isIframeLoaded = false;         // Bandera de carga completada
  isLoading = true;               // Bandera de carga en progreso
  hasError = false;               // Bandera de error
  errorMessage = '';              // Mensaje de error descriptivo
  lastLoadTime: Date | null = null; // Timestamp de última carga exitosa
  isFullscreen = false;           // Estado de pantalla completa

  private resizeObserver!: ResizeObserver; // Observer para cambios de tamaño

  /**
   * Constructor del componente
   * @param sanitizer Servicio para sanitizar URLs y prevenir XSS
   * @param snackBar Servicio para notificaciones toast
   */
  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {
    this.dashboardUrl = this.generateSafeUrl();
  }

  // === Ciclo de vida del componente ===

  ngOnInit(): void {
    this.initDashboard();
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.adjustIframeSize();
  }

  ngOnDestroy(): void {
    this.cleanupResources();
  }

  // === Métodos privados ===

  /**
   * Genera una URL sanitizada con los parámetros configurados
   * @returns SafeResourceUrl lista para usar en el iframe
   */
  private generateSafeUrl(): SafeResourceUrl {
    const params = new URLSearchParams(this.urlParams);
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.baseUrl}?${params.toString()}`
    );
  }

  /**
   * Configura el ResizeObserver para ajustes responsivos
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.adjustIframeSize();
    });
    this.resizeObserver.observe(this.container.nativeElement);
  }

  /**
   * Inicializa/reinicia el dashboard con nueva URL (evita caché)
   */
  private initDashboard(): void {
    this.isLoading = true;
    this.hasError = false;
    this.isIframeLoaded = false;

    const timestamp = new Date().getTime();
    const updatedUrl = `${this.baseUrl}?${new URLSearchParams({
      ...this.urlParams,
      t: timestamp.toString()
    }).toString()}`;

    this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(updatedUrl);
  }

  /**
   * Ajusta dinámicamente el tamaño del iframe según el contenedor
   */
  private adjustIframeSize(): void {
    requestAnimationFrame(() => {
      const container = this.container.nativeElement;
      const controlsHeight = 60; // Altura fija de controles UI

      this.iframe.nativeElement.style.height = this.isFullscreen
        ? `${window.innerHeight - controlsHeight}px`
        : `${container.clientHeight - controlsHeight}px`;
    });
  }

  /**
   * Fuerza el re-renderizado interno del dashboard Superset
   */
  private forceSupersetResize(): void {
    try {
      const iframeWindow = this.iframe.nativeElement.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage(
          {
            type: 'resize',
            height: this.iframe.nativeElement.clientHeight
          },
          { targetOrigin: '*' } // Cambiado de '*' a objeto
        );
      }
    } catch (e) {
      console.warn('No se pudo ajustar el tamaño interno del dashboard');
    }
  }

  /**
   * Limpia recursos (observer, fullscreen) al destruir el componente
   */
  private cleanupResources(): void {
    this.resizeObserver?.disconnect();
    this.exitFullscreen();
  }

  // === Métodos de pantalla completa ===

  /**
   * Alterna entre modo pantalla completa y normal
   */
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.isFullscreen ? this.enterFullscreen() : this.exitFullscreen();
  }

  private enterFullscreen(): void {
    const elem = this.container.nativeElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error('Error en pantalla completa:', err);
        this.isFullscreen = false;
      });
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  // === Event handlers ===

  /**
   * Maneja la carga exitosa del iframe
   */
  onIframeLoad(): void {
    this.isLoading = false;
    this.isIframeLoaded = true;
    this.lastLoadTime = new Date();
    this.hasError = false;

    // Ajustes finales después de la carga
    setTimeout(() => {
      this.adjustIframeSize();
      this.forceSupersetResize();
    }, 500);
  }

  /**
   * Maneja errores de carga del iframe
   */
  onIframeError(): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = 'Error al cargar el dashboard. Verifique su conexión.';
    this.isIframeLoaded = false;
  }

  // === Métodos públicos ===

  /**
   * Recarga el dashboard manualmente
   */
  refreshDashboard(): void {
    this.initDashboard();
    this.snackBar.open('Dashboard actualizado', 'Cerrar', { duration: 2000 });
  }

  /**
   * Abre el dashboard en una nueva pestaña
   */
  openInNewTab(): void {
    window.open(`${this.baseUrl}?${new URLSearchParams(this.urlParams).toString()}`, '_blank');
  }
}
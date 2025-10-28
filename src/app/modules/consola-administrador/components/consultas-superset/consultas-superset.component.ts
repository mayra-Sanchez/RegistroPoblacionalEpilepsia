import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-consultas-superset',
  templateUrl: './consultas-superset.component.html',
  styleUrls: ['./consultas-superset.component.css']
})
export class ConsultasSupersetComponent implements OnInit, AfterViewInit, OnDestroy {
   // Referencia al iframe que contiene el dashboard
  @ViewChild('dashboardIframe') iframe!: ElementRef<HTMLIFrameElement>;

  // Referencia al contenedor padre del iframe
  @ViewChild('dashboardContainer') container!: ElementRef<HTMLDivElement>;

  // Configuración específica para el dashboard de estadísticas (ID: 3)
  private readonly baseUrl = 'http://localhost:8088/superset/dashboard/3/';
  private readonly urlParams = {
    edit: 'true',
    native_filters_key: 'kcii-nGNa_-b4y7mwJaaPHG1wiB5Y6O7i1NjFh8sC_4XkPv-QBRUx721r5TUyjqQ',
    standalone: 'true',       // Modo simplificado sin controles de Superset
    show_filters: '1',        // Mostrar filtros (cambia a '0' para ocultar)
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

    // Nueva URL con timestamp para evitar caché
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
      if (this.iframe && this.iframe.nativeElement && this.container) {
        const container = this.container.nativeElement;
        const controlsHeight = 80; // Altura fija de controles UI

        this.iframe.nativeElement.style.height = this.isFullscreen
          ? `${window.innerHeight - controlsHeight}px`
          : `${container.clientHeight - controlsHeight}px`;
      }
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
          '*' // Target origin para Superset
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
        this.snackBar.open('Error al activar pantalla completa', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-error']
        });
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
    this.errorMessage = 'Error al cargar el dashboard de estadísticas. Verifique que Superset esté ejecutándose en el puerto 8088.';
    this.isIframeLoaded = false;
  }

  /**
   * Listener para cambios de estado en pantalla completa
   */
  @HostListener('document:fullscreenchange')
  private handleFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    this.adjustIframeSize();
    
    // Re-ajustar después del cambio de pantalla completa
    setTimeout(() => {
      this.adjustIframeSize();
      this.forceSupersetResize();
    }, 300);
  }

  // === Métodos públicos ===

  /**
   * Recarga el dashboard manualmente
   */
  refreshDashboard(): void {
    this.initDashboard();
    this.snackBar.open('Dashboard de estadísticas actualizado', 'Cerrar', { 
      duration: 2000,
      panelClass: ['snackbar-success']
    });
  }

  /**
   * Abre el dashboard en una nueva pestaña
   */
  openInNewTab(): void {
    window.open(`${this.baseUrl}?${new URLSearchParams(this.urlParams).toString()}`, '_blank');
  }
}
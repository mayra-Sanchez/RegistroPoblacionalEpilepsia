import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Componente para visualizar dashboards de Superset embebidos
 * 
 * Este componente permite mostrar dashboards de Apache Superset dentro de una aplicación Angular,
 * con funcionalidades como:
 * - Ajuste automático de tamaño
 * - Pantalla completa
 * - Recarga controlada
 * - Manejo de errores
 */
@Component({
  selector: 'app-consulta-datos',
  templateUrl: './consulta-datos.component.html',
  styleUrls: ['./consulta-datos.component.css']
})
export class ConsultaDatosComponent implements OnInit, AfterViewInit, OnDestroy {
  // Referencias a elementos del DOM
  @ViewChild('dashboardIframe') iframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('dashboardContainer') container!: ElementRef<HTMLDivElement>;
  
  // Configuración optimizada de URL para el dashboard de Superset
  private readonly baseUrl = 'http://localhost/superset/dashboard/1/';
  private readonly urlParams = {
    native_filters_key: 'FQJrh8mZkCMHkCpQypf0Elfot1_usqt0KOXnIOkTBawwr_Xm3bjq-KDjcsCaC60P',
    standalone: 'true',        // Modo standalone para ocultar controles de Superset
    show_filters: '0',        // Ocultar filtros
    show_title: '0',          // Ocultar título
    show_edit_button: '0',    // Ocultar botón de edición
    width: '100%',            // Ancho completo
    height: '100%'            // Alto completo
  };
  
  // Propiedades del estado del componente
  dashboardUrl: SafeResourceUrl;  // URL segura para el iframe
  isIframeLoaded = false;        // Indica si el iframe ha cargado
  isLoading = true;              // Estado de carga
  hasError = false;              // Indica si hay error
  errorMessage = '';             // Mensaje de error
  lastLoadTime: Date | null = null; // Último tiempo de carga
  isFullscreen = false;          // Estado de pantalla completa
  
  private resizeObserver!: ResizeObserver; // Observador de cambios de tamaño

  constructor(
    private sanitizer: DomSanitizer, // Para sanitizar URLs
    private snackBar: MatSnackBar   // Para mostrar notificaciones
  ) {
    // Genera la URL segura inicial
    this.dashboardUrl = this.generateSafeUrl();
  }

  /**
   * Método del ciclo de vida: Inicialización del componente
   */
  ngOnInit(): void {
    this.initDashboard();
  }

  /**
   * Método del ciclo de vida: Después de inicializar la vista
   */
  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.adjustIframeSize();
  }

  /**
   * Método del ciclo de vida: Destrucción del componente
   */
  ngOnDestroy(): void {
    this.cleanupResizeObserver();
    this.exitFullscreen();
  }

  /**
   * Genera una URL segura para el iframe con los parámetros configurados
   * @returns URL sanitizada
   */
  private generateSafeUrl(): SafeResourceUrl {
    const params = new URLSearchParams(this.urlParams);
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.baseUrl}?${params.toString()}`
    );
  }

  /**
   * Configura el observador de cambios de tamaño
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.adjustIframeSize();
    });
    this.resizeObserver.observe(this.container.nativeElement);
  }

  /**
   * Limpia el observador de cambios de tamaño
   */
  private cleanupResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Inicializa el dashboard con configuración fresca
   */
  private initDashboard(): void {
    this.isLoading = true;
    this.hasError = false;
    this.isIframeLoaded = false;
    
    // Nueva URL con timestamp para evitar caché
    const timestamp = new Date().getTime();
    const updatedUrl = `${this.baseUrl}?${new URLSearchParams({
      ...this.urlParams,
      t: timestamp.toString()  // Parámetro anti-caché
    }).toString()}`;
    
    this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(updatedUrl);
  }

  /**
   * Maneja el evento de carga del iframe
   */
  onIframeLoad(): void {
    this.isLoading = false;
    this.isIframeLoaded = true;
    this.lastLoadTime = new Date();
    this.hasError = false;
    
    // Ajustes post-carga con pequeño retraso para asegurar renderizado
    setTimeout(() => {
      this.adjustIframeSize();
      this.forceSupersetResize(); // Solución específica para Superset
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

  /**
   * Ajusta el tamaño del iframe según el contenedor
   */
  private adjustIframeSize(): void {
    requestAnimationFrame(() => {
      const container = this.container.nativeElement;
      const controlsHeight = 60; // Altura de controles en la interfaz
      
      if (this.isFullscreen) {
        // En pantalla completa usa el alto de la ventana
        this.iframe.nativeElement.style.height = `${window.innerHeight - controlsHeight}px`;
      } else {
        // En modo normal usa el alto del contenedor
        this.iframe.nativeElement.style.height = `${container.clientHeight - controlsHeight}px`;
      }
    });
  }

  /**
   * Fuerza un reajuste interno del dashboard Superset
   * Soluciona problemas conocidos de dimensionamiento en Superset embebido
   */
  private forceSupersetResize(): void {
    try {
      const iframeWindow = this.iframe.nativeElement.contentWindow;
      if (iframeWindow) {
        // Envía mensaje al iframe para forzar resize
        iframeWindow.postMessage({
          type: 'resize',
          height: this.iframe.nativeElement.clientHeight
        }, '*');
      }
    } catch (e) {
      console.warn('No se pudo ajustar el tamaño interno del dashboard');
    }
  }

  /**
   * Alterna entre modo pantalla completa y normal
   */
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    
    if (this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  /**
   * Activa el modo pantalla completa
   */
  private enterFullscreen(): void {
    const elem = this.container.nativeElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error('Error en pantalla completa:', err);
        this.isFullscreen = false;
      });
    }
  }

  /**
   * Sale del modo pantalla completa
   */
  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.error('Error al salir de pantalla completa:', err);
      });
    }
  }

  /**
   * Listener para cambios en el estado de pantalla completa
   */
  @HostListener('document:fullscreenchange')
  private handleFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    this.adjustIframeSize();
  }

  /**
   * Recarga el dashboard
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
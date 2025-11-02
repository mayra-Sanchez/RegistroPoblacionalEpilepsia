import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Componente para visualizar dashboards de Superset embebidos
 * 
 * Este componente permite mostrar dashboards de Apache Superset dentro de una aplicación Angular,
 * con funcionalidades como:
 * - Ajuste automático de tamaño
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

  // Configuración específica para el dashboard de pacientes (ID: 2)
  private readonly baseUrl = 'http://localhost:8088/superset/dashboard/2/';
  private readonly urlParams = {
    edit: 'true',
    native_filters_key: 'RGEGuUB_vw40u5Ph9mlXGRRC1tUYo1K0Y28nI5E_AljbC8VlxJnYs7rhs75AS4FC',
    standalone: 'true',        // Modo standalone para ocultar controles de Superset
    show_filters: '1',         // Mostrar filtros (puedes cambiar a '0' para ocultar)
    show_title: '0',           // Ocultar título
    show_edit_button: '0',     // Ocultar botón de edición
    width: '100%',             // Ancho completo
    height: '100%'             // Alto completo
  };

  // Propiedades del estado del componente
  dashboardUrl: SafeResourceUrl;
  isIframeLoaded = false;
  isLoading = true;
  hasError = false;
  errorMessage = '';
  lastLoadTime: Date | null = null;

  private resizeObserver!: ResizeObserver;

  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {
    this.dashboardUrl = this.generateSafeUrl();
  }

  ngOnInit(): void {
    this.initDashboard();
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.adjustIframeSize();
  }

  ngOnDestroy(): void {
    this.cleanupResizeObserver();
  }

  /**
   * Genera una URL segura para el iframe
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

    // Ajustes post-carga
    setTimeout(() => {
      this.adjustIframeSize();
    }, 500);
  }

  /**
   * Maneja errores de carga del iframe
   */
  onIframeError(): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = 'Error al cargar el dashboard de pacientes. Verifique que Superset esté ejecutándose en el puerto 8088.';
    this.isIframeLoaded = false;
  }

  /**
   * Ajusta el tamaño del iframe según el contenedor
   */
  private adjustIframeSize(): void {
    requestAnimationFrame(() => {
      if (this.iframe && this.iframe.nativeElement && this.container) {
        const container = this.container.nativeElement;
        const controlsHeight = 80; // Un poco más alto para el header
        const height = container.clientHeight - controlsHeight;
        
        this.iframe.nativeElement.style.height = `${Math.max(height, 400)}px`;
      }
    });
  }

  /**
   * Recarga el dashboard
   */
  refreshDashboard(): void {
    this.initDashboard();
    this.snackBar.open('Dashboard de pacientes actualizado', 'Cerrar', { 
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

  isFullscreen = false;

toggleFullscreen() {
  this.isFullscreen = !this.isFullscreen;
}
}
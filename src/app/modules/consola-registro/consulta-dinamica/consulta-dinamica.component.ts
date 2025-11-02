import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Componente para incrustar y controlar un dashboard de Superset/Apache en un iframe.
 * Versión simplificada sin funcionalidad de pantalla completa.
 */
@Component({
  selector: 'app-consulta-dinamica',
  templateUrl: './consulta-dinamica.component.html',
  styleUrls: ['./consulta-dinamica.component.css']
})
export class ConsultaDinamicaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dashboardIframe') iframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('dashboardContainer') container!: ElementRef<HTMLDivElement>;

  // URL específica de tu dashboard de doctores
  private readonly baseUrl = 'http://localhost:8088/superset/dashboard/1/';
  private readonly urlParams = {
    edit: 'true',
    native_filters_key: 'qzbPGgvzZ2hylP7A7xg88XrBNjsO28F3EHf4QACmis-hyj-3dc56xlDkqFkPNyvH',
    standalone: 'true',
    show_filters: '1',  // Puedes cambiar a '0' para ocultar filtros
    show_title: '0',
    show_edit_button: '0',
    width: '100%',
    height: '100%'
  };

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
    this.resizeObserver?.disconnect();
  }

  private generateSafeUrl(): SafeResourceUrl {
    const params = new URLSearchParams(this.urlParams);
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.baseUrl}?${params.toString()}`
    );
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.adjustIframeSize();
    });
    this.resizeObserver.observe(this.container.nativeElement);
  }

  private initDashboard(): void {
    this.isLoading = true;
    this.hasError = false;
    this.isIframeLoaded = false;

    // Agregar timestamp para evitar cache
    const timestamp = new Date().getTime();
    const updatedUrl = `${this.baseUrl}?${new URLSearchParams({
      ...this.urlParams,
      t: timestamp.toString()
    }).toString()}`;

    this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(updatedUrl);
  }

  private adjustIframeSize(): void {
    requestAnimationFrame(() => {
      const container = this.container.nativeElement;
      const controlsHeight = 60;

      if (this.iframe && this.iframe.nativeElement) {
        this.iframe.nativeElement.style.height =
          `${container.clientHeight - controlsHeight}px`;
      }
    });
  }

  onIframeLoad(): void {
    this.isLoading = false;
    this.isIframeLoaded = true;
    this.lastLoadTime = new Date();
    this.hasError = false;

    setTimeout(() => {
      this.adjustIframeSize();
    }, 500);
  }

  onIframeError(): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = 'Error al cargar el dashboard de doctores. Verifique que Superset esté ejecutándose.';
    this.isIframeLoaded = false;
  }

  refreshDashboard(): void {
    this.initDashboard();
    this.snackBar.open('Dashboard de doctores actualizado', 'Cerrar', {
      duration: 2000,
      panelClass: ['snackbar-success']
    });
  }

  openInNewTab(): void {
    window.open(`${this.baseUrl}?${new URLSearchParams(this.urlParams).toString()}`, '_blank');
  }

  isFullscreen = false;

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

}
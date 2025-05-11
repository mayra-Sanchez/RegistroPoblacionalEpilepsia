import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-consulta-dinamica',
  templateUrl: './consulta-dinamica.component.html',
  styleUrls: ['./consulta-dinamica.component.css']
})
export class ConsultaDinamicaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dashboardIframe') iframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('dashboardContainer') container!: ElementRef<HTMLDivElement>;
  
  // Configuración optimizada de URL
  private readonly baseUrl = 'http://localhost/superset/dashboard/1/';
  private readonly urlParams = {
    native_filters_key: 'FQJrh8mZkCMHkCpQypf0Elfot1_usqt0KOXnIOkTBawwr_Xm3bjq-KDjcsCaC60P',
    standalone: 'true',
    show_filters: '0',
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
  isFullscreen = false;
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
    this.exitFullscreen();
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
    
    // Nueva URL con timestamp para evitar caché
    const timestamp = new Date().getTime();
    const updatedUrl = `${this.baseUrl}?${new URLSearchParams({
      ...this.urlParams,
      t: timestamp.toString()
    }).toString()}`;
    
    this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(updatedUrl);
  }

  onIframeLoad(): void {
    this.isLoading = false;
    this.isIframeLoaded = true;
    this.lastLoadTime = new Date();
    this.hasError = false;
    
    // Ajuste final después de la carga
    setTimeout(() => {
      this.adjustIframeSize();
      this.forceSupersetResize();
    }, 500);
  }

  onIframeError(): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = 'Error al cargar el dashboard. Verifique su conexión.';
    this.isIframeLoaded = false;
  }

  private adjustIframeSize(): void {
    requestAnimationFrame(() => {
      const container = this.container.nativeElement;
      const controlsHeight = 60; // Altura de controles
      
      if (this.isFullscreen) {
        this.iframe.nativeElement.style.height = `${window.innerHeight - controlsHeight}px`;
      } else {
        this.iframe.nativeElement.style.height = `${container.clientHeight - controlsHeight}px`;
      }
    });
  }

  private forceSupersetResize(): void {
    // Solución definitiva para el problema de tamaño en Superset
    try {
      const iframeWindow = this.iframe.nativeElement.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({
          type: 'resize',
          height: this.iframe.nativeElement.clientHeight
        }, '*');
      }
    } catch (e) {
      console.warn('No se pudo ajustar el tamaño interno del dashboard');
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    
    if (this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
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
      document.exitFullscreen().catch(err => {
        console.error('Error al salir de pantalla completa:', err);
      });
    }
  }

  @HostListener('document:fullscreenchange')
  private handleFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    this.adjustIframeSize();
  }

  refreshDashboard(): void {
    this.initDashboard();
    this.snackBar.open('Dashboard actualizado', 'Cerrar', { duration: 2000 });
  }

  openInNewTab(): void {
    window.open(`${this.baseUrl}?${new URLSearchParams(this.urlParams).toString()}`, '_blank');
  }
}
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ConsultaDinamicaComponent } from './consulta-dinamica.component';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ElementRef } from '@angular/core';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

// Mock para DomSanitizer
class MockDomSanitizer {
  bypassSecurityTrustResourceUrl(url: string) {
    return url as any;
  }
}

// Mock para MatSnackBar
class MockMatSnackBar {
  open(message: string, action: string, config: any) {
    return { message, action, config };
  }
}

// Mock para ElementRef
class MockElementRef implements ElementRef {
  nativeElement = {
    style: { height: '' },
    clientHeight: 500,
    requestFullscreen: jasmine.createSpy('requestFullscreen').and.returnValue(Promise.resolve()),
    contentWindow: {
      postMessage: jasmine.createSpy('postMessage')
    }
  };
}

describe('ConsultaDinamicaComponent', () => {
  let component: ConsultaDinamicaComponent;
  let fixture: ComponentFixture<ConsultaDinamicaComponent>;
  let sanitizer: MockDomSanitizer;
  let snackBar: MockMatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsultaDinamicaComponent],
      providers: [
        { provide: DomSanitizer, useClass: MockDomSanitizer },
        { provide: MatSnackBar, useClass: MockMatSnackBar }
      ],
      imports: [BrowserDynamicTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaDinamicaComponent);
    component = fixture.componentInstance;
    sanitizer = TestBed.inject(DomSanitizer) as any;
    snackBar = TestBed.inject(MatSnackBar) as any;

    // Mock ViewChild references
    component.iframe = new MockElementRef() as any;
    component.container = new MockElementRef() as any;

    // Mock ResizeObserver
    spyOn(window, 'ResizeObserver').and.callFake((callback: any) => {
      return {
        observe: jasmine.createSpy('observe'),
        disconnect: jasmine.createSpy('disconnect')
      } as any;
    });
  });

  // Pruebas de inicialización
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default properties', () => {
    expect(component.isIframeLoaded).toBeFalse();
    expect(component.isLoading).toBeTrue();
    expect(component.hasError).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(component.isFullscreen).toBeFalse();
    expect(component.lastLoadTime).toBeNull();
  });

  // Pruebas del ciclo de vida
  describe('ngOnInit', () => {
    it('should call initDashboard on initialization', () => {
      spyOn(component as any, 'initDashboard');
      component.ngOnInit();
      expect((component as any).initDashboard).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call setupResizeObserver and adjustIframeSize', () => {
      spyOn(component as any, 'setupResizeObserver');
      spyOn(component as any, 'adjustIframeSize');
      component.ngAfterViewInit();
      expect((component as any).setupResizeObserver).toHaveBeenCalled();
      expect((component as any).adjustIframeSize).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should call cleanupResources', () => {
      spyOn(component as any, 'cleanupResources');
      component.ngOnDestroy();
      expect((component as any).cleanupResources).toHaveBeenCalled();
    });
  });

  // Pruebas de métodos privados
  describe('generateSafeUrl', () => {
    it('should generate a sanitized URL with parameters', () => {
      const url = component['generateSafeUrl']();
      expect(url).toContain('http://localhost/superset/dashboard/1/');
      expect(url).toContain('native_filters_key');
      expect(url).toContain('standalone=true');
    });
  });

  describe('setupResizeObserver', () => {
    it('should initialize ResizeObserver and observe container', () => {
      component['setupResizeObserver']();
      expect(window.ResizeObserver).toHaveBeenCalled();
      expect(component['resizeObserver'].observe).toHaveBeenCalledWith(component.container.nativeElement);
    });
  });

  describe('initDashboard', () => {
    it('should reset state and update dashboardUrl with timestamp', () => {
      spyOn(Date.prototype, 'getTime').and.returnValue(123456789);
      component['initDashboard']();
      expect(component.isLoading).toBeTrue();
      expect(component.hasError).toBeFalse();
      expect(component.isIframeLoaded).toBeFalse();
      expect(component.dashboardUrl).toContain('t=123456789');
    });
  });

  describe('adjustIframeSize', () => {
    it('should adjust iframe height in normal mode', fakeAsync(() => {
      component.isFullscreen = false;
      component['adjustIframeSize']();
      tick();
      expect(component.iframe.nativeElement.style.height).toBe('440px'); // 500 - 60
    }));

    it('should adjust iframe height in fullscreen mode', fakeAsync(() => {
      spyOnProperty(window, 'innerHeight').and.returnValue(1000);
      component.isFullscreen = true;
      component['adjustIframeSize']();
      tick();
      expect(component.iframe.nativeElement.style.height).toBe('940px'); // 1000 - 60
    }));
  });

  describe('forceSupersetResize', () => {
    it('should post message to iframe contentWindow', () => {
      component['forceSupersetResize']();
      expect(component.iframe.nativeElement.contentWindow?.postMessage).toHaveBeenCalledWith(
        { type: 'resize', height: 500 },
        { targetOrigin: '*' }
      );
    });

    it('should handle error gracefully', () => {
      spyOn(console, 'warn');
      spyOnProperty(component.iframe.nativeElement, 'contentWindow').and.returnValue(null);
      component['forceSupersetResize']();
      expect(console.warn).toHaveBeenCalledWith('No se pudo ajustar el tamaño interno del dashboard');
    });
  });

  describe('cleanupResources', () => {
    it('should disconnect ResizeObserver and exit fullscreen', () => {
      spyOn(component as any, 'exitFullscreen');
      component['cleanupResources']();
      expect(component['resizeObserver'].disconnect).toHaveBeenCalled();
      expect((component as any).exitFullscreen).toHaveBeenCalled();
    });
  });

  // Pruebas de pantalla completa
  describe('toggleFullscreen', () => {
    it('should toggle fullscreen state and call enterFullscreen', () => {
      spyOn(component as any, 'enterFullscreen');
      component.toggleFullscreen();
      expect(component.isFullscreen).toBeTrue();
      expect((component as any).enterFullscreen).toHaveBeenCalled();
    });

    it('should toggle fullscreen state and call exitFullscreen', () => {
      component.isFullscreen = true;
      spyOn(component as any, 'exitFullscreen');
      component.toggleFullscreen();
      expect(component.isFullscreen).toBeFalse();
      expect((component as any).exitFullscreen).toHaveBeenCalled();
    });
  });

  describe('enterFullscreen', () => {
    it('should request fullscreen and handle error', async () => {
      component.container.nativeElement.requestFullscreen = jasmine.createSpy('requestFullscreen').and.returnValue(Promise.reject('Error'));
      spyOn(console, 'error');
      await component['enterFullscreen']();
      expect(console.error).toHaveBeenCalledWith('Error en pantalla completa:', 'Error');
      expect(component.isFullscreen).toBeFalse();
    });
  });

  describe('exitFullscreen', () => {
    it('should call document.exitFullscreen', () => {
      spyOn(document, 'exitFullscreen');
      component['exitFullscreen']();
      expect(document.exitFullscreen).toHaveBeenCalled();
    });
  });

  // Pruebas de eventos
  describe('onIframeLoad', () => {
    it('should update state on successful iframe load', fakeAsync(() => {
      spyOn(component as any, 'adjustIframeSize');
      spyOn(component as any, 'forceSupersetResize');
      component.onIframeLoad();
      expect(component.isLoading).toBeFalse();
      expect(component.isIframeLoaded).toBeTrue();
      expect(component.hasError).toBeFalse();
      expect(component.lastLoadTime).toBeInstanceOf(Date);
      tick(500);
      expect((component as any).adjustIframeSize).toHaveBeenCalled();
      expect((component as any).forceSupersetResize).toHaveBeenCalled();
    }));
  });

  describe('onIframeError', () => {
    it('should update state on iframe error', () => {
      component.onIframeError();
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Error al cargar el dashboard. Verifique su conexión.');
      expect(component.isIframeLoaded).toBeFalse();
    });
  });

  describe('handleFullscreenChange', () => {
    it('should update isFullscreen based on document.fullscreenElement', () => {
      spyOnProperty(document, 'fullscreenElement').and.returnValue({} as any);
      component['handleFullscreenChange']();
      expect(component.isFullscreen).toBeTrue();
      expect((component as any).adjustIframeSize).toHaveBeenCalled();
    });
  });

  // Pruebas de métodos públicos
  describe('refreshDashboard', () => {
    it('should call initDashboard and show snackbar', () => {
      spyOn(component as any, 'initDashboard');
      spyOn(snackBar, 'open').and.callThrough();
      component.refreshDashboard();
      expect((component as any).initDashboard).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Dashboard actualizado', 'Cerrar', { duration: 2000 });
    });
  });

  describe('openInNewTab', () => {
    it('should open dashboard in new tab', () => {
      spyOn(window, 'open');
      component.openInNewTab();
      expect(window.open).toHaveBeenCalledWith(
        jasmine.stringMatching('http://localhost/superset/dashboard/1/.*standalone=true'),
        '_blank'
      );
    });
  });
});
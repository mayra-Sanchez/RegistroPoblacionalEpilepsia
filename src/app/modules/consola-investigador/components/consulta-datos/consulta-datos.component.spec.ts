import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ConsultaDatosComponent } from './consulta-datos.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';

class MockDomSanitizer {
  bypassSecurityTrustResourceUrl(url: string): SafeResourceUrl {
    return url as unknown as SafeResourceUrl;
  }
}

describe('ConsultaDatosComponent', () => {
  let component: ConsultaDatosComponent;
  let fixture: ComponentFixture<ConsultaDatosComponent>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  // Create mock objects with proper typing
  const createMockWindow = (): Window => {
    return {
      postMessage: jasmine.createSpy('postMessage'),
      innerHeight: 1000,
      document: {} as Document,
      location: {} as Location,
    } as unknown as Window;
  };

  const createMockDivElement = (): HTMLDivElement => {
    const mock = {
      style: {} as CSSStyleDeclaration,
      clientHeight: 500,
      requestFullscreen: jasmine.createSpy('requestFullscreen'),
      addEventListener: jasmine.createSpy('addEventListener'),
    };
    return mock as unknown as HTMLDivElement;
  };

  const createMockIframeElement = (contentWindow: Window | null): HTMLIFrameElement => {
    const mock = {
      style: {} as CSSStyleDeclaration,
      contentWindow,
      clientHeight: 500,
      src: '',
    };
    return mock as unknown as HTMLIFrameElement;
  };

  beforeEach(async () => {
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [ConsultaDatosComponent],
      providers: [
        { provide: DomSanitizer, useClass: MockDomSanitizer },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaDatosComponent);
    component = fixture.componentInstance;

    // Initialize with mock elements
    const mockWindow = createMockWindow();
    component.iframe = {
      nativeElement: createMockIframeElement(mockWindow)
    };
    component.container = {
      nativeElement: createMockDivElement()
    };

    // Complete ResizeObserver mock
    (window as any).ResizeObserver = class MockResizeObserver {
      observe = jasmine.createSpy('observe');
      unobserve = jasmine.createSpy('unobserve');
      disconnect = jasmine.createSpy('disconnect');
      constructor(private callback: ResizeObserverCallback) {}
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isLoading).toBeTrue();
    expect(component.hasError).toBeFalse();
    expect(component.isIframeLoaded).toBeFalse();
    expect(component.isFullscreen).toBeFalse();
  });

  it('should generate safe URL on init', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    spyOn(sanitizer, 'bypassSecurityTrustResourceUrl').and.callThrough();
    
    component.ngOnInit();
    
    expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalled();
    expect(component.dashboardUrl).toBeDefined();
  });

  it('should handle iframe load event', fakeAsync(() => {
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

  it('should handle iframe error event', () => {
    component.onIframeError();
    
    expect(component.isLoading).toBeFalse();
    expect(component.isIframeLoaded).toBeFalse();
    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toBe('Error al cargar el dashboard. Verifique su conexión.');
  });

  it('should refresh dashboard', () => {
    spyOn(component as any, 'initDashboard');
    component.refreshDashboard();
    
    expect((component as any).initDashboard).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Dashboard actualizado', 'Cerrar', { duration: 2000 });
  });

  it('should toggle fullscreen mode', () => {
    spyOn(component as any, 'enterFullscreen');
    spyOn(component as any, 'exitFullscreen');
    
    component.toggleFullscreen();
    expect((component as any).enterFullscreen).toHaveBeenCalled();
    
    component.isFullscreen = true;
    component.toggleFullscreen();
    expect((component as any).exitFullscreen).toHaveBeenCalled();
  });

it('should adjust iframe size in fullscreen', fakeAsync(() => {
    // Mock window.innerHeight
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1000);
    
    // Create a complete style mock
    const mockStyle = {
      height: '',
      setProperty: jasmine.createSpy('setProperty'),
      // Add all required properties from CSSStyleDeclaration
      // We cast to unknown first to avoid TypeScript errors
    } as unknown as CSSStyleDeclaration;
    
    // Replace the iframe mock
    component.iframe = {
      nativeElement: {
        ...createMockIframeElement(createMockWindow()),
        style: mockStyle,
        clientHeight: 500
      }
    };
    
    component.isFullscreen = true;
    
    (component as any).adjustIframeSize();
    tick();
    
    // Check the style was set correctly
    expect((mockStyle as any).height).toBe('940px');
  }));


  it('should force Superset resize', () => {
    (component as any).forceSupersetResize();
    
    expect(component.iframe.nativeElement.contentWindow?.postMessage).toHaveBeenCalledWith(
      { type: 'resize', height: 500 },
      '*'
    );
  });

  it('should handle Superset resize error', () => {
    // Create a new iframe with null contentWindow for this test
    const iframeWithNullWindow = {
      nativeElement: {
        ...createMockIframeElement(null),
        contentWindow: null // Explicitly set to null
      }
    };
    const originalIframe = component.iframe;
    component.iframe = iframeWithNullWindow;
    
    const consoleWarnSpy = spyOn(console, 'warn');
    
    try {
      (component as any).forceSupersetResize();
      expect(consoleWarnSpy).toHaveBeenCalledWith('No se pudo ajustar el tamaño interno del dashboard');
    } finally {
      // Restore original iframe
      component.iframe = originalIframe;
    }
  });


  it('should clean up on destroy', () => {
    spyOn(component as any, 'exitFullscreen');
    component['resizeObserver'] = new (window as any).ResizeObserver(() => {});
    
    component.ngOnDestroy();
    
    expect(component['resizeObserver'].disconnect).toHaveBeenCalled();
    expect((component as any).exitFullscreen).toHaveBeenCalled();
  });

  it('should open dashboard in new tab', () => {
    const windowOpenSpy = spyOn(window, 'open').and.callThrough();
    component.openInNewTab();
    
    expect(windowOpenSpy).toHaveBeenCalled();
    expect(windowOpenSpy.calls.mostRecent().args[0]).toContain('http://localhost/superset/dashboard/1/');
  });
});
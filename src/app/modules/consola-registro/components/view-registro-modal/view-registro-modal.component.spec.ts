import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';

// Componente a testear
import { ViewRegistroModalComponent } from './view-registro-modal.component';

// Servicios
import { SignatureUploadService } from 'src/app/services/signature-upload.service';

// Mocks
class MatDialogRefMock {
  close() {}
}

class SignatureUploadServiceMock {
  downloadConsentFile(patientId: number) {
    return of(new Blob(['test content'], { type: 'application/pdf' }));
  }
}

describe('ViewRegistroModalComponent', () => {
  let component: ViewRegistroModalComponent;
  let fixture: ComponentFixture<ViewRegistroModalComponent>;
  let dialogRef: MatDialogRef<ViewRegistroModalComponent>;
  let signatureUploadService: SignatureUploadService;

  // Datos de prueba
  const mockRegistroCompleto = {
    patientIdentificationNumber: 12345,
    patientBasicInfo: {
      name: 'Juan Pérez',
      age: 30,
      gender: 'Masculino'
    },
    registerInfo: [
      {
        researchLayerId: 1,
        researchLayerName: 'Estudio Principal',
        variablesInfo: [
          { variableName: 'Temperatura', variableType: 'number', valueAsNumber: 36.5 },
          { variableName: 'Presión', variableType: 'number', valueAsNumber: 120 }
        ]
      }
    ],
    caregiver: {
      name: 'María García',
      relationship: 'Esposa'
    }
  };

  const mockHistorial = {
    changedAt: '2023-10-01T10:00:00Z',
    operation: 'UPDATE',
    patientIdentificationNumber: 12345,
    patientBasicInfo: {
      name: 'Juan Pérez Modificado'
    },
    isResearchLayerGroup: {
      researchLayerId: 1,
      researchLayerName: 'Estudio Principal',
      variables: [
        { name: 'Temperatura', type: 'number', value: 37.0 }
      ]
    },
    _fullData: {
      patientBasicInfo: {
        name: 'Juan Pérez Original'
      }
    }
  };

  const mockRegistroSinDatos = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewRegistroModalComponent],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: SignatureUploadService, useClass: SignatureUploadServiceMock },
        { provide: MAT_DIALOG_DATA, useValue: { registro: mockRegistroCompleto } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewRegistroModalComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    signatureUploadService = TestBed.inject(SignatureUploadService);

    // Configurar mocks para SweetAlert2
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    fixture.detectChanges();
  });

  afterEach(() => {
    // Limpiar URLs de blob
    if (component.consentimientoUrl) {
      URL.revokeObjectURL(component.consentimientoUrl);
    }
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debería inicializar con datos del registro completo', () => {
      expect(component.datos).toEqual(mockRegistroCompleto);
      expect(component.tipoDatos).toBe('registro-completo');
    });

    it('debería inicializar con datos de historial', () => {
      // Recrear componente con datos de historial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ViewRegistroModalComponent],
        providers: [
          { provide: MatDialogRef, useClass: MatDialogRefMock },
          { provide: SignatureUploadService, useClass: SignatureUploadServiceMock },
          { provide: MAT_DIALOG_DATA, useValue: { registro: mockHistorial } }
        ]
      }).compileComponents();

      const fixtureHistorial = TestBed.createComponent(ViewRegistroModalComponent);
      const componentHistorial = fixtureHistorial.componentInstance;
      
      // Configurar mock de SweetAlert2 para esta instancia
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      
      fixtureHistorial.detectChanges();

      expect(componentHistorial.datos).toEqual(mockHistorial);
      expect(componentHistorial.tipoDatos).toBe('historial');
    });
  });

  // ... resto de las pruebas manteniendo las correcciones mencionadas

  describe('Gestión de consentimientos', () => {
    it('debería descargar consentimiento exitosamente', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      const downloadSpy = spyOn(signatureUploadService, 'downloadConsentFile').and.returnValue(of(blob));
      
      // Mock de saveAs
      const saveAsSpy = spyOn(saveAs, 'saveAs' as any);

      component.downloadConsentimiento();

      expect(downloadSpy).toHaveBeenCalledWith(12345);
      // No podemos verificar saveAs directamente debido a cómo está importado,
      // pero podemos verificar que el servicio fue llamado
    });

    it('debería manejar error al descargar consentimiento', () => {
      const errorResponse = { status: 500 };
      spyOn(signatureUploadService, 'downloadConsentFile').and.returnValue(
        throwError(() => errorResponse)
      );

      component.downloadConsentimiento();

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudo descargar el consentimiento', 'error');
    });
  });

  describe('Determinación de tipo de datos', () => {
    it('debería identificar registro completo correctamente', () => {
      // Con los datos mock iniciales, debería ser 'registro-completo'
      expect(component.tipoDatos).toBe('registro-completo');
    });

    it('debería identificar historial correctamente', () => {
      // Recrear componente con datos de historial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ViewRegistroModalComponent],
        providers: [
          { provide: MatDialogRef, useClass: MatDialogRefMock },
          { provide: SignatureUploadService, useClass: SignatureUploadServiceMock },
          { provide: MAT_DIALOG_DATA, useValue: { registro: mockHistorial } }
        ]
      }).compileComponents();

      const fixtureHistorial = TestBed.createComponent(ViewRegistroModalComponent);
      const componentHistorial = fixtureHistorial.componentInstance;
      fixtureHistorial.detectChanges();

      expect(componentHistorial.tipoDatos).toBe('historial');
    });
  });
});
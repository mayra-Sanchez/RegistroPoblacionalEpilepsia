import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

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

    fixture.detectChanges();
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
      fixtureHistorial.detectChanges();

      expect(componentHistorial.datos).toEqual(mockHistorial);
      expect(componentHistorial.tipoDatos).toBe('historial');
    });

    it('debería manejar registro sin datos', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ViewRegistroModalComponent],
        providers: [
          { provide: MatDialogRef, useClass: MatDialogRefMock },
          { provide: SignatureUploadService, useClass: SignatureUploadServiceMock },
          { provide: MAT_DIALOG_DATA, useValue: { registro: mockRegistroSinDatos } }
        ]
      }).compileComponents();

      const fixtureSinDatos = TestBed.createComponent(ViewRegistroModalComponent);
      const componentSinDatos = fixtureSinDatos.componentInstance;
      fixtureSinDatos.detectChanges();

      expect(componentSinDatos.datos).toEqual({});
      expect(componentSinDatos.tipoDatos).toBe('historial');
    });
  });

  describe('Métodos de obtención de datos', () => {
    it('debería obtener patientId correctamente', () => {
      expect(component.getPatientId()).toBe(12345);
    });

    it('debería obtener información básica del paciente', () => {
      const basicInfo = component.getPatientBasicInfo();
      expect(basicInfo).toEqual(mockRegistroCompleto.patientBasicInfo);
    });

    it('debería obtener variables de investigación', () => {
      const variables = component.getVariables();
      expect(variables.length).toBe(2);
      expect(variables[0].variableName).toBe('Temperatura');
    });

    it('debería obtener información de la capa', () => {
      const layerInfo = component.getLayerInfo();
      expect(layerInfo.researchLayerId).toBe(1);
      expect(layerInfo.researchLayerName).toBe('Estudio Principal');
    });

    it('debería obtener información del cuidador', () => {
      const caregiver = component.getCaregiver();
      expect(caregiver.name).toBe('María García');
    });

    it('debería obtener nombre de variable', () => {
      const variable = { variableName: 'Test Var', variableType: 'string' };
      expect(component.getVariableName(variable)).toBe('Test Var');
    });

    it('debería obtener tipo de variable', () => {
      const variable = { variableName: 'Test Var', variableType: 'string' };
      expect(component.getVariableType(variable)).toBe('string');
    });
  });

  describe('Métodos de navegación y UI', () => {
    it('debería cerrar el modal', () => {
      const closeSpy = spyOn(dialogRef, 'close');
      component.onClose();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('debería cambiar pestaña activa', () => {
      component.setActiveTab('variables');
      expect(component.activeTab).toBe('variables');
    });

    it('debería verificar si pestaña está activa', () => {
      component.setActiveTab('basic');
      expect(component.isTabActive('basic')).toBeTrue();
      expect(component.isTabActive('variables')).toBeFalse();
    });
  });

  describe('Métodos de formateo de datos', () => {
    it('debería formatear fecha correctamente', () => {
      expect(component.formatDate('2023-10-01')).toContain('10/01/2023');
      expect(component.formatDate(null)).toBe('No disponible');
      expect(component.formatDate('fecha-invalida')).toBe('Fecha inválida');
    });

    it('debería formatear valor de variable', () => {
      const variableNumber = { valueAsNumber: 42 };
      const variableString = { valueAsString: 'texto' };
      const variableValue = { value: 'valor' };
      const variableEmpty = {};

      expect(component.formatVariableValue(variableNumber)).toBe('42');
      expect(component.formatVariableValue(variableString)).toBe('texto');
      expect(component.formatVariableValue(variableValue)).toBe('valor');
      expect(component.formatVariableValue(variableEmpty)).toBe('No definido');
    });

    it('debería obtener valor seguro', () => {
      expect(component.getSafeValue('test')).toBe('test');
      expect(component.getSafeValue(null)).toBe('No disponible');
      expect(component.getSafeValue(undefined)).toBe('No disponible');
      expect(component.getSafeValue(0)).toBe(0);
      expect(component.getSafeValue('', 'valor por defecto')).toBe('');
    });
  });

  describe('Métodos de validación', () => {
    it('debería verificar si tiene datos de cuidador', () => {
      expect(component.hasCaregiverData()).toBeTrue();
    });

    it('debería verificar si información básica está vacía', () => {
      expect(component.isPatientBasicInfoEmpty()).toBeFalse();
    });
  });

  describe('Gestión de consentimientos', () => {
    beforeEach(() => {
      // Espías para SweetAlert2
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    });

    it('debería verificar consentimiento exitosamente', () => {
      const downloadSpy = spyOn(signatureUploadService, 'downloadConsentFile').and.returnValue(
        of(new Blob(['test'], { type: 'application/pdf' }))
      );

      component.checkConsentimiento();

      expect(downloadSpy).toHaveBeenCalledWith(12345);
      expect(component.hasConsentimiento).toBeTrue();
      expect(component.consentimientoUrl).toContain('blob:');
    });

    it('debería manejar error 404 al verificar consentimiento', () => {
      const errorResponse = { status: 404 };
      const downloadSpy = spyOn(signatureUploadService, 'downloadConsentFile').and.returnValue(
        throwError(() => errorResponse)
      );

      component.checkConsentimiento();

      expect(downloadSpy).toHaveBeenCalled();
      expect(component.hasConsentimiento).toBeFalse();
      expect(component.consentimientoUrl).toBeNull();
    });

    it('debería manejar error genérico al verificar consentimiento', () => {
      const errorResponse = { status: 500 };
      const downloadSpy = spyOn(signatureUploadService, 'downloadConsentFile').and.returnValue(
        throwError(() => errorResponse)
      );

      component.checkConsentimiento();

      expect(downloadSpy).toHaveBeenCalled();
      expect(component.hasConsentimiento).toBeFalse();
    });

    it('debería descargar consentimiento exitosamente', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      spyOn(signatureUploadService, 'downloadConsentFile').and.returnValue(of(blob));
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test-url');
      
      // Espía para file-saver
      const saveAsSpy = jasmine.createSpy('saveAs');

      component.consentimientoUrl = 'blob:test-url';
      component.downloadConsentimiento();

      expect(signatureUploadService.downloadConsentFile).toHaveBeenCalledWith(12345);
    });

    it('debería manejar error al descargar consentimiento', () => {
      const errorResponse = { status: 500 };
      spyOn(signatureUploadService, 'downloadConsentFile').and.returnValue(
        throwError(() => errorResponse)
      );

      component.consentimientoUrl = 'blob:test-url';
      component.downloadConsentimiento();

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudo descargar el consentimiento', 'error');
    });

    it('debería abrir consentimiento en nueva pestaña', () => {
      const windowOpenSpy = spyOn(window, 'open');
      component.consentimientoUrl = 'blob:test-url';
      
      component.viewConsentimiento();

      expect(windowOpenSpy).toHaveBeenCalledWith('blob:test-url', '_blank');
    });

    it('debería verificar si tiene cuidador', () => {
      expect(component.hasCaregiver()).toBeTrue();
    });
  });

  describe('Determinación de tipo de datos', () => {
    it('debería identificar registro completo correctamente', () => {
      const tipo = component['determinarTipoDatos']();
      expect(tipo).toBe('registro-completo');
    });

    it('debería identificar historial correctamente', () => {
      // Modificar datos para que sean de historial
      component.datos = mockHistorial;
      const tipo = component['determinarTipoDatos']();
      expect(tipo).toBe('historial');
    });
  });

  describe('Comportamiento con datos incompletos', () => {
    it('debería manejar patientId nulo', () => {
      component.datos.patientIdentificationNumber = null;
      expect(component.getPatientId()).toBeNull();
    });

    it('debería manejar información básica vacía', () => {
      component.datos.patientBasicInfo = {};
      const basicInfo = component.getPatientBasicInfo();
      expect(basicInfo).toEqual({});
    });

    it('debería manejar variables vacías', () => {
      component.datos.registerInfo[0].variablesInfo = [];
      const variables = component.getVariables();
      expect(variables).toEqual([]);
    });
  });
});
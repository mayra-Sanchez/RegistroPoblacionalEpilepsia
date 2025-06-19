import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { GraficasInicioComponent } from './graficas-inicio.component';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Register } from '../../../consola-registro/interfaces';

// Define a local type for testing since we can't import ResearchLayer
type TestResearchLayer = {
  id: string;
  layerName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  layerBoss: {
    id: number;
    name: string;
    identificationNumber: string;
  };
};

// Mock Data
const mockRegisters: Register[] = [
  {
    registerId: '1',
    registerDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updateRegisterDate: null,
    patientIdentificationNumber: 123456789,
    patientIdentificationType: 'CC',
    variablesRegister: [],
    patientBasicInfo: {
      name: 'Paciente 1',
      sex: 'masculino',
      birthDate: null,
      age: 30,
      email: 'paciente1@test.com',
      phoneNumber: '123456789',
      deathDate: null,
      economicStatus: 'medio',
      educationLevel: 'universitario',
      maritalStatus: 'casado',
      hometown: 'Medellín',
      currentCity: 'Bogotá',
      firstCrisisDate: '2020-01-01',
      crisisStatus: 'activa',
      hasCaregiver: true
    },
    caregiver: {
      name: 'Cuidador 1',
      identificationType: 'CC',
      identificationNumber: 987654321,
      age: 45,
      educationLevel: 'universitario',
      occupation: 'Enfermero'
    },
    healthProfessional: {
      id: '1',
      name: 'Profesional 1',
      identificationNumber: 111111111
    }
  },
  {
    registerId: '2',
    registerDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updateRegisterDate: null,
    patientIdentificationNumber: 987654321,
    patientIdentificationType: 'CC',
    variablesRegister: [],
    patientBasicInfo: {
      name: 'Paciente 2',
      sex: 'femenino',
      birthDate: null,
      age: 25,
      email: 'paciente2@test.com',
      phoneNumber: '987654321',
      deathDate: null,
      economicStatus: 'bajo',
      educationLevel: 'secundaria',
      maritalStatus: 'soltero',
      hometown: 'Bogotá',
      currentCity: 'Cali',
      firstCrisisDate: '2021-01-01',
      crisisStatus: 'inactiva',
      hasCaregiver: false
    },
    caregiver: null,
    healthProfessional: {
      id: '2',
      name: 'Profesional 2',
      identificationNumber: 222222222
    }
  }
];

const mockResearchLayer: TestResearchLayer = {
  id: 'layer1',
  layerName: 'Capa de Prueba',
  description: 'Descripción de prueba',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  layerBoss: {
    id: 1,
    name: 'Jefe de Capa',
    identificationNumber: '123456789'
  }
};

describe('GraficasInicioComponent', () => {
  let component: GraficasInicioComponent;
  let fixture: ComponentFixture<GraficasInicioComponent>;
  let mockRegisterService: jasmine.SpyObj<ConsolaRegistroService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(waitForAsync(() => {
    mockRegisterService = jasmine.createSpyObj('ConsolaRegistroService', [
      'obtenerCapaPorId',
      'obtenerRegistrosPorCapa'
    ]);

    mockAuthService = jasmine.createSpyObj('AuthService', [
      'getCurrentUserResearchLayer'
    ]);

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      declarations: [GraficasInicioComponent],
      imports: [MatDialogModule, MatMenuModule],
      providers: [
        { provide: ConsolaRegistroService, useValue: mockRegisterService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraficasInicioComponent);
    component = fixture.componentInstance;

    mockAuthService.getCurrentUserResearchLayer.and.returnValue(of('layer1'));
    mockRegisterService.obtenerCapaPorId.and.returnValue(of(mockResearchLayer));
    mockRegisterService.obtenerRegistrosPorCapa.and.returnValue(of({
      registers: mockRegisters,
      currentPage: 1,
      totalPages: 1,
      totalElements: 2
    }));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize and load data', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(mockAuthService.getCurrentUserResearchLayer).toHaveBeenCalled();
    expect(mockRegisterService.obtenerCapaPorId).toHaveBeenCalledWith('layer1');
    expect(component.currentResearchLayer).toEqual(mockResearchLayer);
    expect(component.allRegisters.length).toBe(2);
  }));

  it('should handle errors when loading research layer', fakeAsync(() => {
    mockAuthService.getCurrentUserResearchLayer.and.returnValue(throwError(() => new Error('Test Error')));

    component.loadCurrentResearchLayer();
    tick();

    expect(component.errorMessage).toContain('Error al obtener la información del usuario');
    expect(component.loading).toBeFalse();
  }));

  it('should update summary cards correctly', () => {
    // Access private method for testing
    (component as any).updateSummaryCards(mockRegisters);

    expect(component.summaryCards[0].value).toBe(2); // Total pacientes
    expect(component.summaryCards[1].value).toBe(1); // Crisis activas
    expect(component.summaryCards[3].value).toBe(1); // Con cuidador
  });

  it('should process chart data correctly', () => {
    (component as any).prepareChartData(mockRegisters);

    expect(component.chartData1.labels).toContain('masculino');
    expect(component.chartData1.labels).toContain('femenino');
    expect(component.chartData1.datasets[0].data).toEqual([1, 1]);
  });

  it('should toggle chart types', () => {
    expect(component.chartType1).toBe('bar');
    expect(component.chartType2).toBe('pie');

    component.toggleChartType(1);
    expect(component.chartType1).toBe('pie');

    component.toggleChartType(2);
    expect(component.chartType2).toBe('bar');
  });

  it('should filter data by time range', () => {
    component.allRegisters = mockRegisters;
    component.selectedTimeRange = '7';
    component.filterDataByDateRange();

    expect(component.summaryCards[0].value).toBe(1); // Solo 1 registro en los últimos 7 días
  });

  it('should handle empty register list', () => {
    (component as any).prepareDashboardData([]);

    expect(component.summaryCards.every(card => card.value === 0)).toBeTrue();
    expect(component.chartData1.datasets[0].data).toEqual([]);
    expect(component.chartData2.datasets[0].data).toEqual([]);
  });

  it('should get correct education level label', () => {
    const result = (component as any).getEducationLabel('universitario');
    expect(result).toBe('Universitario');
  });

  it('should get correct economic status label', () => {
    const result = (component as any).getEconomicStatusLabel('medio');
    expect(result).toBe('Medio');
  });

  it('should get correct marital status label', () => {
    const result = (component as any).getMaritalStatusLabel('casado');
    expect(result).toBe('Casado/a');
  });

  it('should destroy charts on ngOnDestroy', () => {
  // Mock chart instances with proper type
  const mockChart1 = { destroy: jasmine.createSpy('destroy') };
  const mockChart2 = { destroy: jasmine.createSpy('destroy') };
  
  // Set the charts in the component
  (component as any).chart1 = mockChart1;
  (component as any).chart2 = mockChart2;

  component.ngOnDestroy();

  expect(mockChart1.destroy).toHaveBeenCalled();
  expect(mockChart2.destroy).toHaveBeenCalled();
  expect((component as any).chart1).toBeNull();
  expect((component as any).chart2).toBeNull();
});

it('should handle null charts in ngOnDestroy', () => {
  // Explicitly set charts to null
  (component as any).chart1 = null;
  (component as any).chart2 = null;

  // This should not throw any errors
  component.ngOnDestroy();

  // Verify charts remain null
  expect((component as any).chart1).toBeNull();
  expect((component as any).chart2).toBeNull();
});
});
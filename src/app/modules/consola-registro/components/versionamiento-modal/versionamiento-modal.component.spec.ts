import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';

// Componente a testear
import { VersionamientoModalComponent } from './versionamiento-modal.component';

// Servicios
import { ConsolaRegistroService } from 'src/app/services/register.service';
import { AuthService } from 'src/app/services/auth.service';

// Interfaces para los tests
interface PaginatedResponse {
  data: any[];
  content?: any[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// Mocks
class MatDialogRefMock {
  close() {}
}

class ConsolaRegistroServiceMock {
  getPatientBasicInfoRegisters(patientId: number, pagination: any) {
    return of({
      data: [],
      content: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0
    } as PaginatedResponse);
  }

  getCaregiverRegisters(patientId: number, pagination: any) {
    return of({
      data: [],
      content: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0
    } as PaginatedResponse);
  }

  getRegistersByResearchLayer(layerId: string, userEmail: string, patientId: number, pagination: any) {
    return of({
      data: [],
      content: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0
    } as PaginatedResponse);
  }
}

class AuthServiceMock {
  getUserEmail() {
    return 'test@example.com';
  }
}

describe('VersionamientoModalComponent', () => {
  let component: VersionamientoModalComponent;
  let fixture: ComponentFixture<VersionamientoModalComponent>;
  let dialogRef: MatDialogRef<VersionamientoModalComponent>;
  let consolaService: ConsolaRegistroService;
  let authService: AuthService;

  // Datos de prueba
  const mockDialogData = {
    researchLayerId: 'test-layer-123',
    patientIdentificationNumber: 12345,
    pacienteNombre: 'Juan Pérez'
  };

  const mockHistorialItem = {
    id: '1',
    registerId: 'reg-123',
    changedBy: 'user@test.com',
    changedAt: '2023-10-01T10:00:00Z',
    operation: 'UPDATE_PATIENT_BASIC_INFO',
    patientIdentificationNumber: 12345,
    isPatientBasicInfo: {
      name: 'Juan Pérez',
      age: 30,
      gender: 'Masculino'
    }
  };

  const mockVersionGroup = {
    registerId: 'reg-123',
    changedBy: 'user@test.com',
    changedAt: '2023-10-01T10:00:00Z',
    operation: 'UPDATE_PATIENT_BASIC_INFO',
    items: [mockHistorialItem],
    hasBasicInfo: true,
    hasCaregiverInfo: false,
    hasResearchVariables: false
  };

  // Helper para acceder a propiedades privadas en tests
  const getPrivateProperty = (instance: any, propertyName: string) => {
    return (instance as any)[propertyName];
  };

  const setPrivateProperty = (instance: any, propertyName: string, value: any) => {
    (instance as any)[propertyName] = value;
  };

  const callPrivateMethod = (instance: any, methodName: string, ...args: any[]) => {
    return (instance as any)[methodName](...args);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VersionamientoModalComponent],
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatChipsModule,
        MatIconModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ConsolaRegistroService, useClass: ConsolaRegistroServiceMock },
        { provide: AuthService, useClass: AuthServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VersionamientoModalComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    consolaService = TestBed.inject(ConsolaRegistroService);
    authService = TestBed.inject(AuthService);

    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debería inicializar con datos del dialog', () => {
      expect(component.data).toEqual(mockDialogData);
    });

    it('debería crear el formulario de búsqueda', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('patientIdentificationNumber')).toBeDefined();
    });

    it('debería precargar número de identificación si está disponible', () => {
      expect(component.searchForm.get('patientIdentificationNumber')?.value).toBe(12345);
    });

    it('debería inicializar con valores por defecto', () => {
      expect(component.loading).toBeFalse();
      expect(component.activeTabIndex).toBe(0);
      expect(component.viewMode).toBe('timeline');
      expect(component.pageSize).toBe(10);
    });

    it('debería inicializar selection model', () => {
      expect(component.selection).toBeInstanceOf(SelectionModel);
    });
  });

  describe('Métodos de búsqueda y validación', () => {
    it('debería validar formulario correctamente', () => {
      component.searchForm.patchValue({ patientIdentificationNumber: '' });
      expect(component.searchForm.valid).toBeFalse();

      component.searchForm.patchValue({ patientIdentificationNumber: 12345 });
      expect(component.searchForm.valid).toBeTrue();
    });

    it('debería mostrar error en formulario inválido', () => {
      const showErrorSpy = spyOn(component as any, 'showError');
      component.searchForm.patchValue({ patientIdentificationNumber: '' });
      
      component.searchPatient();
      
      expect(showErrorSpy).toHaveBeenCalledWith('Por favor corrige los errores en el formulario');
    });

    it('debería buscar paciente con datos válidos', () => {
      const loadAllSpy = spyOn(component as any, 'loadAllHistoriesWithPatientInfo');
      
      component.searchPatient();
      
      expect(loadAllSpy).toHaveBeenCalled();
    });

    it('debería manejar error en validación de paciente', async () => {
      const validateSpy = spyOn(component as any, 'validatePatientExists').and.returnValue(Promise.resolve(false));
      const showErrorSpy = spyOn(component as any, 'showError');
      
      component.searchPatient();
      
      // Esperar a que se resuelva la promesa
      await fixture.whenStable();
      
      expect(validateSpy).toHaveBeenCalled();
      expect(showErrorSpy).toHaveBeenCalledWith('No se encontró un paciente con ese número de identificación');
    });
  });

  describe('Métodos de carga de datos', () => {
    beforeEach(() => {
      setPrivateProperty(component, 'patientIdentificationNumber', 12345);
    });

    it('debería cargar información básica del paciente', () => {
      const response: PaginatedResponse = {
        data: [mockHistorialItem],
        content: [mockHistorialItem],
        totalElements: 1,
        totalPages: 1,
        currentPage: 0
      };
      const serviceSpy = spyOn(consolaService, 'getPatientBasicInfoRegisters').and.returnValue(of(response));
      
      component.loadPatientBasicInfo();
      
      expect(serviceSpy).toHaveBeenCalledWith(12345, jasmine.any(Object));
      expect(component.loadingBasicInfo).toBeFalse();
    });

    it('debería cargar información del cuidador', () => {
      const response: PaginatedResponse = {
        data: [mockHistorialItem],
        content: [mockHistorialItem],
        totalElements: 1,
        totalPages: 1,
        currentPage: 0
      };
      const serviceSpy = spyOn(consolaService, 'getCaregiverRegisters').and.returnValue(of(response));
      
      component.loadCaregiverInfo();
      
      expect(serviceSpy).toHaveBeenCalledWith(12345, jasmine.any(Object));
      expect(component.loadingCaregiver).toBeFalse();
    });

    it('debería cargar variables de investigación', () => {
      const response: PaginatedResponse = {
        data: [mockHistorialItem],
        content: [mockHistorialItem],
        totalElements: 1,
        totalPages: 1,
        currentPage: 0
      };
      const serviceSpy = spyOn(consolaService, 'getRegistersByResearchLayer').and.returnValue(of(response));
      const authSpy = spyOn(authService, 'getUserEmail').and.returnValue('test@example.com');
      
      component.loadResearchVariables();
      
      expect(serviceSpy).toHaveBeenCalledWith('test-layer-123', 'test@example.com', 12345, jasmine.any(Object));
      expect(component.loadingVariables).toBeFalse();
    });

    it('debería manejar error en carga de variables sin email', () => {
      spyOn(authService, 'getUserEmail').and.returnValue(null);
      const showErrorSpy = spyOn(component as any, 'showError');
      
      component.loadResearchVariables();
      
      expect(showErrorSpy).toHaveBeenCalledWith('No se pudo obtener el email del usuario');
    });

    it('debería cargar más versiones', () => {
      const loadAllSpy = spyOn(component as any, 'loadAllHistories').and.returnValue(of({}));
      setPrivateProperty(component, 'hasMoreVersions', true);
      
      component.loadMoreVersions();
      
      expect(loadAllSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Métodos de procesamiento de datos', () => {
    beforeEach(() => {
      // Configurar historiales usando el método setPrivateProperty
      setPrivateProperty(component, 'basicInfoHistory', [mockHistorialItem]);
      setPrivateProperty(component, 'caregiverHistory', []);
      setPrivateProperty(component, 'variablesHistory', []);
    });

    it('debería agrupar historiales por versión', () => {
      callPrivateMethod(component, 'groupHistoriesByVersion');
      
      expect(component.versionGroups.length).toBeGreaterThan(0);
    });

    it('debería extraer información del paciente', () => {
      callPrivateMethod(component, 'extractPatientInfoFromHistories');
      
      expect(component.patientInfo).toBeDefined();
      expect(component.patientInfo?.name).toBe('Juan Pérez');
      expect(component.patientInfo?.identificationNumber).toBe(12345);
    });

    it('debería formatear fecha correctamente', () => {
      const formatted = component.formatDate('2023-10-01T10:00:00Z');
      
      expect(formatted).toContain('01/10/2023');
    });

    it('debería obtener texto de operación', () => {
      expect(component.getOperationText('UPDATE_PATIENT_BASIC_INFO')).toBe('Información Básica Actualizada');
      expect(component.getOperationText('UNKNOWN_OPERATION')).toBe('UNKNOWN_OPERATION');
    });

    it('debería obtener clase de operación', () => {
      expect(component.getOperationClass('REGISTER_CREATED_SUCCESSFULL')).toBe('operation-created');
      expect(component.getOperationClass('UNKNOWN_OPERATION')).toBe('operation-default');
    });

    it('debería obtener icono de operación', () => {
      expect(component.getOperationIcon('REGISTER_CREATED_SUCCESSFULL')).toBe('add_circle');
      expect(component.getOperationIcon('UNKNOWN_OPERATION')).toBe('history');
    });
  });

  describe('Métodos de filtrado', () => {
    beforeEach(() => {
      component.versionGroups = [mockVersionGroup];
    });

    it('debería aplicar filtros', () => {
      component.applyFilters();
      
      expect(component.filteredVersionGroups.length).toBe(1);
    });

    it('debería filtrar por secciones', () => {
      component.filters.sections.basic = false;
      
      component.applyFilters();
      
      expect(component.filteredVersionGroups.length).toBe(0);
    });

    it('debería filtrar por operaciones', () => {
      component.filters.operations = ['UPDATE_PATIENT_BASIC_INFO'];
      
      component.applyFilters();
      
      expect(component.filteredVersionGroups.length).toBe(1);
    });

    it('debería filtrar por texto de búsqueda', () => {
      component.filters.searchText = 'Juan';
      
      component.applyFilters();
      
      expect(component.filteredVersionGroups.length).toBe(1);
    });

    it('debería limpiar filtros', () => {
      component.filters.searchText = 'test';
      component.filters.operations = ['UPDATE_PATIENT_BASIC_INFO'];
      component.filters.sections.basic = false;
      
      component.clearFilters();
      
      expect(component.filters.searchText).toBe('');
      expect(component.filters.operations.length).toBe(0);
      expect(component.filters.sections.basic).toBeTrue();
    });

    it('debería detectar filtros activos', () => {
      expect(component.hasActiveFilters()).toBeFalse();
      
      component.filters.searchText = 'test';
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });

  describe('Métodos de UI y navegación', () => {
    it('debería cambiar pestaña activa', () => {
      component.onTabChange({ index: 1 });
      
      expect(component.activeTabIndex).toBe(1);
    });

    it('debería cambiar modo de vista', () => {
      component.setViewMode('table');
      
      expect(component.viewMode).toBe('table');
    });

    it('debería alternar versión seleccionada', () => {
      component.toggleVersion(mockVersionGroup);
      
      expect(component.selectedVersion).toBe(mockVersionGroup);
      
      component.toggleVersion(mockVersionGroup);
      
      expect(component.selectedVersion).toBeNull();
    });

    it('debería cerrar el modal', () => {
      const closeSpy = spyOn(dialogRef, 'close');
      
      component.close();
      
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Métodos de selección múltiple', () => {
    beforeEach(() => {
      component.filteredVersionGroups = [mockVersionGroup];
    });

    it('debería verificar si todos están seleccionados', () => {
      expect(component.isAllSelected()).toBeFalse();
      
      component.selection.select(...component.filteredVersionGroups);
      
      expect(component.isAllSelected()).toBeTrue();
    });

    it('debería alternar selección de todos', () => {
      component.toggleAllVersions();
      
      expect(component.selection.selected.length).toBe(1);
      
      component.toggleAllVersions();
      
      expect(component.selection.selected.length).toBe(0);
    });

    it('debería obtener tiempo relativo', () => {
      const timeAgo = component.getTimeAgo('2023-10-01T10:00:00Z');
      
      expect(timeAgo).toContain('día');
    });
  });

  describe('Métodos de utilidad', () => {
    it('debería obtener claves de objeto', () => {
      const obj = { name: 'test', age: 30 };
      const keys = component.getObjectKeys(obj);
      
      expect(keys).toEqual(['name', 'age']);
    });

    it('debería formatear valores', () => {
      expect(component.getFormattedValue('test')).toBe('test');
      expect(component.getFormattedValue(null)).toBe('No especificado');
      expect(component.getFormattedValue(true)).toBe('Sí');
      expect(component.getFormattedValue(false)).toBe('No');
    });

    it('debería formatear nombres de claves', () => {
      expect(component.formatKeyName('name')).toBe('Nombre');
      expect(component.formatKeyName('unknownKey')).toBe('unknownKey');
    });

    it('debería obtener datos de sección', () => {
      const sectionData = component.getSectionData(mockVersionGroup, 'basic');
      
      expect(sectionData).toBeDefined();
    });

    it('debería obtener datos actuales de sección', () => {
      setPrivateProperty(component, 'basicInfoHistory', [mockHistorialItem]);
      setPrivateProperty(component, 'caregiverHistory', []);
      setPrivateProperty(component, 'variablesHistory', []);
      
      const basicData = component.getCurrentData('basic');
      const caregiverData = component.getCurrentData('caregiver');
      const variablesData = component.getCurrentData('variables');
      
      expect(basicData.length).toBe(1);
      expect(caregiverData.length).toBe(0);
      expect(variablesData.length).toBe(0);
    });

    it('debería limpiar todos los historiales', () => {
      setPrivateProperty(component, 'basicInfoHistory', [mockHistorialItem]);
      setPrivateProperty(component, 'caregiverHistory', [mockHistorialItem]);
      setPrivateProperty(component, 'variablesHistory', [mockHistorialItem]);
      
      component.clearAllHistories();
      
      expect(getPrivateProperty(component, 'basicInfoHistory').length).toBe(0);
      expect(getPrivateProperty(component, 'caregiverHistory').length).toBe(0);
      expect(getPrivateProperty(component, 'variablesHistory').length).toBe(0);
      expect(component.versionGroups.length).toBe(0);
    });
  });

  describe('Métodos de exportación', () => {
    beforeEach(() => {
      component.filteredVersionGroups = [mockVersionGroup];
    });

    it('debería exportar historial', () => {
      const downloadSpy = spyOn(component as any, 'downloadExport');
      const showSuccessSpy = spyOn(component as any, 'showSuccess');
      
      component.exportHistory();
      
      expect(downloadSpy).toHaveBeenCalled();
    });

    it('debería exportar selección', () => {
      component.selection.select(mockVersionGroup);
      const downloadSpy = spyOn(component as any, 'downloadExport');
      
      component.exportHistory();
      
      expect(downloadSpy).toHaveBeenCalledWith([mockVersionGroup], 'versiones-seleccionadas');
    });

    it('debería convertir a CSV', () => {
      const csv = callPrivateMethod(component, 'convertToCSV', [mockVersionGroup]);
      
      expect(csv).toContain('Fecha');
      expect(csv).toContain('Operación');
      expect(csv).toContain('Información Básica Actualizada');
    });
  });

  describe('Manejo de errores', () => {
    it('debería manejar error en carga de información básica', () => {
      const error = { message: 'Error de servidor' };
      spyOn(consolaService, 'getPatientBasicInfoRegisters').and.returnValue(throwError(() => error));
      const showErrorSpy = spyOn(component as any, 'showError');
      
      component.loadPatientBasicInfo();
      
      expect(showErrorSpy).toHaveBeenCalledWith('Error al cargar el historial de información básica: Error de servidor');
    });

    it('debería manejar error en carga de cuidador', () => {
      const error = { message: 'Error de servidor' };
      spyOn(consolaService, 'getCaregiverRegisters').and.returnValue(throwError(() => error));
      const showErrorSpy = spyOn(component as any, 'showError');
      
      component.loadCaregiverInfo();
      
      expect(showErrorSpy).toHaveBeenCalledWith('Error al cargar el historial del cuidador: Error de servidor');
    });

    it('debería manejar error en carga de variables', () => {
      const error = { message: 'Error de servidor' };
      spyOn(consolaService, 'getRegistersByResearchLayer').and.returnValue(throwError(() => error));
      spyOn(authService, 'getUserEmail').and.returnValue('test@example.com');
      const showErrorSpy = spyOn(component as any, 'showError');
      
      component.loadResearchVariables();
      
      expect(showErrorSpy).toHaveBeenCalledWith('Error al cargar el historial de variables: Error de servidor');
    });
  });

  describe('Estadísticas', () => {
    beforeEach(() => {
      component.versionGroups = [mockVersionGroup];
      component.applyFilters();
    });

    it('debería actualizar estadísticas', () => {
      expect(component.statistics.totalVersions).toBe(1);
      expect(component.statistics.bySection.basic).toBe(1);
    });

    it('debería obtener estadísticas de operaciones', () => {
      const stats = component.getOperationStats();
      
      expect(stats.length).toBeGreaterThan(0);
    });
  });

  describe('Métodos de mensajes', () => {
    it('debería mostrar mensaje de éxito', () => {
      callPrivateMethod(component, 'showSuccess', 'Operación exitosa');
      
      expect(component.successMessage).toBe('Operación exitosa');
      expect(component.errorMessage).toBe('');
    });

    it('debería mostrar mensaje de error', () => {
      callPrivateMethod(component, 'showError', 'Error en operación');
      
      expect(component.errorMessage).toBe('Error en operación');
      expect(component.successMessage).toBe('');
    });
  });

  describe('Métodos de filtros de UI', () => {
    it('debería alternar filtro de sección', () => {
      const applyFiltersSpy = spyOn(component, 'applyFilters');
      
      component.toggleSectionFilter('basic', { selected: false });
      
      expect(component.filters.sections.basic).toBeFalse();
      expect(applyFiltersSpy).toHaveBeenCalled();
    });

    it('debería alternar filtro de operación', () => {
      const applyFiltersSpy = spyOn(component, 'applyFilters');
      
      component.toggleOperationFilter('UPDATE_PATIENT_BASIC_INFO', { selected: true });
      
      expect(component.filters.operations).toContain('UPDATE_PATIENT_BASIC_INFO');
      expect(applyFiltersSpy).toHaveBeenCalled();
    });

    it('debería manejar cambio en búsqueda', () => {
      const applyFiltersSpy = spyOn(component, 'applyFilters');
      
      component.onSearchChange('test search');
      
      expect(component.filters.searchText).toBe('test search');
      expect(applyFiltersSpy).toHaveBeenCalled();
    });
  });

  describe('Métodos de progreso', () => {
    it('debería obtener clase de barra de progreso', () => {
      expect(component.getOperationProgressBarClass('REGISTER_CREATED_SUCCESSFULL')).toBe('progress-created');
      expect(component.getOperationProgressBarClass('UNKNOWN_OPERATION')).toBe('progress-default');
    });
  });
});
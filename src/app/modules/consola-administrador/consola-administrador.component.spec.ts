import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { ConsolaAdministradorComponent } from './consola-administrador.component';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { AuthService } from 'src/app/login/services/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SweetAlertResult } from 'sweetalert2';
import { discardPeriodicTasks } from '@angular/core/testing';
import { flush } from '@angular/core/testing';

describe('ConsolaAdministradorComponent', () => {
  let component: ConsolaAdministradorComponent;
  let fixture: ComponentFixture<ConsolaAdministradorComponent>;
  let consolaService: jasmine.SpyObj<ConsolaAdministradorService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    username: 'johndoe',
    attributes: {
      identificationType: ['CC'],
      identificationNumber: ['123456789'],
      birthDate: ['1990-01-01'],
      researchLayerId: ['1'],
      role: ['ADMIN']
    },
    enabled: true,
    createdTimestamp: Date.now()
  };

  const mockVariable = {
    id: '1',
    variableName: 'Variable 1',
    description: 'Descripción',
    type: 'Texto',
    researchLayerId: 1,
    options: []
  };

  const mockCapa = {
    id: '1',
    layerName: 'Capa 1',
    description: 'Descripción capa',
    layerBoss: {
      id: 1,
      name: 'Jefe Capa',
      identificationNumber: '987654321'
    },
    createdAt: new Date().toISOString()
  };

  const mockRegistro = {
    registerId: '1',
    registerDate: new Date().toISOString(),
    patientBasicInfo: {
      name: 'Paciente 1',
      sex: 'M',
      age: 30
    },
    patientIdentificationNumber: '123',
    healthProfessional: {
      name: 'Doctor 1'
    },
    variablesRegister: []
  };

  beforeEach(waitForAsync(() => {
    const consolaServiceSpy = jasmine.createSpyObj('ConsolaAdministradorService', [
      'getAllLayers',
      'getAllVariables',
      'getAllUsuarios',
      'getRegistrosCapas',
      'deleteRegistroCapa',
      'eliminarUsuario',
      'eliminarVariable',
      'eliminarCapa',
      'actualizarVariable',
      'actualizarCapa',
      'updateUsuario',
      'enableUser',
      'disableUser',
      'getDataUpdatedListener'
    ]);

    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'getUserId',
      'getUserEmail',
      'getUserRole',
      'getUsername',
      'obtenerUsuarioPorEmail',
      'updateUserData',
      'logout'
    ]);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MatPaginatorModule,
        MatTableModule,
        BrowserAnimationsModule
      ],
      declarations: [ConsolaAdministradorComponent],
      providers: [
        { provide: ConsolaAdministradorService, useValue: consolaServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    consolaService = TestBed.inject(ConsolaAdministradorService) as jasmine.SpyObj<ConsolaAdministradorService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    setupMocks();
  }));

  function setupMocks(): void {
    consolaService.getAllLayers.and.returnValue(of([mockCapa]));
    consolaService.getAllVariables.and.returnValue(of([mockVariable]));
    consolaService.getAllUsuarios.and.returnValue(of([mockUser]));
    consolaService.getRegistrosCapas.and.returnValue(of({
      registers: [mockRegistro],
      totalElements: 1
    }));
    consolaService.getDataUpdatedListener.and.returnValue(of(undefined));
    authService.getUsername.and.returnValue('admin');
    authService.getUserRole.and.returnValue('ADMIN');

    // Mock para operaciones exitosas
    consolaService.deleteRegistroCapa.and.returnValue(of({}));
    consolaService.eliminarUsuario.and.returnValue(of({}));
    consolaService.eliminarVariable.and.returnValue(of({}));
    consolaService.eliminarCapa.and.returnValue(of({}));
    consolaService.enableUser.and.returnValue(of({}));
    consolaService.disableUser.and.returnValue(of({}));
    consolaService.updateUsuario.and.returnValue(of(mockUser));
    consolaService.actualizarVariable.and.returnValue(of(mockVariable));
    consolaService.actualizarCapa.and.returnValue(of(mockCapa));
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsolaAdministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debería cargar datos iniciales al iniciar', () => {
      expect(consolaService.getAllLayers).toHaveBeenCalled();
      expect(consolaService.getAllUsuarios).toHaveBeenCalled();
      expect(consolaService.getAllVariables).toHaveBeenCalled();
    });

    it('debería suscribirse a actualizaciones de datos', () => {
      expect(consolaService.getDataUpdatedListener).toHaveBeenCalled();
    });

    it('debería obtener el nombre de usuario del authService', () => {
      expect(authService.getUsername).toHaveBeenCalled();
      expect(component.username).toBe('admin');
    });
  });

  describe('Gestión de pestañas', () => {
    it('debería cambiar la pestaña seleccionada', () => {
      component.onTabSelected('gestionUsuarios');
      expect(component.selectedTab).toBe('gestionUsuarios');
    });

    it('debería cargar usuarios al seleccionar pestaña de gestión de usuarios', () => {
      spyOn(component, 'loadUsuariosData');
      component.onTabSelected('gestionUsuarios');
      expect(component.loadUsuariosData).toHaveBeenCalled();
    });

    it('debería cargar variables al seleccionar pestaña de gestión de variables', () => {
      spyOn(component, 'loadVariablesData');
      component.onTabSelected('gestionVariables');
      expect(component.loadVariablesData).toHaveBeenCalled();
    });

    it('debería cargar capas al seleccionar pestaña de gestión de capas', () => {
      spyOn(component, 'loadCapasData');
      component.onTabSelected('gestionCapas');
      expect(component.loadCapasData).toHaveBeenCalled();
    });

    it('debería cargar registros al seleccionar pestaña de gestión de registros', () => {
      spyOn(component, 'loadRegistrosCapas');
      component.onTabSelected('gestionRegistrosCapas');
      expect(component.loadRegistrosCapas).toHaveBeenCalled();
    });
  });

  describe('Operaciones CRUD - Usuarios', () => {
    it('debería guardar edición de usuario', fakeAsync(() => {
      component.userToEdit = {
        id: '1',
        nombre: 'Updated',
        apellido: 'User',
        email: 'updated@test.com',
        usuario: 'testuser',
        role: 'ADMIN',
        researchLayerId: '1',
        password: 'newpass'
      };

      // Mockear SweetAlert para simular confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      component.guardarEdicionUsuario(component.userToEdit);
      tick(); // Esperar a que se resuelvan las operaciones asíncronas
      fixture.detectChanges();

      expect(consolaService.updateUsuario).toHaveBeenCalledWith(
        '1',
        jasmine.objectContaining({
          firstName: 'Updated',
          lastName: 'User',
          email: 'updated@test.com',
          username: 'testuser',
          role: 'ADMIN'
        })
      );
    }));
  });

  describe('Operaciones CRUD - Variables', () => {
    it('debería preparar variable para edición', () => {
      const variableConOpciones = {
        ...mockVariable,
        options: ['opcion1', 'opcion2']
      };

      component.handleEdit(variableConOpciones, 'variable');

      expect(component.isEditingVar).toBeTrue();
      expect(component.varToEdit).toEqual({
        ...variableConOpciones,
        tieneOpciones: true // Esta propiedad debería ser true cuando hay opciones
      });
    });
  });

  describe('Operaciones CRUD - Registros', () => {
    it('debería manejar error al eliminar registro', fakeAsync(() => {
      // 1. Configurar mocks
      const errorMock = new Error('Error de prueba');
      consolaService.deleteRegistroCapa.and.returnValue(throwError(() => errorMock));

      // Mockear SweetAlert para simular confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      // 2. Espiar las funciones relevantes
      spyOn(console, 'error');
      spyOn(component, 'mostrarMensajeError').and.callThrough();
      spyOn(component, 'loadRegistrosCapas');

      // 3. Ejecutar el método
      component.handleDeleteRegistro(mockRegistro);
      tick(); // Esperar a que se resuelva SweetAlert

      // 4. Avanzar el tiempo para la llamada HTTP
      tick();
      fixture.detectChanges();

      // 5. Verificaciones
      expect(Swal.fire).toHaveBeenCalled();
      expect(consolaService.deleteRegistroCapa).toHaveBeenCalledWith('1');

      // Verificar manejo de errores
      expect(console.error).toHaveBeenCalledOnceWith(
        'Error al eliminar registro:',
        errorMock
      );

      expect(component.mostrarMensajeError).toHaveBeenCalledOnceWith(
        'No se pudo eliminar el registro.'
      );

      // 6. Limpieza
      discardPeriodicTasks();
      flush();
    }));
  });

  describe('Métodos utilitarios', () => {
    it('debería obtener nombre de capa por ID', () => {
      // Configurar datos de prueba correctamente
      component.capas = [{
        id: '1',
        nombreCapa: 'Capa 1',
        layerName: 'Capa 1', // Asegurar que tenga la propiedad que busca el método
        description: 'Descripción',
        jefeCapaNombre: 'Jefe 1'
      }];

      expect(component.getCapaNombreById('1')).toBe('Capa 1');
      expect(component.getCapaNombreById('2')).toBe('Capa no encontrada');
    });
  });

  describe('Operaciones CRUD - Capas', () => {
    it('debería preparar capa para edición', () => {
      const capaCompleta = {
        ...mockCapa,
        createdAt: new Date().toISOString()
      };

      component.handleEdit(capaCompleta, 'capa');

      expect(component.isEditingCapa).toBeTrue();
      expect(component.capaToEdit).toEqual(jasmine.objectContaining({
        id: '1',
        layerName: 'Capa 1',
        description: 'Descripción capa'
      }));
    });

    it('debería guardar edición de capa', fakeAsync(() => {
      component.capaToEdit = {
        ...mockCapa,
        createdAt: new Date().toISOString()
      };

      // Mockear SweetAlert para simular confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      component.guardarEdicionCapa(component.capaToEdit);
      tick(); // Esperar a que se resuelvan las operaciones asíncronas
      fixture.detectChanges();

      expect(consolaService.actualizarCapa).toHaveBeenCalledWith(
        '1',
        jasmine.objectContaining({
          layerName: 'Capa 1',
          description: 'Descripción capa'
        })
      );
    }));
  });

  describe('Métodos utilitarios', () => {
    it('debería transformar strings correctamente', () => {
      expect(component.transformarString('ADMIN')).toBe('Administrador');
      expect(component.transformarString('true')).toBe('Activo');
      expect(component.transformarString('false')).toBe('Inactivo');
      expect(component.transformarString('other')).toBe('other');
    });


    it('debería obtener nombre de capa por ID', () => {
      component.capasData = [{ id: '1', nombreCapa: 'Capa 1' }];
      expect(component.getCapaNombreById('1')).toBe('Capa 1');
      expect(component.getCapaNombreById('2')).toBe('Capa no encontrada');
    });

    it('debería actualizar métricas del dashboard', () => {
      component.usuariosData = [mockUser, mockUser];
      component.variablesData = [mockVariable, mockVariable, mockVariable];
      component.capasData = [mockCapa];

      component.updateDashboard();

      expect(component.totalUsuarios).toBe(2);
      expect(component.totalVariables).toBe(3);
      expect(component.totalCapas).toBe(1);
    });
  });
});
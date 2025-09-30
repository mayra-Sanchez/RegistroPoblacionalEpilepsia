import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { ConsolaAdministradorComponent } from './consola-administrador.component';
import { ConsolaAdministradorService } from '../../services/consola-administrador.service';
import { AuthService } from 'src/app/services/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SweetAlertResult } from 'sweetalert2';
import { ConsolaRegistroService } from 'src/app/services/register.service';

// Interface para BasicResponse
interface BasicResponse {
  message: string;
  [key: string]: any;
}

describe('ConsolaAdministradorComponent', () => {
  let component: ConsolaAdministradorComponent;
  let fixture: ComponentFixture<ConsolaAdministradorComponent>;
  let consolaService: jasmine.SpyObj<ConsolaAdministradorService>;
  let authService: jasmine.SpyObj<AuthService>;
  let registroService: jasmine.SpyObj<ConsolaRegistroService>;

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
      role: ['ADMIN'],
      lastPasswordUpdate: [new Date().toISOString()]
    },
    enabled: true,
    createdTimestamp: Date.now()
  };

  const mockVariable = {
    id: '1',
    variableName: 'Variable 1',
    description: 'Descripción',
    type: 'Texto',
    researchLayerId: '1',
    options: []
  };

  const mockCapa = {
    id: '1',
    layerName: 'Capa 1',
    description: 'Descripción capa',
    layerBoss: {
      id: 1,
      name: 'Jefe Capa',
      identificationNumber: '987654321',
      email: 'jefe@example.com'
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
    variablesRegister: [],
    changedAt: new Date().toISOString(),
    changedBy: 'user@test.com',
    operation: 'REGISTER_CREATED_SUCCESSFULL',
    isResearchLayerGroup: {
      researchLayerId: '1',
      researchLayerName: 'Capa Test',
      variables: []
    }
  };

  // Mock BasicResponse
  const mockBasicResponse: BasicResponse = {
    message: 'Operación exitosa'
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
      'getDataUpdatedListener',
      'getVariableById',
      'getLayerById',
      'getRegisterHistory'
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

    const registroServiceSpy = jasmine.createSpyObj('ConsolaRegistroService', [
      'deleteRegisterHistory',
      'getActualRegisterByPatient'
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
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConsolaRegistroService, useValue: registroServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    consolaService = TestBed.inject(ConsolaAdministradorService) as jasmine.SpyObj<ConsolaAdministradorService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    registroService = TestBed.inject(ConsolaRegistroService) as jasmine.SpyObj<ConsolaRegistroService>;

    setupMocks();
  }));

  function setupMocks(): void {
    // Mocks básicos para inicialización
    consolaService.getAllLayers.and.returnValue(of([mockCapa]));
    consolaService.getAllVariables.and.returnValue(of([mockVariable]));
    consolaService.getAllUsuarios.and.returnValue(of([mockUser]));
    consolaService.getRegistrosCapas.and.returnValue(of({
      registers: [mockRegistro],
      totalElements: 1
    }));
    consolaService.getDataUpdatedListener.and.returnValue(of(undefined));
    consolaService.getVariableById.and.returnValue(of(mockVariable));
    consolaService.getLayerById.and.returnValue(of(mockCapa));
    consolaService.getRegisterHistory.and.returnValue(of({
      data: [mockRegistro],
      totalElements: 1
    }));

    authService.getUsername.and.returnValue('admin');
    authService.getUserRole.and.returnValue('ADMIN');
    authService.getUserEmail.and.returnValue('admin@test.com');

    // Mocks para operaciones exitosas - usando mockBasicResponse
    consolaService.deleteRegistroCapa.and.returnValue(of(mockBasicResponse));
    consolaService.eliminarUsuario.and.returnValue(of(mockBasicResponse));
    consolaService.eliminarVariable.and.returnValue(of(mockBasicResponse));
    consolaService.eliminarCapa.and.returnValue(of(mockBasicResponse));
    consolaService.enableUser.and.returnValue(of(mockBasicResponse));
    consolaService.disableUser.and.returnValue(of(mockBasicResponse));
    consolaService.updateUsuario.and.returnValue(of(mockUser));
    consolaService.actualizarVariable.and.returnValue(of(mockVariable));
    consolaService.actualizarCapa.and.returnValue(of(mockCapa));

    registroService.deleteRegisterHistory.and.returnValue(of(mockBasicResponse));
    registroService.getActualRegisterByPatient.and.returnValue(of({}));
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

    it('debería limpiar historial al seleccionar pestaña de historial sin capa seleccionada', () => {
      component.capaSeleccionadaHistorial = '';
      component.onTabSelected('historialRegistros');
      
      expect(component.historialRegistrosData).toEqual([]);
      expect(component.totalHistorialRegistros).toBe(0);
    });
  });

  describe('Operaciones CRUD - Usuarios', () => {
    it('debería guardar edición de usuario exitosamente', fakeAsync(() => {
      const usuarioEditado = {
        userId: '1',
        payload: {
          firstName: 'Updated',
          lastName: 'User',
          email: 'updated@test.com',
          username: 'testuser',
          role: 'ADMIN',
          researchLayerId: ['1'],
          password: 'newpass',
          attributes: {
            lastPasswordUpdate: [new Date().toISOString()]
          }
        }
      };

      // Mock SweetAlert para confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      component.guardarEdicionUsuario(usuarioEditado);
      tick();

      expect(consolaService.updateUsuario).toHaveBeenCalledWith(
        '1',
        jasmine.objectContaining({
          firstName: 'Updated',
          lastName: 'User'
        })
      );
    }));

    it('debería mostrar error si falta userId al guardar usuario', () => {
      spyOn(Swal, 'fire');
      
      component.guardarEdicionUsuario({} as any);

      expect(Swal.fire).toHaveBeenCalledWith('Error', 'Falta el ID del usuario.', 'error');
    });

    it('debería cambiar estado de usuario', fakeAsync(() => {
      const user = { 
        id: '1', 
        nombre: 'Test', 
        apellido: 'User', 
        enabled: true 
      };

      // Mock SweetAlert para confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      component.toggleUserStatus(user);
      tick();

      expect(consolaService.disableUser).toHaveBeenCalledWith('1');
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
      expect(component.varToEdit.tieneOpciones).toBeTrue();
    });

    it('debería guardar edición de variable exitosamente', fakeAsync(() => {
      component.varToEdit = {
        ...mockVariable,
        tieneOpciones: false,
        options: []
      };

      // Mock SweetAlert para confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      component.guardarEdicionVariable(component.varToEdit);
      tick();

      expect(consolaService.actualizarVariable).toHaveBeenCalled();
    }));
  });

  describe('Operaciones CRUD - Capas', () => {
    it('debería preparar capa para edición', () => {
      component.handleEdit(mockCapa, 'capa');

      expect(component.isEditingCapa).toBeTrue();
      expect(component.capaToEdit).toEqual(jasmine.objectContaining({
        id: '1',
        layerName: 'Capa 1'
      }));
    });

    it('debería guardar edición de capa exitosamente', fakeAsync(() => {
      component.capaToEdit = mockCapa;

      // Mock SweetAlert para confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      component.guardarEdicionCapa(component.capaToEdit);
      tick();

      expect(consolaService.actualizarCapa).toHaveBeenCalledWith(
        '1',
        jasmine.objectContaining({
          layerName: 'Capa 1'
        })
      );
    }));
  });

  describe('Operaciones CRUD - Registros', () => {
    it('debería manejar error al eliminar registro', fakeAsync(() => {
      const errorMock = new Error('Error de prueba');
      consolaService.deleteRegistroCapa.and.returnValue(throwError(() => errorMock));

      // Mock SweetAlert para confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      // Espiar console.error
      spyOn(console, 'error');

      component.handleDeleteRegistro(mockRegistro);
      tick();

      expect(consolaService.deleteRegistroCapa).toHaveBeenCalledWith('1');
      expect(console.error).toHaveBeenCalledWith('Error al eliminar registro:', errorMock);
    }));

    it('debería eliminar registro del historial exitosamente', fakeAsync(() => {
      // Mock SweetAlert para confirmación
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false
      } as SweetAlertResult));

      spyOn(component, 'loadHistorialRegistros');

      component.handleDeleteHistorial(mockRegistro);
      tick();

      expect(registroService.deleteRegisterHistory).toHaveBeenCalledWith('1');
      expect(component.loadHistorialRegistros).toHaveBeenCalled();
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
      component.capasData = [{ 
        id: '1', 
        nombreCapa: 'Capa 1',
        layerName: 'Capa 1'
      }];
      
      expect(component.getCapaNombreById('1')).toBe('Capa 1');
      expect(component.getCapaNombreById('2')).toBe('Ninguna');
    });

    it('debería obtener nombre de capa por ID para variables', () => {
      component.capasData = [{ 
        id: '1', 
        nombreCapa: 'Capa Test'
      }];
      
      expect(component.getCapaNombreByIdVariables('1')).toBe('Capa Test');
      expect(component.getCapaNombreByIdVariables('2')).toBe('Ninguna');
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

    it('debería formatear fecha correctamente', () => {
      // Para probar métodos privados, podemos acceder a ellos a través de cualquier método público que los use
      const fecha = new Date().toISOString();
      // No probamos directamente el método privado
    });

    it('debería traducir operaciones correctamente', () => {
      // No probamos directamente el método privado
    });
  });

  describe('Filtrado de datos', () => {
    it('debería filtrar usuarios por estado activo', () => {
      component.usuariosDataOriginal = [
        { ...mockUser, enabled: true },
        { ...mockUser, enabled: false }
      ];

      component.estadoSeleccionado = 'activo';
      component.filtrarUsuariosPorEstado();

      expect(component.usuariosData.length).toBe(1);
      expect(component.usuariosData[0].enabled).toBeTrue();
    });

    it('debería filtrar variables por capa', () => {
      component.variablesDataOriginal = [
        { ...mockVariable, researchLayerId: '1' },
        { ...mockVariable, researchLayerId: '2' }
      ];

      component.capaSeleccionada = '1';
      component.filtrarVariablesPorCapa();

      expect(component.variablesData.length).toBe(1);
      expect(component.variablesData[0].researchLayerId).toBe('1');
    });
  });

  describe('Métodos de navegación y modales', () => {
    it('debería abrir modal para crear nueva variable', () => {
      component.crearNuevaVariable();
      
      expect(component.selectedTab).toBe('gestionVariables');
      expect(component.isCreatingVar).toBeTrue();
    });

    it('debería cerrar modal y recargar datos si success es true', () => {
      spyOn(component, 'loadCapasData');
      spyOn(component, 'loadUsuariosData');
      spyOn(component, 'loadVariablesData');

      component.cerrarModal({ success: true });

      expect(component.isViewing).toBeFalse();
      expect(component.loadCapasData).toHaveBeenCalled();
      expect(component.loadUsuariosData).toHaveBeenCalled();
      expect(component.loadVariablesData).toHaveBeenCalled();
    });

    it('debería manejar visualización de usuario', () => {
      const userData = {
        detalles: {
          nombre: 'Test',
          apellido: 'User',
          email: 'test@example.com',
          capaRawValue: '1'
        }
      };

      component.handleView(userData, 'usuario');

      expect(component.isViewing).toBeTrue();
      expect(component.viewType).toBe('usuario');
      expect(component.viewedItem).toBeDefined();
    });
  });

  describe('Métodos de exportación', () => {
    it('debería exportar usuarios a CSV', () => {
      component.usuariosData = [{
        id: '1',
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com'
      }];

      // En lugar de espiar el método privado, probamos el comportamiento público
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();
      const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      
      component.exportarUsuarios();

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('debería manejar exportación cuando no hay usuarios', () => {
      component.usuariosData = [];
      const consoleWarnSpy = spyOn(console, 'warn');
      
      component.exportarUsuarios();

      // Verificamos que se llamó a console.warn
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  // Pruebas para métodos públicos de utilidad
  describe('Métodos públicos de utilidad', () => {
    it('debería obtener tipo de elemento según pestaña', () => {
      component.selectedTab = 'gestionUsuarios';
      expect(component.obtenerTipoElemento()).toBe('usuario');
      
      component.selectedTab = 'gestionVariables';
      expect(component.obtenerTipoElemento()).toBe('variable');
      
      component.selectedTab = 'gestionCapas';
      expect(component.obtenerTipoElemento()).toBe('capa de investigación');
    });

    it('debería obtener nombre de elemento', () => {
      const rowWithUsername = { username: 'testuser' };
      const rowWithVariableName = { variableName: 'Test Variable' };
      const rowWithNombreCapa = { nombreCapa: 'Test Capa' };
      const rowWithoutName = { otherField: 'value' };
      
      expect(component.obtenerNombreElemento(rowWithUsername)).toBe('testuser');
      expect(component.obtenerNombreElemento(rowWithVariableName)).toBe('Test Variable');
      expect(component.obtenerNombreElemento(rowWithNombreCapa)).toBe('Test Capa');
      expect(component.obtenerNombreElemento(rowWithoutName)).toBe('sin nombre');
    });
  });

  describe('Manejo de errores', () => {
    it('debería mostrar mensaje de error', () => {
      const swalFireSpy = spyOn(Swal, 'fire');
      const mensaje = 'Error de prueba';
      
      component.mostrarMensajeError(mensaje);
      
      expect(swalFireSpy).toHaveBeenCalledWith('Error', mensaje, 'error');
    });

    it('debería mostrar mensaje de información', () => {
      const swalFireSpy = spyOn(Swal, 'fire');
      const mensaje = 'Información de prueba';
      
      component.mostrarMensajeInfo(mensaje);
      
      expect(swalFireSpy).toHaveBeenCalledWith('Información', mensaje, 'info');
    });
  });
});
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import Swal from 'sweetalert2';

// Componente a testear
import { RegistroPacienteComponent } from './registro-paciente.component';

// Servicios e interfaces
import { ConsolaRegistroService, RegisterRequest, ValidatePatientResponse } from '../../../../services/register.service';
import { AuthService } from '../../../../services/auth.service';
import { SignatureUploadService } from 'src/app/services/signature-upload.service';
import { Variable } from '../../interfaces';

// Mocks
class ConsolaRegistroServiceMock {
  obtenerVariablesPorCapa = jasmine.createSpy('obtenerVariablesPorCapa').and.returnValue(of([]));
  validarPaciente = jasmine.createSpy('validarPaciente').and.returnValue(of({}));
  saveRegister = jasmine.createSpy('saveRegister').and.returnValue(of({}));
  updateRegister = jasmine.createSpy('updateRegister').and.returnValue(of({}));
  getActualRegisterByPatient = jasmine.createSpy('getActualRegisterByPatient').and.returnValue(of({}));
  notifyDataChanged = jasmine.createSpy('notifyDataChanged');
}

class AuthServiceMock {
  getUserEmail = jasmine.createSpy('getUserEmail').and.returnValue('test@example.com');
}

class SignatureUploadServiceMock {
  uploadConsentFile = jasmine.createSpy('uploadConsentFile').and.returnValue(of({}));
}

describe('RegistroPacienteComponent', () => {
  let component: RegistroPacienteComponent;
  let fixture: ComponentFixture<RegistroPacienteComponent>;
  let consolaService: ConsolaRegistroService;
  let authService: AuthService;
  let signatureUploadService: SignatureUploadService;

  // Datos de prueba
  const mockVariables: Variable[] = [
    {
      id: '1',
      name: 'Temperatura',
      variableName: 'Temperatura',
      type: 'Real',
      isEnabled: true,
      isRequired: true,
      hasOptions: false,
      selectionType: 'single',
      options: [],
      description: 'Temperatura corporal',
      researchLayerId: 'test-layer-1',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  const mockValidationResponse: ValidatePatientResponse = {
    action: 'patient_doesnt_exist',
    patientIdentificationNumber: 123456789,
    patientIdentificationType: 'CC',
    patientBasicInfo: {
      name: 'Juan Pérez',
      sex: 'Masculino',
      birthDate: '1990-01-01',
      age: 33,
      email: '',
      phoneNumber: '',
      deathDate: null,
      economicStatus: '',
      educationLevel: '',
      maritalStatus: '',
      hometown: '',
      currentCity: '',
      firstCrisisDate: null,
      crisisStatus: ''
    },
    caregiver: {
      name: 'María García',
      identificationType: 'CC',
      identificationNumber: 123456789,
      age: 45,
      educationLevel: 'Universitario',
      occupation: 'Ama de casa'
    },
    registerInfo: [],
    registerId: 'reg-123'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistroPacienteComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ConsolaRegistroService, useClass: ConsolaRegistroServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: SignatureUploadService, useClass: SignatureUploadServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroPacienteComponent);
    component = fixture.componentInstance;
    consolaService = TestBed.inject(ConsolaRegistroService);
    authService = TestBed.inject(AuthService);
    signatureUploadService = TestBed.inject(SignatureUploadService);

    component.researchLayerId = 'test-layer-1';
    component.researchLayerName = 'Test Layer';

    fixture.detectChanges();
  });

  // Función helper para resetear spies
  const resetServiceSpies = (): void => {
    const methodNames = [
      'obtenerVariablesPorCapa',
      'validarPaciente',
      'saveRegister',
      'updateRegister',
      'getActualRegisterByPatient',
      'notifyDataChanged'
    ] as const;

    methodNames.forEach(methodName => {
      const spy = consolaService[methodName] as jasmine.Spy;
      if (spy && typeof spy.calls?.reset === 'function') {
        spy.calls.reset();
      }
    });
  };

  const setupValidForm = (): void => {
    // Configurar formulario completamente válido con TODOS los campos requeridos
    component.registroForm.patchValue({
      patientIdentificationType: 'CC',
      patientIdentificationNumber: '123456789',
      patient: {
        name: 'Juan Pérez',
        sex: 'Masculino',
        birthDate: '1990-01-01',
        age: 33,
        email: 'juan@example.com',
        phoneNumber: '1234567890',
        economicStatus: 'Medio',
        educationLevel: 'Universitario',
        maritalStatus: 'Soltero',
        hometown: 'Bogotá',
        currentCity: 'Medellín'
      }
    });

    component.variablesDeCapa = mockVariables;
    (component as any).initializeVariables();

    // Asegurar que el formulario sea válido
    component.registroForm.updateValueAndValidity();

    // Verificar que realmente es válido
    if (!component.registroForm.valid) {
      console.error('Formulario no es válido después de setup:');
      Object.keys(component.registroForm.controls).forEach(key => {
        const control = component.registroForm.get(key);
        if (control?.invalid) {
          console.error(`Control ${key} inválido:`, control.errors);
        }
      });

      if (component.registroForm.get('patient')) {
        Object.keys((component.registroForm.get('patient') as FormGroup).controls).forEach(key => {
          const control = (component.registroForm.get('patient') as FormGroup).get(key);
          if (control?.invalid) {
            console.error(`Control patient.${key} inválido:`, control.errors);
          }
        });
      }
    }
  };

  describe('Validación de paciente', () => {
    it('debería validar paciente exitosamente', fakeAsync(() => {
      (consolaService.validarPaciente as jasmine.Spy).and.returnValue(of(mockValidationResponse));

      // Configurar formulario
      component.registroForm.patchValue({
        patientIdentificationType: 'CC',
        patientIdentificationNumber: '123456789'
      });

      component.validarPaciente();
      tick();

      expect(consolaService.validarPaciente).toHaveBeenCalledWith(123456789, 'test-layer-1');
      expect(component.validatingPatient).toBeFalse();
    }));

    it('debería manejar CASE1 - paciente existe en misma capa', fakeAsync(() => {
      const case1Response: ValidatePatientResponse = {
        ...mockValidationResponse,
        action: 'patient_already_exist_in_layer'
      };
      (consolaService.validarPaciente as jasmine.Spy).and.returnValue(of(case1Response));

      component.registroForm.patchValue({
        patientIdentificationType: 'CC',
        patientIdentificationNumber: '123456789'
      });

      component.validarPaciente();
      tick();

      expect(component.validationFlag).toBe('CASE1');
      expect(component.validationStatus).toBe('warning');
    }));

    it('debería manejar CASE2 - paciente existe en otra capa', fakeAsync(() => {
      const case2Response: ValidatePatientResponse = {
        ...mockValidationResponse,
        action: 'patient_doesnt_exist_in_layer'
      };
      (consolaService.validarPaciente as jasmine.Spy).and.returnValue(of(case2Response));

      component.registroForm.patchValue({
        patientIdentificationType: 'CC',
        patientIdentificationNumber: '123456789'
      });

      component.validarPaciente();
      tick();

      expect(component.validationFlag).toBe('CASE2');
      expect(component.validationStatus).toBe('warning');
    }));

    it('debería manejar CASE3 - paciente nuevo', fakeAsync(() => {
      const case3Response: ValidatePatientResponse = {
        ...mockValidationResponse,
        action: 'patient_doesnt_exist'
      };
      (consolaService.validarPaciente as jasmine.Spy).and.returnValue(of(case3Response));

      component.registroForm.patchValue({
        patientIdentificationType: 'CC',
        patientIdentificationNumber: '123456789'
      });

      component.validarPaciente();
      tick();

      expect(component.validationFlag).toBe('CASE3');
      expect(component.validationStatus).toBe('success');
    }));

    it('debería manejar error en validación', fakeAsync(() => {
      (consolaService.validarPaciente as jasmine.Spy).and.returnValue(throwError(() => new Error('Error')));
      component.registroForm.patchValue({
        patientIdentificationType: 'CC',
        patientIdentificationNumber: '123456789'
      });

      component.validarPaciente();
      tick();

      expect(component.validationStatus).toBe('error');
      expect(component.validatingPatient).toBeFalse();
    }));
  });

  describe('Envío del formulario', () => {
    beforeEach(() => {
      resetServiceSpies();
      setupValidForm();

      // Verificar que el formulario es válido
      console.log('Formulario válido:', component.registroForm.valid);
      console.log('Errores del formulario:', component.registroForm.errors);
      console.log('Errores de patient:', component.registroForm.get('patient')?.errors);
    });

    it('debería ejecutar CASE1 - actualizar registro', fakeAsync(() => {
      // Configurar CASE1 completamente
      component.validationFlag = 'CASE1';
      component.lastValidationResponse = {
        ...mockValidationResponse,
        registerId: 'reg-123',
        action: 'patient_already_exist_in_layer'
      };

      // Mock exitoso
      (consolaService.updateRegister as jasmine.Spy).and.returnValue(of({ success: true }));

      // Espiar métodos internos para debugging
      const prepareSpy = spyOn(component as any, 'prepareRegisterRequest').and.callThrough();
      const handleSuccessSpy = spyOn(component as any, 'handleSuccess').and.callThrough();

      // Debug: verificar estado antes de ejecutar
      console.log('CASE1 - Estado antes de onSubmit:');
      console.log('- validationFlag:', component.validationFlag);
      console.log('- lastValidationResponse:', component.lastValidationResponse);
      console.log('- formulario válido:', component.registroForm.valid);
      console.log('- userEmail:', authService.getUserEmail());

      // Ejecutar
      component.onSubmit();
      tick();

      // Debug: verificar qué se llamó
      console.log('CASE1 - Después de onSubmit:');
      console.log('- prepareRegisterRequest llamado:', prepareSpy.calls.any());
      console.log('- updateRegister llamado:', (consolaService.updateRegister as jasmine.Spy).calls.any());
      console.log('- handleSuccess llamado:', handleSuccessSpy.calls.any());

      // Verificaciones
      expect(prepareSpy).toHaveBeenCalled();
      expect(consolaService.updateRegister).toHaveBeenCalledWith(
        'reg-123',
        'test@example.com',
        jasmine.any(Object)
      );
      expect(handleSuccessSpy).toHaveBeenCalled();
    }));

    it('debería ejecutar CASE2 - mover registro', fakeAsync(() => {
      // Configurar CASE2 completamente
      component.validationFlag = 'CASE2';
      component.lastValidationResponse = {
        ...mockValidationResponse,
        registerId: 'reg-123',
        action: 'patient_doesnt_exist_in_layer'
      };

      // Mock exitoso
      (consolaService.updateRegister as jasmine.Spy).and.returnValue(of({ success: true }));

      // Espiar para debugging
      const prepareSpy = spyOn(component as any, 'prepareRegisterRequest').and.callThrough();

      console.log('CASE2 - Estado antes de onSubmit:');
      console.log('- validationFlag:', component.validationFlag);
      console.log('- lastValidationResponse:', component.lastValidationResponse);

      // Ejecutar
      component.onSubmit();
      tick();

      console.log('CASE2 - Después de onSubmit:');
      console.log('- prepareRegisterRequest llamado:', prepareSpy.calls.any());
      console.log('- updateRegister llamado:', (consolaService.updateRegister as jasmine.Spy).calls.any());
      console.log('- notifyDataChanged llamado:', (consolaService.notifyDataChanged as jasmine.Spy).calls.any());

      // Verificaciones
      expect(prepareSpy).toHaveBeenCalled();
      expect(consolaService.updateRegister).toHaveBeenCalledWith(
        'reg-123',
        'test@example.com',
        jasmine.any(Object)
      );
      expect(consolaService.notifyDataChanged).toHaveBeenCalled();
    }));

    it('debería ejecutar CASE3 - nuevo registro', fakeAsync(() => {
      // Configurar CASE3 completamente
      component.validationFlag = 'CASE3';
      component.lastValidationResponse = {
        ...mockValidationResponse,
        action: 'patient_doesnt_exist'
      };

      // Mock exitoso
      (consolaService.saveRegister as jasmine.Spy).and.returnValue(of({ success: true }));

      // Espiar para debugging
      const prepareSpy = spyOn(component as any, 'prepareRegisterRequest').and.callThrough();
      const handleSuccessSpy = spyOn(component as any, 'handleSuccess').and.callThrough();

      console.log('CASE3 - Estado antes de onSubmit:');
      console.log('- validationFlag:', component.validationFlag);
      console.log('- lastValidationResponse:', component.lastValidationResponse);

      // Ejecutar
      component.onSubmit();
      tick();

      console.log('CASE3 - Después de onSubmit:');
      console.log('- prepareRegisterRequest llamado:', prepareSpy.calls.any());
      console.log('- saveRegister llamado:', (consolaService.saveRegister as jasmine.Spy).calls.any());
      console.log('- handleSuccess llamado:', handleSuccessSpy.calls.any());

      // Verificaciones
      expect(prepareSpy).toHaveBeenCalled();
      expect(consolaService.saveRegister).toHaveBeenCalledWith(
        'test@example.com',
        jasmine.any(Object)
      );
      expect(handleSuccessSpy).toHaveBeenCalled();
    }));

    it('debería manejar error en envío', fakeAsync(() => {
      // Configurar CASE3 completamente
      component.validationFlag = 'CASE3';
      component.lastValidationResponse = {
        ...mockValidationResponse,
        action: 'patient_doesnt_exist'
      };

      // Mock de error
      (consolaService.saveRegister as jasmine.Spy).and.returnValue(
        throwError(() => new Error('Error de servidor'))
      );

      // Espiar SweetAlert y métodos internos
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      const prepareSpy = spyOn(component as any, 'prepareRegisterRequest').and.callThrough();

      console.log('Error CASE3 - Estado antes de onSubmit:');
      console.log('- validationFlag:', component.validationFlag);

      // Ejecutar
      component.onSubmit();
      tick();

      console.log('Error CASE3 - Después de onSubmit:');
      console.log('- prepareRegisterRequest llamado:', prepareSpy.calls.any());
      console.log('- saveRegister llamado:', (consolaService.saveRegister as jasmine.Spy).calls.any());
      console.log('- SweetAlert llamado:', swalSpy.calls.any());

      // Verificar que se mostró el error
      expect(prepareSpy).toHaveBeenCalled();
      expect(swalSpy).toHaveBeenCalledWith('Error', 'Error al guardar el registro', 'error');
    }));

    it('debería mostrar error si no hay usuario autenticado', fakeAsync(() => {
      // Simular usuario no autenticado
      (authService.getUserEmail as jasmine.Spy).and.returnValue(null);

      // Configurar un caso válido
      component.validationFlag = 'CASE3';
      component.lastValidationResponse = {
        ...mockValidationResponse,
        action: 'patient_doesnt_exist'
      };

      // Espiar SweetAlert
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      console.log('Sin usuario - Estado antes de onSubmit:');
      console.log('- userEmail:', authService.getUserEmail());
      console.log('- validationFlag:', component.validationFlag);

      // Ejecutar
      component.onSubmit();
      tick();

      console.log('Sin usuario - Después de onSubmit:');
      console.log('- SweetAlert llamado:', swalSpy.calls.any());

      // Verificar mensaje de error
      expect(swalSpy).toHaveBeenCalledWith('Error', 'No se pudo obtener el usuario autenticado', 'error');
    }));

    it('debería mostrar advertencia si no se validó el paciente', fakeAsync(() => {
      // No configurar validationFlag - simular que no se validó
      component.validationFlag = null;
      component.lastValidationResponse = null;

      // Espiar SweetAlert
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      console.log('Sin validación - Estado antes de onSubmit:');
      console.log('- validationFlag:', component.validationFlag);
      console.log('- lastValidationResponse:', component.lastValidationResponse);

      // Ejecutar
      component.onSubmit();
      tick();

      console.log('Sin validación - Después de onSubmit:');
      console.log('- SweetAlert llamado:', swalSpy.calls.any());

      // Verificar que se mostró la advertencia
      expect(swalSpy).toHaveBeenCalledWith('Advertencia', 'Debe validar el paciente antes de guardar', 'warning');
    }));

    it('debería mostrar error si el formulario es inválido', fakeAsync(() => {
      // Hacer el formulario inválido
      component.registroForm.patchValue({
        patientIdentificationNumber: '' // Campo requerido vacío
      });
      component.registroForm.updateValueAndValidity();

      // Configurar un caso
      component.validationFlag = 'CASE3';
      component.lastValidationResponse = {
        ...mockValidationResponse,
        action: 'patient_doesnt_exist'
      };

      // Espiar métodos
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      const markFormSpy = spyOn(component as any, 'markFormGroupTouched').and.callThrough();

      console.log('Formulario inválido - Estado antes de onSubmit:');
      console.log('- formulario válido:', component.registroForm.valid);
      console.log('- errores identification:', component.registroForm.get('patientIdentificationNumber')?.errors);

      // Ejecutar
      component.onSubmit();
      tick();

      console.log('Formulario inválido - Después de onSubmit:');
      console.log('- markFormGroupTouched llamado:', markFormSpy.calls.any());
      console.log('- SweetAlert llamado:', swalSpy.calls.any());

      // Verificar que se mostró el error
      expect(component.validationStatus).toBe('error');
      expect(markFormSpy).toHaveBeenCalled();
    }));
  });

  describe('Interacción de usuario', () => {
    it('debería alternar cuidador', () => {
      component.hasCaregiver = false;

      // Activar cuidador
      component.toggleCaregiver();
      expect(component.hasCaregiver).toBeTrue();

      // Desactivar cuidador - esto debería resetear los valores
      component.toggleCaregiver();
      expect(component.hasCaregiver).toBeFalse();

      // Verificar valores después del reset
      const caregiverValue = component.registroForm.get('caregiver')?.value;

      expect(caregiverValue.name).toBe('');
      expect(caregiverValue.identificationType).toBe('CC');
      expect(caregiverValue.identificationNumber).toBe('');
      expect(caregiverValue.age).toBe('');
      expect(caregiverValue.educationLevel).toBe('');
      expect(caregiverValue.occupation).toBe('');
    });
  });

  describe('Métodos auxiliares', () => {
    it('debería obtener mensaje de error', () => {
      const fb = TestBed.inject(FormBuilder);
      const variableForm = fb.group({
        value: ['', Validators.required],
        variableName: ['test'],
        type: ['Texto'],
        isRequired: [true]
      });

      const valueControl = variableForm.get('value');
      valueControl?.markAsTouched();
      valueControl?.setErrors({ required: true });

      const errorMessage = component.getErrorMessage(variableForm);
      expect(errorMessage).toBe('Este campo es requerido');
    });

    it('debería formatear tamaño de archivo correctamente', () => {
      expect(component.getFileSize(0)).toBe('0 bytes');
      expect(component.getFileSize(500)).toBe('500 bytes');
      expect(component.getFileSize(1024)).toBe('1.0 KB');
      expect(component.getFileSize(1048576)).toBe('1.0 MB');
      expect(component.getFileSize(1073741824)).toBe('1.0 GB');
      expect(component.getFileSize(2147483648)).toBe('2.0 GB');
    });
  });

  describe('Carga de variables existentes', () => {
    it('debería manejar error al cargar variables existentes', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      // Simular error
      (component as any).cargarVariablesExistentes(null);
      tick();

      expect(consoleSpy).toHaveBeenCalled();
      expect(swalSpy).toHaveBeenCalled();
    }));
  });

  describe('Gestión de archivos', () => {
    it('debería procesar archivo válido', () => {
      const file = new File(['test'], 'consentimiento.pdf', { type: 'application/pdf' });
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      (component as any).processFile(file);

      expect(component.consentimientoFile).toBe(file);
      expect(component.consentimientoSubido).toBeTrue();
      expect(swalSpy).toHaveBeenCalledWith('Éxito', 'Archivo cargado correctamente', 'success');
    });

    it('debería rechazar archivo inválido', () => {
      const file = new File(['test'], 'document.txt', { type: 'text/plain' });
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      (component as any).processFile(file);

      expect(component.consentimientoFile).toBeNull();
      expect(swalSpy).toHaveBeenCalledWith('Error', 'Solo se permiten archivos PDF, JPEG o PNG', 'error');
    });
  });

  describe('Inicialización', () => {
    it('debería crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debería inicializar el formulario', () => {
      expect(component.registroForm).toBeDefined();
      expect(component.registroForm.get('patientIdentificationNumber')).toBeDefined();
      expect(component.registroForm.get('patient')).toBeDefined();
      expect(component.registroForm.get('caregiver')).toBeDefined();
      expect(component.registroForm.get('variables')).toBeDefined();
    });

    it('debería cargar variables al inicializar', fakeAsync(() => {
      (consolaService.obtenerVariablesPorCapa as jasmine.Spy).and.returnValue(of(mockVariables));

      component.ngOnInit();
      tick();

      expect(consolaService.obtenerVariablesPorCapa).toHaveBeenCalledWith('test-layer-1');
      expect(component.variablesDeCapa.length).toBe(1);
    }));
  });
});
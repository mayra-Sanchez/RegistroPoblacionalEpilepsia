import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaRegistroService } from '../consola-registro.service';
import { AuthService } from 'src/app/services/auth.service';
import { Register } from '../../modules/consola-registro/interfaces';
import { environment } from '../../environments/environment';

describe('ConsolaRegistroService', () => {
  let service: ConsolaRegistroService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const API_REGISTERS = `${environment.backendUrl}${environment.endpoints.registers}`;

  // 🔹 Mock válido de registro (mínimo necesario según tu interfaz)
  const mockRegister: Register = {
    registerId: '1',
    registerDate: '2025-09-14',
    updateRegisterDate: null,
    updatedBy: 'tester',
    patientIdentificationNumber: 123,
    patientIdentificationType: 'CC',
    registerInfo: [],
    patientBasicInfo: {
      name: 'Paciente Test',
      sex: 'M',
      birthDate: '1990-01-01',
      age: 35,
      email: 'paciente@test.com',
      phoneNumber: '3001234567',
      deathDate: null,
      economicStatus: 'medio',
      educationLevel: 'universitario',
      maritalStatus: 'soltero',
      hometown: 'Bogotá',
      currentCity: 'Cali',
      firstCrisisDate: '2000-01-01',
      crisisStatus: 'activo'
    },
    caregiver: null,
    healthProfessional: null
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue('fake-jwt-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConsolaRegistroService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ConsolaRegistroService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ------------------ getRegistros ------------------
  it('✅ getRegistros devuelve lista mockeada', () => {
    const mockResponse = { registers: [mockRegister] };

    service.obtenerRegistros().subscribe(resp => {
      expect(resp.registers[0].registerId).toBe('1');
      expect(resp.registers.length).toBe(1);
    });

    const req = httpMock.expectOne(`${API_REGISTERS}/all?page=0&size=10&sort=registerDate&sortDirection=DESC`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // ------------------ getRegistroById ------------------
  it('✅ getRegistroById devuelve registro específico', () => {
    service.obtenerCapaPorId('1').subscribe(resp => {
      expect(resp.id).toBe('1');
    });

    const req = httpMock.expectOne(`${environment.backendUrl}${environment.endpoints.researchLayer}?id=1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: '1', researchLayerId: 'layer1', layerName: 'Test Layer', description: 'desc', layerBoss: { id: 1, name: 'Dr', identificationNumber: '111' } });
  });

  // ------------------ createRegistro ------------------
  it('✅ createRegistro devuelve registro creado con ID', () => {
    service.registrarRegistro(mockRegister, 'user@test.com').subscribe(resp => {
      expect(resp.registerId).toBe('1');
    });

    const req = httpMock.expectOne(`${API_REGISTERS}?userEmail=user@test.com`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRegister);
  });

  // ------------------ updateRegistro ------------------
  it('✅ updateRegistro devuelve registro actualizado', () => {
    const updatedRegister = { ...mockRegister, updatedBy: 'admin' };

    service.actualizarRegistro('1', 'user@test.com', updatedRegister as any).subscribe(resp => {
      expect(resp.updatedBy).toBe('admin');
    });

    const req = httpMock.expectOne(`${API_REGISTERS}?registerId=1&userEmail=user@test.com`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedRegister);
  });

  // ------------------ deleteRegistro ------------------
  // ------------------ deleteRegistro ------------------
  it('✅ deleteRegistro devuelve confirmación de eliminación', () => {
    service.deleteRegistro('1').subscribe((resp: any) => {
      expect(resp).toEqual({ success: true });
    });

    const req = httpMock.expectOne(`${API_REGISTERS}?registerId=1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ------------------ Manejar error 404 ------------------
  it('❌ getRegistroById devuelve error 404 controlado', () => {
    service.obtenerCapaPorId('999').subscribe({
      next: () => fail('Debe fallar con 404'),
      error: (err) => {
        expect(err.message).toContain('Failed to fetch layer with ID: 999');
      }
    });

    const req = httpMock.expectOne(`${environment.backendUrl}${environment.endpoints.researchLayer}?id=999`);
    req.flush('No encontrado', { status: 404, statusText: 'Not Found' });
  });
});

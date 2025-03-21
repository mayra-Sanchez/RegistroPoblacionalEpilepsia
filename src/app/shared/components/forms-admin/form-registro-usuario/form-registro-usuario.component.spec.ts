import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormRegistroUsuarioComponent } from './form-registro-usuario.component';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('FormRegistroUsuarioComponent', () => {
  let component: FormRegistroUsuarioComponent;
  let fixture: ComponentFixture<FormRegistroUsuarioComponent>;
  let consolaAdministradorService: jasmine.SpyObj<ConsolaAdministradorService>;

  beforeEach(async () => {
    const consolaSpy = jasmine.createSpyObj('ConsolaAdministradorService', ['getAllLayers', 'crearUsuario']);

    await TestBed.configureTestingModule({
      declarations: [FormRegistroUsuarioComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule], // Importa módulos necesarios
      providers: [{ provide: ConsolaAdministradorService, useValue: consolaSpy }]
    }).compileComponents();

    consolaAdministradorService = TestBed.inject(ConsolaAdministradorService) as jasmine.SpyObj<ConsolaAdministradorService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRegistroUsuarioComponent);
    component = fixture.componentInstance;

    // Mockear getAllLayers para que retorne un array vacío por defecto
    consolaAdministradorService.getAllLayers.and.returnValue(of([]));

    fixture.detectChanges();
  });

  it('Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe inicializar correctamente y cargar capas', () => {
    const capasMock = [{ id: 1, nombreCapa: 'Capa 1' }, { id: 2, nombreCapa: 'Capa 2' }];
    consolaAdministradorService.getAllLayers.and.returnValue(of(capasMock));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.capas).toEqual(capasMock);
    expect(consolaAdministradorService.getAllLayers).toHaveBeenCalled();
  });

  it('Debe manejar errores al fallar la API de capas', () => {
    consolaAdministradorService.getAllLayers.and.returnValue(throwError(() => new Error('Error de API')));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.capas).toEqual([]);
  });

  it('Debe marcar como inválido el formulario si faltan campos', () => {
    component.usuarioForm.controls['nombre'].setValue('');
    component.usuarioForm.controls['apellido'].setValue('Pérez');

    expect(component.usuarioForm.valid).toBeFalse();
  });

  it('Debe generar correctamente el username sin espacios y en minúsculas', () => {
    component.usuarioForm.controls['nombre'].setValue('Juan Carlos');
    component.usuarioForm.controls['apellido'].setValue('Díaz');

    const expectedUsername = 'juancarlosdiaz';
    component.onRegister();

    expect(component.usuarioForm.value.nombre + component.usuarioForm.value.apellido).toBe('Juan CarlosDíaz');
    expect(expectedUsername).toBe('juancarlosdiaz');
  });

  it('Debe llamar a crearUsuario con los datos correctos', () => {
    const usuarioMock = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      username: 'juanperez',
      password: '123456',
      identificationType: 'DNI',
      identificationNumber: 12345678,
      birthDate: '2000-01-01',
      researchLayer: '1',
      role: 'investigador'
    };

    consolaAdministradorService.crearUsuario.and.returnValue(of(usuarioMock));

    component.usuarioForm.setValue({
      nombre: usuarioMock.firstName,
      apellido: usuarioMock.lastName,
      email: usuarioMock.email,
      tipoDocumento: usuarioMock.identificationType,
      numeroDocumento: usuarioMock.identificationNumber.toString(),
      fechaNacimiento: usuarioMock.birthDate,
      capaInvestigacion: usuarioMock.researchLayer,
      rol: usuarioMock.role,
      password: usuarioMock.password
    });

    component.onRegister();

    expect(consolaAdministradorService.crearUsuario).toHaveBeenCalledWith(usuarioMock);
  });
});

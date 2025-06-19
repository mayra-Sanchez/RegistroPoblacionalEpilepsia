import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarUsuarioComponent } from './editar-usuario.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

// Mock del AuthService
const mockAuthService = {
  getUserId: () => '123',
  getUserEmail: () => 'test@example.com',
  getUserRole: () => 'ADMIN',
  obtenerUsuarioPorEmail: jasmine.createSpy('obtenerUsuarioPorEmail').and.returnValue(of({
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    username: 'johndoe',
    attributes: {
      identificationType: 'DNI',
      identificationNumber: '12345678',
      birthDate: '1990-01-01',
      researchLayerId: 'layer1',
      role: 'ADMIN'
    }
  })),
  updateUserData: jasmine.createSpy('updateUserData')
};

// Mock del ConsolaAdministradorService
const mockAdminService = {
  updateUsuario: jasmine.createSpy('updateUsuario').and.returnValue(of({ success: true }))
};

fdescribe('EditarUsuarioComponent', () => {
  let component: EditarUsuarioComponent;
  let fixture: ComponentFixture<EditarUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditarUsuarioComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConsolaAdministradorService, useValue: mockAdminService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditarUsuarioComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load user data on init if userData is not provided', () => {
    fixture.detectChanges();
    expect(mockAuthService.obtenerUsuarioPorEmail).toHaveBeenCalled();
    expect(component.editForm.value.firstName).toBe('John');
  });

  it('should patch form with userData if provided', () => {
    const userData = {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      username: 'alicesmith',
      attributes: {
        identificationType: 'CI',
        identificationNumber: '98765432',
        birthDate: '1985-06-15',
        researchLayerId: 'layer2',
        role: 'USER'
      }
    };
    component.userData = userData;
    fixture.detectChanges();

    expect(component.editForm.value.firstName).toBe('Alice');
    expect(component.editForm.value.researchLayer).toBe('layer2');
  });

  it('should not submit if form is invalid', () => {
    fixture.detectChanges();
    component.editForm.patchValue({ firstName: '' }); // invalid required field
    component.onSubmit();
    expect(mockAdminService.updateUsuario).not.toHaveBeenCalled();
  });

  it('should call updateUsuario when form is valid', () => {
    fixture.detectChanges();
    component.editForm.patchValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      identificationType: 'DNI',
      identificationNumber: '11122233',
      birthDate: '1992-04-10'
    });
    component.onSubmit();

    expect(mockAdminService.updateUsuario).toHaveBeenCalled();
  });

  it('should handle error when update fails', () => {
    mockAdminService.updateUsuario.and.returnValue(throwError(() => ({
      error: { message: 'Update failed' }
    })));
    fixture.detectChanges();

    component.editForm.patchValue({
      firstName: 'Error',
      lastName: 'Test',
      email: 'error@example.com',
      identificationType: 'DNI',
      identificationNumber: '99999999',
      birthDate: '2000-01-01'
    });
    component.onSubmit();

    expect(component.errorMessage).toContain('Update failed');
  });

  it('should toggle password visibility', () => {
    component.showPassword = false;
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });
});

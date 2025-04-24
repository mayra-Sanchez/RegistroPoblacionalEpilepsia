import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsolaAdministradorComponent } from './consola-administrador.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from 'src/app/login/services/auth.service';

// Mock del AuthService
const mockAuthService = {
  getToken: () => 'fake-jwt-token',  // Simula un token JWT válido
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
const mockConsolaService = {
  eliminarUsuario: jasmine.createSpy('eliminarUsuario').and.returnValue(of(null)),
  eliminarVariable: jasmine.createSpy('eliminarVariable').and.returnValue(of(null)),
  eliminarCapa: jasmine.createSpy('eliminarCapa').and.returnValue(of(null)),
};

describe('ConsolaAdministradorComponent', () => {
  let component: ConsolaAdministradorComponent;
  let consolaService: ConsolaAdministradorService;
  let fixture: ComponentFixture<ConsolaAdministradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ConsolaAdministradorComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConsolaAdministradorService, useValue: mockConsolaService } // Usa el mock aquí
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    consolaService = TestBed.inject(ConsolaAdministradorService);
    fixture = TestBed.createComponent(ConsolaAdministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open view modal for user', () => {
    const user = { nombre: 'Juan', apellido: 'Perez', documento: '12345', capa: 'Capa 1', rol: 'Admin' };
    component.handleView(user, 'usuario');
    expect(component.isViewing).toBeTrue();
    expect(component.viewedItem).toEqual(user);
    expect(component.viewType).toBe('usuario');
  });

  it('should open edit modal for user', () => {
    const user = { nombre: 'Juan', apellido: 'Perez', documento: '12345', capa: 'Capa 1', rol: 'Admin' };
    component.handleEdit(user, 'usuario');
    expect(component.isEditingUserModal).toBeTrue();
    expect(component.userToEdit).toEqual(user);
  });

  it('should delete user', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'reloadData');
    const user = { id: '1', nombre: 'Juan', apellido: 'Perez', documento: '12345' };
    component.usuariosData = [user];
    component.selectedTab = 'gestionUsuarios';
    fixture.detectChanges();
    component.handleDelete(user);
    tick();
    fixture.detectChanges();
    expect(component.reloadData).toHaveBeenCalled();
  }));

  it('should open view modal for variable', () => {
    const variable = { nombre: 'Var 1', descripcion: 'Desc', capa: 'Capa 1', tipo: 'Texto' };
    component.handleView(variable, 'variable');
    expect(component.isViewing).toBeTrue();
    expect(component.viewedItem).toEqual(variable);
    expect(component.viewType).toBe('variable');
  });

  it('should open edit modal for variable', () => {
    const variable = { nombre: 'Var 1', descripcion: 'Desc', capa: 'Capa 1', tipo: 'Texto' };
    component.handleEdit(variable, 'variable');
    expect(component.isEditingVar).toBeTrue();
    expect(component.varToEdit).toEqual(variable);
  });

  it('should delete variable', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'reloadData');
    const variable = { id: '1', nombre: 'Var 1', descripcion: 'Desc' };
    component.variablesData = [variable];
    component.selectedTab = 'gestionVariables';
    fixture.detectChanges();
    component.handleDelete(variable);
    tick();
    fixture.detectChanges();
    expect(component.reloadData).toHaveBeenCalled();
  }));

  it('should open view modal for capa', () => {
    const capa = { nombreCapa: 'Capa 1', descripcion: 'Desc', jefeCapa: { nombre: 'Pedro' } };
    component.handleView(capa, 'capa');
    expect(component.isViewing).toBeTrue();
    expect(component.viewedItem).toEqual(capa);
    expect(component.viewType).toBe('capa');
  });

  it('should open edit modal for capa', () => {
    const capa = { nombreCapa: 'Capa 1', descripcion: 'Desc', jefeCapa: { nombre: 'Pedro' } };
    component.handleEdit(capa, 'capa');
    expect(component.isEditingCapa).toBeTrue();
    expect(component.capaToEdit).toEqual(capa);
  });

  it('should delete capa', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'reloadData');
    const capa = { id: '1', nombreCapa: 'Capa 1', descripcion: 'Desc' };
    component.capasData = [capa];
    component.selectedTab = 'gestionCapas';
    fixture.detectChanges();
    component.handleDelete(capa);
    tick();
    fixture.detectChanges();
    expect(component.reloadData).toHaveBeenCalled();
  }));
});

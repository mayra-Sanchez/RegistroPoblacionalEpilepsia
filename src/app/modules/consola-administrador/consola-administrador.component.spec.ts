import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsolaAdministradorComponent } from './consola-administrador.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConsolaAdministradorService } from './services/consola-administrador.service';
import { of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminComponent', () => {
  let component: ConsolaAdministradorComponent;
  let consolaService: ConsolaAdministradorService;
  let fixture: ComponentFixture<ConsolaAdministradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ConsolaAdministradorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    consolaService = TestBed.inject(ConsolaAdministradorService);
  });

  beforeEach(() => {
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
    spyOn(component, 'reloadData'); // Espiamos reloadData
  
    const user = { id: '1', nombre: 'Juan', apellido: 'Perez', documento: '12345' };
    component.usuariosData = [user];
  
    spyOn(consolaService, 'eliminarUsuario').and.returnValue(of(null));
  
    component.selectedTab = 'gestionUsuarios'; // 👈 Asegurar que tiene un valor válido
    fixture.detectChanges();
  
    component.handleDelete(user);
    tick();
    fixture.detectChanges();
  
    expect(component.reloadData).toHaveBeenCalled(); // ✅ Ahora reloadData debería ejecutarse
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
    spyOn(component, 'reloadData'); // Espiamos reloadData
  
    const variable = { id: '1', nombre: 'Var 1', descripcion: 'Desc' };
    component.variablesData = [variable];
  
    spyOn(consolaService, 'eliminarVariable').and.returnValue(of(null));
  
    component.selectedTab = 'gestionVariables'; // 👈 Asegurar que tiene un valor válido
    fixture.detectChanges();
  
    component.handleDelete(variable);
    tick();
    fixture.detectChanges();
  
    expect(component.reloadData).toHaveBeenCalled(); // ✅ Se debe llamar reloadData
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
    spyOn(component, 'reloadData'); // Espiamos reloadData
  
    const capa = { id: '1', nombreCapa: 'Capa 1', descripcion: 'Desc' };
    component.capasData = [capa];
  
    spyOn(consolaService, 'eliminarCapa').and.returnValue(of(null));
  
    component.selectedTab = 'gestionCapas'; // 👈 Asegurar que tiene un valor válido
    fixture.detectChanges();
  
    component.handleDelete(capa);
    tick();
    fixture.detectChanges();
  
    expect(component.reloadData).toHaveBeenCalled(); // ✅ Verifica que reloadData se llama
  }));
  
});

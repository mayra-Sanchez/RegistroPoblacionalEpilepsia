import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarPacienteModalComponent } from './buscar-paciente-modal.component';

describe('BuscarPacienteModalComponent', () => {
  let component: BuscarPacienteModalComponent;
  let fixture: ComponentFixture<BuscarPacienteModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuscarPacienteModalComponent]
    });
    fixture = TestBed.createComponent(BuscarPacienteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

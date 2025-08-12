import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentimientoInformadoComponent } from './consentimiento-informado.component';

describe('ConsentimientoInformadoComponent', () => {
  let component: ConsentimientoInformadoComponent;
  let fixture: ComponentFixture<ConsentimientoInformadoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsentimientoInformadoComponent]
    });
    fixture = TestBed.createComponent(ConsentimientoInformadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

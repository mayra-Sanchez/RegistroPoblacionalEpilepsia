import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaDinamicaComponent } from './consulta-dinamica.component';

describe('ConsultaDinamicaComponent', () => {
  let component: ConsultaDinamicaComponent;
  let fixture: ComponentFixture<ConsultaDinamicaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaDinamicaComponent]
    });
    fixture = TestBed.createComponent(ConsultaDinamicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

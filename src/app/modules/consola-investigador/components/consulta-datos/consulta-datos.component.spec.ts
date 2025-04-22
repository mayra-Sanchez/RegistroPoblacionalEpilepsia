import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaDatosComponent } from './consulta-datos.component';

describe('ConsultaDatosComponent', () => {
  let component: ConsultaDatosComponent;
  let fixture: ComponentFixture<ConsultaDatosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaDatosComponent]
    });
    fixture = TestBed.createComponent(ConsultaDatosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

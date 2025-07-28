import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultasSupersetComponent } from './consultas-superset.component';

describe('ConsultasSupersetComponent', () => {
  let component: ConsultasSupersetComponent;
  let fixture: ComponentFixture<ConsultasSupersetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultasSupersetComponent]
    });
    fixture = TestBed.createComponent(ConsultasSupersetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

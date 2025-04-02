import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarProfesionalModalComponent } from './buscar-profesional-modal.component';

describe('BuscarProfesionalModalComponent', () => {
  let component: BuscarProfesionalModalComponent;
  let fixture: ComponentFixture<BuscarProfesionalModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuscarProfesionalModalComponent]
    });
    fixture = TestBed.createComponent(BuscarProfesionalModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

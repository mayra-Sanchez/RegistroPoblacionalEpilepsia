import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfesionalFormComponent } from './profesional-form.component';

describe('ProfesionalFormComponent', () => {
  let component: ProfesionalFormComponent;
  let fixture: ComponentFixture<ProfesionalFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfesionalFormComponent]
    });
    fixture = TestBed.createComponent(ProfesionalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

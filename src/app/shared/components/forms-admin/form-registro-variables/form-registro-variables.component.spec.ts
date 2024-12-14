import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRegistroVariablesComponent } from './form-registro-variables.component';

describe('FormRegistroVariablesComponent', () => {
  let component: FormRegistroVariablesComponent;
  let fixture: ComponentFixture<FormRegistroVariablesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormRegistroVariablesComponent]
    });
    fixture = TestBed.createComponent(FormRegistroVariablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

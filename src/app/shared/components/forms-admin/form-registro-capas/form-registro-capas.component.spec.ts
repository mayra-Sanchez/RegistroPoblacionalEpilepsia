import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRegistroCapasComponent } from './form-registro-capas.component';

describe('FormRegistroCapasComponent', () => {
  let component: FormRegistroCapasComponent;
  let fixture: ComponentFixture<FormRegistroCapasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormRegistroCapasComponent]
    });
    fixture = TestBed.createComponent(FormRegistroCapasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

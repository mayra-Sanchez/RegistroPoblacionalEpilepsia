import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRegistroUsuarioComponent } from './form-registro-usuario.component';

describe('FormRegistroUsuarioComponent', () => {
  let component: FormRegistroUsuarioComponent;
  let fixture: ComponentFixture<FormRegistroUsuarioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormRegistroUsuarioComponent]
    });
    fixture = TestBed.createComponent(FormRegistroUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuidadorFormComponent } from './cuidador-form.component';

describe('CuidadorFormComponent', () => {
  let component: CuidadorFormComponent;
  let fixture: ComponentFixture<CuidadorFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CuidadorFormComponent]
    });
    fixture = TestBed.createComponent(CuidadorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

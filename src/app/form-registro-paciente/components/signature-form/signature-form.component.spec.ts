import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignaturePadComponent } from './signature-form.component';

describe('SignatureFormComponent', () => {
  let component: SignaturePadComponent;
  let fixture: ComponentFixture<SignaturePadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SignaturePadComponent]
    });
    fixture = TestBed.createComponent(SignaturePadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

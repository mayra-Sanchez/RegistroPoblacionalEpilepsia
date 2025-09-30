import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadConsentimientoComponent } from './upload-consentimiento.component';

describe('UploadConsentimientoComponent', () => {
  let component: UploadConsentimientoComponent;
  let fixture: ComponentFixture<UploadConsentimientoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UploadConsentimientoComponent]
    });
    fixture = TestBed.createComponent(UploadConsentimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

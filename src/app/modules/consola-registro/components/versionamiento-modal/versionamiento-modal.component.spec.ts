import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersionamientoModalComponent } from './versionamiento-modal.component';

describe('VersionamientoModalComponent', () => {
  let component: VersionamientoModalComponent;
  let fixture: ComponentFixture<VersionamientoModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VersionamientoModalComponent]
    });
    fixture = TestBed.createComponent(VersionamientoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

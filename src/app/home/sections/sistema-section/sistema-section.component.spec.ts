import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SistemaSectionComponent } from './sistema-section.component';

describe('SistemaSectionComponent', () => {
  let component: SistemaSectionComponent;
  let fixture: ComponentFixture<SistemaSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SistemaSectionComponent]
    });
    fixture = TestBed.createComponent(SistemaSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

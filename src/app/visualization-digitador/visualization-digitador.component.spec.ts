import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizationDigitadorComponent } from './visualization-digitador.component';

describe('VisualizationDigitadorComponent', () => {
  let component: VisualizationDigitadorComponent;
  let fixture: ComponentFixture<VisualizationDigitadorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisualizationDigitadorComponent]
    });
    fixture = TestBed.createComponent(VisualizationDigitadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

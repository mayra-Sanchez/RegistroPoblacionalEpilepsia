import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsolaInvestigadorComponent } from './consola-investigador.component';

describe('ConsolaInvestigadorComponent', () => {
  let component: ConsolaInvestigadorComponent;
  let fixture: ComponentFixture<ConsolaInvestigadorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsolaInvestigadorComponent]
    });
    fixture = TestBed.createComponent(ConsolaInvestigadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficasInicioComponent } from './graficas-inicio.component';

describe('GraficasInicioComponent', () => {
  let component: GraficasInicioComponent;
  let fixture: ComponentFixture<GraficasInicioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GraficasInicioComponent]
    });
    fixture = TestBed.createComponent(GraficasInicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsolaRegistroComponent } from './consola-registro.component';

describe('ConsolaRegistroComponent', () => {
  let component: ConsolaRegistroComponent;
  let fixture: ComponentFixture<ConsolaRegistroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsolaRegistroComponent]
    });
    fixture = TestBed.createComponent(ConsolaRegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsolaAdministradorComponent } from './consola-administrador.component';

describe('ConsolaAdministradorComponent', () => {
  let component: ConsolaAdministradorComponent;
  let fixture: ComponentFixture<ConsolaAdministradorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsolaAdministradorComponent]
    });
    fixture = TestBed.createComponent(ConsolaAdministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

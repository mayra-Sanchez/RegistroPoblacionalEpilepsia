import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableVerUsuariosComponent } from './table-ver-usuarios.component';

describe('TableVerUsuariosComponent', () => {
  let component: TableVerUsuariosComponent;
  let fixture: ComponentFixture<TableVerUsuariosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableVerUsuariosComponent]
    });
    fixture = TestBed.createComponent(TableVerUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

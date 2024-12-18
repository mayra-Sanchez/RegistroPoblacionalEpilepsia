import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableVerConsultasComponent } from './table-ver-consultas.component';

describe('TableVerConsultasComponent', () => {
  let component: TableVerConsultasComponent;
  let fixture: ComponentFixture<TableVerConsultasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableVerConsultasComponent]
    });
    fixture = TestBed.createComponent(TableVerConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

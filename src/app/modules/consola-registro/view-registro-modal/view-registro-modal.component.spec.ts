import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRegistroModalComponent } from './view-registro-modal.component';

describe('ViewRegistroModalComponent', () => {
  let component: ViewRegistroModalComponent;
  let fixture: ComponentFixture<ViewRegistroModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ViewRegistroModalComponent]
    });
    fixture = TestBed.createComponent(ViewRegistroModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

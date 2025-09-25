import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRegistroModalComponent } from './edit-registro-modal.component';

describe('EditRegistroModalComponent', () => {
  let component: EditRegistroModalComponent;
  let fixture: ComponentFixture<EditRegistroModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditRegistroModalComponent]
    });
    fixture = TestBed.createComponent(EditRegistroModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

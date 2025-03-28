import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleEditComponent } from './handle-edit.component';

describe('HandleEditComponent', () => {
  let component: HandleEditComponent;
  let fixture: ComponentFixture<HandleEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HandleEditComponent]
    });
    fixture = TestBed.createComponent(HandleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

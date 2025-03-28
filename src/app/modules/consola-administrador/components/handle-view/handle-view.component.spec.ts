import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleViewComponent } from './handle-view.component';

describe('HandleViewComponent', () => {
  let component: HandleViewComponent;
  let fixture: ComponentFixture<HandleViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HandleViewComponent]
    });
    fixture = TestBed.createComponent(HandleViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicoFormComponent } from './clinico-form.component';

describe('ClinicoFormComponent', () => {
  let component: ClinicoFormComponent;
  let fixture: ComponentFixture<ClinicoFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClinicoFormComponent]
    });
    fixture = TestBed.createComponent(ClinicoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

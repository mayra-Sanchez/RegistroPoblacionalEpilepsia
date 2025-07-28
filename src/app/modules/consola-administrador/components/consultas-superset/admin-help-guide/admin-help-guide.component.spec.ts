import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminHelpGuideComponent } from './admin-help-guide.component';

describe('AdminHelpGuideComponent', () => {
  let component: AdminHelpGuideComponent;
  let fixture: ComponentFixture<AdminHelpGuideComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminHelpGuideComponent]
    });
    fixture = TestBed.createComponent(AdminHelpGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

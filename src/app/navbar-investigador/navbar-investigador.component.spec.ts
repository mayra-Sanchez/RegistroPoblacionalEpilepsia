import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarInvestigadorComponent } from './navbar-investigador.component';

describe('NavbarInvestigadorComponent', () => {
  let component: NavbarInvestigadorComponent;
  let fixture: ComponentFixture<NavbarInvestigadorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavbarInvestigadorComponent]
    });
    fixture = TestBed.createComponent(NavbarInvestigadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarRegistroComponent } from './navbar-registro.component';

describe('NavbarRegistroComponent', () => {
  let component: NavbarRegistroComponent;
  let fixture: ComponentFixture<NavbarRegistroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavbarRegistroComponent]
    });
    fixture = TestBed.createComponent(NavbarRegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

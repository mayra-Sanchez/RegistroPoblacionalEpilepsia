import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioSectionComponent } from './inicio-section.component';

describe('InicioSectionComponent', () => {
  let component: InicioSectionComponent;
  let fixture: ComponentFixture<InicioSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InicioSectionComponent]
    });
    fixture = TestBed.createComponent(InicioSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

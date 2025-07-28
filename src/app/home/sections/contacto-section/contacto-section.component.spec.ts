import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactoSectionComponent } from './contacto-section.component';

describe('ContactoSectionComponent', () => {
  let component: ContactoSectionComponent;
  let fixture: ComponentFixture<ContactoSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContactoSectionComponent]
    });
    fixture = TestBed.createComponent(ContactoSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

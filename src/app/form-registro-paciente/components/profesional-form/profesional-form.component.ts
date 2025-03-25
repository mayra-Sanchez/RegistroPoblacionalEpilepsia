import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/login/services/auth.service';

@Component({
  selector: 'app-profesional-form',
  templateUrl: './profesional-form.component.html',
  styleUrls: ['./profesional-form.component.css']
})
export class ProfesionalFormComponent implements OnInit {
  @Input() initialData: any; // Añadido el Input para datos iniciales
  @Output() prev = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  form: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      healthProfessionalId: ['', Validators.required],
      healthProfessionalName: ['', Validators.required],
      healthProfessionalIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    
    // Cargar datos iniciales si existen
    if (this.initialData) {
      this.form.patchValue(this.initialData);
    }
  }

  private loadUserData(): void {
    const userData = {
      id: this.authService.getUserEmail(),
      firstName: this.authService.getUserFirstName(),
      lastName: this.authService.getUserLastName(),
      identificationNumber: this.authService.getUserIdentificationNumber()
    };

    if (userData.id) {
      this.form.patchValue({
        healthProfessionalId: userData.id,
        healthProfessionalName: `${userData.firstName} ${userData.lastName}`.trim(),
        healthProfessionalIdentificationNumber: userData.identificationNumber
      });
    }
  }

  onPrevious(): void {
    this.prev.emit();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submit.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
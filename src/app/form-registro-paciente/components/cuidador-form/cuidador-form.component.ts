import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cuidador-form',
  templateUrl: './cuidador-form.component.html',
  styleUrls: ['./cuidador-form.component.css']
})
export class CuidadorFormComponent {
  @Input() initialData: any;
  @Output() next = new EventEmitter<any>();
  @Output() prev = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      caregiverName: ['', Validators.required],
      caregiverIdentificationType: ['', Validators.required],
      caregiverIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      caregiverAge: ['', [Validators.required, Validators.min(18)]],
      caregiverEducationLevel: ['', Validators.required],
      caregiverOccupation: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.initialData) {
      this.form.patchValue(this.initialData);
    }
  }

  // En cuidador-form.component.ts
  onSubmit(): void {
    if (this.form.valid) {
      // Transforma los datos antes de emitirlos
      const formData = this.form.value;
      const transformedData = {
        name: formData.caregiverName,
        identificationType: formData.caregiverIdentificationType,
        identificationNumber: formData.caregiverIdentificationNumber,
        age: formData.caregiverAge,
        educationLevel: formData.caregiverEducationLevel,
        occupation: formData.caregiverOccupation
      };

      this.next.emit(transformedData);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onPrevious(): void {
    this.prev.emit();
  }
}
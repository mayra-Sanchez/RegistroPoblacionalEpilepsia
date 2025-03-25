import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cuidador-form',
  templateUrl: './cuidador-form.component.html',
  styleUrls: ['./cuidador-form.component.css']
})
export class CuidadorFormComponent implements OnInit {
  @Input() tieneCuidador: boolean = false;
  @Input() initialData: any; // Input para datos iniciales
  @Output() next = new EventEmitter<any>(); // Cambiado para emitir los datos
  @Output() prev = new EventEmitter<void>();

  cuidadorForm: FormGroup; // Cambiado de 'form' a 'cuidadorForm' para consistencia

  constructor(private fb: FormBuilder) {
    this.cuidadorForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      caregiverName: [''],
      caregiverIdentificationType: [''],
      caregiverIdentificationNumber: ['', [Validators.pattern('^[0-9]+$')]],
      caregiverAge: ['', [Validators.min(1)]],
      caregiverEducationLevel: [''],
      caregiverOccupation: ['']
    });
  }

  ngOnInit(): void {
    if (this.initialData) {
      this.cuidadorForm.patchValue(this.initialData);
    }
  }

  onSubmit(): void {
    if (this.cuidadorForm.valid) {
      this.next.emit(this.cuidadorForm.value);
    } else {
      this.cuidadorForm.markAllAsTouched();
    }
  }

  onPrevious(): void {
    this.prev.emit();
  }
}
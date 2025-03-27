import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Register } from '../interfaces';

@Component({
  selector: 'app-edit-registro-modal',
  templateUrl: './edit-registro-modal.component.html',
  styleUrls: ['./edit-registro-modal.component.css']
})
export class EditRegistroModalComponent {
  @Input() registro: Register | null = null;
  @Input() closeModal!: () => void;
  @Output() saveChanges = new EventEmitter<Register>();

  onSubmit() {
    if (this.registro) {
      this.saveChanges.emit(this.registro);
      this.closeModal();
    }
  }
}
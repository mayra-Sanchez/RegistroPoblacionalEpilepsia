import { Component, Input } from '@angular/core';
import { Register } from '../interfaces';

@Component({
  selector: 'app-view-registro-modal',
  templateUrl: './view-registro-modal.component.html',
  styleUrls: ['./view-registro-modal.component.css']
})
export class ViewRegistroModalComponent {
  @Input() registro: Register | null = null;
  @Input() closeModal!: () => void;
}
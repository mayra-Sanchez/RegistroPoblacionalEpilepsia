import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { jsPDF } from 'jspdf';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  selectedTab: string = 'inicio';

  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

}
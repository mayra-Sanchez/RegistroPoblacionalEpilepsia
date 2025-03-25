import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-form.component.html',
  styleUrls: ['./signature-form.component.css']
})
export class SignaturePadComponent implements AfterViewInit {
  @ViewChild('signatureCanvas') signaturePadElement!: ElementRef<HTMLCanvasElement>;
  @Output() signatureSaved = new EventEmitter<string>();
  
  private signaturePad!: SignaturePad;

  ngAfterViewInit(): void {
    this.initializeSignaturePad();
  }

  private initializeSignaturePad(): void {
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
  }

  saveSignature(): void {
    if (!this.signaturePad.isEmpty()) {
      this.signatureSaved.emit(this.signaturePad.toDataURL());
    }
  }

  clearSignature(): void {
    this.signaturePad.clear();
  }
}
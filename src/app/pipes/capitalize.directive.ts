import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCapitalize]'
})
export class CapitalizeDirective {

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('blur')
  onBlur() {
    let value = this.el.nativeElement.value;
    if (value) {
      let capitalized = this.capitalizeWords(value);
      // Actualizar el valor en el formControl y en el input
      if (this.control.control) {
        this.control.control.setValue(capitalized, { emitEvent: false });
      }
      this.el.nativeElement.value = capitalized;
    }
  }

  private capitalizeWords(text: string): string {
    if (!text) return text;
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Mantener palabras vacías y capitalizar las demás
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .replace(/\s+/g, ' ') // Eliminar espacios múltiples
      .trim();
  }
}
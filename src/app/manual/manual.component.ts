import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.css']
})
export class ManualComponent {
  currentSection: number = 0;

  manualSections = [
    {
      title: 'Introducción',
      content: 'Bienvenido a la introducción del manual. Aquí encontrarás una descripción general de la aplicación.'
    },
    {
      title: 'Funcionalidades',
      content: 'En esta sección, descubrirás todas las funcionalidades que ofrece nuestra aplicación.'
    },
    {
      title: 'Configuración',
      content: 'Aprende cómo configurar la aplicación según tus necesidades en esta sección.'
    },
    {
      title: 'Soporte',
      content: '¿Necesitas ayuda? Encuentra toda la información de soporte aquí.'
    }
  ];

  goToSection(index: number) {
    this.currentSection = index;
  }

  prevSection() {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  nextSection() {
    if (this.currentSection < this.manualSections.length - 1) {
      this.currentSection++;
    }
  }
}
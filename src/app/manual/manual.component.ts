import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.css']
})
export class ManualComponent {
  @Input() isVisible = false; 
  @Input() onClose!: () => void; 
  currentSection = 0;

  
  manualSections = [
    {
      title: 'Introducción',
      content: 'Bienvenido al sistema RPE. Este manual te guiará a través de las funciones principales disponibles para médicos.'
    },
    {
      title: 'Registro de Pacientes',
      content: 'Aprende cómo registrar nuevos pacientes en el sistema, incluyendo sus datos personales y médicos.'
    },
    {
      title: 'Gestión de Historial Médico',
      content: 'Accede y edita el historial médico de los pacientes de forma rápida y segura.'
    },
    {
      title: 'Generación de Reportes',
      content: 'Genera reportes médicos detallados para tus pacientes en unos pocos pasos.'
    },
    {
      title: 'Soporte Técnico',
      content: '¿Tienes dudas? Aprende cómo contactar al equipo de soporte técnico para resolver tus inquietudes.'
    }
  ];

  nextSection(): void {
    if (this.currentSection < this.manualSections.length - 1) {
      this.currentSection++;
    }
  }

  prevSection(): void {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  goToSection(index: number): void {
    this.currentSection = index;
  }
}

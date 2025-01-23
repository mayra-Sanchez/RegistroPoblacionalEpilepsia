import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isModalVisible = false;
  modalType: 'login' | 'manual' = 'login';
  currentSection = 0;

  // Secciones del manual
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

  constructor(private router: Router) {}

  openModal(type: 'login' | 'manual'): void {
    this.isModalVisible = true;
    this.modalType = type;
    if (type === 'manual') {
      this.currentSection = 0; 
    }
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  navigateTo(route: string): void {
    this.router.navigate([`/${route}`]);
    this.closeModal();
  }

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

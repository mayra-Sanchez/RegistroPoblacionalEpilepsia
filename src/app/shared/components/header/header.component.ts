import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isModalVisible: boolean = false;  // Controla si el modal está visible
  modalType: string = '';  // Define el tipo de modal (login o help)
  currentHelpSection: string = '';  // Controla la sección actual del manual

  constructor(private router: Router) {}

  // Abre el modal de acuerdo al tipo
  openModal(modalType: string): void {
    this.modalType = modalType;  // Define el tipo del modal
    this.isModalVisible = true;  // Muestra el modal
    this.currentHelpSection = '';  // Resetea la sección de la guía
  }

  // Cierra el modal
  closeModal(): void {
    this.isModalVisible = false;  // Oculta el modal
    this.modalType = '';  // Resetea el tipo de modal
  }

  // Navegar a la ruta correspondiente
  navigateTo(route: string): void {
    this.isModalVisible = false;  // Cierra el modal al navegar
    if (route === '') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate([`/${route}`]);
    }
  }

  // Mostrar la sección correspondiente de la guía
  showHelpSection(section: string): void {
    this.currentHelpSection = section;  // Establece la sección activa de la guía
  }
}

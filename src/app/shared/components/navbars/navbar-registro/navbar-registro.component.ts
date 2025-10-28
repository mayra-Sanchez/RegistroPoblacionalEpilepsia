import { Component, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar-registro',
  templateUrl: './navbar-registro.component.html',
  styleUrls: ['./navbar-registro.component.css']
})
export class NavbarRegistroComponent {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicioDigitador';  

  // Array de pestañas disponibles para navegación
  private availableTabs: string[] = [
    'inicioDigitador', 
    'registroPaciente', 
    'listadoPacientes', 
    'consultaDatosDigitador'
  ];
  private currentTabIndex: number = 0;

  constructor() {
    this.currentTabIndex = this.availableTabs.indexOf(this.selectedTab);
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.currentTabIndex = this.availableTabs.indexOf(tab);
    this.tabSelected.emit(tab);  
  }

  // Navegación por teclado silenciosa para digitadores
  @HostListener('document:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    // Solo procesar si no estamos en un campo de entrada
    if (this.isInputElement(event.target as HTMLElement)) {
      return;
    }

    switch(event.key) {
      case 'ArrowLeft':
        this.navigateToPreviousTab();
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.navigateToNextTab();
        event.preventDefault();
        break;
      case 'Home':
        this.navigateToFirstTab();
        event.preventDefault();
        break;
      case 'End':
        this.navigateToLastTab();
        event.preventDefault();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        // Atajos numéricos (1-4) para pestañas específicas
        this.navigateToNumberedTab(parseInt(event.key) - 1);
        event.preventDefault();
        break;
      case 'r':
      case 'R':
        // Atajo directo para registro de paciente
        if (event.ctrlKey) {
          this.selectTab('registroPaciente');
          event.preventDefault();
        }
        break;
      case 'l':
      case 'L':
        // Atajo directo para listado de pacientes
        if (event.ctrlKey) {
          this.selectTab('listadoPacientes');
          event.preventDefault();
        }
        break;
    }
  }

  private navigateToPreviousTab(): void {
    if (this.currentTabIndex > 0) {
      this.currentTabIndex--;
    } else {
      // Circular: ir al último tab si estamos en el primero
      this.currentTabIndex = this.availableTabs.length - 1;
    }
    this.updateSelectedTab();
  }

  private navigateToNextTab(): void {
    if (this.currentTabIndex < this.availableTabs.length - 1) {
      this.currentTabIndex++;
    } else {
      // Circular: ir al primer tab si estamos en el último
      this.currentTabIndex = 0;
    }
    this.updateSelectedTab();
  }

  private navigateToFirstTab(): void {
    this.currentTabIndex = 0;
    this.updateSelectedTab();
  }

  private navigateToLastTab(): void {
    this.currentTabIndex = this.availableTabs.length - 1;
    this.updateSelectedTab();
  }

  private navigateToNumberedTab(index: number): void {
    if (index >= 0 && index < this.availableTabs.length) {
      this.currentTabIndex = index;
      this.updateSelectedTab();
    }
  }

  private updateSelectedTab(): void {
    this.selectedTab = this.availableTabs[this.currentTabIndex];
    this.tabSelected.emit(this.selectedTab);
  }

  private isInputElement(element: HTMLElement): boolean {
    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTags.includes(element.tagName) || element.isContentEditable;
  }

  // Método para obtener información de debug (opcional)
  getCurrentNavigationInfo(): string {
    return `Tab: ${this.selectedTab}, Index: ${this.currentTabIndex}`;
  }
}
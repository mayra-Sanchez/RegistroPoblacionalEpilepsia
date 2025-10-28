import { Component, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar-investigador',
  templateUrl: './navbar-investigador.component.html',
  styleUrls: ['./navbar-investigador.component.css']
})
export class NavbarInvestigadorComponent {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicioInvestigador';  

  // Array de pestañas disponibles para navegación
  private availableTabs: string[] = ['inicioInvestigador', 'consultaDatos'];
  private currentTabIndex: number = 0;

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.currentTabIndex = this.availableTabs.indexOf(tab);
    this.tabSelected.emit(tab);  
  }

  // Navegación por teclado silenciosa (sin mensajes)
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

  private updateSelectedTab(): void {
    this.selectedTab = this.availableTabs[this.currentTabIndex];
    this.tabSelected.emit(this.selectedTab);
  }

  private isInputElement(element: HTMLElement): boolean {
    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTags.includes(element.tagName) || element.isContentEditable;
  }
}
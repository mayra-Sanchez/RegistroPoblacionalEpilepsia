import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import {jwtDecode} from 'jwt-decode';

@Component({
  selector: 'app-navbar-admin',
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent implements OnInit {
  @Output() tabSelected = new EventEmitter<string>();
  selectedTab: string = 'inicioAdmin';
  isSuperAdmin: boolean = false;
  userFullName: string = '';

  // Array de pestañas disponibles para navegación
  private availableTabs: string[] = [
    'inicioAdmin', 
    'gestionUsuarios', 
    'gestionVariables', 
    'gestionCapas', 
    'gestionSuperset', 
    'historialRegistros'
  ];
  private currentTabIndex: number = 0;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.userFullName = this.authService.getUserFullName();
    this.currentTabIndex = this.availableTabs.indexOf(this.selectedTab);
  }

  private checkUserRole(): void {
    // Verifica tanto el rol de cliente como el de realm
    const token = localStorage.getItem('kc_token');
    if (token) {
      const decoded: any = jwtDecode(token);
      const clientRoles = decoded.resource_access?.['registers-users-api-rest']?.roles || [];
      const realmRoles = decoded.realm_access?.roles || [];
      
      this.isSuperAdmin = [...clientRoles, ...realmRoles].some(role => 
        role === 'SuperAdmin_client_role' || 
        role === 'SuperAdmin'
      );
    }
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.currentTabIndex = this.availableTabs.indexOf(tab);
    this.tabSelected.emit(tab);
  }

  // Navegación por teclado silenciosa para administradores
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
      case '5':
      case '6':
        // Atajos numéricos (1-6) para pestañas específicas
        this.navigateToNumberedTab(parseInt(event.key) - 1);
        event.preventDefault();
        break;
    }
  }

  private navigateToPreviousTab(): void {
    let newIndex = this.currentTabIndex - 1;
    
    // Navegar hasta encontrar una pestaña disponible
    while (newIndex >= 0) {
      if (this.isTabAvailable(this.availableTabs[newIndex])) {
        this.currentTabIndex = newIndex;
        this.updateSelectedTab();
        return;
      }
      newIndex--;
    }
    
    // Si no hay pestañas anteriores disponibles, ir a la última disponible
    this.navigateToLastAvailableTab();
  }

  private navigateToNextTab(): void {
    let newIndex = this.currentTabIndex + 1;
    
    // Navegar hasta encontrar una pestaña disponible
    while (newIndex < this.availableTabs.length) {
      if (this.isTabAvailable(this.availableTabs[newIndex])) {
        this.currentTabIndex = newIndex;
        this.updateSelectedTab();
        return;
      }
      newIndex++;
    }
    
    // Si no hay pestañas siguientes disponibles, ir a la primera disponible
    this.navigateToFirstAvailableTab();
  }

  private navigateToFirstTab(): void {
    this.currentTabIndex = 0;
    if (this.isTabAvailable(this.availableTabs[this.currentTabIndex])) {
      this.updateSelectedTab();
    } else {
      this.navigateToFirstAvailableTab();
    }
  }

  private navigateToLastTab(): void {
    this.currentTabIndex = this.availableTabs.length - 1;
    if (this.isTabAvailable(this.availableTabs[this.currentTabIndex])) {
      this.updateSelectedTab();
    } else {
      this.navigateToLastAvailableTab();
    }
  }

  private navigateToFirstAvailableTab(): void {
    for (let i = 0; i < this.availableTabs.length; i++) {
      if (this.isTabAvailable(this.availableTabs[i])) {
        this.currentTabIndex = i;
        this.updateSelectedTab();
        return;
      }
    }
  }

  private navigateToLastAvailableTab(): void {
    for (let i = this.availableTabs.length - 1; i >= 0; i--) {
      if (this.isTabAvailable(this.availableTabs[i])) {
        this.currentTabIndex = i;
        this.updateSelectedTab();
        return;
      }
    }
  }

  private navigateToNumberedTab(index: number): void {
    if (index >= 0 && index < this.availableTabs.length && 
        this.isTabAvailable(this.availableTabs[index])) {
      this.currentTabIndex = index;
      this.updateSelectedTab();
    }
  }

  private updateSelectedTab(): void {
    this.selectedTab = this.availableTabs[this.currentTabIndex];
    this.tabSelected.emit(this.selectedTab);
  }

  private isTabAvailable(tab: string): boolean {
    // La pestaña de historial solo está disponible para SuperAdmin
    if (tab === 'historialRegistros') {
      return this.isSuperAdmin;
    }
    return true;
  }

  private isInputElement(element: HTMLElement): boolean {
    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTags.includes(element.tagName) || element.isContentEditable;
  }

  // Método para obtener información de debug (opcional)
  getNavigationInfo(): string {
    return `Tab: ${this.selectedTab}, Index: ${this.currentTabIndex}, SuperAdmin: ${this.isSuperAdmin}`;
  }
}
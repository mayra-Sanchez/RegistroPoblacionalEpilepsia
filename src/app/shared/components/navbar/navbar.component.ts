import { Component, EventEmitter, Output, OnInit, HostListener, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicio';  

  isLoggedIn: boolean = false;
  userRoles: string[] = [];
  showKeyboardHint: boolean = false;
  
  // Propiedades públicas simplificadas
  isKeyboardMode: boolean = false;
  
  private hintTimeout: any;
  private availableTabs: string[] = ['inicio', 'sistema', 'contacto'];
  private currentTabIndex: number = 0;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userRoles = this.authService.getStoredRoles();

    this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        this.userRoles = this.authService.getStoredRoles();
      } else {
        this.userRoles = [];
      }
    });

    this.currentTabIndex = this.availableTabs.indexOf(this.selectedTab);
    this.showTemporaryHint(3000);
  }

  ngOnDestroy(): void {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
    }
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.currentTabIndex = this.availableTabs.indexOf(tab);
    this.isKeyboardMode = false; // Reset al usar mouse
    this.tabSelected.emit(tab);
  }

  volverAlDashboard(): void {
    if (this.userRoles.includes('Admin_client_role') || this.userRoles.includes('SuperAdmin_client_role')) {
      this.router.navigate(['/administrador']);
    } else if (this.userRoles.includes('Doctor_client_role')) {
      this.router.navigate(['/registro']);
    } else if (this.userRoles.includes('Researcher_client_role')) {
      this.router.navigate(['/investigador']);
    } else {
      this.router.navigate(['/']);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
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
        this.currentTabIndex = 0;
        this.updateSelectedTab();
        event.preventDefault();
        break;
      case 'End':
        this.currentTabIndex = this.availableTabs.length - 1;
        this.updateSelectedTab();
        event.preventDefault();
        break;
      case '?':
        this.showTemporaryHint(5000);
        event.preventDefault();
        break;
    }
  }

  private navigateToPreviousTab(): void {
    this.currentTabIndex = this.currentTabIndex > 0 ? this.currentTabIndex - 1 : this.availableTabs.length - 1;
    this.updateSelectedTab();
  }

  private navigateToNextTab(): void {
    this.currentTabIndex = this.currentTabIndex < this.availableTabs.length - 1 ? this.currentTabIndex + 1 : 0;
    this.updateSelectedTab();
  }

  private updateSelectedTab(): void {
    this.selectedTab = this.availableTabs[this.currentTabIndex];
    this.isKeyboardMode = true;
    this.showTemporaryHint(2000);
    this.tabSelected.emit(this.selectedTab);
  }

  private isInputElement(element: HTMLElement): boolean {
    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTags.includes(element.tagName) || element.isContentEditable;
  }

  private showTemporaryHint(duration: number = 3000): void {
    this.showKeyboardHint = true;
    
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
    }
    
    this.hintTimeout = setTimeout(() => {
      this.showKeyboardHint = false;
    }, duration);
  }
}
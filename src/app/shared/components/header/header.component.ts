import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/login/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isModalVisible = false;
  modalType: 'login' | 'manual' = 'login';
  isLoggedIn: boolean = false;
  username: string = '';
  userRole: string = ''; // 🔹 Agregar esta línea
  userIcon: string = 'fa fa-user'; // Ícono por defecto
  isSettingsMenuVisible = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.username = this.authService.getUsername();
    this.userRole = this.authService.getUserRole(); 
  
    this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        this.username = this.authService.getUsername();
        this.userRole = this.authService.getUserRole();
      }
    });
  }
  

  openModal(type: 'login' | 'manual'): void {
    this.modalType = type;
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  
  }
  

  navigateTo(route: string): void {
    this.closeModal();
  }

  handleLoginSuccess(): void {
    this.isModalVisible = false;
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuVisible = !this.isSettingsMenuVisible;
  }

  setUserIcon(role: string): void {
    switch (role) {
      case 'admin':
        this.userIcon = 'fa fa-user-shield';
        break;
      case 'doctor':
        this.userIcon = 'fa fa-user-md';
        break;
      case 'patient':
        this.userIcon = 'fa fa-user-injured';
        break;
      default:
        this.userIcon = 'fa fa-user';
    }
  }
}
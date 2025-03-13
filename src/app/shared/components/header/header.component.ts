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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
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
    this.router.navigate([`/${route}`]);
    this.closeModal();
  }

  handleLoginSuccess(): void {
    this.isModalVisible = false; // 🔹 Cerrar modal cuando el login es exitoso
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }
}

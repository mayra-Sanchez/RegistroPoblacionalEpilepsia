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

  constructor(private router: Router) {}

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
}

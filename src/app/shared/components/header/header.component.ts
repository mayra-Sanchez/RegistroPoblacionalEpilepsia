import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isModalVisible: boolean = false;

  constructor(private router: Router) {}

  openModal(): void {
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  navigateTo(route: string): void {
    this.isModalVisible = false; 
    if (route === '') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate([`/${route}`]); 
    }
  }
  
}

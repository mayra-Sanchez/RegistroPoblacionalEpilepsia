import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicio';  

  isLoggedIn: boolean = false;
  userRoles: string[] = [];

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
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
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
}

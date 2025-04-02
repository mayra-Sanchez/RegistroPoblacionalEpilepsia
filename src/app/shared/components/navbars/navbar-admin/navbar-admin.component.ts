import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth.service';
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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.userFullName = this.authService.getUserFullName();
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
    this.tabSelected.emit(tab);
  }
}
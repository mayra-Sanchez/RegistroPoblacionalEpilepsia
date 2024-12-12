import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar-admin',
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicioAdmin';  

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.tabSelected.emit(tab);  
  }
}

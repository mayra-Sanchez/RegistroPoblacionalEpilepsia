import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicio';  

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.tabSelected.emit(tab);  
  }
}

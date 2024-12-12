import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar-registro',
  templateUrl: './navbar-registro.component.html',
  styleUrls: ['./navbar-registro.component.css']
})
export class NavbarRegistroComponent {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicioAdmin';  

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.tabSelected.emit(tab);  
  }
}

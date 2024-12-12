import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar-investigador',
  templateUrl: './navbar-investigador.component.html',
  styleUrls: ['./navbar-investigador.component.css']
})
export class NavbarInvestigadorComponent {
  @Output() tabSelected = new EventEmitter<string>(); 
  selectedTab: string = 'inicioAdmin';  

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.tabSelected.emit(tab);  
  }
}

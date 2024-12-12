import { Component } from '@angular/core';

@Component({
  selector: 'app-consola-registro',
  templateUrl: './consola-registro.component.html',
  styleUrls: ['./consola-registro.component.css']
})
export class ConsolaRegistroComponent {
  selectedTab: string = 'inicio'; 
  
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }
}

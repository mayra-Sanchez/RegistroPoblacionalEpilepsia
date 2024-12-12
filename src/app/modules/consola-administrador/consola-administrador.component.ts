import { Component } from '@angular/core';

@Component({
  selector: 'app-consola-administrador',
  templateUrl: './consola-administrador.component.html',
  styleUrls: ['./consola-administrador.component.css']
})
export class ConsolaAdministradorComponent {
  selectedTab: string = 'inicio'; 
  
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }
}

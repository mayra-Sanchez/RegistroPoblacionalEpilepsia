import { Component } from '@angular/core';

@Component({
  selector: 'app-consola-investigador',
  templateUrl: './consola-investigador.component.html',
  styleUrls: ['./consola-investigador.component.css']
})
export class ConsolaInvestigadorComponent {
  selectedTab: string = 'inicio'; 
  
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }
}

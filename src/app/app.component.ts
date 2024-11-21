import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'RPE-Frontend';
  
  selectedTab: string = 'inicio'; 
  
  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }
}

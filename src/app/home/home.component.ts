import { Component } from '@angular/core';



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  selectedTab: string = 'inicio';

  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

}
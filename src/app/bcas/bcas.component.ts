import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-bcas',
  imports: [NgIf,NgFor],
  templateUrl: './bcas.component.html',
  styleUrl: './bcas.component.css'
})
export class BcasComponent {
activeTab = 'schedule';

  setTab(tab: string) {
    this.activeTab = tab;
  }
}

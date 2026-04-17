import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-icao',
  imports: [NgIf,NgFor],
  templateUrl: './icao.component.html',
  styleUrl: './icao.component.css'
})
export class IcaoComponent {
activeTab = 'schedule';

  setTab(tab: string) {
    this.activeTab = tab;
  }
}

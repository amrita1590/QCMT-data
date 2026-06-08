import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BcasInternalComponent } from './bcas-internal/bcas-internal.component';
import { BcasIcaoComponent } from './bcas-icao/bcas-icao.component';
import { BcasBcasComponent } from './bcas-bcas/bcas-bcas.component';

@Component({
  selector: 'app-bcas',
  imports: [CommonModule, BcasInternalComponent, BcasIcaoComponent, BcasBcasComponent],
  templateUrl: './bcas.component.html',
  styleUrl: './bcas.component.css'
})
export class BcasComponent {
  activeTab: 'BCAS' | 'Internal' | 'ICAO' = 'BCAS';
  setTab(tab: 'BCAS' | 'Internal' | 'ICAO') { this.activeTab = tab; }
}

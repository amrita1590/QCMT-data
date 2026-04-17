import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-internal-audit',
   standalone: true,
  imports: [FormsModule,NgIf], 
  templateUrl: './internal-audit.component.html',
  styleUrls: ['./internal-audit.component.css']
})

export class InternalAuditComponent {

  activeTab: string = 'schedule';

  auditSchedule = {
    auditorName: '',
    auditDate: '',
    asgName: '',
    auditType: '',
    status: 'Planned'
  };

  auditor = {
    rank: '',
    name: '',
    id: '',
    postingUnit: ''
  };

  questionCategory = {
    name: '',
    addedBy: '',
    status: 'Active'
  };

  observation = {
    criticality: '',
    complianceStatus: ''
  };

  setTab(tab: string) {
    this.activeTab = tab;
  }

  save(section: string) {
    alert(section + ' saved successfully');
  }
}

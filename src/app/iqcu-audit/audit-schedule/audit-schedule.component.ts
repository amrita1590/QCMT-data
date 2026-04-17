import { Component } from '@angular/core';
import {UnitDetails } from '../../interface/UnitDetails';
import { AuditSchedule } from '../../interface/audit-schedule';
import { UnitdetailsComponent } from '../../master/unitmaster/unitdetails/unitdetails.component';
@Component({
  selector: 'app-audit-schedule',
  templateUrl: './audit-schedule.component.html'
})
export class AuditScheduleComponent {

  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  selectedStatus = '';
  searchText = '';

  years: number[] = [];
  statuses = ['Planned', 'In Progress', 'Completed', 'Action Required'];

  audits: AuditSchedule[] = [
    {
      auditorName: 'Insp. Rajesh Kumar',
      auditDate: new Date('2026-01-20'),
      asgName: 'Delhi',
      auditType: 'Regular',
      status: 'Planned',auditYear: '2026', updateTime: '', createdBy: '', userId: 0, isActive: 1, unitmaster: null, auditorDetails: [], updteauditHistory: ''
    }
  ];

  filteredAudits: AuditSchedule[] = [];

  statusBadge: any = {
    Planned: 'bg-primary-subtle text-primary',
    'In Progress': 'bg-warning-subtle text-warning',
    Completed: 'bg-success-subtle text-success',
    'Action Required': 'bg-danger-subtle text-danger'
  };

  statusCards: any[] = [];

  ngOnInit() {
    this.initYears();
    this.applyFilters();
  }

  initYears() {
    const startYear = this.currentYear - 5;
    for (let y = this.currentYear; y >= startYear; y--) {
      this.years.push(y);
    }
  }

  applyFilters() {
    this.filteredAudits = this.audits.filter(a => {
      const matchesYear = new Date(a.auditDate).getFullYear() === +this.selectedYear;
      const matchesStatus = !this.selectedStatus || a.status === this.selectedStatus;
      const matchesText =
        !this.searchText ||
        a.auditorName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        a.asgName.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesYear && matchesStatus && matchesText;
    });

    this.updateStatusCards();
  }

  updateStatusCards() {
    this.statusCards = [
      { label: 'Planned', count: this.countByStatus('Planned'), border: 'border-primary' },
      { label: 'In Progress', count: this.countByStatus('In Progress'), border: 'border-warning' },
      { label: 'Completed', count: this.countByStatus('Completed'), border: 'border-success' },
      { label: 'Action Required', count: this.countByStatus('Action Required'), border: 'border-danger' }
    ];
  }

  countByStatus(status: string): number {
    return this.filteredAudits.filter(a => a.status === status).length;
  }
}

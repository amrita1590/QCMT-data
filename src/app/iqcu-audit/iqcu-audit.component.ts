import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuditorsComponent } from './auditors/auditors.component';
import { AuditScheduleComponent } from './audit-schedule/audit-schedule.component';


@Component({
  selector: 'app-iqcu-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,AuditorsComponent,AuditScheduleComponent],
  templateUrl: './iqcu-audit.component.html',
})
export class IqcuAuditComponent {

  /* ---------------- TAB CONTROL ---------------- */
  activeTab = 'schedule';

  setTab(tab: string) {
    this.activeTab = tab;
  }

  /* ---------------- REACTIVE FORMS ---------------- */
  auditScheduleForm!: FormGroup;
  auditorForm!: FormGroup;
  categoryForm!: FormGroup;
  questionnaireForm!: FormGroup;
  observationForm!: FormGroup;
  complianceForm!: FormGroup;

  isDialogOpen = false;
  searchTerm = '';
  filterStatus = 'all';

  constructor(private fb: FormBuilder) {

    /* -------- Audit Schedule Form -------- */
    this.auditScheduleForm = this.fb.group({
      auditorName: ['', Validators.required],
      auditDate: ['', Validators.required],
      asgName: ['', Validators.required],
      status: ['Planned']
    });

    /* -------- Auditor Master -------- */
    this.auditorForm = this.fb.group({
      rank: ['', Validators.required],
      name: ['', Validators.required],
      officerId: ['', Validators.required],
      unit: ['', Validators.required]
    });

    /* -------- Category -------- */
    this.categoryForm = this.fb.group({
      categoryName: ['', Validators.required],
      status: ['Active']
    });

    /* -------- Questionnaire -------- */
    this.questionnaireForm = this.fb.group({
      question: ['', Validators.required],
      benchmark: ['']
    });

    /* -------- Observation -------- */
    this.observationForm = this.fb.group({
      criticality: ['', Validators.required],
      complianceStatus: ['', Validators.required],
      responsibleOfficer: ['', Validators.required],
      deadline: ['', Validators.required]
    });

    /* -------- Compliance -------- */
    this.complianceForm = this.fb.group({
      complianceDetails: ['', Validators.required],
      upload: [null]
    });
  }

 

  
}

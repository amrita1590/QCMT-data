import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  INTERNAL_AUDIT_STAGE_CARDS,
  INTERNAL_AUDIT_STATUS_BADGE,
  INTERNAL_AUDIT_TABS,
  INTERNAL_AUDIT_UNITS
} from './internal-audit-master-data';
import {
  InternalAuditFile,
  InternalAuditObservation,
  InternalAuditSchedule,
  InternalAuditUnit
} from './internal-audit.model';

@Injectable({
  providedIn: 'root'
})
export class InternalAuditFacade {
  activeTab = 'schedule';
  selectedAuditId = 1;
  selectedObservationId: number | null = 101;
  searchText = '';
  selectedStatus = '';
  status = false;
  statusMsg = '';

  readonly tabs = INTERNAL_AUDIT_TABS;
  readonly units = INTERNAL_AUDIT_UNITS;
  readonly stageCards = INTERNAL_AUDIT_STAGE_CARDS;
  readonly statusBadge = INTERNAL_AUDIT_STATUS_BADGE;

  auditForm: FormGroup;
  questionnaireForm: FormGroup;
  responseForm: FormGroup;
  reportForm: FormGroup;
  observationForm: FormGroup;
  complianceForm: FormGroup;

  audits: InternalAuditSchedule[] = [
    {
      id: 1,
      auditRefNo: 'IA/DEL/2026/001',
      auditType: 'IG Audit',
      auditFromDate: '2026-05-06',
      auditToDate: '2026-05-08',
      auditorName: 'Insp. Rajesh Kumar',
      auditorRank: 'Insp',
      unit: INTERNAL_AUDIT_UNITS[0],
      status: 'In Progress',
      questions: [
        {
          id: 1,
          category: 'Access Control',
          question: 'Whether entry control register is maintained at all operational gates?',
          benchmark: 'Register with daily supervisory check',
          status: 'Active'
        }
      ],
      responses: [
        { questionId: 1, response: 'Yes', remarks: 'Register is maintained and checked by shift officer.' }
      ],
      reportFiles: [this.makeFile('internal-audit-report-del.pdf', 168000, 'Auditor')],
      observations: [
        {
          id: 101,
          slNo: 1,
          observation: 'Visitor register checking requires supervisory countersignature on every shift.',
          remarks: 'Observed during terminal gate inspection.',
          type: 'Moderate',
          status: 'Pending',
          complianceDetails: ''
        }
      ],
      complianceTrail: [
        'Internal audit scheduled by HQrs.',
        'Questionnaire sent to unit.',
        'Unit response submitted to auditor.'
      ]
    }
  ];

  constructor(private fb: FormBuilder) {
    this.auditForm = this.fb.group({
      auditRefNo: ['', Validators.required],
      auditType: ['IG Audit', Validators.required],
      unitId: ['', Validators.required],
      auditFromDate: ['', Validators.required],
      auditToDate: ['', Validators.required],
      auditorRank: ['', Validators.required],
      auditorName: ['', Validators.required],
      status: ['Planned', Validators.required]
    });

    this.questionnaireForm = this.fb.group({
      questions: this.fb.array([this.createQuestionRow()])
    });

    this.responseForm = this.fb.group({
      responses: this.fb.array([this.createResponseRow(1)])
    });

    this.reportForm = this.fb.group({
      auditorRemarks: ['', Validators.required],
      reportFiles: this.fb.array([])
    });

    this.observationForm = this.fb.group({
      observations: this.fb.array([this.createObservationRow(1)])
    });

    this.complianceForm = this.fb.group({
      complianceDetails: ['', Validators.required],
      status: ['Compliant', Validators.required]
    });
  }

  get filteredAudits(): InternalAuditSchedule[] {
    return this.audits.filter((audit) => {
      const search = this.searchText.trim().toLowerCase();
      const matchesText =
        !search ||
        audit.auditRefNo.toLowerCase().includes(search) ||
        audit.unit.unitName.toLowerCase().includes(search) ||
        audit.auditorName.toLowerCase().includes(search);
      const matchesStatus = !this.selectedStatus || audit.status === this.selectedStatus;
      return matchesText && matchesStatus;
    });
  }

  get selectedAudit(): InternalAuditSchedule | undefined {
    return this.audits.find((audit) => audit.id === this.selectedAuditId);
  }

  get selectedObservation(): InternalAuditObservation | undefined {
    return this.selectedAudit?.observations.find((observation) => observation.id === this.selectedObservationId);
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  selectAudit(audit: InternalAuditSchedule): void {
    this.selectedAuditId = audit.id;
    this.selectedObservationId = audit.observations[0]?.id ?? null;
    this.prepareResponseRows(audit);
  }

  selectObservation(observationId: number): void {
    this.selectedObservationId = observationId;
  }

  countByStatus(status: string): number {
    return this.audits.filter((audit) => audit.status === status).length;
  }

  saveAudit(): void {
    if (this.auditForm.invalid) {
      this.auditForm.markAllAsTouched();
      return;
    }

    const unit = this.units.find((item) => item.id === +this.auditForm.value.unitId) as InternalAuditUnit;
    const audit: InternalAuditSchedule = {
      id: Date.now(),
      auditRefNo: this.auditForm.value.auditRefNo,
      auditType: this.auditForm.value.auditType,
      auditFromDate: this.auditForm.value.auditFromDate,
      auditToDate: this.auditForm.value.auditToDate,
      auditorName: this.auditForm.value.auditorName,
      auditorRank: this.auditForm.value.auditorRank,
      unit,
      status: this.auditForm.value.status,
      questions: [],
      responses: [],
      reportFiles: [],
      observations: [],
      complianceTrail: ['Internal audit scheduled.']
    };

    this.audits = [audit, ...this.audits];
    this.selectAudit(audit);
    this.auditForm.reset({ auditType: 'IG Audit', status: 'Planned' });
    this.showStatus('Internal audit schedule saved successfully!');
  }

  saveQuestionnaire(): void {
    const audit = this.selectedAudit;
    if (!audit) {
      return;
    }
    if (this.questionnaireForm.invalid) {
      this.questionnaireForm.markAllAsTouched();
      return;
    }

    audit.questions = this.questionnaireForm.value.questions.map((question: any, index: number) => ({
      id: Date.now() + index,
      category: question.category,
      question: question.question,
      benchmark: question.benchmark,
      status: question.status
    }));
    audit.status = 'In Progress';
    audit.complianceTrail.push('Questionnaire prepared and sent to unit.');
    this.prepareResponseRows(audit);
    this.showStatus('Questionnaire saved successfully!');
  }

  submitUnitResponse(): void {
    const audit = this.selectedAudit;
    if (!audit) {
      return;
    }
    if (this.responseForm.invalid) {
      this.responseForm.markAllAsTouched();
      return;
    }

    audit.responses = this.responseForm.value.responses.map((response: any, index: number) => ({
      questionId: audit.questions[index]?.id ?? index + 1,
      response: response.response,
      remarks: response.remarks
    }));
    audit.status = 'In Progress';
    audit.complianceTrail.push('Unit response submitted.');
    this.showStatus('Unit response submitted successfully!');
  }

  onReportFilesSelected(event: Event): void {
    this.replaceFileArray(this.reportForm, 'reportFiles', event, 'Auditor');
  }

  submitReport(): void {
    const audit = this.selectedAudit;
    if (!audit) {
      return;
    }
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    audit.reportFiles = this.reportForm.value.reportFiles;
    audit.status = 'Completed';
    audit.complianceTrail.push('Audit report submitted by auditor.');
    this.reportForm.reset();
    this.clearFileArray(this.reportForm, 'reportFiles');
    this.showStatus('Audit report submitted successfully!');
  }

  saveObservations(): void {
    const audit = this.selectedAudit;
    if (!audit) {
      return;
    }
    if (this.observationForm.invalid) {
      this.observationForm.markAllAsTouched();
      return;
    }

    audit.observations = this.observationForm.value.observations.map((observation: any, index: number) => ({
      id: Date.now() + index,
      slNo: observation.slNo,
      observation: observation.observation,
      remarks: observation.remarks,
      type: observation.type,
      status: observation.status,
      complianceDetails: ''
    }));
    audit.status = 'Action Required';
    audit.complianceTrail.push('Internal audit observations created.');
    this.selectedObservationId = audit.observations[0]?.id ?? null;
    this.showStatus('Observations saved successfully!');
  }

  submitCompliance(): void {
    const audit = this.selectedAudit;
    const observation = this.selectedObservation;
    if (!audit || !observation) {
      return;
    }
    if (this.complianceForm.invalid) {
      this.complianceForm.markAllAsTouched();
      return;
    }

    observation.complianceDetails = this.complianceForm.value.complianceDetails;
    observation.status = this.complianceForm.value.status;
    audit.status = audit.observations.every((item) => item.status === 'Compliant' || item.status === 'Dropped')
      ? 'Closed'
      : 'Action Required';
    audit.complianceTrail.push(`Compliance submitted for observation ${observation.slNo}.`);
    this.complianceForm.reset({ status: 'Compliant' });
    this.showStatus('Compliance submitted successfully!');
  }

  private prepareResponseRows(audit: InternalAuditSchedule): void {
    const responses = this.responseForm.get('responses') as FormArray;
    while (responses.length) {
      responses.removeAt(0);
    }

    const questions = audit.questions.length ? audit.questions : [{ id: 1 }];
    questions.forEach((question: any) => responses.push(this.createResponseRow(question.id)));
  }

  private createQuestionRow(): FormGroup {
    return this.fb.group({
      category: ['', Validators.required],
      question: ['', Validators.required],
      benchmark: [''],
      status: ['Active', Validators.required]
    });
  }

  private createResponseRow(questionId: number): FormGroup {
    return this.fb.group({
      questionId: [questionId],
      response: ['Yes', Validators.required],
      remarks: ['']
    });
  }

  private createObservationRow(slNo: number): FormGroup {
    return this.fb.group({
      slNo: [slNo, Validators.required],
      observation: ['', Validators.required],
      remarks: [''],
      type: ['Moderate', Validators.required],
      status: ['Pending', Validators.required]
    });
  }

  private replaceFileArray(form: FormGroup, controlName: string, event: Event, uploadedBy: string): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).map((file) => this.makeFile(file.name, file.size, uploadedBy, file.type));
    this.clearFileArray(form, controlName);
    const array = form.get(controlName) as FormArray;
    files.forEach((file) => array.push(this.fb.control(file)));
  }

  private clearFileArray(form: FormGroup, controlName: string): void {
    const array = form.get(controlName) as FormArray;
    while (array.length) {
      array.removeAt(0);
    }
  }

  private makeFile(name: string, size: number, uploadedBy: string, type = 'application/pdf'): InternalAuditFile {
    return {
      name,
      size,
      type,
      uploadedBy,
      uploadedOn: new Date().toISOString()
    };
  }

  private showStatus(message: string): void {
    this.statusMsg = message;
    this.status = true;
    setTimeout(() => {
      this.status = false;
    }, 5000);
  }
}

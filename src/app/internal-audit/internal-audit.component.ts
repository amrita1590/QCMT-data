import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InternalAuditReportComponent } from './audit-report/internal-audit-report.component';
import { InternalAuditScheduleComponent } from './audit-schedule/internal-audit-schedule.component';
import { InternalAuditComplianceComponent } from './compliance/internal-audit-compliance.component';
import { InternalAuditFacade } from './internal-audit.facade';
import { InternalAuditObservationComponent } from './observation/internal-audit-observation.component';
import { InternalAuditQuestionnaireComponent } from './questionnaire/internal-audit-questionnaire.component';
import { InternalAuditSummaryComponent } from './summary/internal-audit-summary.component';
import { InternalAuditUnitResponseComponent } from './unit-response/internal-audit-unit-response.component';

@Component({
  selector: 'app-internal-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InternalAuditScheduleComponent,
    InternalAuditQuestionnaireComponent,
    InternalAuditUnitResponseComponent,
    InternalAuditReportComponent,
    InternalAuditObservationComponent,
    InternalAuditComplianceComponent,
    InternalAuditSummaryComponent
  ],
  templateUrl: './internal-audit.component.html',
  styleUrls: ['./internal-audit.component.css']
})
export class InternalAuditComponent {
  constructor(public internalAuditFacade: InternalAuditFacade) {}
}

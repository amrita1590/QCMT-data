export type InternalAuditStatus = 'Planned' | 'In Progress' | 'Completed' | 'Action Required' | 'Closed';

export type InternalAuditObservationType = 'Critical' | 'Moderate' | 'Non-Critical';

export type InternalAuditComplianceStatus = 'Pending' | 'Compliant' | 'Non-Compliant' | 'Dropped';

export interface InternalAuditUnit {
  id: number;
  unitName: string;
  airportCode: string;
}

export interface InternalAuditFile {
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedOn: string;
  filePath?: string;
}

export interface InternalAuditQuestion {
  id: number;
  category: string;
  question: string;
  benchmark: string;
  status: 'Active' | 'Inactive';
}

export interface InternalAuditResponse {
  questionId: number;
  response: 'Yes' | 'No' | 'NA';
  remarks: string;
}

export interface InternalAuditObservation {
  id: number;
  slNo: number;
  observation: string;
  remarks: string;
  type: InternalAuditObservationType;
  status: InternalAuditComplianceStatus;
  complianceDetails: string;
}

export interface InternalAuditSchedule {
  id: number;
  auditRefNo: string;
  auditType: string;
  auditFromDate: string;
  auditToDate: string;
  auditorName: string;
  auditorRank: string;
  unit: InternalAuditUnit;
  status: InternalAuditStatus;
  questions: InternalAuditQuestion[];
  responses: InternalAuditResponse[];
  reportFiles: InternalAuditFile[];
  observations: InternalAuditObservation[];
  complianceTrail: string[];
}

export interface InternalAuditStageCard {
  label: string;
  status: InternalAuditStatus;
  border: string;
}

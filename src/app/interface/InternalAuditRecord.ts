export type InternalAuditStatus = 'Planned' | 'In Progress' | 'Completed' | 'Action Required' | 'Closed';

export type InternalAuditObservationType = 'Critical' | 'Moderate' | 'Non-Critical';

export type InternalAuditComplianceStatus = 'Pending' | 'Compliant' | 'Non-Compliant' | 'Dropped';

export interface InternalAuditFile {
  id?: number;
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

export interface InternalAuditRecord {
  id?: number;
  auditName: string;
  auditMonth: string;

  unitId: number;
  unitName: string;

  casoId: number;
  casoName: string;
  casoRank: string;
  casoNo: string;

  auditorId: number;
  auditorName: string;
  auditorRank: string;
  auditorNo: string;

  gist: string;

  igUserId: number;
  igUserName: string;
  igUserRank?: string;
  igUserNo?: string;

  fromDate?: string;
  toDate?: string;

  status: string;
  createdBy?: string;
  createdById?: number;
  createdAt?: string;

  files?: InternalAuditFile[];
  questions?: InternalAuditQuestion[];
  responses?: InternalAuditResponse[];
  reportFiles?: InternalAuditFile[];
  observations?: InternalAuditObservation[];
  complianceTrail?: string[];
}

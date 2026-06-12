export interface BcasAuditFile {
  id?: number;
  fileName: string;
  filePath: string;
  uploadedAt?: string;
  fileType?: string;
}

export interface BcasObservation {
  id?: number;
  observationText: string;
  remarksType: string;
  complianceStatus: string;
  currentStatus?: string;
  supportingDocPath?: string;
  createdAt?: string;
}

export interface BcasAuditRecord {
  id?: number;
  auditName: string;
  unitId: number;
  unitName: string;
  auditMonth: string;
  fromDate?: string;
  toDate?: string;
  gist: string;
  finalReportPath?: string;
  letterNo?: string;
  letterDate?: string;
  obsLetterNo?: string;
  obsLetterDate?: string;
  createdBy: string;
  createdById: number;
  createdAt?: string;
  casoId: number;
  casoName: string;
  casoRank: string;
  casoNo: string;
  status: string;
  files?: BcasAuditFile[];
  obsSupportDocs?: BcasAuditFile[];
  observations?: BcasObservation[];
}

export interface CasoReplyDraftObs {
  observationId: number;
  replyMessage: string;
  replyStatus: string;
}

export interface CasoReplyDraft {
  letterNo: string;
  letterDate: string;
  obsReplies: CasoReplyDraftObs[];
}

export interface BcasAuditFile {
  id?: number;
  fileName: string;
  filePath: string;
  uploadedAt?: string;
  fileType?: string;
}

export interface BcasObsMessage {
  id?: number;
  sender: 'APS' | 'CASO';
  senderName: string;
  userId?: number;
  message: string;
  replyStatus?: string;
  letterNo?: string;
  letterDate?: string;
  fileName?: string;
  filePath?: string;
  attachmentStatus?: string;
  entryDate?: string;
  entryTime?: string;
}

export interface BcasObservation {
  id?: number;
  observationText: string;
  remarksType: string;
  complianceStatus: string;
  currentStatus?: string;
  apsRemarks?: string;
  supportingDocPath?: string;
  createdAt?: string;
  complianceRemark?: string;
  changedBy?: number;
  changedByName?: string;
  messages?: BcasObsMessage[];
}

export interface BcasObsDraft {
  obsLetterNo?: string;
  obsLetterDate?: string;
  observations: BcasObservation[];
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
  apsLetterNo?: string;
  apsLetterDate?: string;
  apsLetterFiles?: BcasAuditFile[];
  updatedBy?: number;
  updatedByName?: string;
  obsCreatedBy?: number;
  obsCreatedByName?: string;
}

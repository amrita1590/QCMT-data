export interface AuditObservationComponentMessage {
  
  id: number;
  auditObservationComponentId: number;
  letterNo: string;
  letterDate: string;
  
  attachmentStatus: string;
  filePath: string;
  fileName: string;
  
  complianceMessage: string;
  
  status: string;
  createdBy: string;
  entryDate: string;
  entryTime: string;
}
export interface AuditorResponseFilesTemp {
  id: number;
  index: number;
  auditorResponseId: number;
  auditTemplateId: number;
  documentName: string;
  remarks: string;
  uploadDocFile ?: File | null;
  filePath?: string;
  
}
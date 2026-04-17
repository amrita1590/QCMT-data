import { AuditorResponseFiles } from "./AuditorResponseFiles";

export interface AuditorResponse {
  
  id: number;
  auditTemplateId: number;
  auditTemplateName: string;
  letterNumber: number;
  letterDate: string;
  auditFromDate: string;
  auditToDate: string;
  auditorResponseFiles: AuditorResponseFiles[];
}
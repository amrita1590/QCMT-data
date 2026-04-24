import { AuditObservationComponent } from "./AuditObservationComponent";

export interface AuditObservation {
  
  id: number;
  auditTemplateId: number;
  auditTemplateName: string;
  letterNo: string;
  letterDate: string;
  createdBy: string;
  creationDate: string;
  status: string;

  observationStatus: string;
  auditObservationComponent: AuditObservationComponent[];
  
}
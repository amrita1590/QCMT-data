import { AuditObservationComponentMessage } from "./AuditObservationComponentMessage";

export interface AuditObservationComponent {
  id: number;
  index: number;
  auditObservationId: number;
  templateId: number;
  templateName: string;
  letterNo: string;
  letterDate: string;
  createdBy: string;
  entryDate: string;
  entryTime: string;
  complianceStatus: string;
  remarks: string;
  typeCriticality: string;
  observation: string;
  status: string;

  auditObservationComponentMessageList: AuditObservationComponentMessage[];
}
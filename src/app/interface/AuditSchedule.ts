export interface AuditSchedule {
  id: number;
  index: number;
  category: number;
  categoryName: string;
  template: number;
  templateName: string;
  createdBy: string;
  entryDate: string;
  status: string;
  information: string;
}
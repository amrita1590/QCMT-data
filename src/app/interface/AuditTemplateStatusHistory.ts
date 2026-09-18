export interface AuditTemplateStatusHistory {
  id: number;
  auditTemplateId: number;
  previousStatus: string | null;
  newStatus: string;
  changedByUserId: number | null;
  changedByName: string;
  changedByRank: string | null;
  changedByCisfno: string | null;
  changedByUnit: string | null;
  changedByRole: string | null;
  changedAt: string;
  daysInPreviousStatus: number | null;
  daysAfterScheduledEnd: number | null;
}

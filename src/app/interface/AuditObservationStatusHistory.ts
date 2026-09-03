export interface AuditObservationStatusHistory {
  id: number;
  previousStatus: string;
  newStatus: string;
  changedByName: string;
  changedAt: string;
}

import { AuditSchedule } from "./AuditSchedule";

export interface AuditScheduleTemplate {
  id: number;
  name: string;
  unitId: number;
  unitName: string;
  auditDate?: string;
  auditMonth: string;
  auditType: string;
  auditorId: number;
  auditorName: string;
  createdBy: string;
  createdById: number;
  createdAt: string;
  casoId: number;
  casoName: string;
  status: string;
  auditStatus: string;
  observationCasoSince?: string;
  observationZoneSince?: string;
  observationSectorSince?: string;
  observationScopeMatch?: boolean;
  auditScheduleList: AuditSchedule[];

  auditScheduleFromDate: string;
	auditScheduleToDate: string;
  auditDescription: string;
}

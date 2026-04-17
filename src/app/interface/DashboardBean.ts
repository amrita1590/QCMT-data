import { AuditScheduleTemplate } from "./AuditScheduleTemplate";
import { UnitAuditCurrentStatus } from "./unit-audit-current-status";

export interface DashboardBean {
    
    fromDate: string;
    toDate: string;

    totalDropped: string;
    totalCompliance: string;
    auditType: string;

    totalAirport: string;
	totalObservation: string;
	openObservation: string;
	averageCompliance: string;
	
	totalObservationLast30Days: string;
	averageComplianceLast30Days: string;
	
	IQCUTotalObservation: string;
	IQCUOpenObservation: string;
	IQCUComplianceRate: string;
	IQCULastAudit: string;
    IQCUAuditedAirport: string;
	
	BCASTotalObservation: string;
	BCASOpenObservation: string;
	BCASComplianceRate: string;
	BCASLastAudit: string;
    BCASAuditedAirport: string;
	
	InternalTotalObservation: string;
	InternalOpenObservation: string;
	InternalComplianceRate: string;
	InternalLastAudit: string;
    InternalAuditedAirport: string;
	
	ICAOTotalObservation: string;
	ICAOOpenObservation: string;
	ICAOComplianceRate: string;
	ICAOLastAudit: string;
    ICAOAuditedAirport: string;
	unitAuditCurrentStatuslist:UnitAuditCurrentStatus[];
	upcomingAuditTemplate: AuditScheduleTemplate[];
}
import { AuditorDetails } from "./auditor-details";
import { UnitDetails } from "./UnitDetails";
export interface AuditSchedule {
    auditorName: string,        
    auditDate: Date,
    auditType: string,
    auditYear: string,
    asgName: string,
    updateTime: string,
    createdBy: string,
    userId: number,
    isActive: number;
    unitmaster?: UnitDetails | null;  
    auditorDetails: AuditorDetails[];
    updteauditHistory: string;
    status: string;

}

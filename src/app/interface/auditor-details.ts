import { UnitDetails } from "./UnitDetails";
export interface AuditorDetails {
    officerId: number,
    unit: string,
    name: string,
    rank: string,
    email: string,
    mobileno: string,
    createdBy: string,
    isActive: number;
    unitmaster: UnitDetails;  

}

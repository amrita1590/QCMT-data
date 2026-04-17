import { UnitDetails } from "./UnitDetails";
import { UserRoles } from "./UserRoles";

export interface User {
    id?: number,
    username: string,
    password?: string,
    confirmpassword?: string,
    email?: string,
    mobileNo: number,
    organizationName: string,
    address: string,
    additionaldetails?: string,
    mstr_name : string; // Optional property for user name
    createdBy ?: string;
    status: string;
    sector?: string;
    rank?: string;
    zone?: string;
    cisfno?:string;
    userscopelevel?: string; 
    unitmaster?: UnitDetails;
    userRolesList: UserRoles[];
}
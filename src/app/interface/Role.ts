import { Permissions } from "./Permissions";

export interface Role {
    id: number;
    roleName: string;
    remarks: string;

    permissions: Permissions[];
}
import { User } from "./User";

export interface UserDashboard {
    userDetailsBean: User,
    permissionMasterEntity: Permissions[];
}
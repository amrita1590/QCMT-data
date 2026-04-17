export interface Permissions {
    id: number;
    permissionLabel: string;
    permissionRoutelink: string;
    permissionIcon: string;
    isParent: string;
    parentPermissionId: number | null;
    remark: string;
    sequence: number;
}
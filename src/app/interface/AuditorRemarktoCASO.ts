export interface AuditorRemarktoCASO {
    id: number,
    remarks: string,
    remarkSource?: 'AUDITOR' | 'ZONE' | 'SECTOR',
    routeDestination?: 'APS' | 'CASO',
    auditTempalteId: number,
    createdBy: string,
    entryDate: Date;
}

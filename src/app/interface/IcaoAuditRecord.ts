export interface IcaoAuditFile {
  id?: number;
  fileName: string;
  filePath: string;
  uploadedAt?: string;
}

export interface IcaoAuditRecord {
  id?: number;
  auditName: string;
  unitId: number;
  unitName: string;
  auditMonth: string;
  fromDate: string;
  toDate: string;
  gist: string;
  createdBy: string;
  createdById: number;
  createdAt?: string;
  casoId: number;
  casoName: string;
  casoRank: string;
  casoNo: string;
  status: string;
  files?: IcaoAuditFile[];
}

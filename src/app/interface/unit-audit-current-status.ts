import { serverRoutes } from "../app.routes.server"

export interface UnitAuditCurrentStatus {
      id:number,
	  unitId:number,
	  unitname: string,
	  name: string,
	  auditMonth: string,
	  schedulefromDate: string,
	  scheduletoDate: string,
	  fromDate: string,
	  toDate: string,
      auditStatus: string
}

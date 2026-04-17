import { AuditBoardQuestionTemplate } from "./AuditBoardQuestionTemplate";
import { AuditBoardScheduleTemplate } from "./AuditBoardScheduleTemplate";
import { AuditorResponse } from "./AuditorResponse";

export interface AuditBoardTemplateGen {
  id: number;
  auditBoardScheduleTemplate: AuditBoardScheduleTemplate;
  questionTemplateList: AuditBoardQuestionTemplate[];
  auditiorResponse: AuditorResponse;
}
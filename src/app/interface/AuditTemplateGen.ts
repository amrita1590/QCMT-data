import { AuditScheduleTemplate } from "./AuditScheduleTemplate";
import { QuestionTemplate } from "./QuestionTemplate";

export interface AuditTemplateGen {
  id: number;
  auditScheduleTemplate: AuditScheduleTemplate;
  questionTemplateList: QuestionTemplate[];
}
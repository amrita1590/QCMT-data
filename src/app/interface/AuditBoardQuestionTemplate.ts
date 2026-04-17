import { AuditBoardQuestions } from "./AuditBoardQuestions";

export interface AuditBoardQuestionTemplate {
  id: number;
  name: string;
  category: number;
  questions: number;
  type: string;
  createdBy: string;
  createdAt: string;
  status: string;
  auditBoardQuestionsList: AuditBoardQuestions[];
}
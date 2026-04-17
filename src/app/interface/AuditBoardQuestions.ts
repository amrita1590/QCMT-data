export interface AuditBoardQuestions {
  id: number;
  index: number;
  question: string;
  createdBy: string;
  entryDate: string;
  status: boolean;
  information: string;
  benchmark: string;
  details: string;
  observation: string;
  questionBoardTemplateId: number;
}
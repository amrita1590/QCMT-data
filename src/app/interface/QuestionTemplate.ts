import { Questions } from "./Questions";

export interface QuestionTemplate {
  id: number;
  name: string;
  category: number;
  categoryName: string;
  questions: number;
  type: string;
  createdBy: string;
  createdAt: string;
  status: string;
  questionsList: Questions[];
}
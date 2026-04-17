import { Questionauditor } from "./questionauditor";
import { Questions } from "./Questions";

export interface AuditorQuestions {
 auditTemplateId:number;
 auditorId:number;
 unitId:number;
 questions:Questionauditor[];

}

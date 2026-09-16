export type FeedbackType = 'SUGGESTION' | 'FEEDBACK' | 'ISSUE' | 'OTHER';
export type FeedbackStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'CLOSED';

export interface Feedback {
  id: number;
  userId: number;
  userName: string;
  unitSection: string | null;
  feedbackType: FeedbackType;
  subject: string;
  description: string;
  submittedAt: string;
  status: FeedbackStatus;
  remarks: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
}

export interface FeedbackSubmitRequest {
  feedbackType: FeedbackType | '';
  subject: string;
  description: string;
}

export interface FeedbackStatusUpdateRequest {
  status: FeedbackStatus;
  remarks: string;
}

export interface IqcuCalendar {
  id: number;
  calendarYear: number;
  fileName: string;
  filePath: string;
  active: boolean;
  uploadedByName: string;
  uploadedAt: string;
  updatedByName: string | null;
  updatedAt: string | null;
}

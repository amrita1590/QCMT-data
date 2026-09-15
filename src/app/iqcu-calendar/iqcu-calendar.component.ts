import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IqcuCalendarService } from '../service/iqcu-calendar.service';
import { UsermanagementService } from '../service/usermanagement.service';
import { ToastService } from '../service/toast.service';
import { IqcuCalendar } from '../interface/IqcuCalendar';
import { User } from '../interface/User';
import { UserRoleDetails } from '../interface/UserRoleDetails';

@Component({
  selector: 'app-iqcu-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './iqcu-calendar.component.html',
  styleUrl: './iqcu-calendar.component.css'
})
export class IqcuCalendarComponent implements OnInit {

  calendars: IqcuCalendar[] = [];
  isLoading = false;
  isUploading = false;

  loggedUser: User | null = null;
  calendarManagerList: UserRoleDetails[] = [];

  selectedYear: number = new Date().getFullYear();
  years: number[] = [];
  selectedFile: File | null = null;
  fileError = '';

  // Backend already returns calendars sorted latest-upload-first (findAllByOrderByUploadedAtDesc).
  page = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50];

  constructor(
    private calendarService: IqcuCalendarService,
    private umService: UsermanagementService,
    private toast: ToastService
  ) {
    const currentYear = new Date().getFullYear();
    // A reasonable fixed window around the current year - not the calendar's own display logic,
    // just the range offered when uploading a new one.
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.loadCalendars();

    this.umService.getUserAuditDetailList().subscribe({
      next: data => {
        this.calendarManagerList = data.filter(u => u.rolename === 'APS HQrs' || u.rolename === 'ADMIN');
      }
    });
    this.umService.getLoggedUserDetailList().subscribe({
      next: users => { if (users.length > 0) this.loggedUser = users[0]; }
    });
  }

  get isCalendarManager(): boolean {
    return this.calendarManagerList.some(u => Number(u.id) === Number(this.loggedUser?.id));
  }

  loadCalendars(): void {
    this.isLoading = true;
    this.calendarService.getCalendarList().subscribe({
      next: data => {
        this.calendars = data;
        this.page = 1;
        this.isLoading = false;
      },
      error: () => {
        this.toast.show('Failed to load IQCU calendars.', 'error');
        this.isLoading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.calendars.length / this.pageSize) || 1;
  }

  get visiblePages(): number[] {
    const pagesToShow = 5;
    const half = Math.floor(pagesToShow / 2);
    let start = Math.max(1, this.page - half);
    let end = Math.min(this.totalPages, start + pagesToShow - 1);

    if (end - start < pagesToShow - 1) {
      start = Math.max(1, end - pagesToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(p: number): void {
    this.page = p;
  }

  prevPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  onFileSelected(event: Event): void {
    this.fileError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      this.selectedFile = null;
      return;
    }
    // Client-side convenience only - the server independently checks extension, declared
    // content-type, AND the file's own magic bytes before accepting anything.
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      this.fileError = 'Only PDF files are allowed.';
      this.selectedFile = null;
      input.value = '';
      return;
    }
    this.selectedFile = file;
  }

  uploadCalendar(): void {
    if (!this.selectedFile || this.isUploading) {
      return;
    }
    this.isUploading = true;
    const fd = new FormData();
    fd.append('calendarYear', String(this.selectedYear));
    fd.append('file', this.selectedFile, this.selectedFile.name);

    this.calendarService.uploadCalendar(fd).subscribe({
      next: () => {
        this.toast.show('IQCU calendar uploaded successfully.', 'success');
        this.isUploading = false;
        this.selectedFile = null;
        this.loadCalendars();
      },
      error: (err) => {
        this.toast.show(typeof err?.error === 'string' ? err.error : 'Failed to upload calendar.', 'error');
        this.isUploading = false;
      }
    });
  }

  activate(calendar: IqcuCalendar): void {
    this.calendarService.activateCalendar(calendar.id).subscribe({
      next: () => {
        this.toast.show(`Calendar ${calendar.calendarYear} activated.`, 'success');
        this.loadCalendars();
      },
      error: (err) => {
        this.toast.show(typeof err?.error === 'string' ? err.error : 'Failed to activate calendar.', 'error');
      }
    });
  }

  deactivate(calendar: IqcuCalendar): void {
    this.calendarService.deactivateCalendar(calendar.id).subscribe({
      next: () => {
        this.toast.show(`Calendar ${calendar.calendarYear} deactivated.`, 'success');
        this.loadCalendars();
      },
      error: (err) => {
        this.toast.show(typeof err?.error === 'string' ? err.error : 'Failed to deactivate calendar.', 'error');
      }
    });
  }

  view(calendar: IqcuCalendar): void {
    this.calendarService.getCalendarFile(calendar.filePath).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Revoked after a delay rather than immediately - the new tab needs the blob URL to
        // still resolve by the time it finishes opening/rendering the PDF.
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: () => {
        this.toast.show('Failed to open calendar PDF.', 'error');
      }
    });
  }
}

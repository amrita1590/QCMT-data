import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UsermanagementService } from '../service/usermanagement.service';
import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { CommonModule } from "@angular/common";
import { DashboardService } from "../service/dashboard.service";
import { AuditscheduleserviceService } from '../service/auditscheduleservice.service';
import { ClassDetails } from "../interface/ClassDetails";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StudentService } from '../service/student.service';
import { DashboardBean } from '../interface/DashboardBean';
import { ToastService } from '../service/toast.service';
import { AirportListDashboard } from '../interface/AirportListDashboard';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
import { AuditTemplateStatusHistory } from '../interface/AuditTemplateStatusHistory';
import { NotificationBean } from '../interface/NotificationBean';
import { RouterModule } from '@angular/router';
import { IqcuCalendarService } from '../service/iqcu-calendar.service';
import { IqcuCalendar } from '../interface/IqcuCalendar';
import { AuditStatusGuideComponent } from '../shared/audit-status-guide/audit-status-guide.component';
import { UnitAuditCurrentStatus } from '../interface/unit-audit-current-status';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';



type Status = 'P' | 'A';
type ScheduleStatusFilter = 'ALL' | 'SCHEDULED' | 'DUE' | 'OVERDUE' | 'COMPLETED';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, NgbModule, CommonModule, FormsModule, RouterModule, AuditStatusGuideComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  @ViewChild('plannedAuditReminder') plannedAuditReminder?: TemplateRef<unknown>;
  @ViewChild('casoAuditReminder') casoAuditReminder?: TemplateRef<unknown>;
  @ViewChild('scopedObservationReminder') scopedObservationReminder?: TemplateRef<unknown>;
  
  isLoading: boolean = false;
  usernameData = "";
  isLeftSidebarCollapsed = true;
  private modalRef: NgbModalRef | null = null;

  dashboardBean: DashboardBean | null = null;
  dashboardAudits: AuditScheduleTemplate[] = [];
  auditHistorySearch = '';
  auditHistoryPage = 1;
  readonly auditHistoryPageSize = 10;
  auditListLoading = false;
  auditListError = false;
  selectedHistoryAudit: AuditScheduleTemplate | null = null;
  selectedAuditHistory: AuditTemplateStatusHistory[] = [];
  selectedHistoryLoading = false;
  selectedHistoryError = false;
  selectedScheduleStatus: ScheduleStatusFilter = 'ALL';

  airportList: AirportListDashboard[] | null = null

  fromDate: any;
  toDate: any;
  dateError: string = '';

  auditType: string = '';
  auditSubtitle: string = '';

  chartcompliance: number = 0;
  chartdropped: number = 0;
  chartopen: number = 0;
  chartclose: number = 0;
  notificationCount: number = 0;

  statusChart: any;
  monthlyAuditChart: any;

  private upcomingAuditsFull: AuditScheduleTemplate[] = [];
  plannedAuditAlerts: AuditScheduleTemplate[] = [];
  auditorEvaluationAlerts: AuditScheduleTemplate[] = [];
  casoAuditAlerts: AuditScheduleTemplate[] = [];
  casoObservationAlerts: AuditScheduleTemplate[] = [];
  scopedObservationAlerts: AuditScheduleTemplate[] = [];
  private initialCasoReminderLoad = true;
  private initialScopedReminderLoad = true;
  upcomingTotalCount = 0;
  upcomingPlannedCount = 0;
  upcomingAttentionCount = 0;

  private static readonly ATTENTION_STATUSES = ['Action Required', 'Observation APS', 'Observation CASO', 'ObservationZONE', 'Observation SECTOR'];

  // Default view is Planned-only - clicking the "Total scheduled"/"Need attention" cards below
  // switches this to show every status / just the attention-needing ones.
  selectedUpcomingFilter: 'PLANNED' | 'ALL' | 'ATTENTION' = 'PLANNED';

  selectUpcomingFilter(filter: 'PLANNED' | 'ALL' | 'ATTENTION'): void {
    this.selectedUpcomingFilter = filter;
  }

  get upcomingAuditList(): AuditScheduleTemplate[] {
    const filtered = this.selectedUpcomingFilter === 'ALL'
      ? this.upcomingAuditsFull
      : this.selectedUpcomingFilter === 'PLANNED'
        ? this.upcomingAuditsFull.filter(a => a.auditStatus === 'Planned')
        : this.upcomingAuditsFull.filter(a => DashboardComponent.ATTENTION_STATUSES.includes(a.auditStatus));
    return filtered.slice(0, 7);
  }

  private auditMonthStart(auditMonth: string): Date | null {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(auditMonth || '');
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : null;
  }

  overdueDays(audit: AuditScheduleTemplate): number {
    const monthStart = this.auditMonthStart(audit.auditMonth);
    if (!monthStart) return -1;
    const reminderStart = new Date(monthStart);
    reminderStart.setDate(reminderStart.getDate() - 30);
    const today = new Date();
    return Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
      - Date.UTC(reminderStart.getFullYear(), reminderStart.getMonth(), reminderStart.getDate())) / 86400000);
  }

  private showPlannedAuditReminders(audits: AuditScheduleTemplate[]): void {
    this.plannedAuditAlerts = audits
      .filter(audit => audit.auditStatus === 'Planned' && this.overdueDays(audit) >= 0)
      .sort((a, b) => a.auditMonth.localeCompare(b.auditMonth));

    if (!this.umService.hasPendingAuditReminder()) return;
    this.umService.consumeAuditReminder();
    if ((this.plannedAuditAlerts.length || this.auditorEvaluationAlerts.length) && this.plannedAuditReminder) {
      this.modalRef = this.modalService.open(this.plannedAuditReminder, {
        size: 'lg', centered: true, scrollable: true,
        windowClass: 'planned-audit-reminder-modal',
        backdropClass: 'planned-audit-reminder-backdrop'
      });
    }
  }

  daysSinceAuditorScheduledEnd(audit: AuditScheduleTemplate): number | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(audit.auditScheduleToDate || '');
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const end = new Date(Date.UTC(year, month - 1, day));
    if (end.getUTCFullYear() !== year || end.getUTCMonth() !== month - 1 || end.getUTCDate() !== day) return null;
    const today = new Date();
    return Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - end.getTime()) / 86400000);
  }

  private scheduledStartDay(audit: AuditScheduleTemplate): number | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(audit.auditScheduleFromDate || '');
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
      ? date.getTime() / 86400000 : null;
  }

  daysUntilCasoSchedule(audit: AuditScheduleTemplate): number | null {
    const scheduledDay = this.scheduledStartDay(audit);
    if (scheduledDay === null) return null;
    const today = new Date();
    const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000;
    return scheduledDay - todayDay;
  }

  observationCasoDelayDays(audit: AuditScheduleTemplate): number | null {
    return audit.auditStatus === 'Observation CASO' ? this.observationDelayDays(audit) : null;
  }

  observationDelayDays(audit: AuditScheduleTemplate): number | null {
    const since = audit.auditStatus === 'Observation CASO' ? audit.observationCasoSince
      : audit.auditStatus === 'ObservationZONE' ? audit.observationZoneSince
      : audit.auditStatus === 'Observation SECTOR' ? audit.observationSectorSince : null;
    if (!since) return null;
    const enteredAt = Date.parse(since);
    if (!Number.isFinite(enteredAt)) return null;
    const daysPending = Math.floor((Date.now() - enteredAt) / 86400000);
    return daysPending > 30 ? daysPending - 30 : null;
  }

  observationCasoReminderMessage(audit: AuditScheduleTemplate): string | null {
    const delay = this.observationCasoDelayDays(audit);
    return delay === null ? null : `Observation awaiting CASO response for ${delay + 30} days · ${delay} day${delay === 1 ? '' : 's'} beyond the 30-day reminder threshold`;
  }

  scopedObservationReminderMessage(audit: AuditScheduleTemplate): string | null {
    const delay = this.observationDelayDays(audit);
    if (delay === null) return null;
    const office = audit.auditStatus === 'ObservationZONE' ? 'Zone' : 'Sector';
    return `Observation awaiting ${office} review for ${delay + 30} days · ${delay} day${delay === 1 ? '' : 's'} beyond the 30-day reminder threshold`;
  }

  private loadScopedObservationReminders(): void {
    if (!this.initialScopedReminderLoad || !this.umService.hasPendingAuditReminder()) return;
    this.initialScopedReminderLoad = false;
    this.auditScheduleService.getDashboardAuditList().subscribe({
      next: audits => {
        this.scopedObservationAlerts = (audits ?? [])
          .filter(audit => audit.observationScopeMatch
            && ((this.dashboardBean?.zoneView && audit.auditStatus === 'ObservationZONE')
              || (this.dashboardBean?.sectorView && audit.auditStatus === 'Observation SECTOR'))
            && this.observationDelayDays(audit) !== null)
          .sort((a, b) => (this.observationDelayDays(b) ?? 0) - (this.observationDelayDays(a) ?? 0));
        this.umService.consumeAuditReminder();
        if (this.scopedObservationAlerts.length && this.scopedObservationReminder) {
          this.modalRef = this.modalService.open(this.scopedObservationReminder, {
            size: 'lg', centered: true, scrollable: true,
            windowClass: 'scoped-observation-reminder-modal',
            backdropClass: 'planned-audit-reminder-backdrop'
          });
        }
      },
      error: () => { this.scopedObservationAlerts = []; this.initialScopedReminderLoad = true; }
    });
  }

  private loadCasoAuditReminders(): void {
    if (!this.initialCasoReminderLoad || !this.umService.hasPendingAuditReminder()) return;
    this.initialCasoReminderLoad = false;
    this.auditScheduleService.getCASOAuditDetails().subscribe({
      next: audits => {
        this.casoAuditAlerts = (audits ?? [])
          .filter(audit => audit.auditStatus === 'In Progress')
          .filter(audit => {
            const days = this.daysUntilCasoSchedule(audit);
            return days !== null && days <= 15;
          })
          .sort((a, b) => (this.scheduledStartDay(a) ?? 0) - (this.scheduledStartDay(b) ?? 0));
        this.casoObservationAlerts = (audits ?? [])
          .filter(audit => audit.casoId === this.dashboardBean?.currentUserId && this.observationCasoDelayDays(audit) !== null)
          .sort((a, b) => (this.observationCasoDelayDays(b) ?? 0) - (this.observationCasoDelayDays(a) ?? 0));
        this.umService.consumeAuditReminder();
        if ((this.casoAuditAlerts.length || this.casoObservationAlerts.length) && this.casoAuditReminder) {
          this.modalRef = this.modalService.open(this.casoAuditReminder, {
            size: 'lg', centered: true, scrollable: true,
            windowClass: 'caso-audit-reminder-modal',
            backdropClass: 'planned-audit-reminder-backdrop'
          });
        }
      },
      error: () => { this.casoAuditAlerts = []; this.casoObservationAlerts = []; this.initialCasoReminderLoad = true; }
    });
  }

  auditCards : any = [];

  currentDate: Date = new Date();
  private intervalId: any;

  notificationList: NotificationBean[] | null = null;
  allNotificationList: NotificationBean[] | null = null;
  showNotificationPopup: boolean = false;

  // IQCU Calendar - visible to every authenticated user regardless of role, unlike the
  // management page at /iqcucalendar (APS HQrs only). Year is derived from the system date,
  // never hardcoded.
  currentCalendarYear: number = new Date().getFullYear();
  activeCalendar: IqcuCalendar | null = null;
  calendarLoading = true;
  calendarViewerUrl: SafeResourceUrl | null = null;
  private calendarBlobUrl: string | null = null;

  constructor(private modalService: NgbModal,private umService: UsermanagementService, private dashboardService: DashboardService, private auditScheduleService: AuditscheduleserviceService, private toast: ToastService, private iqcuCalendarService: IqcuCalendarService, private sanitizer: DomSanitizer) {

  }

  ngOnInit(): void {
    this.umService.username$.subscribe(name => {
      this.usernameData = name.toString();
      console.log("Dashboard component - username updated to:", this.usernameData);
    });
    
    const now = new Date();
    this.intervalId = setInterval(() => {
        this.currentDate = new Date();  
    }, 1000); // update every 1 second
    const today = new Date();

    // Default range: Jan 1 - Dec 31 of the current year
    this.fromDate = this.formatDate(new Date(today.getFullYear(), 0, 1));
    this.toDate = this.formatDate(new Date(today.getFullYear(), 11, 31));

    this.getDashboardData(this.fromDate, this.toDate);
    
    this.umService.getNotificatinList().subscribe({
      next: (data) => {
        this.notificationList = data;
        this.notificationCount = this.notificationList.filter(n => Number(n.status) === 0).length;
        console.log('Notification List:', this.notificationList);
      }
    });

    this.loadActiveCalendar();
  }

  loadActiveCalendar(): void {
    this.calendarLoading = true;
    this.iqcuCalendarService.getActiveCalendarForYear(this.currentCalendarYear).subscribe({
      next: (calendar) => {
        this.activeCalendar = calendar;
        this.calendarLoading = false;
      },
      error: () => {
        // No active calendar for this year (or the request failed) - either way, show the
        // "none available" state rather than blocking the rest of the dashboard.
        this.activeCalendar = null;
        this.calendarLoading = false;
      }
    });
  }

  /** Opens the active calendar PDF inline (in-app modal + iframe), not a new browser tab. */
  viewActiveCalendar(content: any): void {
    if (!this.activeCalendar) return;
    this.calendarViewerUrl = null;
    this.modalRef = this.modalService.open(content, {
      size: 'xl', centered: true, scrollable: true,
      backdrop: 'static', windowClass: 'iqcu-calendar-viewer-modal'
    });
    this.iqcuCalendarService.getCalendarFile(this.activeCalendar.filePath).subscribe({
      next: (blob) => {
        this.calendarBlobUrl = window.URL.createObjectURL(blob);
        this.calendarViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.calendarBlobUrl);
      },
      error: () => {
        this.toast.show('Failed to open IQCU calendar PDF.', 'error');
        this.modalRef?.dismiss();
      }
    });
  }

  closeCalendarViewer(modal: any): void {
    modal.dismiss();
    if (this.calendarBlobUrl) {
      window.URL.revokeObjectURL(this.calendarBlobUrl);
      this.calendarBlobUrl = null;
    }
    this.calendarViewerUrl = null;
  }

  isDashboardLoading: boolean = true;
  showNotifications = false;

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if(this.notificationCount !== 0) {
      this.umService.updateNotificatinList().subscribe({
        next: (data) => { 
          console.log('Notifications updated successfully');
        }
      });
      this.notificationCount = 0;
    }
  }
  showAllNotificationPopup(content: any){
    // Call refresh API
    this.showNotifications = false;
    this.umService.getNotificatinList().subscribe({
      next: (data) => {
        this.allNotificationList = data;
        console.log('Notification List:', this.notificationList);
      }
    });
    this.modalRef = this.modalService.open(content, {
      size: 'lg', centered: true, scrollable: true,
      backdrop: 'static', keyboard: false, windowClass: 'dashboard-notification-modal'
    });
  }
  createModal(content: any) {
    this.selectedScheduleStatus = 'ALL';
    this.modalRef = this.modalService.open(content, {
      size: 'xl', centered: true, scrollable: true,
      backdrop: 'static', keyboard: false, windowClass: 'iqcu-schedule-modal'
    });
  }

  get filteredDashboardAudits(): AuditScheduleTemplate[] {
    const search = this.auditHistorySearch.trim().toLowerCase();
    if (!search) return this.dashboardAudits;
    return this.dashboardAudits.filter(audit =>
      [audit.name, audit.unitName, audit.auditType, audit.auditStatus, audit.auditorName, audit.casoName, this.auditReminderMessage(audit)]
        .some(value => (value || '').toLowerCase().includes(search)));
  }

  auditReminderMessage(audit: AuditScheduleTemplate): string | null {
    const userId = this.dashboardBean?.currentUserId;
    if (!userId) return null;

    if (this.dashboardBean?.auditorView && audit.auditorId === userId) {
      if (audit.auditStatus === 'Planned') {
        const overdue = this.overdueDays(audit);
        if (overdue >= 0) return `Action Required · Overdue${overdue === 0 ? ' today' : ` by ${overdue} day${overdue === 1 ? '' : 's'}`}`;
      }
      if (audit.auditStatus === 'Action Required') {
        const days = this.daysSinceAuditorScheduledEnd(audit);
        if (days !== null && days > 15) return `Audit is pending for Auditor Evaluation & Response · ${days} days since scheduled end`;
      }
    }

    if (this.dashboardBean?.casoView && audit.casoId === userId) {
      if (audit.auditStatus === 'In Progress') {
        const days = this.daysUntilCasoSchedule(audit);
        if (days !== null && days <= 15) {
          const timing = days > 0 ? `Starts in ${days} day${days === 1 ? '' : 's'}`
            : days === 0 ? 'Starts today' : `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
          return `In Progress · ${timing}`;
        }
      }
      const casoReminder = this.observationCasoReminderMessage(audit);
      if (casoReminder) return casoReminder;
    }
    if (audit.observationScopeMatch) {
      if (this.dashboardBean?.zoneView && audit.auditStatus === 'ObservationZONE')
        return this.scopedObservationReminderMessage(audit);
      if (this.dashboardBean?.sectorView && audit.auditStatus === 'Observation SECTOR')
        return this.scopedObservationReminderMessage(audit);
    }
    return null;
  }

  get highlightedAuditCount(): number {
    return this.filteredDashboardAudits.filter(audit => this.auditReminderMessage(audit) !== null).length;
  }

  get auditHistoryPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredDashboardAudits.length / this.auditHistoryPageSize));
  }

  get visibleDashboardAudits(): AuditScheduleTemplate[] {
    const start = (this.auditHistoryPage - 1) * this.auditHistoryPageSize;
    return this.filteredDashboardAudits.slice(start, start + this.auditHistoryPageSize);
  }

  openAuditHistory(content: TemplateRef<unknown>): void {
    this.selectedHistoryAudit = null;
    this.selectedAuditHistory = [];
    this.auditHistorySearch = '';
    this.auditHistoryPage = 1;
    this.auditListLoading = true;
    this.auditListError = false;
    this.modalRef = this.modalService.open(content, {
      size: 'xl', centered: true, scrollable: true, windowClass: 'dashboard-audit-history-modal'
    });
    this.auditScheduleService.getDashboardAuditList().subscribe({
      next: audits => { this.dashboardAudits = audits ?? []; this.auditListLoading = false; },
      error: () => { this.dashboardAudits = []; this.auditListError = true; this.auditListLoading = false; }
    });
  }

  viewAuditHistory(audit: AuditScheduleTemplate): void {
    this.selectedHistoryAudit = audit;
    this.selectedAuditHistory = [];
    this.selectedHistoryLoading = true;
    this.selectedHistoryError = false;
    this.auditScheduleService.getAuditTemplateStatusHistory(audit.id).subscribe({
      next: events => { this.selectedAuditHistory = events ?? []; this.selectedHistoryLoading = false; },
      error: () => { this.selectedHistoryError = true; this.selectedHistoryLoading = false; }
    });
  }

  backToAuditHistoryList(): void {
    this.selectedHistoryAudit = null;
    this.selectedAuditHistory = [];
  }
  getDashboardData(fromDate: string, toDate: string) {
    this.isDashboardLoading = true;
    const payload = {
      fromDate: this.fromDate,
      toDate: this.toDate
    };

    this.dashboardService.getDashboardDetails(payload).subscribe({
      next: (data) => {
        this.dashboardBean = data;
        this.createAuditTypeOverview(this.dashboardBean);
        const upcomingAudits = [...(this.dashboardBean.upcomingAuditTemplate || [])]
          .sort((a, b) => (a.auditMonth || '').localeCompare(b.auditMonth || ''));
        this.upcomingTotalCount = upcomingAudits.length;
        this.upcomingPlannedCount = upcomingAudits.filter(audit => audit.auditStatus === 'Planned').length;
        this.upcomingAttentionCount = upcomingAudits.filter(audit =>
          DashboardComponent.ATTENTION_STATUSES.includes(audit.auditStatus)
        ).length;
        this.upcomingAuditsFull = upcomingAudits;
        this.auditorEvaluationAlerts = (this.dashboardBean.pendingAuditorEvaluationReminders || [])
          .filter(audit => (this.daysSinceAuditorScheduledEnd(audit) ?? -1) > 15)
          .sort((a, b) => (this.daysSinceAuditorScheduledEnd(b) ?? 0) - (this.daysSinceAuditorScheduledEnd(a) ?? 0));
        if (this.dashboardBean.auditorView) this.showPlannedAuditReminders(this.dashboardBean.plannedAuditReminders || []);
        if (this.dashboardBean.zoneView || this.dashboardBean.sectorView) this.loadScopedObservationReminders();
        else if (this.dashboardBean.casoView) this.loadCasoAuditReminders();
        if (!this.dashboardBean.auditorView && !this.dashboardBean.casoView
          && !this.dashboardBean.zoneView && !this.dashboardBean.sectorView) this.umService.consumeAuditReminder();
        console.log('DashboardBean:', this.dashboardBean);
        this.isDashboardLoading = false;
        this.createChartView(this.dashboardBean);
      },
      error: (err) => {
        this.toast.show('Failed to fetch Dashboard Data: ' + err, 'error');
        this.isDashboardLoading = false;
      }
    });
  }

  createAuditTypeOverview(dashboardBean: DashboardBean) {
    this.auditCards = [
      {
        title: "IQCU",
        subtitle: "Internal Quality Control Unit",
        total: dashboardBean.IQCUTotalObservation,
        open: dashboardBean.IQCUOpenObservation,
        rate: dashboardBean.IQCUComplianceRate,
        lastAudit: dashboardBean.IQCULastAudit,
        airports: dashboardBean.IQCUAuditedAirport+"/"+dashboardBean.totalAirport+" Airports",
        color: "#e67e22",
        badgeBg: "#fde9d2"
      },
      {
        title: "BCAS",
        subtitle: "Bureau of Civil Aviation Security",
        total: dashboardBean.BCASTotalObservation,
        open: dashboardBean.BCASOpenObservation,
        rate: dashboardBean.BCASComplianceRate,
        lastAudit: dashboardBean.BCASLastAudit,
        airports: dashboardBean.BCASAuditedAirport+"/"+dashboardBean.totalAirport+" Airports",
        color: "#7c40ff",
        badgeBg: "#efe2ff"
      },
      {
        title: "CISF Internal",
        subtitle: "CISF Internal Audit",
        total: dashboardBean.InternalTotalObservation,
        open: dashboardBean.InternalOpenObservation,
        rate: dashboardBean.InternalComplianceRate,
        lastAudit: dashboardBean.InternalLastAudit,
        airports: dashboardBean.InternalAuditedAirport+"/"+dashboardBean.totalAirport+" Airports",
        color: "#009b75",
        badgeBg: "#d1f4e6"
      },
      {
        title: "ICAO",
        subtitle: "International Civil Aviation Organization",
        total: dashboardBean.ICAOTotalObservation,
        open: dashboardBean.ICAOOpenObservation,
        rate: dashboardBean.ICAOComplianceRate,
        lastAudit: dashboardBean.ICAOLastAudit,
        airports: dashboardBean.ICAOAuditedAirport+"/"+dashboardBean.totalAirport+" Airports",
        color: "#2d61ff",
        badgeBg: "#dde7ff"
      }
    ];
  }

  formatDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  }

  ngAfterViewInit() {
    this.createChartView(this.dashboardBean)
  }

  createChartView(bean: DashboardBean | null) {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;

    // 🔥 Destroy old chart if exists
    if (this.statusChart) {
      this.statusChart.destroy(); 
    }

    this.chartcompliance = Number(bean?.totalCompliance || 0);
    this.chartdropped = Number(bean?.totalDropped || 0);
    this.chartopen = Number(bean?.openObservation || 0);
    this.chartclose = this.chartcompliance + this.chartdropped;

    // ✅ FIXED HERE
    this.statusChart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Compliance", "Dropped", "Open", "Close"],
        datasets: [{
          data: [
            this.chartcompliance,
            this.chartdropped,
            this.chartopen,
            this.chartclose
          ],
          backgroundColor: ["#1abf4b", "#ffcc00", "#ff3b30", "#1b74e4"],
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: false }
        }
      }
    });

    this.createMonthlyAuditChart(bean);
  }

  createMonthlyAuditChart(bean: DashboardBean | null) {
    const canvas = document.getElementById('monthlyAuditChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    if (this.monthlyAuditChart) {
      this.monthlyAuditChart.destroy();
    }

    const monthlyCounts = bean?.monthlyAuditCounts || [];
    const auditCounts = monthlyCounts.map(item => Number(item.auditCount || 0));
    const monthLabels = monthlyCounts.map(item => {
      const [year, month] = item.auditMonth.split('-').map(Number);
      return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' })
        .format(new Date(year, month - 1, 1));
    });

    this.monthlyAuditChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Audits',
          data: auditCounts,
          backgroundColor: auditCounts.map(count => this.getAuditCountColor(count)),
          hoverBackgroundColor: auditCounts.map(count => this.getAuditCountColor(count, true)),
          borderRadius: 7,
          borderSkipped: false,
          maxBarThickness: 54
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#64748b', stepSize: 1 },
            grid: { color: 'rgba(148, 163, 184, .18)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: '#17395d',
            padding: 10
          }
        }
      }
    });
  }

  private getAuditCountColor(count: number, hover = false): string {
    const colors = count <= 0
      ? ['#d9e1e8', '#c8d2dc']
      : count === 1
        ? ['#27ae60', '#1f8f4e']
        : count === 2
          ? ['#2f80d8', '#2469b4']
          : count === 3
            ? ['#f2b01e', '#d5960c']
            : count === 4
              ? ['#f0782b', '#cc5d16']
              : ['#dc4453', '#b92f3d'];

    return colors[hover ? 1 : 0];
  }

  validateDates() {
    this.dateError = '';

    if (this.fromDate && this.toDate) {
      const from = new Date(this.fromDate);
      const to = new Date(this.toDate);

      // Today's date (without time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (from > to) {
        this.dateError = 'From Date cannot be greater than To Date';
        return;
      }

      if (to > today) {
        this.dateError = 'To Date cannot be greater than today';
        return;
      }
    }
  }

  getStatusClass(open: number) {
    if (open === 0) return 'bg-success';
    if (open <= 5) return 'bg-warning';
    return 'bg-danger';
  }

  viewDetails(airport: any) {
    console.log('Open details for:', airport);
  }

  applyFilter() {
    this.validateDates();

    if (this.dateError) return;

    this.getDashboardData(this.fromDate, this.toDate);
    this.modalService.dismissAll();
  }

  syncData(content: any) {
    console.log('Sync triggered');
    // Call refresh API
    this.modalRef = this.modalService.open(content, {
      centered: true, backdrop: 'static', keyboard: false,
      windowClass: 'dashboard-date-range-modal'
    });
  }

  openObservationDetails(content: any, type: string, subtitle: string) {
    console.log('Sync triggered');
    this.auditType = type;
    this.auditSubtitle = subtitle;
    // Call refresh API
    const payload = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      auditType: type
    };
    this.dashboardService.getAirportDetailList(payload).subscribe({
      next: (data) => {
        this.airportList = data;
        this.airportList.sort((a, b) => b.open - a.open);
        console.log('airportList:', this.airportList);
      },
      error: (err) => {
        this.toast.show('Failed to fetch Dashboard Data: ' + err, 'error');
      }
    });

    this.modalRef = this.modalService.open(content, { 
      backdrop: 'static', 
      keyboard: false,
      size: 'xl',
      centered: true,
      scrollable: true,
      windowClass: 'dashboard-observation-modal'
    });
  }

  getTotalObservation(): number {
    return this.airportList?.reduce((sum, a) => sum + (a.total || 0), 0) || 0;
  }

  getTotalOpen(): number {
    return this.airportList?.reduce((sum, a) => sum + (a.open || 0), 0) || 0;
  }

  getCompliance(airport: any): number {
    if (!airport.total) return 0;
    return ((airport.total - airport.open) / airport.total) * 100;
  }

  getShortText(text: string): string {
    return text?.length > 100 ? text.substring(0, 100) + '...' : text;
  }
  formatDateMonthYear(date: any): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');
}
getAuditStatusClass(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'status-completed';
    case 'OVERDUE': return 'status-overdue';
    case 'DUE': return 'status-due';
    case 'SCHEDULED': return 'status-plan';
    default: return 'status-not-scheduled';
  }
}

getScheduleStatusCount(status: string): number {
  return this.dashboardBean?.unitAuditCurrentStatuslist?.filter(item => item.auditStatus === status).length || 0;
}

filterScheduleByStatus(status: ScheduleStatusFilter): void {
  this.selectedScheduleStatus = status;
}

get filteredUnitAuditStatuses(): UnitAuditCurrentStatus[] {
  const audits = this.dashboardBean?.unitAuditCurrentStatuslist ?? [];
  return this.selectedScheduleStatus === 'ALL'
    ? audits
    : audits.filter(audit => audit.auditStatus === this.selectedScheduleStatus);
}
}

import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UsermanagementService } from '../service/usermanagement.service';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { CommonModule } from "@angular/common";
import { DashboardService } from "../service/dashboard.service";
import { ClassDetails } from "../interface/ClassDetails";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StudentService } from '../service/student.service';
import { DashboardBean } from '../interface/DashboardBean';
import { ToastService } from '../service/toast.service';
import { AirportListDashboard } from '../interface/AirportListDashboard';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
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
  
  isLoading: boolean = false;
  usernameData = "";
  isLeftSidebarCollapsed = true;
  private modalRef: NgbModalRef | null = null;

  dashboardBean: DashboardBean | null = null;
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

  constructor(private modalService: NgbModal,private umService: UsermanagementService, private dashboardService: DashboardService, private toast: ToastService, private iqcuCalendarService: IqcuCalendarService, private sanitizer: DomSanitizer) {

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

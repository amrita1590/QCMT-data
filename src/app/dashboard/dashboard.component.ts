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



type Status = 'P' | 'A';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, NgbModule, CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  
  isLoading: boolean = false;
  usernameData = "";
  isLeftSidebarCollapsed = true;
  private modalRef: NgbModalRef | null = null;

  dashboardBean: DashboardBean | null = null;

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

  upcomingAuditList: AuditScheduleTemplate[] | null = null; 

  auditCards : any = [];

  currentDate: Date = new Date();
  private intervalId: any;

  notificationList: NotificationBean[] | null = null;
  allNotificationList: NotificationBean[] | null = null;
  showNotificationPopup: boolean = false;

  constructor(private modalService: NgbModal,private umService: UsermanagementService, private dashboardService: DashboardService, private toast: ToastService) {

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

    // To Date = Today
    this.toDate = this.formatDate(today);

    // From Date = 1 year back
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    this.fromDate = this.formatDate(lastYear);
    this.getDashboardData(this.fromDate, this.toDate);   
    
    this.umService.getNotificatinList().subscribe({
      next: (data) => {
        this.notificationList = data;
        this.notificationCount = this.notificationList.filter(n => Number(n.status) === 0).length;
        console.log('Notification List:', this.notificationList);
      }
    });
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
    this.modalRef = this.modalService.open(content, { backdrop: 'static', keyboard: false});
  }
 createModal(content: any) {
   
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
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
        this.upcomingAuditList = this.dashboardBean.upcomingAuditTemplate.sort((a, b) => new Date(b.createdAt).getTime()).slice(0, 10);
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
        cutout: "70%",
        plugins: {
          legend: { display: false }
        }
      }
    });
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

    console.log('Filtering from', this.fromDate, 'to', this.toDate);
    // Call API here
    this.modalService.dismissAll();
  }

  syncData(content: any) {
    console.log('Sync triggered');
    // Call refresh API
    this.modalRef = this.modalService.open(content, { backdrop: 'static', keyboard: false});
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
      size: 'lg'   // ✅ large size
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
    default: return '';
  }
}}

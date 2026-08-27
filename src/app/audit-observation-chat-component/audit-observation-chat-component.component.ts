import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuditObservationComponent } from '../interface/AuditObservationComponent';
import { AuditscheduleserviceService } from '../service/auditscheduleservice.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../service/toast.service';
import { AuditObservationComponentMessage } from '../interface/AuditObservationComponentMessage';
import { RefreshService } from '../service/refresh.service';
import { APP_CONSTANTS } from '../constants/app.constants';
import { DownloadService } from '../service/download.service';

@Component({
  selector: 'app-audit-observation-chat-component',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './audit-observation-chat-component.component.html',
  styleUrl: './audit-observation-chat-component.component.css'
})
export class AuditObservationChatComponentComponent {

  constants = APP_CONSTANTS;
  baseUrl = APP_CONSTANTS.FILES.BASE_URL;
  @Input() data: AuditObservationComponent | null = null;
  observationMessages: AuditObservationComponentMessage[] = [];
  csfFile: File | null = null

  constructor(private auditService: AuditscheduleserviceService, private modalService: NgbModal, private toast: ToastService, private refreshService: RefreshService, private downloadService: DownloadService) {

  }

  ngOnInit() {
    this.refreshService.refresh$.subscribe(() => {
      this.getObservationMessages();   // refresh popup data
    });
    this.getObservationMessages();
  }

  getObservationMessages() {
    if (this.data) {
      console.log("Fetching messages for observation ID ::", this.data.id);
      this.auditService.getAuditObservationMessages(this.data.id).subscribe({
        next: (messages) => {
          this.observationMessages = messages;
          this.observationMessages = (this.observationMessages ?? []).sort((a, b) => this.parseDateTime(a.entryTime) - this.parseDateTime(b.entryTime));
          console.log("Observation Messages ::", messages);
          this.observationMessagesprepareDownloadUrls();
        },
        error: (err) => {
          console.error("Error fetching observation messages ::", err);
        }
      });
    }
  }

  observationMessagesprepareDownloadUrls() {
    this.observationMessages.forEach(msg => {
      if (msg.attachmentStatus === 'Attached') {
        downloadUrl: this.buildDownloadUrl(msg.filePath, msg.fileName);
      }
    });
  }

  buildDownloadUrl(path: string, documentName: string) {
   const normalizedPath = path.replace(/[\\\/]+$/, '').replace(/\\/g, '/');
      const fullPath = `${normalizedPath}/${documentName}`;
    //console.log("Building download URL for:", fullPath);
    return this.baseUrl + 'v1/qcmt/master/auditfile?fullPath=' + encodeURIComponent(fullPath);
  }

  /** /auditfile now requires auth - a plain <a href> can't carry the Bearer token, so downloads go through this instead. */
  downloadFile(path: string, documentName: string) {
    this.downloadService.downloadAuditFile(path, documentName);
  }

  parseDateTime(dateStr: string) {
    if (!dateStr) return 0;

    // convert "19 Mar 2026 | 02:26 pm" → "19 Mar 2026 02:26 pm"
    const clean = dateStr.replace('|', '');

    return new Date(clean).getTime();
  }
}

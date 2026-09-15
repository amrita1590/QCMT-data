import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-audit-status-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-status-guide.component.html',
  styleUrl: './audit-status-guide.component.css'
})
export class AuditStatusGuideComponent {
  expanded = false;
}

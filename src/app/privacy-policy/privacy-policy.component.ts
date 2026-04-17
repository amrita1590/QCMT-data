import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.css'
})
export class PrivacyPolicyComponent {
  lastUpdated = 'January 01, 2026';
  contactEmail = 'support@qcmt.com';
  websiteUrl = 'www.qcmt.com';
}
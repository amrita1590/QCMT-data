import { InternalAuditStageCard, InternalAuditUnit } from './internal-audit.model';

export const INTERNAL_AUDIT_TABS = [
  ['schedule', 'Audit Schedule'],
  ['questionnaire', 'Questionnaire'],
  ['response', 'Unit Response'],
  ['report', 'Audit Report'],
  ['observation', 'Observation'],
  ['compliance', 'Compliance'],
  ['summary', 'Audit Summary']
];

export const INTERNAL_AUDIT_STAGE_CARDS: InternalAuditStageCard[] = [
  { label: 'Planned', status: 'Planned', border: 'border-primary' },
  { label: 'In Progress', status: 'In Progress', border: 'border-warning' },
  { label: 'Action Required', status: 'Action Required', border: 'border-danger' },
  { label: 'Completed', status: 'Completed', border: 'border-success' },
  { label: 'Closed', status: 'Closed', border: 'border-secondary' }
];

export const INTERNAL_AUDIT_STATUS_BADGE: Record<string, string> = {
  Planned: 'bg-primary-subtle text-primary',
  'In Progress': 'bg-warning-subtle text-warning',
  Completed: 'bg-success-subtle text-success',
  'Action Required': 'bg-danger-subtle text-danger',
  Closed: 'bg-secondary-subtle text-secondary'
};

export const INTERNAL_AUDIT_UNITS: InternalAuditUnit[] = [
  { id: 1, unitName: 'CISF Unit IGI Airport, Delhi', airportCode: 'DEL' },
  { id: 2, unitName: 'CISF Unit CSMIA, Mumbai', airportCode: 'BOM' },
  { id: 3, unitName: 'CISF Unit Kempegowda Airport, Bengaluru', airportCode: 'BLR' },
  { id: 4, unitName: 'CISF Unit RGIA, Hyderabad', airportCode: 'HYD' },
  { id: 5, unitName: 'CISF Unit Chennai Airport', airportCode: 'MAA' },
  { id: 6, unitName: 'CISF Unit Kolkata Airport', airportCode: 'CCU' }
];

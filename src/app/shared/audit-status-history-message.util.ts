/**
 * Maps a raw audit-template status transition (previousStatus -> newStatus, using the exact
 * strings MasterConstant defines on the backend - see CLAUDE.md's IQCU status table) to a
 * human-readable activity message for non-technical users.
 *
 * This is a display-only layer: it never drives a workflow/permission decision, and it never
 * changes what is stored. Unmapped/unrecognized transitions return null so callers can fall back
 * to showing the raw "previousStatus -> newStatus" text instead - every history row stays visible
 * even for a transition this table doesn't (yet) know about.
 *
 * Single source of truth for this mapping - shared by shared/audit-template-status-history and
 * dashboard.component so the wording never drifts between the two places that show it.
 */
export function getAuditHistoryActivityMessage(previousStatus: string | null | undefined, newStatus: string): string | null {
  const from = (previousStatus ?? '').trim();
  const to = (newStatus ?? '').trim();

  if (!from && to === 'Planned') return 'Audit scheduled';
  if (from === 'Planned' && to === 'In Progress') return 'PQ sent to CASO';
  if (from === 'In Progress' && to === 'Action Required') return 'Response to PQ sent';
  if (from === 'Action Required' && to === 'Observation APS') return 'Final audit report submitted to APS HQrs';

  if (from === 'Observation APS' && to === 'Observation CASO') return 'Audit observation list sent to CASO';
  if (from === 'Observation APS' && to === 'ObservationZONE') return 'Audit observation list forwarded to Zone';

  if (from === 'Observation CASO' && to === 'ObservationZONE') return 'Observation compliance sent to Zone';
  if (from === 'Observation CASO' && to === 'Observation SECTOR') return 'Observation compliance sent to Sector';

  if (from === 'ObservationZONE' && to === 'Observation CASO') return 'Observation compliance sent back to CASO';
  if (from === 'Observation SECTOR' && to === 'Observation CASO') return 'Observation compliance sent back to CASO';

  if (from === 'ObservationZONE' && to === 'Observation APS') return 'Observation compliance forwarded to APS HQrs for necessary action';
  if (from === 'Observation SECTOR' && to === 'Observation APS') return 'Observation compliance forwarded to APS HQrs for necessary action';

  return null;
}

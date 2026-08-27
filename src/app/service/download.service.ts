import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  constructor(private http: HttpClient, private toastService: ToastService) {}

  /**
   * Fetches an audit file as an authenticated blob and saves it to disk. /auditfile now
   * requires a valid Bearer token (tokenInterceptor attaches it automatically here, unlike a
   * plain `<a href>` which can't carry custom headers) - this replaces the old pattern of
   * binding an anchor tag directly to a raw `?fullPath=` download URL.
   */
  downloadAuditFile(fullPath: string, documentName: string) {
    if (!fullPath || !documentName) {
      console.error('Invalid path or document name for download.');
      return;
    }
    const normalizedPath = fullPath.replace(/[\\/]+$/, '').replace(/\\/g, '/');
    const filePath = `${normalizedPath}/${documentName}`;
    // Relative path (not APP_CONSTANTS.FILES.BASE_URL) - this goes through HttpClient, which is
    // subject to CORS, unlike the raw <a href> this replaced. A relative path stays same-origin
    // (proxied in dev, same-origin routing in prod), matching every other HttpClient call in the
    // app - see BcasAuditService.getBcasFile() for the same working pattern.
    const url = '/v1/qcmt/master/auditfile?fullPath=' + encodeURIComponent(filePath);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => saveAs(blob, documentName),
      error: () => this.toastService.show('Failed to download file.', 'error')
    });
  }

  // CSV from array of objects
  downloadCsv(filename: string, data: any[], columns?: string[]) {
    if (!data || !data.length) {
      console.warn('No data to export');
      return;
    }
    const keys = columns ?? Object.keys(data[0]);
    const csvRows = [
      keys.join(','), // header
      ...data.map(row => keys.map(k => this.escapeCsv(String(row[k] ?? ''))).join(','))
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
  }

  private escapeCsv(value: string) {
    // surround value in quotes if contains comma/quote/newline
    if (value.includes('"')) value = value.replace(/"/g, '""');
    if (value.search(/("|,|\n)/g) >= 0) return `"${value}"`;
    return value;
  }

  // Excel (.xlsx) from array of objects
  downloadExcel(filename: string, data: any[], sheetName = 'Sheet1') {
    if (!data || !data.length) {
      console.warn('No data to export');
      return;
    }
    // convert to worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { [sheetName]: ws }, SheetNames: [sheetName] };
    const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  }

  // PDF using jsPDF + autoTable
  downloadPdf(filename: string, data: any[], columns?: { header: string, dataKey: string }[], title?: string) {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 16);
    }
    const cols = columns ?? (data.length ? Object.keys(data[0]).map(k => ({ header: k, dataKey: k })) : []);
    // autoTable takes columns & data
    (doc as any).autoTable({
      startY: title ? 22 : 10,
      head: [cols.map(c => c.header)],
      body: data.map(r => cols.map(c => r[c.dataKey] ?? '')),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 144, 255] },
      theme: 'striped',
      didDrawCell: (dataArg: { cell: { raw: any } }) => { /* optional custom styling */ }
    });
    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  }
}

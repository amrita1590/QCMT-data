import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
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

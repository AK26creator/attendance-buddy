/**
 * Excel Export Utility
 * Generates and downloads .xlsx files for attendance data
 */

import * as XLSX from 'xlsx';
import { AttendanceRecord } from './db';

/**
 * Export attendance records to Excel file
 * Columns: S.NO, Employee ID, Employee Name, Absentees, Present, Time
 */
export function exportToExcel(records: AttendanceRecord[], filename?: string): void {
  // Transform records to match Excel column format
  const excelData = records.map(record => ({
    'S.NO': record.sno,
    'Employee ID': record.employeeId,
    'Employee Name': record.employeeName,
    'Absentees': record.absent,
    'Present': record.present,
    'Time': record.time,
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 8 },  // S.NO
    { wch: 15 }, // Employee ID
    { wch: 25 }, // Employee Name
    { wch: 12 }, // Absentees
    { wch: 10 }, // Present
    { wch: 20 }, // Time
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  // Generate filename with current date if not provided
  const date = new Date();
  const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const exportFilename = filename || `Attendance_${dateStr}.xlsx`;

  // Trigger download
  XLSX.writeFile(workbook, exportFilename);
}

/**
 * Export to Excel with custom formatting
 */
export function exportToExcelWithStyles(
  records: AttendanceRecord[], 
  filename?: string,
  options?: {
    sheetName?: string;
    includeHeaders?: boolean;
  }
): void {
  const sheetName = options?.sheetName || 'Attendance';
  
  // Transform records
  const excelData = records.map(record => ({
    'S.NO': record.sno,
    'Employee ID': record.employeeId,
    'Employee Name': record.employeeName,
    'Absentees': record.absent,
    'Present': record.present,
    'Time': record.time,
  }));

  // Create worksheet from JSON
  const worksheet = XLSX.utils.json_to_sheet(excelData, {
    header: ['S.NO', 'Employee ID', 'Employee Name', 'Absentees', 'Present', 'Time'],
  });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
  ];

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename
  const date = new Date();
  const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const exportFilename = filename || `Attendance_${dateStr}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, exportFilename);
}

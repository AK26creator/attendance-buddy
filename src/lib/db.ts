/**
 * IndexedDB Database Layer for Story Seeds Attendance
 * Provides CRUD operations for employees and attendance records
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from './supabase';
import { toast } from 'sonner';

// Database schema types
export interface Employee {
  id: string;
  name: string;
  salary: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id?: number; // Auto-incremented
  sno: number;
  employeeId: string;
  employeeName: string;
  absent: string; // "Yes" or ""
  present: string; // "Yes" or ""
  time: string; // DD-MM-YYYY HH:mm or empty
  date: string; // DD-MM-YYYY
}

interface AttendanceDB extends DBSchema {
  employees: {
    key: string;
    value: Employee;
    indexes: { 'by-name': string };
  };
  attendance: {
    key: number;
    value: AttendanceRecord;
    indexes: {
      'by-employee': string;
      'by-date': string;
    };
  };
}

const DB_NAME = 'AttendanceSystem';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AttendanceDB> | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase<AttendanceDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AttendanceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create employees store
      if (!db.objectStoreNames.contains('employees')) {
        const employeeStore = db.createObjectStore('employees', { keyPath: 'id' });
        employeeStore.createIndex('by-name', 'name');
      }

      // Create attendance store with auto-increment
      if (!db.objectStoreNames.contains('attendance')) {
        const attendanceStore = db.createObjectStore('attendance', {
          keyPath: 'id',
          autoIncrement: true
        });
        attendanceStore.createIndex('by-employee', 'employeeId');
        attendanceStore.createIndex('by-date', 'date');
      }
    },
  });

  return dbInstance;
}

// ==================== Employee Operations ====================

/**
 * Add a new employee
 */
export async function addEmployee(employee: Omit<Employee, 'createdAt'>): Promise<Employee> {
  const db = await getDB();

  // Validate required fields
  if (!employee.id?.trim()) {
    throw new Error('Employee ID is required');
  }
  if (!employee.name?.trim()) {
    throw new Error('Employee Name is required');
  }

  // Check if employee ID already exists (IndexedDB)
  const existing = await db.get('employees', employee.id);
  if (existing) {
    throw new Error('Employee ID already exists locally');
  }

  const newEmployee: Employee = {
    id: employee.id.trim(),
    name: employee.name.trim(),
    salary: Number(employee.salary) || 0,
    createdAt: new Date().toISOString(),
  };

  // Sync with Supabase
  const { error: supabaseError } = await supabase
    .from('employees')
    .insert([{
      employee_id: newEmployee.id,
      name: newEmployee.name,
      salary: newEmployee.salary,
      created_at: newEmployee.createdAt
    }]);

  if (supabaseError) {
    console.error('Supabase error:', supabaseError);
    toast.error(`Supabase Sync Failed: ${supabaseError.message}`);
    // Continue even if Supabase fails
  }

  await db.add('employees', newEmployee);
  return newEmployee;
}

/**
 * Get all employees
 */
export async function getEmployees(): Promise<Employee[]> {
  const db = await getDB();

  // Try to fetch from Supabase first
  const { data: supabaseEmployees, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');

  if (!error && supabaseEmployees) {
    const formatted = supabaseEmployees.map(e => ({
      id: e.employee_id,
      name: e.name,
      salary: e.salary,
      createdAt: e.created_at
    }));

    // Optional: Update local DB with Supabase data
    for (const emp of formatted) {
      await db.put('employees', emp);
    }

    return formatted;
  }

  // Fallback to IndexedDB
  return db.getAll('employees');
}

/**
 * Delete an employee by ID
 */
export async function deleteEmployee(id: string): Promise<void> {
  const db = await getDB();

  // Delete from Supabase
  await supabase.from('employees').delete().eq('employee_id', id);

  await db.delete('employees', id);
}

/**
 * Get a single employee by ID
 */
export async function getEmployee(id: string): Promise<Employee | undefined> {
  const db = await getDB();
  return db.get('employees', id);
}

// ==================== Attendance Operations ====================

/**
 * Format current date/time as DD-MM-YYYY HH:mm
 */
export function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

/**
 * Format current date as DD-MM-YYYY
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Get the next S.NO for attendance records
 */
async function getNextSno(): Promise<number> {
  const db = await getDB();
  const allRecords = await db.getAll('attendance');
  if (allRecords.length === 0) return 1;
  const maxSno = Math.max(...allRecords.map(r => r.sno));
  return maxSno + 1;
}

/**
 * Mark attendance for an employee
 */
export async function markAttendance(
  employeeId: string,
  isPresent: boolean
): Promise<AttendanceRecord> {
  const db = await getDB();

  // Get employee details
  const employee = await db.get('employees', employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const now = new Date();
  const sno = await getNextSno();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Logic 5: if after 12:00 pm -> Absent (force absent even if isPresent is true)
  let finalIsPresent = isPresent;
  if (hours >= 12) {
    finalIsPresent = false;
  }

  const record: Omit<AttendanceRecord, 'id'> = {
    sno,
    employeeId: employee.id,
    employeeName: employee.name,
    absent: finalIsPresent ? '' : 'Yes',
    present: finalIsPresent ? 'Yes' : '',
    time: finalIsPresent ? formatDateTime(now) : '', // Time is usually recorded for present employees
    date: formatDate(now),
  };

  const id = await db.add('attendance', record as AttendanceRecord);
  return { ...record, id } as AttendanceRecord;
}

/**
 * Get all attendance records
 */
export async function getAttendance(): Promise<AttendanceRecord[]> {
  const db = await getDB();
  return db.getAll('attendance');
}

/**
 * Update an attendance record
 */
export async function updateAttendance(
  id: number,
  updates: Partial<AttendanceRecord>
): Promise<AttendanceRecord> {
  const db = await getDB();
  const existing = await db.get('attendance', id);

  if (!existing) {
    throw new Error('Attendance record not found');
  }

  const updated: AttendanceRecord = {
    ...existing,
    ...updates,
    id, // Ensure ID is preserved
  };

  await db.put('attendance', updated);
  return updated;
}

/**
 * Delete an attendance record
 */
export async function deleteAttendance(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('attendance', id);
}

/**
 * Get attendance records by date
 */
export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('attendance', 'by-date', date);
}

/**
 * Get attendance records for a specific employee
 */
export async function getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('attendance', 'by-employee', employeeId);
}

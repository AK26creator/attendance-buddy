import { AttendanceRecord } from './db';

export interface SalaryDetails {
  baseSalary: number;
  dailySalary: number;
  totalLeaves: number;
  lopDays: number;
  deductionAmount: number;
  payableSalary: number;
}

/**
 * Calculate salary details based on attendance and LOP logic.
 * Logic:
 * - Daily Salary = Monthly Salary / 30
 * - First 3 leaves are paid (no deduction).
 * - Leaves > 3 are Loss of Pay (LOP).
 * - Deduction = (Total Leaves - 3) * Daily Salary
 */
export function calculateSalary(
  baseSalary: number,
  attendanceRecords: AttendanceRecord[]
): SalaryDetails {
  const dailySalary = baseSalary / 30;
  
  // Count total absent days
  // Assuming 'absent' field being "Yes" indicates a leave
  const totalLeaves = attendanceRecords.filter(r => r.absent === 'Yes').length;

  let lopDays = 0;
  if (totalLeaves > 3) {
    lopDays = totalLeaves - 3;
  }

  const deductionAmount = lopDays * dailySalary;
  const payableSalary = Math.max(0, baseSalary - deductionAmount);

  return {
    baseSalary,
    dailySalary,
    totalLeaves,
    lopDays,
    deductionAmount,
    payableSalary
  };
}

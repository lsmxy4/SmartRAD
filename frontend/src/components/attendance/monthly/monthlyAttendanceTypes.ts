import type { AttendanceStatus, Department, EmployeeSummary } from "../types";

export type { Department, EmployeeSummary };

export interface MonthlySummaryResponse {
  employeeId: number;
  employeeName: string;
  totalWorkMinutes: number;
  totalOvertimeMinutes: number;
  workDayCount: number;
}

export interface DailyTrendPoint {
  date: string;
  day: number;
  attendanceRate: number | null;
  lateRate: number | null;
  absentRate: number | null;
  normalCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
}

export interface EmployeeMonthlyRow {
  employeeId: number;
  employeeName: string;
  departmentName: string;
  positionName: string;
  normalDays: number;
  lateCount: number;
  absentCount: number;
  leaveDays: number;
  overtimeMinutes: number | null;
  attendanceRate: number | null;
}

export interface DepartmentRate {
  name: string;
  rate: number;
}

export interface MonthlyViewData {
  workdayCount: number;
  attendanceRate: number | null;
  normalCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  averageOvertimeMinutes: number | null;
  trend: DailyTrendPoint[];
  employees: EmployeeMonthlyRow[];
  departments: DepartmentRate[];
}

export interface StatusCount {
  status: AttendanceStatus;
  count: number;
}

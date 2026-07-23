import type { AttendanceResponse, EmployeeSummary } from "../types";
import { normalizeAttendanceStatus } from "../types";
import type { DailyTrendPoint, DepartmentRate, EmployeeMonthlyRow, MonthlySummaryResponse, MonthlyViewData } from "./monthlyAttendanceTypes";

export const TEMP_WARNING_LATE_THRESHOLD = 3;
export const TEMP_WARNING_ABSENT_THRESHOLD = 1;

export function weekdayDates(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const dates: string[] = [];
  const lastDay = new Date(year, monthNumber, 0).getDate();
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, monthNumber - 1, day);
    if (date.getDay() !== 0 && date.getDay() !== 6) dates.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  return dates;
}

function percent(value: number, total: number) { return total > 0 ? Number(((value / total) * 100).toFixed(1)) : null; }

export function aggregateMonthly(
  month: string,
  employees: EmployeeSummary[],
  summaries: MonthlySummaryResponse[],
  attendanceByDate: Map<string, AttendanceResponse[]>,
  departmentsList: { departmentName: string }[] = [],
): MonthlyViewData {
  const dates = weekdayDates(month);
  const employeeMap = new Map(employees.map((employee) => [employee.employeeId, employee]));
  const counters = new Map<number, { normal: number; late: number; absent: number; leave: number }>();
  const totals = { normal: 0, late: 0, absent: 0, leave: 0 };
  const trend: DailyTrendPoint[] = dates.map((date) => {
    const records = attendanceByDate.get(date) ?? [];
    const daily = { normal: 0, late: 0, absent: 0, leave: 0 };
    records.forEach((record) => {
      const status = normalizeAttendanceStatus(record.attendanceStatusCode);
      if (status === "unknown" || status === "earlyLeave" || status === "overtime" || status === "nightWork") return;
      daily[status] += 1;
      totals[status] += 1;
      const counter = counters.get(record.employeeId) ?? { normal: 0, late: 0, absent: 0, leave: 0 };
      counter[status] += 1;
      counters.set(record.employeeId, counter);
    });
    const classified = daily.normal + daily.late + daily.absent + daily.leave;
    return { date, day: Number(date.slice(-2)), attendanceRate: percent(daily.normal, classified), lateRate: percent(daily.late, classified), absentRate: percent(daily.absent, classified), normalCount: daily.normal, lateCount: daily.late, absentCount: daily.absent, leaveCount: daily.leave };
  }).filter((point) => point.normalCount + point.lateCount + point.absentCount + point.leaveCount > 0);

  const summaryMap = new Map(summaries.map((summary) => [summary.employeeId, summary]));
  const employeeIds = new Set([...summaries.map((item) => item.employeeId), ...counters.keys()]);
  const employeeRows: EmployeeMonthlyRow[] = [...employeeIds].map((employeeId) => {
    const employee = employeeMap.get(employeeId);
    const summary = summaryMap.get(employeeId);
    const count = counters.get(employeeId) ?? { normal: 0, late: 0, absent: 0, leave: 0 };
    const classified = count.normal + count.late + count.absent + count.leave;
    return { employeeId, employeeName: employee?.name ?? summary?.employeeName ?? "미확인", departmentName: employee?.departmentName ?? "미지정", positionName: employee?.positionName ?? "-", normalDays: count.normal, lateCount: count.late, absentCount: count.absent, leaveDays: count.leave, overtimeMinutes: summary?.totalOvertimeMinutes ?? null, attendanceRate: percent(count.normal, classified) };
  }).sort((a, b) => a.employeeName.localeCompare(b.employeeName, "ko"));

  const departmentGroups = new Map<string, { normal: number; classified: number }>();
  departmentsList.forEach((dept) => {
    departmentGroups.set(dept.departmentName, { normal: 0, classified: 0 });
  });

  employeeRows.forEach((row) => {
    const group = departmentGroups.get(row.departmentName) ?? { normal: 0, classified: 0 };
    group.normal += row.normalDays;
    group.classified += row.normalDays + row.lateCount + row.absentCount + row.leaveDays;
    departmentGroups.set(row.departmentName, group);
  });
  const departments: DepartmentRate[] = [...departmentGroups].map(([name, value]) => ({ name, rate: percent(value.normal, value.classified) ?? 0 })).sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name, "ko"));
  const classifiedTotal = totals.normal + totals.late + totals.absent + totals.leave;
  const overtimeValues = summaries.map((item) => item.totalOvertimeMinutes).filter((value) => Number.isFinite(value));
  return { workdayCount: dates.length, attendanceRate: percent(totals.normal, classifiedTotal), normalCount: totals.normal, lateCount: totals.late, absentCount: totals.absent, leaveCount: totals.leave, averageOvertimeMinutes: overtimeValues.length ? overtimeValues.reduce((sum, value) => sum + value, 0) / overtimeValues.length : null, trend, employees: employeeRows, departments };
}

export function warningEmployees(rows: EmployeeMonthlyRow[]) {
  return rows.filter((row) => row.lateCount >= TEMP_WARNING_LATE_THRESHOLD || row.absentCount >= TEMP_WARNING_ABSENT_THRESHOLD).sort((a, b) => b.absentCount - a.absentCount || b.lateCount - a.lateCount || a.employeeName.localeCompare(b.employeeName, "ko")).slice(0, 3);
}

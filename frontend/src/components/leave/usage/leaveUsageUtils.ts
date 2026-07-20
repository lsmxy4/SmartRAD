import type { Employee, EmployeeUsageRow, LeaveBalance, LeaveRequest, UsageSummary } from "./leaveUsageTypes";

export function yearRange() { const year = new Date().getFullYear(); return { startDate: `${year}-01-01`, endDate: `${year}-12-31` }; }
export function makeRows(employees: Employee[], balances: Map<number, LeaveBalance[]>, requests: LeaveRequest[]) {
  return employees.filter((employee) => employee.employeeStatusCode === "ACTIVE").map((employee): EmployeeUsageRow => {
    const employeeBalances = balances.get(employee.employeeId) ?? [];
    const totalDays = employeeBalances.reduce((sum, item) => sum + Number(item.totalDays), 0);
    const usedDays = employeeBalances.reduce((sum, item) => sum + Number(item.usedDays), 0);
    const remainDays = employeeBalances.reduce((sum, item) => sum + Number(item.remainDays), 0);
    return { ...employee, balances: employeeBalances, requests: requests.filter((request) => request.employeeId === employee.employeeId), totalDays, usedDays, remainDays, usageRate: totalDays > 0 ? Number(((usedDays / totalDays) * 100).toFixed(1)) : 0 };
  });
}
export function summarize(rows: EmployeeUsageRow[]): UsageSummary { const totalGranted = rows.reduce((sum, row) => sum + row.totalDays, 0); const totalUsed = rows.reduce((sum, row) => sum + row.usedDays, 0); const totalRemaining = rows.reduce((sum, row) => sum + row.remainDays, 0); return { employeeCount: rows.length, totalGranted, totalUsed, totalRemaining, usageRate: totalGranted ? Number(((totalUsed / totalGranted) * 100).toFixed(1)) : 0, remainingRate: totalGranted ? Number(((totalRemaining / totalGranted) * 100).toFixed(1)) : 0 }; }
export function formatDays(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }

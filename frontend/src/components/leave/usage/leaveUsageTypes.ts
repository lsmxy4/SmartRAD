export interface Employee { employeeId: number; employeeNo: string; name: string; departmentName: string | null; positionName: string | null; employeeStatusCode: string; email: string; hireDate: string | null; }
export interface EmployeePage { content: Employee[]; totalElements: number; }
export interface LeaveBalance { employeeLeaveBalanceId: number; employeeId: number; leaveTypeId: number; leaveTypeName: string; totalDays: number; usedDays: number; remainDays: number; expireDate: string | null; }
export interface LeaveRequest { leaveRequestId: number; employeeId: number; employeeName: string; leaveTypeId: number; leaveTypeName: string; startDate: string; endDate: string; leaveDays: number; reason: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; approverName: string | null; createdAt: string; }
export interface Department { departmentId: number; departmentName: string; }
export interface Position { positionId: number; positionName: string; level: number; }
export interface EmployeeUsageRow extends Employee { totalDays: number; usedDays: number; remainDays: number; usageRate: number; balances: LeaveBalance[]; requests: LeaveRequest[]; }
export interface UsageFilters { keyword: string; departmentId: string; positionId: string; startDate: string; endDate: string; }
export type SortKey = "totalDays" | "usedDays" | "remainDays" | "usageRate";
export interface UsageSummary { employeeCount: number; totalGranted: number; totalUsed: number; totalRemaining: number; usageRate: number; remainingRate: number; }

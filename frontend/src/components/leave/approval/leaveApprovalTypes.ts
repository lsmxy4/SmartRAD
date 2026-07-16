export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveRequestResponse {
  leaveRequestId: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  leaveDays: number;
  reason: string | null;
  status: LeaveStatus;
  approverId: number | null;
  approverName: string | null;
  createdAt: string;
}

export interface LeaveTypeResponse {
  leaveTypeId: number;
  leaveTypeName: string;
  paidYn: boolean;
  defaultDays: number | null;
  note: string | null;
}

export interface EmployeeSummary {
  employeeId: number;
  employeeNo: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
  employeeStatusCode: string;
  email: string;
}

export interface EmployeePage { content: EmployeeSummary[]; totalElements: number; }

export interface LeaveApprovalRow extends LeaveRequestResponse {
  employeeNo: string | null;
  departmentName: string | null;
  positionName: string | null;
  email: string | null;
}

export interface LeaveFilters {
  startDate: string;
  endDate: string;
  leaveTypeId: string;
  status: string;
  keyword: string;
}

export const STATUS_LABELS: Record<LeaveStatus, string> = { PENDING: "승인 대기", APPROVED: "승인 완료", REJECTED: "반려" };

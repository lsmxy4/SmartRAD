export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveRequestResponse {
  leaveRequestId: number;
  employeeId: number;
  employeeName: string;
  employeeNo: string | null;
  departmentId: number | null;
  departmentName: string | null;
  positionName: string | null;
  email: string | null;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  leaveDays: number;
  reason: string | null;
  status: LeaveStatus;
  approverId: number | null;
  approverName: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface LeaveRequestPage {
  content: LeaveRequestResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LeaveRequestSummary {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface LeaveRequestBulkApproveResult {
  leaveRequestId: number;
  success: boolean;
  failureReason: string | null;
}

export interface LeaveTypeResponse {
  leaveTypeId: number;
  leaveTypeName: string;
  paidYn: boolean;
  defaultDays: number | null;
  note: string | null;
}

export type LeaveApprovalRow = LeaveRequestResponse;

export interface LeaveFilters {
  startDate: string;
  endDate: string;
  leaveTypeId: string;
  status: string;
  keyword: string;
}

export const STATUS_LABELS: Record<LeaveStatus, string> = { PENDING: "승인 대기", APPROVED: "승인 완료", REJECTED: "반려" };

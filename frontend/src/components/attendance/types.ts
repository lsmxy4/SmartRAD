export interface AttendanceResponse {
  attendanceId: number;
  employeeId: number;
  employeeName: string;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workMinutes: number | null;
  overtimeMinutes: number | null;
  nightWorkMinutes: number | null;
  lateMinutes: number | null;
  earlyLeaveMinutes: number | null;
  attendanceStatusCode: string | null;
}

export interface EmployeeSummary {
  employeeId: number;
  employeeNo: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
  employeeStatusCode: string;
  email: string;
  hireDate: string | null;
  resignationDate: string | null;
}

export interface EmployeePage {
  content: EmployeeSummary[];
  totalElements: number;
}

export interface Department {
  departmentId: number;
  departmentName: string;
  parentDepartmentId: number | null;
  parentDepartmentName: string | null;
}

export type AttendanceStatus = "normal" | "late" | "absent" | "leave" | "unknown";

export interface AttendanceRow extends AttendanceResponse {
  employeeNo: string | null;
  departmentName: string | null;
  positionName: string | null;
  normalizedStatus: AttendanceStatus;
}

export interface AttendanceCounts {
  totalEmployees: number;
  normal: number;
  late: number;
  absent: number;
  leave: number;
}

export function normalizeAttendanceStatus(status: string | null): AttendanceStatus {
  switch (status?.toUpperCase()) {
    case "NORMAL":
      return "normal";
    case "LATE":
      return "late";
    case "ABSENT":
      return "absent";
    case "LEAVE":
    case "VACATION":
      return "leave";
    default:
      return "unknown";
  }
}

export function attendanceStatusLabel(row: AttendanceRow) {
  const labels: Record<AttendanceStatus, string> = {
    normal: "정상출근",
    late: "지각",
    absent: "결근",
    leave: "휴가",
    unknown: row.attendanceStatusCode || "미확인",
  };
  return labels[row.normalizedStatus];
}

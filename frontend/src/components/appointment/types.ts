export interface AppointmentResponse {
  employeeAppointmentId: number;
  employeeId: number;
  employeeName: string;
  appointmentType: string;
  appointmentDate: string;
  effectiveDate: string;
  fromDepartmentId: number | null;
  fromDepartmentName: string | null;
  toDepartmentId: number | null;
  toDepartmentName: string | null;
  fromPositionName: string | null;
  toPositionName: string | null;
  fromJobTitle: string | null;
  toJobTitle: string | null;
  reason: string | null;
  memo: string | null;
  createdAt: string;
}

export interface AppointmentPage {
  content: AppointmentResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const APPOINTMENT_TYPE_OPTIONS = [
  { value: "TRANSFER", label: "부서 이동" },
  { value: "PROMOTION", label: "직급 승진" },
  { value: "DEMOTION", label: "직급 강등" },
  { value: "RESIGNATION", label: "퇴사" },
  { value: "REINSTATEMENT", label: "복직" },
];

export function appointmentTypeLabel(type: string) {
  return APPOINTMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

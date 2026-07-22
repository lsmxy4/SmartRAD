export interface EventSupportResponse {
  eventSupportId: number;
  employeeId: number;
  employeeName: string;
  employeeNo: string | null;
  departmentName: string | null;
  positionName: string | null;
  eventType: string;
  eventDate: string;
  requestAmount: number;
  reason: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  status: string;
  approverId: number | null;
  approverName: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface EventSupportPage {
  content: EventSupportResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const EVENT_TYPE_OPTIONS = [
  { value: "SELF_MARRIAGE", label: "본인 결혼" },
  { value: "CHILD_BIRTH", label: "자녀 출산" },
  { value: "CHILD_MARRIAGE", label: "자녀 결혼" },
  { value: "PARENT_DEATH", label: "부모상" },
  { value: "SPOUSE_DEATH", label: "배우자상" },
  { value: "CHILD_DEATH", label: "자녀상" },
  { value: "OTHER", label: "기타" },
];

export function eventTypeLabel(type: string) {
  return EVENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export const EVENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "대기중" },
  { value: "APPROVED", label: "지급 대기" },
  { value: "REJECTED", label: "반려" },
  { value: "PAID", label: "지급완료" },
];

export function eventStatusLabel(status: string) {
  return EVENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function eventStatusBadge(status: string) {
  if (status === "REJECTED") return { label: "반려", className: "bg-rose-50 text-rose-700" };
  if (status === "PAID") return { label: "지급완료", className: "bg-emerald-50 text-emerald-700" };
  if (status === "APPROVED") return { label: "지급 대기", className: "bg-sky-50 text-sky-700" };
  return { label: "대기중", className: "bg-amber-50 text-amber-700" };
}

export function formatAmount(value: number) {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

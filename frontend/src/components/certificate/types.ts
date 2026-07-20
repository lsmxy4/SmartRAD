export interface CertificateIssueResponse {
  employeeCertificateIssueId: number;
  employeeId: number;
  employeeName: string;
  applicationNo: string;
  certificateType: string;
  applicationDate: string;
  issueStatus: string;
  issuedAt: string | null;
  approvalStatus: string;
  purpose: string | null;
  memo: string | null;
}

export interface CertificateIssuePage {
  content: CertificateIssueResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const CERTIFICATE_TYPE_OPTIONS = [
  { value: "EMPLOYMENT", label: "재직증명서" },
  { value: "CAREER", label: "경력증명서" },
];

export function certificateTypeLabel(type: string) {
  return CERTIFICATE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export const APPROVAL_STATUS_OPTIONS = [
  { value: "PENDING", label: "대기중" },
  { value: "APPROVED", label: "승인됨" },
  { value: "REJECTED", label: "반려" },
];

export function approvalStatusLabel(status: string) {
  return APPROVAL_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function statusBadge(issue: CertificateIssueResponse) {
  if (issue.approvalStatus === "REJECTED") return { label: "반려", className: "bg-rose-50 text-rose-700" };
  if (issue.issueStatus === "ISSUED") return { label: "처리완료", className: "bg-emerald-50 text-emerald-700" };
  if (issue.approvalStatus === "APPROVED") return { label: "발급 대기", className: "bg-sky-50 text-sky-700" };
  return { label: "대기중", className: "bg-amber-50 text-amber-700" };
}

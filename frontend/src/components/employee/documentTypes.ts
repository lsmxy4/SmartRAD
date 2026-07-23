export type EmployeeDocumentTypeOption = {
  value: string;
  label: string;
  required: boolean;
};

export const EMPLOYEE_DOCUMENT_TYPE_OPTIONS: EmployeeDocumentTypeOption[] = [
  { value: "RESUME", label: "이력서", required: false },
  { value: "DIPLOMA", label: "졸업증명서", required: false },
  { value: "ID_CARD", label: "신분증 사본", required: false },
  { value: "BANKBOOK", label: "통장 사본", required: false },
  { value: "CAREER_CERT", label: "경력증명서", required: false },
  { value: "FAMILY_CERT", label: "가족관계증명서", required: false },
  { value: "HEALTH_CERT", label: "건강진단서", required: false },
  { value: "ETC", label: "기타", required: false },
];

export function employeeDocumentTypeLabel(type: string) {
  return EMPLOYEE_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { UserIcon, BuildingOfficeIcon, BriefcaseIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, HomeIcon, ClockIcon, CheckBadgeIcon, PencilSquareIcon, DocumentTextIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { getEmployeeStatusLabel, getEmployeeStatusBadgeClasses } from "@/lib/employeeStatus";
import { certificateTypeLabel, statusBadge, type CertificateIssueResponse } from "@/components/certificate/types";
import Modal, { ModalCancelButton, ModalPrimaryButton } from "@/components/common/Modal";
import { EMPLOYEE_DOCUMENT_TYPE_OPTIONS } from "@/components/employee/documentTypes";
import { resolveFileUrl } from "@/lib/fileUrl";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string; zonecode: string }) => void;
        width?: string | number;
        height?: string | number;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function authHeadersMultipart(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EmployeeDetailData {
  employeeId: number;
  employeeNo: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  hireDate: string;
  resignationDate: string | null;
  employeeStatusCode: string;
  departmentId: number | null;
  departmentName: string;
  positionId: number | null;
  positionName: string;
  employmentTypeId: number | null;
  employmentTypeName: string;
  managerId: number | null;
  managerName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  profileImage: string | null;
  birthDate: string | null;
}

type EmployeeDocument = {
  employeeDocumentId: number;
  documentType: string;
  attachmentUrl: string;
  attachmentName: string;
  createdAt: string;
};

interface AppointmentResponse {
  appointmentId: number;
  employeeId: number;
  employeeName: string;
  appointmentType: string;
  appointmentDate: string;
  beforeDepartmentName: string | null;
  afterDepartmentName: string | null;
  beforePositionName: string | null;
  afterPositionName: string | null;
  beforeEmploymentTypeName: string | null;
  afterEmploymentTypeName: string | null;
  reason: string;
}

interface LeaveBalance {
  leaveBalanceId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainDays: number;
}

interface Attendance {
  attendanceId: number;
  workDate: string;
  checkInTime: string;
  checkOutTime: string | null;
  attendanceStatusCode: string;
}

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  NORMAL: "정상",
  LATE: "지각",
  EARLY_LEAVE: "조퇴",
  OVERTIME: "추가근무",
  NIGHT_WORK: "야근",
  ABSENT: "결근",
};

interface Payroll {
  payrollId: number;
  payrollYearMonth: string;
  paymentDate: string | null;
  totalPayAmount: number | null;
  totalDeductionAmount: number | null;
  realPayAmount: number | null;
  payrollStatusCode: string;
}

function formatCurrency(value: number | null | undefined) {
  return `₩${Math.round(value ?? 0).toLocaleString("ko-KR")}`;
}

function formatPayrollMonth(value: string) {
  const normalized = value.replace(/(\d{4})(\d{2})$/, "$1-$2");
  const [year, month] = normalized.split("-");
  return year && month ? `${year}년 ${Number(month)}월` : value;
}

function formatTenure(hireDate: string | null) {
  if (!hireDate) return "-";
  const hire = new Date(hireDate);
  if (Number.isNaN(hire.getTime())) return "-";

  const now = new Date();
  let years = now.getFullYear() - hire.getFullYear();
  let months = now.getMonth() - hire.getMonth();
  if (now.getDate() < hire.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return "-";

  return `${years}년 ${months}개월`;
}

function currentYearMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

type TabType = "appointments" | "certificates" | "payroll" | "documents";

export default function MyProfile() {
  const [profile, setProfile] = useState<EmployeeDetailData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [certificateIssues, setCertificateIssues] = useState<CertificateIssueResponse[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>("appointments");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ phone: string; email: string; address: string; addressDetail: string; profileImage: string | null }>({
    phone: "",
    email: "",
    address: "",
    addressDetail: "",
    profileImage: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const addressLayerRef = useRef<HTMLDivElement>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const employeeId = window.localStorage.getItem("employeeId") ?? window.sessionStorage.getItem("employeeId");
    if (employeeId) {
      fetchData(employeeId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async (employeeId: string) => {
    setLoading(true);
    try {
      const [profileRes, appointmentsRes, leaveRes, attendanceRes, certificatesRes, payrollsRes, documentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employees/${employeeId}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/appointments/me`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/leave-balances?employeeId=${employeeId}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/attendances/me?yearMonth=${currentYearMonthString()}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/certificate-issues/me`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/payrolls/me`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/employees/${employeeId}/documents`, { headers: authHeaders() }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setEditForm({ phone: data.phone || "", email: data.email || "", address: data.address || "", addressDetail: "", profileImage: data.profileImage || null });
      }
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());

      if (leaveRes.ok) {
        const balances = await leaveRes.json();
        setLeaveBalances(balances);
      }

      if (attendanceRes.ok) {
        const attendances: Attendance[] = await attendanceRes.json();
        const today = todayString();
        const found = attendances.find((a: Attendance) => a.workDate === today);
        setTodayAttendance(found || null);
      }

      if (certificatesRes.ok) setCertificateIssues(await certificatesRes.json());

      if (payrollsRes.ok) {
        const result: Payroll[] = await payrollsRes.json();
        setPayrolls([...result].sort((a, b) => b.payrollYearMonth.localeCompare(a.payrollYearMonth)));
      }

      if (documentsRes.ok) {
        setDocuments(await documentsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch my profile data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (document.getElementById("daum-postcode-script")) return;
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!addressSearchOpen || !addressLayerRef.current || !window.daum?.Postcode) return;
    addressLayerRef.current.innerHTML = "";
    new window.daum.Postcode({
      oncomplete: (data) => {
        setEditForm((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress }));
        setAddressSearchOpen(false);
        document.getElementById("addressDetail")?.focus();
      },
      width: "100%",
      height: "100%",
    }).embed(addressLayerRef.current);
  }, [addressSearchOpen]);

  const openAddressSearch = () => {
    if (!window.daum?.Postcode) {
      window.alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setAddressSearchOpen(true);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setEditForm((prev) => ({ ...prev, profileImage: null }));
  };

  const closeEditModal = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setIsEditModalOpen(false);
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      let profileImageUrl = editForm.profileImage;
      if (profileImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", profileImageFile);
        const uploadRes = await fetch(`${API_BASE_URL}/employees/profile-image`, {
          method: "POST",
          headers: authHeadersMultipart(),
          body: uploadFormData,
        });
        if (!uploadRes.ok) throw new Error("프로필 사진 업로드에 실패했습니다.");
        profileImageUrl = ((await uploadRes.json()) as { url: string }).url;
      }

      const payload = {
        employmentTypeId: profile.employmentTypeId,
        name: profile.name,
        birthDate: profile.birthDate,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address
          ? `${editForm.address}${editForm.addressDetail ? ` ${editForm.addressDetail}` : ""}`
          : editForm.address,
        hireDate: profile.hireDate,
        resignationDate: profile.resignationDate,
        employeeStatusCode: profile.employeeStatusCode,
        bankName: profile.bankName,
        accountNumber: profile.accountNumber,
        accountHolder: profile.accountHolder,
        profileImage: profileImageUrl
      };

      const res = await fetch(`${API_BASE_URL}/employees/${profile.employeeId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("업데이트 실패");

      setProfileImageFile(null);
      setProfileImagePreview(null);
      alert("정보가 성공적으로 수정되었습니다.");
      setIsEditModalOpen(false);
      fetchData(profile.employeeId.toString());
    } catch (error) {
      console.error(error);
      alert("정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex items-center justify-center text-gray-500">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex items-center justify-center text-gray-500">
        프로필 정보를 찾을 수 없습니다. 다시 로그인해 주세요.
      </div>
    );
  }

  const totalRemainLeave = leaveBalances.reduce((acc, curr) => acc + curr.remainDays, 0);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        {/* Left: Basic Info */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 min-h-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-4 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 font-medium"
            >
              <PencilSquareIcon className="w-4 h-4" />
              정보 수정
            </button>
            <div className="flex flex-col items-center mb-6 mt-4">
              {profile.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveFileUrl(profile.profileImage)} alt={`${profile.name} 프로필 사진`} className="w-24 h-24 rounded-full object-cover shadow-md mb-4 border-2 border-white ring-2 ring-blue-100" />
              ) : (
                <div className="w-24 h-24 bg-blue-500 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-md mb-4 border-2 border-white ring-2 ring-blue-100">
                  {profile.name ? profile.name.charAt(0) : '?'}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white border ${getEmployeeStatusBadgeClasses(profile.employeeStatusCode)} before:content-[''] before:block before:w-1.5 before:h-1.5 before:rounded-full shadow-sm`}>
                {getEmployeeStatusLabel(profile.employeeStatusCode)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">소속 부서</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.departmentName || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">직급 및 고용형태</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.positionName || '-'} · {profile.employmentTypeName || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <IdentificationIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">사원 번호</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.employeeNo || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">개인 연락처 정보</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">이메일</p>
                  <p className="text-sm text-gray-900 mt-0.5">{profile.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">연락처</p>
                  <p className="text-sm text-gray-900 mt-0.5">{profile.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HomeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">자택 주소</p>
                  <p className="text-sm text-gray-900 mt-0.5">{profile.address || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">입사일 (근속 기간)</p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {profile.hireDate ? profile.hireDate.substring(0, 10) : '-'} <span className="text-blue-600 font-medium ml-1">({formatTenure(profile.hireDate)})</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Widgets & Tabs Content */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6 min-h-0">
          
          {/* Top Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <CheckBadgeIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">올해 남은 총 연차</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                    {totalRemainLeave} <span className="text-sm font-medium text-gray-500 ml-0.5">일</span>
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">오늘 출근 시간</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                    {todayAttendance?.checkInTime?.substring(11, 16) || "미출근"}
                    {todayAttendance?.checkInTime && <span className="text-sm font-medium text-gray-500 ml-1">({ATTENDANCE_STATUS_LABELS[todayAttendance.attendanceStatusCode] ?? todayAttendance.attendanceStatusCode})</span>}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 flex items-end px-4 pt-4 gap-2">
              <button 
                type="button"
                onClick={() => setActiveTab("appointments")}
                className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'appointments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
              >
                <UserIcon className="w-4 h-4" />
                발령 이력
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab("certificates")}
                className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'certificates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
              >
                <DocumentTextIcon className="w-4 h-4" />
                증명서 내역
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab("payroll")}
                className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'payroll' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
              >
                <CurrencyDollarIcon className="w-4 h-4" />
                급여 내역
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
              >
                <DocumentTextIcon className="w-4 h-4" />
                첨부 서류
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 relative bg-white">
              {activeTab === "appointments" && (
                appointments.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    인사 발령 이력이 없습니다.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-blue-100 ml-4 space-y-8 pb-8">
                    {appointments.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()).map((app) => (
                      <div key={app.appointmentId} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-blue-600">{app.appointmentDate}</span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-semibold">{app.appointmentType}</span>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-lg p-4 mt-2 shadow-sm">
                          {app.appointmentType === "부서이동" && (
                            <p className="text-sm text-gray-700">부서 변경: <span className="line-through text-gray-400">{app.beforeDepartmentName || '-'}</span> <span className="text-blue-500 font-bold ml-1">→ {app.afterDepartmentName}</span></p>
                          )}
                          {app.appointmentType === "승진" && (
                            <p className="text-sm text-gray-700">직급 변경: <span className="line-through text-gray-400">{app.beforePositionName || '-'}</span> <span className="text-blue-500 font-bold ml-1">→ {app.afterPositionName}</span></p>
                          )}
                          {(app.appointmentType === "입사" || app.appointmentType === "기타") && (
                            <p className="text-sm text-gray-700">
                              소속: <strong>{app.afterDepartmentName}</strong>, 직급: <strong>{app.afterPositionName}</strong>
                            </p>
                          )}
                          {app.reason && (
                            <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded italic border-l-2 border-gray-200">
                              사유: {app.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === "certificates" && (
                certificateIssues.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <DocumentTextIcon className="w-12 h-12 text-gray-200" />
                    <p className="text-sm">신청한 증명서 발급 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {certificateIssues.map((issue) => {
                      const badge = statusBadge(issue);
                      return (
                        <div key={issue.employeeCertificateIssueId} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{certificateTypeLabel(issue.certificateType)}</p>
                            <p className="mt-1 text-xs text-gray-500">{issue.applicationDate} · {issue.purpose || "용도 없음"}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {activeTab === "payroll" && (
                payrolls.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <CurrencyDollarIcon className="w-12 h-12 text-gray-200" />
                    <p className="text-sm">최근 급여 명세서 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payrolls.map((payroll) => (
                      <div key={payroll.payrollId} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formatPayrollMonth(payroll.payrollYearMonth)}</p>
                          <p className="mt-1 text-xs text-gray-500">지급일 {payroll.paymentDate ?? "지급 예정"}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-blue-600">{formatCurrency(payroll.realPayAmount)}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === "documents" && (
                <div className="space-y-3">
                  {EMPLOYEE_DOCUMENT_TYPE_OPTIONS.map((docType) => {
                    const document = documents.find((doc) => doc.documentType === docType.value);
                    return (
                      <div key={docType.value} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <div className="min-w-0 flex-1 flex items-center gap-4">
                          <p className="text-sm font-bold text-gray-900 w-32 shrink-0">
                            {docType.label} {docType.required ? <b className="text-rose-500">*</b> : null}
                          </p>
                          {document ? (
                            <a
                              href={resolveFileUrl(document.attachmentUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-sm font-semibold text-blue-600 hover:underline"
                            >
                              {document.attachmentName}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-400 font-medium">미제출</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Modal
          icon={PencilSquareIcon}
          title="개인 연락처 정보 수정"
          onClose={closeEditModal}
          as="form"
          onSubmit={handleUpdateInfo}
          footer={
            <>
              <ModalCancelButton onClick={closeEditModal} disabled={isSaving} />
              <ModalPrimaryButton type="submit" disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </ModalPrimaryButton>
            </>
          }
        >
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">프로필 사진</h3>
                  </div>
                  <div className="p-4 flex items-center gap-4">
                    {profileImagePreview || editForm.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImagePreview ?? resolveFileUrl(editForm.profileImage)} alt="프로필 사진" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
                        {profile.name ? profile.name.charAt(0) : "?"}
                      </div>
                    )}
                    <label className="cursor-pointer px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                      사진 변경
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                    </label>
                    {(profileImagePreview || editForm.profileImage) && (
                      <button
                        type="button"
                        onClick={removeProfileImage}
                        className="px-3 py-1.5 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-md hover:bg-rose-50"
                      >
                        사진 삭제
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                  <input 
                    type="text" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="010-0000-0000"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="example@company.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자택 주소</label>
                  <div className="flex gap-2">
                    <div className="flex h-9 flex-1 items-center rounded-md border border-gray-300 bg-gray-50 px-3 text-sm">
                      <span className={editForm.address ? "text-gray-900" : "text-gray-400"}>
                        {editForm.address || "주소 검색 버튼을 눌러주세요"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={openAddressSearch}
                      className="h-9 shrink-0 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      주소 검색
                    </button>
                  </div>
                  <input
                    type="text"
                    id="addressDetail"
                    value={editForm.addressDetail}
                    onChange={(e) => setEditForm({...editForm, addressDetail: e.target.value})}
                    placeholder="상세주소 (선택)"
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
        </Modal>
      )}

      {addressSearchOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => setAddressSearchOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-900">주소 검색</h3>
              <button
                type="button"
                onClick={() => setAddressSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="주소 검색 닫기"
              >
                ×
              </button>
            </div>
            <div ref={addressLayerRef} className="h-[450px] w-full" />
          </div>
        </div>
      ) : null}
    </>
  );
}

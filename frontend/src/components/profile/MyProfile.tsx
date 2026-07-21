"use client";

import { useEffect, useState } from "react";
import { UserIcon, BuildingOfficeIcon, BriefcaseIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, ClockIcon, CheckBadgeIcon, XMarkIcon, PencilSquareIcon, DocumentTextIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { getEmployeeStatusLabel, getEmployeeStatusBadgeClasses } from "@/lib/employeeStatus";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
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
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: string;
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

type TabType = "appointments" | "certificates" | "payroll";

export default function MyProfile() {
  const [profile, setProfile] = useState<EmployeeDetailData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>("appointments");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", email: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);

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
      const [profileRes, appointmentsRes, leaveRes, attendanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employees/${employeeId}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/appointments/me`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/leave-balances?employeeId=${employeeId}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/attendances/me?yearMonth=${currentYearMonthString()}`, { headers: authHeaders() }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setEditForm({ phone: data.phone || "", email: data.email || "", address: data.address || "" });
      }
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
      
      if (leaveRes.ok) {
        const balances = await leaveRes.json();
        setLeaveBalances(balances);
      }
      
      if (attendanceRes.ok) {
        const attendances: Attendance[] = await attendanceRes.json();
        const today = todayString();
        const found = attendances.find((a: Attendance) => a.date === today);
        setTodayAttendance(found || null);
      }
    } catch (error) {
      console.error("Failed to fetch my profile data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      const payload = {
        employmentTypeId: profile.employmentTypeId,
        name: profile.name,
        birthDate: profile.birthDate,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        hireDate: profile.hireDate,
        resignationDate: profile.resignationDate,
        employeeStatusCode: profile.employeeStatusCode,
        bankName: profile.bankName,
        accountNumber: profile.accountNumber,
        accountHolder: profile.accountHolder,
        profileImage: profile.profileImage
      };

      const res = await fetch(`${API_BASE_URL}/employees/${profile.employeeId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("업데이트 실패");
      
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
                <img src={profile.profileImage} alt={`${profile.name} 프로필 사진`} className="w-24 h-24 rounded-full object-cover shadow-md mb-4 border-2 border-white ring-2 ring-blue-100" />
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
                    {todayAttendance?.checkInTime?.substring(0, 5) || "미출근"}
                    {todayAttendance?.checkInTime && <span className="text-sm font-medium text-gray-500 ml-1">({todayAttendance.status})</span>}
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
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <DocumentTextIcon className="w-12 h-12 text-gray-200" />
                  <p className="text-sm">신청한 증명서 발급 내역이 없습니다.</p>
                </div>
              )}

              {activeTab === "payroll" && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <CurrencyDollarIcon className="w-12 h-12 text-gray-200" />
                  <p className="text-sm">최근 급여 명세서 내역이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">개인 연락처 정보 수정</h2>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateInfo}>
              <div className="p-5 space-y-4">
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
                  <input 
                    type="text" 
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder="거주지 주소 입력"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#4A5DDF] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

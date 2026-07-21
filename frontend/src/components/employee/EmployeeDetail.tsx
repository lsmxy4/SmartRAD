"use client";

import { useEffect, useState } from "react";
import { UserIcon, PencilSquareIcon, TrashIcon, ClockIcon, CurrencyDollarIcon, DocumentTextIcon, BuildingOfficeIcon, BriefcaseIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import { getEmployeeStatusLabel, getEmployeeStatusBadgeClasses } from "@/lib/employeeStatus";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
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
  employeeStatusCode: string;
  departmentId: number | null;
  departmentName: string;
  positionId: number | null;
  positionName: string;
  employmentTypeId: number | null;
  employmentTypeName: string;
  managerId: number | null;
  managerName: string | null;
  profileImage: string | null;
}

interface LeaveBalance {
  leaveTypeName: string;
  remainDays: number;
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

function formatDays(days: number) {
  return Number.isInteger(days) ? `${days}일` : `${days.toFixed(1)}일`;
}

export default function EmployeeDetail({ employeeId, onEditClick, onDeleteClick, refreshKey, role }: { employeeId: number | null, onEditClick?: (data: EmployeeDetailData) => void, onDeleteClick?: (id: number) => void, refreshKey?: number, role?: string | null }) {
  const [data, setData] = useState<EmployeeDetailData | null>(null);
  const [annualLeaveDays, setAnnualLeaveDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeId) {
      fetchDetail();
      fetchLeaveBalance();
    } else {
      setData(null);
      setAnnualLeaveDays(null);
    }
  }, [employeeId, refreshKey]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch detail", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/leave-balances?employeeId=${employeeId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const balances: LeaveBalance[] = await res.json();
        const annual = balances.find((b) => b.leaveTypeName === "연차");
        setAnnualLeaveDays(annual ? annual.remainDays : null);
      }
    } catch (error) {
      console.error("Failed to fetch leave balance", error);
    }
  };

  if (!employeeId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <UserIcon className="w-16 h-16 mb-4 text-gray-200" />
        <p>왼쪽 목록에서 직원을 선택해주세요.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex items-center justify-center p-8 text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-600" />
          직원 상세
        </h2>
        <div className="flex items-center gap-2">
          {role === "ADMIN" && (
            <>
              <button onClick={() => onEditClick?.(data)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <PencilSquareIcon className="w-4 h-4" />
                정보 수정
              </button>
              <button onClick={() => onDeleteClick?.(data.employeeId)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-md hover:bg-rose-100 transition-colors">
                <TrashIcon className="w-4 h-4" />
                직원 삭제
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Profile Card */}
        <div className="bg-[#F8FAFC] border border-blue-100 rounded-xl p-6 flex items-start justify-between mb-6">
          <div className="flex items-center gap-5">
            {data.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.profileImage} alt={`${data.name} 프로필 사진`} className="w-20 h-20 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-md">
                {data.name ? data.name.charAt(0) : '?'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{data.name}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white border ${getEmployeeStatusBadgeClasses(data.employeeStatusCode)} before:content-[''] before:block before:w-1.5 before:h-1.5 before:rounded-full`}>
                  {getEmployeeStatusLabel(data.employeeStatusCode)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><BuildingOfficeIcon className="w-4 h-4" /> {data.departmentName || '-'}</span>
                <span className="flex items-center gap-1.5"><BriefcaseIcon className="w-4 h-4" /> {data.positionName || '-'}</span>
                <span className="flex items-center gap-1.5"><IdentificationIcon className="w-4 h-4" /> {data.employeeNo || '-'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
             <div className="text-sm font-bold text-blue-600 bg-white px-3 py-1.5 rounded-md shadow-sm border border-blue-50">
                <span className="text-gray-500 font-medium mr-2">근속 기간</span>
                {formatTenure(data.hireDate)}
             </div>
             {role === "ADMIN" && (
               <div className="text-sm font-bold text-emerald-600 bg-white px-3 py-1.5 rounded-md shadow-sm border border-emerald-50 mt-2">
                  <span className="text-emerald-500 font-medium mr-2">잔여 연차</span>
                  {annualLeaveDays !== null ? formatDays(annualLeaveDays) : "-"}
               </div>
             )}
          </div>
        </div>

        {/* Info Grids */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 text-center">기본 정보</h4>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">연락처</span>
                <span className="text-gray-900 font-medium">{data.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">이메일</span>
                <span className="text-gray-900 font-medium">{data.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">입사일</span>
                <span className="text-gray-900 font-medium">{data.hireDate ? data.hireDate.substring(0, 10) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">주소</span>
                <span className="text-gray-900 font-medium text-right">{data.address || '-'}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 text-center">소속 정보</h4>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">부서</span>
                <span className="text-gray-900 font-medium">{data.departmentName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">직급</span>
                <span className="text-gray-900 font-medium">{data.positionName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">고용 형태</span>
                <span className="text-gray-900 font-medium">{data.employmentTypeName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">직속 관리자</span>
                <span className="text-gray-900 font-medium">{data.managerName || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        {role === "ADMIN" && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-3">관련 페이지로 이동</h4>
            <div className="grid grid-cols-3 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-700 font-bold hover:bg-blue-50 transition-colors text-sm">
                <ClockIcon className="w-5 h-5" />
                근태 현황 보기 &gt;
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-700 font-bold hover:bg-emerald-50 transition-colors text-sm">
                <CurrencyDollarIcon className="w-5 h-5" />
                급여 정보 보기 &gt;
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-lg border border-orange-200 bg-orange-50/50 text-orange-700 font-bold hover:bg-orange-50 transition-colors text-sm">
                <DocumentTextIcon className="w-5 h-5" />
                증명서 발급 &gt;
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

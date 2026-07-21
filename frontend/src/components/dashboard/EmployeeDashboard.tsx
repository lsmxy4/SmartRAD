"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClockIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

interface Notice {
  noticeId: number;
  writerName: string;
  title: string;
  pinned: boolean;
  createdAt: string;
}

interface NoticeDetail extends Notice {
  content: string;
  viewCount: number;
}

interface Attendance {
  attendanceId: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
}

interface LeaveBalance {
  employeeLeaveBalanceId: number;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainDays: number;
  expireDate: string | null;
}

interface EmployeeSummary {
  todayAttendance: Attendance | null;
  totalRemainLeave: number;
}

function getAuthToken() {
  return (
    window.localStorage.getItem("accessToken") ??
    window.sessionStorage.getItem("accessToken")
  );
}

function getEmployeeId() {
  return (
    window.localStorage.getItem("employeeId") ??
    window.sessionStorage.getItem("employeeId")
  );
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentYearMonthString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) return "-";
  // timeStr e.g. "09:00:00"
  return timeStr.substring(0, 5);
}

export default function EmployeeDashboard() {
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingNotice, setViewingNotice] = useState<NoticeDetail | null>(null);

  const openNotice = async (noticeId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${noticeId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setViewingNotice((await res.json()) as NoticeDetail);
    } catch (error) {
      console.error("Failed to fetch notice detail", error);
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      const headers = authHeaders();
      const employeeId = getEmployeeId();
      
      try {
        const [attendanceRes, leaveRes, noticesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/attendances/me?yearMonth=${currentYearMonthString()}`, { headers }),
          employeeId ? fetch(`${API_BASE_URL}/leave-balances?employeeId=${employeeId}`, { headers }) : Promise.resolve(null),
          fetch(`${API_BASE_URL}/notices?page=0&size=5`, { headers }),
        ]);

        const attendances: Attendance[] = attendanceRes.ok ? await attendanceRes.json() : [];
        const todayAtt = attendances.find(a => a.date === todayString()) || null;

        const leaveBalances: LeaveBalance[] = (leaveRes && leaveRes.ok) ? await leaveRes.json() : [];
        const totalRemainLeave = leaveBalances.reduce((acc, curr) => acc + curr.remainDays, 0);

        const noticePage = noticesRes.ok ? await noticesRes.json() : { content: [] };

        setSummary({
          todayAttendance: todayAtt,
          totalRemainLeave: totalRemainLeave,
        });
        setNotices(noticePage.content ?? []);
      } catch (error) {
        console.error("Failed to fetch employee dashboard summary", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 출퇴근 현황 위젯 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClockIcon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">오늘 출퇴근 현황</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">출근 시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.todayAttendance ? formatTime(summary.todayAttendance.checkInTime) : "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">퇴근 시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.todayAttendance ? formatTime(summary.todayAttendance.checkOutTime) : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* 연차 현황 위젯 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">내 연차 현황</h2>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">{summary ? summary.totalRemainLeave : "-"}</span>
            <span className="text-lg text-gray-500 mb-1">일 남음</span>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            총 부여된 휴가 잔여일수의 합계입니다.
          </div>
        </div>
      </div>

      {/* 공지사항 위젯 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MegaphoneIcon className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-gray-900">최근 공지사항</h2>
          </div>
          <Link href="/notices" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            전체보기 &gt;
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="text-center py-10 text-gray-500">로딩 중...</div>
          ) : notices.length === 0 ? (
            <div className="text-center py-10 text-gray-500">등록된 공지사항이 없습니다.</div>
          ) : (
            notices.map((notice) => (
              <button
                type="button"
                key={notice.noticeId}
                onClick={() => openNotice(notice.noticeId)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {notice.pinned && (
                    <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">고정</span>
                  )}
                  <span className="font-medium text-gray-900">{notice.title}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{notice.writerName}</span>
                  <span>{notice.createdAt.substring(0, 10)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 공지사항 팝업 모달 */}
      {viewingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
              <div>
                {viewingNotice.pinned && <span className="mr-1.5 text-orange-500">📌</span>}
                <h2 className="inline text-lg font-bold text-gray-900">{viewingNotice.title}</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {viewingNotice.writerName} · {viewingNotice.createdAt.substring(0, 10)} · 조회 {viewingNotice.viewCount}
                </p>
              </div>
              <button type="button" onClick={() => setViewingNotice(null)} aria-label="닫기" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-gray-700">
              {viewingNotice.content}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 p-4">
              <button type="button" onClick={() => setViewingNotice(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

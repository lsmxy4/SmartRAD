"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  FingerPrintIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

interface AttendanceResponse {
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
  attendanceStatusCode: string;
}

interface ErrorResponse {
  code: string;
  message: string;
}

type DisplayStatus = "출근 전" | "근무 중" | "퇴근 완료" | "지각" | "조퇴" | "결근";

const STATUS_STYLES: Record<DisplayStatus, string> = {
  "출근 전": "bg-slate-100 text-slate-600 ring-slate-200",
  "근무 중": "bg-blue-50 text-blue-700 ring-blue-200",
  "퇴근 완료": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  지각: "bg-amber-50 text-amber-700 ring-amber-200",
  조퇴: "bg-orange-50 text-orange-700 ring-orange-200",
  결근: "bg-rose-50 text-rose-700 ring-rose-200",
};

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getEmployeeId(): number | null {
  const raw = window.localStorage.getItem("employeeId") ?? window.sessionStorage.getItem("employeeId");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function formatTime(value: string | null | undefined) {
  if (!value) return "미등록";
  const match = value.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "미등록";
}

function parseLocalDateTime(value: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "0"] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatKoreanDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(value);
}

function formatClock(value: Date) {
  return value.toLocaleTimeString("ko-KR", { hour12: false });
}

function formatMinutes(value: number | null | undefined) {
  const minutes = Math.max(0, Math.floor(value ?? 0));
  return `${Math.floor(minutes / 60)}시간 ${String(minutes % 60).padStart(2, "0")}분`;
}

function getDisplayStatus(record: AttendanceResponse | null): DisplayStatus {
  if (!record) return "출근 전";
  if (record.attendanceStatusCode === "ABSENT") return "결근";
  if (record.attendanceStatusCode === "EARLY_LEAVE") return "조퇴";
  if (record.attendanceStatusCode === "LATE") return "지각";
  if (record.checkOutTime) return "퇴근 완료";
  if (record.checkInTime) return "근무 중";
  return "출근 전";
}

function getGuidance(checkedIn: boolean, checkedOut: boolean) {
  if (checkedOut) return "오늘 근무 기록이 정상적으로 완료되었습니다.";
  if (checkedIn) return "현재 근무 중입니다. 퇴근 시 퇴근 버튼을 눌러주세요.";
  return "출근 버튼을 눌러 오늘 근무를 시작해주세요.";
}

export default function SelfAttendancePage() {
  const [today] = useState(todayString);
  const [now, setNow] = useState(() => new Date());
  const [record, setRecord] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshInFlight = useRef(false);

  const fetchToday = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setError(null);
    const employeeId = getEmployeeId();
    if (employeeId == null) {
      setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      setLoading(false);
      refreshInFlight.current = false;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendances?date=${today}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("오늘의 근태 정보를 불러오지 못했습니다.");
      const data = (await res.json()) as AttendanceResponse[];
      setRecord(data.find((item) => item.employeeId === employeeId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오늘의 근태 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      refreshInFlight.current = false;
    }
  }, [today]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchToday();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchToday]);

  useEffect(() => {
    const handleRefresh = () => {
      void fetchToday();
    };
    window.addEventListener("attendance:self-refresh", handleRefresh);
    return () => window.removeEventListener("attendance:self-refresh", handleRefresh);
  }, [fetchToday]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/attendances/check-in`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = (await res.json()) as ErrorResponse;
        throw new Error(body.message || "출근 체크에 실패했습니다.");
      }
      await fetchToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : "출근 체크에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/attendances/check-out`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = (await res.json()) as ErrorResponse;
        throw new Error(body.message || "퇴근 체크에 실패했습니다.");
      }
      await fetchToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : "퇴근 체크에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const checkedIn = record?.checkInTime != null;
  const checkedOut = record?.checkOutTime != null;
  const displayStatus = getDisplayStatus(record);
  const workMinutes = useMemo(() => {
    if (checkedOut) return record?.workMinutes ?? 0;
    const checkIn = parseLocalDateTime(record?.checkInTime ?? null);
    return checkIn ? Math.max(0, Math.floor((now.getTime() - checkIn.getTime()) / 60_000)) : 0;
  }, [checkedOut, now, record?.checkInTime, record?.workMinutes]);
  const progressStep = checkedOut ? 3 : checkedIn ? 1 : 0;
  const progressItems = ["출근 등록", "근무 진행", "퇴근 등록", "근무 완료"];

  const summaryCards = [
    {
      label: "오늘 날짜",
      value: formatKoreanDate(now),
      description: "오늘의 근무일",
      icon: CalendarDaysIcon,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "현재 근태 상태",
      value: displayStatus,
      description: "서버 기록 기준",
      icon: FingerPrintIcon,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "출근 시간",
      value: formatTime(record?.checkInTime),
      description: checkedIn ? "등록된 출근 시각" : "아직 등록되지 않음",
      icon: ClockIcon,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "누적 근무 시간",
      value: formatMinutes(workMinutes),
      description: checkedOut ? "확정된 근무 시간" : checkedIn ? "현재 시각 기준" : "출근 후 집계",
      icon: CheckCircleIcon,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="오늘 근무 요약">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex min-h-32 items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-1 break-keep text-lg font-bold leading-snug text-gray-900">{card.value}</p>
                <p className="mt-1 text-xs text-gray-400">{card.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center p-6 text-sm text-gray-500">불러오는 중...</div>
        ) : (
          <>
            <div className="grid lg:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col justify-center border-b border-gray-200 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <p className="text-sm font-medium text-gray-500">{formatKoreanDate(now)}</p>
                <p className="mt-3 font-mono text-4xl font-extrabold tracking-wide text-gray-900 sm:text-5xl" aria-live="polite">
                  {formatClock(now)}
                </p>
                <span className={`mt-5 w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[displayStatus]}`}>
                  {displayStatus}
                </span>
                <p className="mt-3 break-keep text-sm leading-6 text-gray-600">{getGuidance(checkedIn, checkedOut)}</p>

                {error && (
                  <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={processing || checkedIn}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#4A5DDF] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    {checkedIn ? "출근 완료" : processing ? "처리 중..." : "출근하기"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={processing || !checkedIn || checkedOut}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                    {checkedOut ? "퇴근 완료" : processing ? "처리 중..." : "퇴근하기"}
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <h2 className="text-base font-bold text-gray-900">오늘 출퇴근 기록</h2>
                <dl className="mt-5 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-gray-50/60 px-4">
                  {[
                    ["출근 시간", formatTime(record?.checkInTime)],
                    ["퇴근 시간", formatTime(record?.checkOutTime)],
                    ["근무 시간", formatMinutes(workMinutes)],
                    ["진행 상태", checkedOut ? "근무 완료" : checkedIn ? "근무 진행 중" : "출근 대기"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-4">
                      <dt className="text-sm text-gray-500">{label}</dt>
                      <dd className="text-right text-sm font-semibold text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 sm:p-8">
              <h2 className="text-base font-bold text-gray-900">오늘의 근태 진행</h2>
              <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {progressItems.map((item, index) => {
                  const complete = checkedOut ? index <= progressStep : index < progressStep;
                  const current = !complete && index === progressStep;
                  return (
                    <li key={item} className={`rounded-lg border px-4 py-3 ${complete ? "border-blue-200 bg-blue-50" : current ? "border-blue-400 bg-white" : "border-gray-200 bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-blue-600 text-white" : current ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
                          {complete ? "✓" : index + 1}
                        </span>
                        <span className={`text-sm font-semibold ${complete || current ? "text-gray-900" : "text-gray-400"}`}>{item}</span>
                      </div>
                      <p className="mt-2 pl-8 text-xs text-gray-500">{complete ? "완료" : current ? "현재 단계" : "대기"}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        )}
      </section>

      <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-label="근태 안내">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-gray-900">근태 안내</h2>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-gray-600">
              <li>출근 및 퇴근 버튼은 각각 하루 한 번만 처리됩니다.</li>
              <li>출퇴근 기록에 문제가 있을 경우 관리자에게 문의해주세요.</li>
              <li>근무 상태는 서버에 등록된 기록을 기준으로 표시됩니다.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

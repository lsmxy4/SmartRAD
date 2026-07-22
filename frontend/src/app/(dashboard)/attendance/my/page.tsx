"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon, CheckCircleIcon, ClockIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import AttendanceReasonModal from "@/components/attendance/AttendanceReasonModal";
import Modal, { ModalCancelButton } from "@/components/common/Modal";

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
  reason: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
}

function needsCorrection(status: string) {
  return status === "LATE" || status === "EARLY_LEAVE";
}

type Filter = "ALL" | "NORMAL" | "LATE" | "EARLY_LEAVE" | "OVERTIME" | "NIGHT_WORK" | "ABSENT";
type Status = "정상" | "지각" | "조퇴" | "추가근무" | "야근" | "결근" | "근무 중" | "미등록";

const filters: { value: Filter; label: string }[] = [
  { value: "ALL", label: "전체" }, { value: "NORMAL", label: "정상" },
  { value: "LATE", label: "지각" }, { value: "EARLY_LEAVE", label: "조퇴" },
  { value: "OVERTIME", label: "추가근무" }, { value: "NIGHT_WORK", label: "야근" },
  { value: "ABSENT", label: "결근" },
];

const statusStyle: Record<Status, string> = {
  정상: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  지각: "bg-orange-50 text-orange-700 ring-orange-200",
  조퇴: "bg-violet-50 text-violet-700 ring-violet-200",
  추가근무: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  야근: "bg-purple-50 text-purple-700 ring-purple-200",
  결근: "bg-rose-50 text-rose-700 ring-rose-200",
  "근무 중": "bg-blue-50 text-blue-700 ring-blue-200",
  미등록: "bg-gray-100 text-gray-600 ring-gray-200",
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, amount: number) {
  const [year, value] = month.split("-").map(Number);
  const next = new Date(year, value - 1 + amount, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatTime(value: string | null) {
  const match = value?.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "-";
}

function formatMinutes(value: number | null | undefined) {
  const minutes = Math.max(0, Math.floor(value ?? 0));
  return `${Math.floor(minutes / 60)}시간 ${String(minutes % 60).padStart(2, "0")}분`;
}

function formatDate(value: string) { return value.replaceAll("-", "."); }
function weekday(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(new Date(year, month - 1, day));
}

function getStatus(record: AttendanceResponse): Status {
  if (record.checkInTime && !record.checkOutTime && record.attendanceStatusCode !== "ABSENT") return "근무 중";
  return ({ NORMAL: "정상", LATE: "지각", EARLY_LEAVE: "조퇴", OVERTIME: "추가근무", NIGHT_WORK: "야근", ABSENT: "결근" } as Record<string, Status>)[record.attendanceStatusCode] ?? "미등록";
}

function StatusBadge({ record }: { record: AttendanceResponse }) {
  const status = getStatus(record);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyle[status]}`}>{status}</span>;
}

export default function MyAttendancePage() {
  const [month, setMonth] = useState(currentMonth);
  const [records, setRecords] = useState<AttendanceResponse[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [detail, setDetail] = useState<AttendanceResponse | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/attendances/me?yearMonth=${encodeURIComponent(month)}`, { headers: authHeaders(), signal });
      if (!response.ok) throw new Error("근태 기록을 불러오지 못했습니다.");
      setRecords((await response.json()) as AttendanceResponse[]);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "근태 기록을 불러오지 못했습니다.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [month]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void fetchRecords(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [fetchRecords]);

  useEffect(() => {
    const handleRefresh = () => void fetchRecords();
    window.addEventListener("attendance:my-refresh", handleRefresh);
    return () => window.removeEventListener("attendance:my-refresh", handleRefresh);
  }, [fetchRecords]);

  const summary = useMemo(() => {
    const total = records.reduce((sum, item) => sum + (item.workMinutes ?? 0), 0);
    const count = (status: Filter) => records.filter((item) => item.attendanceStatusCode === status).length;
    return { total, average: records.length ? Math.round(total / records.length) : 0, normal: count("NORMAL"), late: count("LATE"), early: count("EARLY_LEAVE"), absent: count("ABSENT") };
  }, [records]);

  const shown = useMemo(() => records.filter((item) => filter === "ALL" || item.attendanceStatusCode === filter).sort((a, b) => b.workDate.localeCompare(a.workDate)), [filter, records]);
  const cards = [
    { label: "총 근무일", value: `${records.length}일`, icon: CalendarDaysIcon, style: "bg-blue-50 text-blue-600" },
    { label: "총 근무 시간", value: formatMinutes(summary.total), icon: ClockIcon, style: "bg-indigo-50 text-indigo-600" },
    { label: "평균 근무 시간", value: formatMinutes(summary.average), icon: CheckCircleIcon, style: "bg-emerald-50 text-emerald-600" },
  ];

  return <div className="mx-auto max-w-[1600px] space-y-5">
    <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-medium text-gray-500">조회 기간</p><p className="mt-1 text-lg font-bold text-gray-900">{month.replace("-", "년 ")}월 근태 기록</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="이전 달" className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><ArrowLeftIcon className="h-4 w-4" /></button>
        <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-10 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 outline-none focus:border-blue-500" />
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="다음 달" className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><ArrowRightIcon className="h-4 w-4" /></button>
        <button type="button" onClick={() => setMonth(currentMonth())} className="h-10 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50">이번 달</button>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-3">{cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.style}`}><Icon className="h-5 w-5" /></span><div><p className="text-sm font-medium text-gray-500">{card.label}</p><p className="mt-1 text-xl font-bold text-gray-900">{card.value}</p></div></div>; })}</section>

    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">근태 상태 요약</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["정상 출근", summary.normal, "text-emerald-600"], ["지각", summary.late, "text-orange-600"], ["조퇴", summary.early, "text-violet-600"], ["결근", summary.absent, "text-rose-600"]].map(([label, value, color]) => <div key={String(label)} className="rounded-lg bg-gray-50 px-4 py-3"><p className="text-xs font-medium text-gray-500">{label}</p><p className={`mt-1 text-xl font-bold ${color}`}>{value}회</p></div>)}</div></section>

    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold text-gray-900">일별 근태 목록</h2><div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{item.label}</button>)}</div></div>
      {loading ? <div className="py-16 text-center text-sm text-gray-500">근태 기록을 불러오는 중입니다.</div>
        : error ? <div className="py-16 text-center text-sm font-semibold text-rose-600">{error}</div>
        : records.length === 0 ? <div className="flex flex-col items-center px-5 py-16 text-center"><CalendarDaysIcon className="h-10 w-10 text-gray-300" /><p className="mt-4 font-semibold text-gray-800">선택한 월의 근태 기록이 없습니다.</p><p className="mt-1 text-sm text-gray-500">출퇴근 기록이 등록되면 이곳에서 확인할 수 있습니다.</p><Link href="/attendance/self" className="mt-5 rounded-md bg-[#4A5DDF] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">내 근태 체크로 이동</Link></div>
        : shown.length === 0 ? <div className="py-16 text-center text-sm text-gray-500">선택한 상태의 근태 기록이 없습니다.</div>
        : <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-gray-50 text-xs font-semibold text-gray-500"><tr>{["날짜", "요일", "출근 시간", "퇴근 시간", "근무 시간", "근태 상태"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{shown.map((item) => <tr key={item.attendanceId} onClick={() => setDetail(item)} className="cursor-pointer hover:bg-blue-50/40"><td className="px-5 py-4 font-semibold text-gray-900">{formatDate(item.workDate)}</td><td className="px-5 py-4 text-gray-600">{weekday(item.workDate)}</td><td className="px-5 py-4">{formatTime(item.checkInTime)}</td><td className="px-5 py-4">{formatTime(item.checkOutTime)}</td><td className="px-5 py-4 font-medium">{formatMinutes(item.workMinutes)}</td><td className="px-5 py-4"><StatusBadge record={item} /></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-gray-100 md:hidden">{shown.map((item) => <button key={item.attendanceId} type="button" onClick={() => setDetail(item)} className="w-full p-4 text-left hover:bg-gray-50"><div className="flex items-center justify-between"><div><p className="font-semibold">{formatDate(item.workDate)}</p><p className="text-xs text-gray-500">{weekday(item.workDate)}</p></div><StatusBadge record={item} /></div><p className="mt-3 text-sm text-gray-600">{formatTime(item.checkInTime)} → {formatTime(item.checkOutTime)} · {formatMinutes(item.workMinutes)}</p></button>)}</div></>}
    </section>

    {detail && <Modal
      icon={ClockIcon}
      title="일일 근태 상세"
      subtitle={`${formatDate(detail.workDate)} ${weekday(detail.workDate)}`}
      onClose={() => setDetail(null)}
      maxWidth="md"
      bodyClassName="max-h-[65vh] overflow-y-auto p-6"
      footer={<>
        {needsCorrection(detail.attendanceStatusCode) && <button type="button" onClick={() => setCorrecting(true)} className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-100"><PencilSquareIcon className="h-4 w-4" />{detail.reason ? "사유 수정" : "정정"}</button>}
        <ModalCancelButton onClick={() => setDetail(null)}>닫기</ModalCancelButton>
      </>}
    >
      <dl className="divide-y divide-gray-100">{[["날짜", formatDate(detail.workDate)], ["출근 시간", formatTime(detail.checkInTime)], ["퇴근 시간", formatTime(detail.checkOutTime)], ["근무 시간", formatMinutes(detail.workMinutes)]].map(([label, value]) => <div key={label} className="flex justify-between py-3 first:pt-0"><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-semibold">{value}</dd></div>)}<div className="flex items-center justify-between py-3"><dt className="text-sm text-gray-500">근태 상태</dt><dd><StatusBadge record={detail} /></dd></div>
      {needsCorrection(detail.attendanceStatusCode) && <div className="py-3"><dt className="text-sm text-gray-500">사유</dt><dd className="mt-1 text-sm font-medium text-gray-800">{detail.reason || "등록된 사유가 없습니다."}</dd>{detail.attachmentName && <dd className="mt-1 text-xs">{detail.attachmentUrl ? <a href={`${API_BASE_URL.replace(/\/api\/?$/, "")}${detail.attachmentUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{detail.attachmentName}</a> : detail.attachmentName}</dd>}</div>}
      </dl>
    </Modal>}

    {correcting && detail && (
      <AttendanceReasonModal
        attendanceId={detail.attendanceId}
        title={getStatus(detail) === "지각" ? "지각 사유 정정" : "조퇴 사유 정정"}
        description="사유와 필요한 경우 증빙 파일을 첨부해주세요."
        initialReason={detail.reason}
        initialAttachmentName={detail.attachmentName}
        initialAttachmentUrl={detail.attachmentUrl}
        onClose={() => setCorrecting(false)}
        onSaved={(saved) => {
          setCorrecting(false);
          setDetail((prev) => (prev ? { ...prev, ...saved } : prev));
          void fetchRecords();
        }}
      />
    )}
  </div>;
}

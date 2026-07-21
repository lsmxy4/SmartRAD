"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDaysIcon, CheckCircleIcon, ClockIcon, PaperAirplaneIcon, PlusIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
type StatusFilter = "ALL" | LeaveStatus;

interface LeaveRequestResponse {
  leaveRequestId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  leaveDays: number;
  reason: string | null;
  status: LeaveStatus;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface LeaveBalanceResponse {
  employeeLeaveBalanceId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainDays: number;
  expireDate: string;
}

interface LeaveTypeResponse {
  leaveTypeId: number;
  leaveTypeName: string;
  paidYn: boolean;
  defaultDays: number | null;
  note: string | null;
}

interface ErrorResponse { message?: string; }

const filters: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "승인 대기" },
  { value: "APPROVED", label: "승인 완료" },
  { value: "REJECTED", label: "반려" },
];

const statusLabel: Record<LeaveStatus, string> = { PENDING: "승인 대기", APPROVED: "승인 완료", REJECTED: "반려" };
const statusStyle: Record<LeaveStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
};

function authHeaders(json = false): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(json ? { "Content-Type": "application/json" } : {}) };
}

function formatDate(value: string | null) { return value ? value.slice(0, 10).replaceAll("-", ".") : "-"; }
function formatDateTime(value: string | null) { return value ? value.slice(0, 16).replace("T", " ").replaceAll("-", ".") : "-"; }
function period(item: LeaveRequestResponse) { return item.startDate === item.endDate ? formatDate(item.startDate) : `${formatDate(item.startDate)} ~ ${formatDate(item.endDate)}`; }
function days(value: number) { return `${Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}일`; }

async function readError(response: Response, fallback: string) {
  if (response.status === 401) return "로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.";
  if (response.status === 403) return "휴가 정보를 조회하거나 신청할 권한이 없습니다.";
  try { return ((await response.json()) as ErrorResponse).message || fallback; } catch { return fallback; }
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyle[status]}`}>{statusLabel[status]}</span>;
}

export default function MyLeavePage() {
  const [requests, setRequests] = useState<LeaveRequestResponse[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceResponse[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponse[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [detail, setDetail] = useState<LeaveRequestResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const [requestsResponse, balancesResponse, typesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/leave-requests/me`, { headers: authHeaders(), signal }),
        fetch(`${API_BASE_URL}/leave-balances/me`, { headers: authHeaders(), signal }),
        fetch(`${API_BASE_URL}/leave-types`, { headers: authHeaders(), signal }),
      ]);
      const failed = [requestsResponse, balancesResponse, typesResponse].find((response) => !response.ok);
      if (failed) throw new Error(await readError(failed, "휴가 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."));
      const [requestData, balanceData, typeData] = await Promise.all([requestsResponse.json(), balancesResponse.json(), typesResponse.json()]);
      setRequests(Array.isArray(requestData) ? requestData as LeaveRequestResponse[] : []);
      setBalances(Array.isArray(balanceData) ? balanceData as LeaveBalanceResponse[] : []);
      setLeaveTypes(Array.isArray(typeData) ? typeData as LeaveTypeResponse[] : []);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "휴가 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadData(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadData]);

  const summary = useMemo(() => ({
    total: balances.reduce((sum, item) => sum + Number(item.totalDays), 0),
    used: balances.reduce((sum, item) => sum + Number(item.usedDays), 0),
    pending: requests.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item.leaveDays), 0),
    remain: balances.reduce((sum, item) => sum + Number(item.remainDays), 0),
  }), [balances, requests]);

  const filtered = useMemo(() => requests.filter((item) => filter === "ALL" || item.status === filter), [filter, requests]);

  const openForm = () => {
    setForm({ leaveTypeId: leaveTypes[0] ? String(leaveTypes[0].leaveTypeId) : "", startDate: "", endDate: "", reason: "" });
    setFormError(null); setNotice(null); setFormOpen(true);
  };

  const submit = async () => {
    if (submitting) return;
    if (!form.leaveTypeId || !form.startDate || !form.endDate) { setFormError("휴가 유형과 시작일, 종료일을 모두 입력해주세요."); return; }
    if (form.startDate > form.endDate) { setFormError("시작일은 종료일보다 늦을 수 없습니다."); return; }
    setSubmitting(true); setFormError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/leave-requests/me`, {
        method: "POST", headers: authHeaders(true),
        body: JSON.stringify({ leaveTypeId: Number(form.leaveTypeId), startDate: form.startDate, endDate: form.endDate, reason: form.reason.trim() || null }),
      });
      if (!response.ok) throw new Error(await readError(response, "휴가 신청에 실패했습니다."));
      setFormOpen(false); setNotice("휴가 신청이 완료되었습니다. 승인 대기 상태로 등록되었습니다.");
      await loadData();
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : "휴가 신청에 실패했습니다."); }
    finally { setSubmitting(false); }
  };

  const summaryCards = [
    { label: "총 부여 일수", value: summary.total, icon: CalendarDaysIcon, style: "bg-blue-50 text-blue-600" },
    { label: "사용 일수", value: summary.used, icon: CheckCircleIcon, style: "bg-emerald-50 text-emerald-600" },
    { label: "승인 대기 일수", value: summary.pending, icon: ClockIcon, style: "bg-amber-50 text-amber-600" },
    { label: "잔여 일수", value: summary.remain, icon: PaperAirplaneIcon, style: "bg-indigo-50 text-indigo-600" },
  ];

  return <div className="mx-auto max-w-[1600px] space-y-5">
    <div className="flex justify-end"><button type="button" onClick={openForm} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#4A5DDF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"><PlusIcon className="h-4 w-4" />휴가 신청</button></div>
    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summaryCards.map((card) => { const Icon = card.icon; return <div key={card.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.style}`}><Icon className="h-5 w-5" /></span><div><p className="text-sm font-medium text-gray-500">{card.label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{loading ? "-" : days(card.value)}</p></div></div>; })}</section>

    {balances.length > 0 && <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">휴가 유형별 잔여 현황</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{balances.map((item) => <div key={item.employeeLeaveBalanceId} className="rounded-lg bg-gray-50 p-4"><div className="flex items-center justify-between"><p className="font-semibold text-gray-800">{item.leaveTypeName}</p><p className="text-lg font-bold text-blue-600">{days(item.remainDays)}</p></div><p className="mt-2 text-xs text-gray-500">부여 {days(item.totalDays)} · 사용 {days(item.usedDays)} · 만료 {formatDate(item.expireDate)}</p></div>)}</div></section>}

    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold text-gray-900">내 휴가 신청 내역</h2><div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{item.label}</button>)}</div></div>
      {loading ? <div className="py-16 text-center text-sm text-gray-500">휴가 정보를 불러오는 중입니다.</div>
        : error ? <div className="flex flex-col items-center py-16 text-center"><XCircleIcon className="h-9 w-9 text-rose-400" /><p className="mt-3 text-sm font-medium text-rose-600">{error}</p><button type="button" onClick={() => void loadData()} className="mt-4 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">다시 시도</button></div>
        : requests.length === 0 ? <div className="flex flex-col items-center px-5 py-16 text-center"><CalendarDaysIcon className="h-10 w-10 text-gray-300" /><p className="mt-4 font-semibold text-gray-800">신청한 휴가 내역이 없습니다.</p><p className="mt-1 text-sm text-gray-500">휴가가 필요할 때 신청 버튼을 이용해주세요.</p><button type="button" onClick={openForm} className="mt-5 rounded-md bg-[#4A5DDF] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">휴가 신청</button></div>
        : filtered.length === 0 ? <div className="py-16 text-center text-sm text-gray-500">선택한 상태의 신청 내역이 없습니다.</div>
        : <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-gray-50 text-xs font-semibold text-gray-500"><tr>{["신청일", "휴가 유형", "휴가 기간", "사용 일수", "신청 사유", "승인 상태", "처리일"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{filtered.map((item) => <tr key={item.leaveRequestId} onClick={() => setDetail(item)} className="cursor-pointer hover:bg-blue-50/40"><td className="px-5 py-4">{formatDate(item.createdAt)}</td><td className="px-5 py-4 font-semibold text-gray-900">{item.leaveTypeName}</td><td className="px-5 py-4">{period(item)}</td><td className="px-5 py-4">{days(item.leaveDays)}</td><td className="max-w-48 truncate px-5 py-4">{item.reason || "-"}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4">{formatDate(item.processedAt)}</td></tr>)}</tbody></table></div>
        <div className="divide-y divide-gray-100 md:hidden">{filtered.map((item) => <button key={item.leaveRequestId} type="button" onClick={() => setDetail(item)} className="w-full p-4 text-left hover:bg-gray-50"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-gray-900">{item.leaveTypeName} · {days(item.leaveDays)}</p><p className="mt-1 text-xs text-gray-500">{period(item)}</p></div><StatusBadge status={item.status} /></div><p className="mt-3 truncate text-sm text-gray-600">{item.reason || "신청 사유 없음"}</p></button>)}</div></>}
    </section>

    {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl bg-white shadow-xl"><div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold">휴가 신청</h2><button type="button" onClick={() => setFormOpen(false)} disabled={submitting} aria-label="닫기"><XMarkIcon className="h-5 w-5 text-gray-400" /></button></div><div className="space-y-4 p-6"><label className="block text-sm font-medium text-gray-700">휴가 유형<select value={form.leaveTypeId} onChange={(event) => setForm({ ...form, leaveTypeId: event.target.value })} className="mt-1 block h-10 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-blue-500"><option value="">선택해주세요</option>{leaveTypes.map((item) => <option key={item.leaveTypeId} value={item.leaveTypeId}>{item.leaveTypeName}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-gray-700">시작일<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="mt-1 block h-10 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-blue-500" /></label><label className="text-sm font-medium text-gray-700">종료일<input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="mt-1 block h-10 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-blue-500" /></label></div><label className="block text-sm font-medium text-gray-700">신청 사유<textarea maxLength={500} rows={4} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="필요한 경우 신청 사유를 입력해주세요." className="mt-1 block w-full resize-none rounded-md border border-gray-200 p-3 outline-none focus:border-blue-500" /></label>{formError && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{formError}</p>}</div><div className="flex justify-end gap-2 border-t px-6 py-4"><button type="button" onClick={() => setFormOpen(false)} disabled={submitting} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">취소</button><button type="button" onClick={() => void submit()} disabled={submitting} className="rounded-md bg-[#4A5DDF] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{submitting ? "신청 중..." : "신청하기"}</button></div></div></div>}

    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl bg-white shadow-xl"><div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold">휴가 신청 상세</h2><button type="button" onClick={() => setDetail(null)} aria-label="닫기"><XMarkIcon className="h-5 w-5 text-gray-400" /></button></div><div className="space-y-4 p-6"><div className="grid grid-cols-2 gap-4 text-sm">{[["휴가 유형", detail.leaveTypeName], ["신청 기간", period(detail)], ["사용 일수", days(detail.leaveDays)], ["신청일", formatDate(detail.createdAt)], ["처리일", formatDateTime(detail.processedAt)]].map(([label, value]) => <div key={label}><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-1 font-semibold text-gray-800">{value}</p></div>)}<div><p className="text-xs font-medium text-gray-500">승인 상태</p><p className="mt-1"><StatusBadge status={detail.status} /></p></div></div><div><p className="text-xs font-medium text-gray-500">신청 사유</p><p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{detail.reason || "-"}</p></div>{detail.rejectionReason && <div><p className="text-xs font-medium text-gray-500">반려 사유</p><p className="mt-1 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{detail.rejectionReason}</p></div>}</div><div className="flex justify-end border-t px-6 py-4"><button type="button" onClick={() => setDetail(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">닫기</button></div></div></div>}
  </div>;
}

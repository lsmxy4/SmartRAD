"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LeaveApprovalFilters from "./LeaveApprovalFilters";
import LeaveApprovalStats from "./LeaveApprovalStats";
import LeaveApprovalTable from "./LeaveApprovalTable";
import LeaveRequestModal from "./LeaveRequestModal";
import type { EmployeePage, LeaveApprovalRow, LeaveFilters, LeaveRequestResponse, LeaveTypeResponse } from "./leaveApprovalTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
function monthRange() { const now = new Date(); const year = now.getFullYear(); const month = now.getMonth(); const last = new Date(year, month + 1, 0).getDate(); return { startDate: `${year}-${String(month + 1).padStart(2, "0")}-01`, endDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}` }; }
function initialFilters(): LeaveFilters { return { ...monthRange(), leaveTypeId: "", status: "", keyword: "" }; }
function authHeaders(): HeadersInit { const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken"); return token ? { Authorization: `Bearer ${token}` } : {}; }
function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export default function LeaveApprovalDashboard() {
  const [rows, setRows] = useState<LeaveApprovalRow[]>([]); const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponse[]>([]); const [filters, setFilters] = useState<LeaveFilters>(initialFilters); const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState(10); const [selectedIds, setSelectedIds] = useState<number[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [retryKey, setRetryKey] = useState(0); const [modal, setModal] = useState<{ mode: "detail" | "approve" | "bulk" | "reject"; row?: LeaveApprovalRow } | null>(null); const [busy, setBusy] = useState(false); const [actionError, setActionError] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [leaveRes, typesRes, employeesRes] = await Promise.all([fetch(`${API_BASE_URL}/leave-requests`, { headers: authHeaders() }), fetch(`${API_BASE_URL}/leave-types`), fetch(`${API_BASE_URL}/employees?page=0&size=1000`)]);
        if (!leaveRes.ok || !typesRes.ok || !employeesRes.ok) throw new Error();
        const [leaves, types, employeePage] = await Promise.all([leaveRes.json() as Promise<LeaveRequestResponse[]>, typesRes.json() as Promise<LeaveTypeResponse[]>, employeesRes.json() as Promise<EmployeePage>]);
        const employeeMap = new Map((employeePage.content ?? []).map((employee) => [employee.employeeId, employee]));
        if (!cancelled) {
          setRows((Array.isArray(leaves) ? leaves : []).map((leave) => { const employee = employeeMap.get(leave.employeeId); return { ...leave, employeeNo: employee?.employeeNo ?? null, departmentName: employee?.departmentName ?? null, positionName: employee?.positionName ?? null, email: employee?.email ?? null }; }));
          setLeaveTypes(Array.isArray(types) ? types : []); setSelectedIds([]);
        }
      } catch { if (!cancelled) setError("휴가 신청 정보를 불러오지 못했습니다."); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [retryKey]);

  const baseFiltered = useMemo(() => rows.filter((row) => { const requested = row.createdAt.slice(0, 10); const keyword = filters.keyword.trim().toLocaleLowerCase(); return requested >= filters.startDate && requested <= filters.endDate && (!filters.leaveTypeId || row.leaveTypeId === Number(filters.leaveTypeId)) && (!keyword || row.employeeName.toLocaleLowerCase().includes(keyword) || (row.departmentName ?? "").toLocaleLowerCase().includes(keyword) || (row.employeeNo ?? "").toLocaleLowerCase().includes(keyword)); }), [filters.endDate, filters.keyword, filters.leaveTypeId, filters.startDate, rows]);
  const filtered = useMemo(() => baseFiltered.filter((row) => !filters.status || row.status === filters.status), [baseFiltered, filters.status]); const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const changeFilters = (next: Partial<LeaveFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(0); setSelectedIds([]); };
  const reset = () => { setFilters(initialFilters()); setPage(0); setSelectedIds([]); };
  const exportCsv = useCallback(() => { const headers = ["신청일","직원명","사번","부서","직급","휴가 유형","휴가 시작일","휴가 종료일","사용 일수","신청 사유","상태","승인자","처리일","반려 사유"]; const lines = filtered.map((row) => [row.createdAt.slice(0, 10), row.employeeName, row.employeeNo || "-", row.departmentName || "-", row.positionName || "-", row.leaveTypeName, row.startDate, row.endDate, row.leaveDays, row.reason || "-", row.status, row.approverName || "-", "-", "-"]); const blob = new Blob([`\uFEFF${[headers, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `leave-requests-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); }, [filtered]);
  const pendingFilter = useCallback(() => { changeFilters({ status: "PENDING" }); requestAnimationFrame(() => document.getElementById("leave-request-list")?.scrollIntoView({ behavior: "smooth", block: "start" })); }, []);
  useEffect(() => { const onExport = () => exportCsv(); const onPending = () => pendingFilter(); window.addEventListener("leave:approval-export", onExport); window.addEventListener("leave:approval-pending", onPending); return () => { window.removeEventListener("leave:approval-export", onExport); window.removeEventListener("leave:approval-pending", onPending); }; }, [exportCsv, pendingFilter]);

  const approveIds = async (ids: number[]) => { setBusy(true); setActionError(null); const results = await Promise.allSettled(ids.map(async (id) => { const response = await fetch(`${API_BASE_URL}/leave-requests/${id}/approve`, { method: "PATCH", headers: authHeaders() }); if (!response.ok) throw new Error(); return response; })); const succeeded = results.filter((result) => result.status === "fulfilled").length; const failed = results.length - succeeded; setMessage(failed ? `${succeeded}건 승인, ${failed}건 실패했습니다.` : `${succeeded}건을 승인했습니다.`); setModal(null); setBusy(false); setPage(0); setRetryKey((key) => key + 1); };
  const selectedRows = rows.filter((row) => selectedIds.includes(row.leaveRequestId) && row.status === "PENDING");

  return <div className="mx-auto max-w-[1600px] space-y-5 pb-8">{message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}{error && <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => setRetryKey((key) => key + 1)} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 font-semibold">재시도</button></div>}<LeaveApprovalStats rows={baseFiltered} loading={loading} /><LeaveApprovalFilters filters={filters} leaveTypes={leaveTypes} onChange={changeFilters} onReset={reset} /><LeaveApprovalTable rows={pageRows} total={filtered.length} loading={loading} selectedIds={selectedIds} page={page} pageSize={pageSize} onPage={(next) => { setPage(next); setSelectedIds([]); }} onPageSize={(size) => { setPageSize(size); setPage(0); setSelectedIds([]); }} onToggle={(id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id])} onToggleAll={() => { const ids = pageRows.filter((row) => row.status === "PENDING").map((row) => row.leaveRequestId); setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]); }} onApprove={(row) => { setActionError(null); setModal({ mode: "approve", row }); }} onReject={(row) => { setActionError(null); setModal({ mode: "reject", row }); }} onDetail={(row) => { setActionError(null); setModal({ mode: "detail", row }); }} onBulk={() => { setActionError(null); setModal({ mode: "bulk" }); }} />{modal && <LeaveRequestModal mode={modal.mode} row={modal.row} selectedRows={selectedRows} busy={busy} error={actionError} onClose={() => { if (!busy) setModal(null); }} onConfirm={() => modal.mode === "approve" && modal.row ? approveIds([modal.row.leaveRequestId]) : modal.mode === "bulk" ? approveIds(selectedRows.map((row) => row.leaveRequestId)) : undefined} />}</div>;
}

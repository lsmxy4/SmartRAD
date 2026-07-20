"use client";

import { useCallback, useEffect, useState } from "react";
import LeaveApprovalFilters from "./LeaveApprovalFilters";
import LeaveApprovalStats from "./LeaveApprovalStats";
import LeaveApprovalTable from "./LeaveApprovalTable";
import LeaveRequestModal from "./LeaveRequestModal";
import type {
  LeaveApprovalRow,
  LeaveFilters,
  LeaveRequestBulkApproveResult,
  LeaveRequestPage,
  LeaveRequestSummary,
  LeaveTypeResponse,
} from "./leaveApprovalTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function monthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  return {
    startDate: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    endDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
  };
}
function initialFilters(): LeaveFilters {
  return { ...monthRange(), leaveTypeId: "", status: "", keyword: "" };
}
function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
function buildQuery(filters: LeaveFilters, extra: Record<string, string | number> = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.leaveTypeId) params.set("leaveTypeId", filters.leaveTypeId);
  if (filters.status) params.set("status", filters.status);
  if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  return params.toString();
}

export default function LeaveApprovalDashboard() {
  const [rows, setRows] = useState<LeaveApprovalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponse[]>([]);
  const [summary, setSummary] = useState<LeaveRequestSummary | null>(null);
  const [filters, setFilters] = useState<LeaveFilters>(initialFilters);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [modal, setModal] = useState<{ mode: "detail" | "approve" | "bulk" | "reject"; row?: LeaveApprovalRow } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const listQuery = buildQuery(filters, { page, size: pageSize, sort: "createdAt,desc" });
        const summaryQuery = buildQuery({ ...filters, status: "" });
        const [listRes, summaryRes, typesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/leave-requests/search?${listQuery}`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/leave-requests/summary?${summaryQuery}`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/leave-types`, { headers: authHeaders() }),
        ]);
        if (!listRes.ok || !summaryRes.ok || !typesRes.ok) throw new Error();
        const [listPage, summaryData, types] = await Promise.all([
          listRes.json() as Promise<LeaveRequestPage>,
          summaryRes.json() as Promise<LeaveRequestSummary>,
          typesRes.json() as Promise<LeaveTypeResponse[]>,
        ]);
        if (!cancelled) {
          setRows(listPage.content ?? []);
          setTotal(listPage.totalElements ?? 0);
          setSummary(summaryData);
          setLeaveTypes(Array.isArray(types) ? types : []);
          setSelectedIds([]);
        }
      } catch {
        if (!cancelled) setError("휴가 신청 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filters, page, pageSize, retryKey]);

  const changeFilters = (next: Partial<LeaveFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(0);
    setSelectedIds([]);
  };
  const reset = () => {
    setFilters(initialFilters());
    setPage(0);
    setSelectedIds([]);
  };

  const exportCsv = useCallback(async () => {
    try {
      const query = buildQuery(filters, { page: 0, size: 10000, sort: "createdAt,desc" });
      const res = await fetch(`${API_BASE_URL}/leave-requests/search?${query}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const listPage = (await res.json()) as LeaveRequestPage;
      const headers = ["신청일", "직원명", "사번", "부서", "직급", "휴가 유형", "휴가 시작일", "휴가 종료일", "사용 일수", "신청 사유", "상태", "승인자", "처리일", "반려 사유"];
      const lines = listPage.content.map((row) => [
        row.createdAt.slice(0, 10), row.employeeName, row.employeeNo || "-", row.departmentName || "-", row.positionName || "-",
        row.leaveTypeName, row.startDate, row.endDate, row.leaveDays, row.reason || "-", row.status, row.approverName || "-",
        row.processedAt ? row.processedAt.slice(0, 16).replace("T", " ") : "-", row.rejectionReason || "-",
      ]);
      const blob = new Blob([`﻿${[headers, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `leave-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setActionError("내보내기에 실패했습니다.");
    }
  }, [filters]);

  const pendingFilter = useCallback(() => {
    changeFilters({ status: "PENDING" });
    requestAnimationFrame(() => document.getElementById("leave-request-list")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  useEffect(() => {
    const onExport = () => exportCsv();
    const onPending = () => pendingFilter();
    window.addEventListener("leave:approval-export", onExport);
    window.addEventListener("leave:approval-pending", onPending);
    return () => {
      window.removeEventListener("leave:approval-export", onExport);
      window.removeEventListener("leave:approval-pending", onPending);
    };
  }, [exportCsv, pendingFilter]);

  const approveOne = async (id: number) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests/${id}/approve`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "승인에 실패했습니다.");
      }
      setMessage("1건을 승인했습니다.");
      setModal(null);
      setRetryKey((key) => key + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "승인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const bulkApproveIds = async (ids: number[]) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests/bulk-approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ leaveRequestIds: ids }),
      });
      if (!res.ok) throw new Error();
      const results = (await res.json()) as LeaveRequestBulkApproveResult[];
      const succeeded = results.filter((result) => result.success).length;
      const failed = results.length - succeeded;
      setMessage(failed ? `${succeeded}건 승인, ${failed}건 실패했습니다.` : `${succeeded}건을 승인했습니다.`);
      setModal(null);
      setPage(0);
      setRetryKey((key) => key + 1);
    } catch {
      setActionError("일괄 승인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const rejectOne = async (id: number, rejectionReason: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "반려에 실패했습니다.");
      }
      setMessage("1건을 반려했습니다.");
      setModal(null);
      setRetryKey((key) => key + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "반려에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const selectedRows = rows.filter((row) => selectedIds.includes(row.leaveRequestId) && row.status === "PENDING");

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 font-semibold">재시도</button>
        </div>
      )}
      <LeaveApprovalStats summary={summary} loading={loading} />
      <LeaveApprovalFilters filters={filters} leaveTypes={leaveTypes} onChange={changeFilters} onReset={reset} />
      <LeaveApprovalTable
        rows={rows}
        total={total}
        loading={loading}
        selectedIds={selectedIds}
        page={page}
        pageSize={pageSize}
        onPage={(next) => { setPage(next); setSelectedIds([]); }}
        onPageSize={(size) => { setPageSize(size); setPage(0); setSelectedIds([]); }}
        onToggle={(id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]))}
        onToggleAll={() => {
          const ids = rows.filter((row) => row.status === "PENDING").map((row) => row.leaveRequestId);
          setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
        }}
        onApprove={(row) => { setActionError(null); setModal({ mode: "approve", row }); }}
        onReject={(row) => { setActionError(null); setModal({ mode: "reject", row }); }}
        onDetail={(row) => { setActionError(null); setModal({ mode: "detail", row }); }}
        onBulk={() => { setActionError(null); setModal({ mode: "bulk" }); }}
      />
      {modal && (
        <LeaveRequestModal
          mode={modal.mode}
          row={modal.row}
          selectedRows={selectedRows}
          busy={busy}
          error={actionError}
          onClose={() => { if (!busy) setModal(null); }}
          onConfirm={(rejectionReason) => {
            if (modal.mode === "approve" && modal.row) approveOne(modal.row.leaveRequestId);
            else if (modal.mode === "bulk") bulkApproveIds(selectedRows.map((row) => row.leaveRequestId));
            else if (modal.mode === "reject" && modal.row && rejectionReason) rejectOne(modal.row.leaveRequestId, rejectionReason);
          }}
        />
      )}
    </div>
  );
}

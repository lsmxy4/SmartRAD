"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  APPROVAL_STATUS_OPTIONS,
  CERTIFICATE_TYPE_OPTIONS,
  certificateTypeLabel,
  statusBadge,
  type CertificateIssuePage,
  type CertificateIssueResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
const PAGE_SIZE = 10;

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export default function CertificateList({ refreshKey, onActionComplete }: { refreshKey?: number; onActionComplete?: () => void }) {
  const [data, setData] = useState<CertificateIssuePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [internalRefresh, setInternalRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/certificate-issues/search?page=${page}&size=${PAGE_SIZE}&sort=applicationDate,desc`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        if (certificateType) url += `&certificateType=${certificateType}`;
        if (approvalStatus) url += `&approvalStatus=${approvalStatus}`;
        const res = await fetch(url, { headers: authHeaders() });
        if (res.ok) {
          const json = (await res.json()) as CertificateIssuePage;
          if (!cancelled) setData(json);
        } else if (!cancelled) {
          setData(null);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, keyword, certificateType, approvalStatus, refreshKey, internalRefresh]);

  const runSearch = () => {
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const runAction = async (id: number, action: "approve" | "reject" | "issue") => {
    setActionError(null);
    try {
      let url = `${API_BASE_URL}/certificate-issues/${id}/${action}`;
      let body: string | undefined;
      let headers: HeadersInit = authHeaders();
      if (action === "reject") {
        const memo = window.prompt("반려 사유를 입력하세요");
        if (!memo) return;
        body = JSON.stringify({ memo });
        headers = { "Content-Type": "application/json", ...headers };
      }
      const res = await fetch(url, { method: "PATCH", headers, body });
      if (!res.ok) throw new Error("처리에 실패했습니다.");
      setInternalRefresh((key) => key + 1);
      onActionComplete?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    }
  };

  const exportCsv = async () => {
    try {
      let url = `${API_BASE_URL}/certificate-issues/search?page=0&size=1000&sort=applicationDate,desc`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (certificateType) url += `&certificateType=${certificateType}`;
      if (approvalStatus) url += `&approvalStatus=${approvalStatus}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as CertificateIssuePage;
      const headers = ["신청번호", "신청자", "증명서 종류", "신청일", "용도", "상태"];
      const lines = json.content.map((row) => [
        row.applicationNo,
        row.employeeName,
        certificateTypeLabel(row.certificateType),
        row.applicationDate,
        row.purpose || "-",
        statusBadge(row).label,
      ]);
      const csv = `﻿${[headers, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n")}`;
      const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `certificate-issues-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setActionError("일괄 다운로드에 실패했습니다.");
    }
  };

  useEffect(() => {
    const handleExportEvent = () => exportCsv();
    window.addEventListener("certificate:export", handleExportEvent);
    return () => window.removeEventListener("certificate:export", handleExportEvent);
  }, [keyword, certificateType, approvalStatus]);

  const rows = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0 flex-1">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">발급 신청 내역</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              {totalElements}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                placeholder="신청자명 검색..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <select
              value={certificateType}
              onChange={(e) => { setCertificateType(e.target.value); setPage(0); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">증명서 종류</option>
              {CERTIFICATE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={approvalStatus}
              onChange={(e) => { setApprovalStatus(e.target.value); setPage(0); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">처리 상태</option>
              {APPROVAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        {actionError && <p className="mt-2 text-sm font-medium text-rose-500">{actionError}</p>}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {["신청일", "신청자", "증명서 종류", "용도", "신청번호", "상태", "관리"].map((title) => (
                <th key={title} className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center text-gray-500">로딩 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-base font-medium text-gray-900 mb-1">데이터가 없습니다</p>
                    <p className="text-sm">해당하는 발급 신청 내역이 없습니다.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row: CertificateIssueResponse) => {
                const badge = statusBadge(row);
                return (
                  <tr key={row.employeeCertificateIssueId} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{row.applicationDate}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{row.employeeName}</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-600 whitespace-nowrap">{certificateTypeLabel(row.certificateType)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{row.purpose || "-"}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{row.applicationNo}</td>
                    <td className="py-3 px-4 text-sm whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td className="py-3 px-4 text-sm whitespace-nowrap">
                      {row.approvalStatus === "PENDING" && (
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => runAction(row.employeeCertificateIssueId, "approve")} className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">승인</button>
                          <button type="button" onClick={() => runAction(row.employeeCertificateIssueId, "reject")} className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50">반려</button>
                        </div>
                      )}
                      {row.approvalStatus === "APPROVED" && row.issueStatus !== "ISSUED" && (
                        <button type="button" onClick={() => runAction(row.employeeCertificateIssueId, "issue")} className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">발급 처리</button>
                      )}
                      {(row.approvalStatus === "REJECTED" || row.issueStatus === "ISSUED") && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          총 {totalElements}건 중 {rows.length ? page * PAGE_SIZE + 1 : 0}-{page * PAGE_SIZE + rows.length} 표시
        </p>
        <div className="flex gap-1">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-blue-600 text-white text-sm">{page + 1}</button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

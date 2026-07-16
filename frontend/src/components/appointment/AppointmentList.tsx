"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { APPOINTMENT_TYPE_OPTIONS, appointmentTypeLabel, type AppointmentPage, type AppointmentResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
const PAGE_SIZE = 10;

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function changeCell(before: string | null, after: string | null) {
  if (!before && !after) return "-";
  if (before === after) return after ?? "-";
  return `${before ?? "-"} → ${after ?? "-"}`;
}

export default function AppointmentList({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<AppointmentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [month, setMonth] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/appointments/search?page=${page}&size=${PAGE_SIZE}&sort=effectiveDate,desc`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        if (type) url += `&appointmentType=${type}`;
        if (month) url += `&yearMonth=${month}`;
        const res = await fetch(url, { headers: authHeaders() });
        if (res.ok) {
          const json = (await res.json()) as AppointmentPage;
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
  }, [page, keyword, type, month, refreshKey]);

  const runSearch = () => {
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const rows = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0 flex-1">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">발령 내역</h2>
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
                placeholder="직원 검색..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(0); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">발령 유형</option>
              {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input
              type="month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(0); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {["발령일", "대상 직원", "발령 유형", "부서 변경", "직급 변경", "사유", "상태"].map((title) => (
                <th key={title} className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center text-gray-500">로딩 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-base font-medium text-gray-900 mb-1">데이터가 없습니다</p>
                    <p className="text-sm">해당하는 발령 내역이 없습니다.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row: AppointmentResponse) => (
                <tr key={row.employeeAppointmentId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{row.effectiveDate}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{row.employeeName}</td>
                  <td className="py-3 px-4 text-sm whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      {appointmentTypeLabel(row.appointmentType)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{changeCell(row.fromDepartmentName, row.toDepartmentName)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{changeCell(row.fromPositionName, row.toPositionName)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{row.reason || "-"}</td>
                  <td className="py-3 px-4 text-sm whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">완료</span>
                  </td>
                </tr>
              ))
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

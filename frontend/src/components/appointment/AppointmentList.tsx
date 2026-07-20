"use client";

import { Fragment, useEffect, useState } from "react";
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, TrashIcon } from "@heroicons/react/24/outline";
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

export default function AppointmentList({ refreshKey, onActionComplete }: { refreshKey?: number; onActionComplete?: () => void }) {
  const [data, setData] = useState<AppointmentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [month, setMonth] = useState("");
  const [groupByDate, setGroupByDate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [internalRefresh, setInternalRefresh] = useState(0);

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
  }, [page, keyword, type, month, refreshKey, internalRefresh]);

  const runSearch = () => {
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const deleteAppointment = async (id: number) => {
    if (!window.confirm("이 발령 내역을 삭제하시겠습니까?")) return;
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      setInternalRefresh((key) => key + 1);
      onActionComplete?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const rows = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const groupedRows = groupByDate
    ? rows.reduce<{ date: string; items: AppointmentResponse[] }[]>((groups, row) => {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === row.effectiveDate) {
          lastGroup.items.push(row);
        } else {
          groups.push({ date: row.effectiveDate, items: [row] });
        }
        return groups;
      }, [])
    : null;

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
            <button
              type="button"
              onClick={() => setGroupByDate((current) => !current)}
              title="날짜별로 모아보기"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                groupByDate
                  ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
                  : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              날짜별로 보기
            </button>
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
            <input
              type="month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(0); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
        {actionError && <p className="mt-2 text-sm font-medium text-rose-500">{actionError}</p>}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {["발령일", "대상 직원", "발령 유형", "부서 변경", "직급 변경", "사유", "상태", "관리"].map((title) => (
                <th key={title} className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-16 text-center text-gray-500">로딩 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-base font-medium text-gray-900 mb-1">데이터가 없습니다</p>
                    <p className="text-sm">해당하는 발령 내역이 없습니다.</p>
                  </div>
                </td>
              </tr>
            ) : groupedRows ? (
              groupedRows.map((group) => (
                <Fragment key={`group-${group.date}`}>
                  <tr className="bg-gray-100">
                    <td colSpan={8} className="py-2 px-4 text-sm font-bold text-gray-700">{group.date}</td>
                  </tr>
                  {group.items.map((row) => (
                    <AppointmentRow key={row.employeeAppointmentId} row={row} hideDate onDelete={deleteAppointment} />
                  ))}
                </Fragment>
              ))
            ) : (
              rows.map((row: AppointmentResponse) => (
                <AppointmentRow key={row.employeeAppointmentId} row={row} onDelete={deleteAppointment} />
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

function AppointmentRow({ row, hideDate, onDelete }: { row: AppointmentResponse; hideDate?: boolean; onDelete: (id: number) => void }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{hideDate ? "" : row.effectiveDate}</td>
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
      <td className="py-3 px-4 text-sm whitespace-nowrap">
        <button
          type="button"
          onClick={() => onDelete(row.employeeAppointmentId)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          삭제
        </button>
      </td>
    </tr>
  );
}

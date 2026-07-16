"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { AttendanceRow, AttendanceStatus, Department } from "./types";
import { attendanceStatusLabel } from "./types";

const PAGE_SIZE = 7;
const inputClass = "h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const badgeStyles: Record<AttendanceStatus, string> = {
  normal: "bg-emerald-50 text-emerald-700",
  late: "bg-amber-50 text-amber-700",
  absent: "bg-rose-50 text-rose-700",
  leave: "bg-sky-50 text-sky-700",
  unknown: "bg-gray-100 text-gray-600",
};

function formatTime(value: string | null) {
  if (!value) return "-";
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? "-";
}

function formatMinutes(value: number | null) {
  if (value === null || value === undefined) return "-";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

interface Props {
  rows: AttendanceRow[];
  departments: Department[];
  date: string;
  loading: boolean;
  error: string | null;
  onDateChange: (date: string) => void;
  onFilteredRowsChange: (rows: AttendanceRow[]) => void;
}

export default function AttendanceTable({ rows, departments, date, loading, error, onDateChange, onFilteredRowsChange }: Props) {
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const departmentMatches = !department || row.departmentName === department;
    const statusMatches = !status || row.normalizedStatus === status;
    const keywordMatches = !keyword || row.employeeName.toLocaleLowerCase().includes(keyword.toLocaleLowerCase());
    return departmentMatches && statusMatches && keywordMatches;
  }), [rows, department, status, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filteredRows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  useEffect(() => { onFilteredRowsChange(filteredRows); }, [filteredRows, onFilteredRowsChange]);

  const runSearch = () => { setKeyword(searchInput.trim()); setPage(0); setCheckedIds([]); };
  const resetFilters = () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setDepartment(""); setStatus(""); setSearchInput(""); setKeyword(""); setPage(0); onDateChange(today);
  };
  const allChecked = pageRows.length > 0 && pageRows.every((row) => checkedIds.includes(row.attendanceId));
  const toggleAll = () => setCheckedIds((current) => allChecked
    ? current.filter((id) => !pageRows.some((row) => row.attendanceId === id))
    : [...new Set([...current, ...pageRows.map((row) => row.attendanceId)])]);

  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="mr-1 text-lg font-bold text-gray-900">근태 현황</h2>
            <input type="date" value={date} onChange={(event) => { setPage(0); setCheckedIds([]); onDateChange(event.target.value); }} className={inputClass} aria-label="조회 날짜" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={department} onChange={(event) => { setDepartment(event.target.value); setPage(0); setCheckedIds([]); }} className={inputClass} aria-label="부서 필터">
              <option value="">부서 전체</option>
              {departments.map((item) => <option key={item.departmentId} value={item.departmentName}>{item.departmentName}</option>)}
            </select>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); setCheckedIds([]); }} className={inputClass} aria-label="상태 필터">
              <option value="">상태 전체</option><option value="normal">정상출근</option><option value="late">지각</option><option value="absent">결근</option><option value="leave">휴가</option><option value="unknown">미확인</option>
            </select>
            <div className="relative min-w-[190px] flex-1 sm:max-w-64">
              <button type="button" onClick={runSearch} aria-label="직원 검색" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"><MagnifyingGlassIcon className="h-4 w-4" /></button>
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") runSearch(); }} placeholder="직원 이름 검색" className={`${inputClass} w-full pl-9`} />
            </div>
            <button type="button" onClick={resetFilters} title="필터 초기화" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ArrowPathIcon className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="w-12 px-5 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="현재 페이지 전체 선택" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
              {['직원','부서','직급','출근 시간','퇴근 시간','근무 시간','상태','비고'].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3 font-semibold">{title}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="py-16 text-center text-gray-500">로딩 중...</td></tr>
              : error ? <tr><td colSpan={9} className="py-16 text-center text-rose-600">{error}</td></tr>
              : pageRows.length === 0 ? <tr><td colSpan={9} className="py-16 text-center text-gray-500">조회된 근태 내역이 없습니다.</td></tr>
              : pageRows.map((row) => (
                <tr key={row.attendanceId} className={`border-b border-gray-100 last:border-0 ${row.normalizedStatus === 'late' ? 'bg-amber-50/30' : row.normalizedStatus === 'absent' ? 'bg-rose-50/30' : 'hover:bg-gray-50/70'}`}>
                  <td className="px-5 py-4"><input type="checkbox" checked={checkedIds.includes(row.attendanceId)} onChange={() => setCheckedIds((ids) => ids.includes(row.attendanceId) ? ids.filter((id) => id !== row.attendanceId) : [...ids, row.attendanceId])} aria-label={`${row.employeeName} 선택`} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                  <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{row.employeeName.charAt(0) || '?'}</div><div><p className="font-medium text-gray-900">{row.employeeName}</p>{row.employeeNo && <p className="text-xs text-gray-400">{row.employeeNo}</p>}</div></div></td>
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600">{row.departmentName || '-'}</td><td className="whitespace-nowrap px-4 py-4 text-gray-600">{row.positionName || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600">{formatTime(row.checkInTime)}</td><td className="whitespace-nowrap px-4 py-4 text-gray-600">{formatTime(row.checkOutTime)}</td><td className="whitespace-nowrap px-4 py-4 text-gray-600">{formatMinutes(row.workMinutes)}</td>
                  <td className="whitespace-nowrap px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyles[row.normalizedStatus]}`}>{attendanceStatusLabel(row)}</span></td><td className="px-4 py-4 text-gray-500">-</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-gray-500">{filteredRows.length ? `${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, filteredRows.length)} / 총 ${filteredRows.length}명` : "0 / 총 0명"}</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="이전 페이지" className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronLeftIcon className="h-4 w-4" /></button>
          {Array.from({ length: totalPages }, (_, index) => index).map((index) => <button type="button" key={index} onClick={() => setPage(index)} className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${currentPage === index ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{index + 1}</button>)}
          <button type="button" disabled={currentPage >= totalPages - 1} onClick={() => setPage(currentPage + 1)} aria-label="다음 페이지" className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronRightIcon className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}

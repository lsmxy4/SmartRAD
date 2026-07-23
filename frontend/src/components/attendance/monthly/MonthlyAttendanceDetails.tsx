"use client";

import { useMemo, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { DepartmentRate, EmployeeMonthlyRow } from "./monthlyAttendanceTypes";
import { warningEmployees } from "./monthlyAttendanceUtils";

function rateColor(rate: number) { return rate >= 90 ? "bg-emerald-500" : rate >= 80 ? "bg-indigo-500" : rate >= 70 ? "bg-amber-500" : "bg-rose-500"; }

export function DepartmentAttendanceRates({ data }: { data: DepartmentRate[] }) {
  return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-gray-900">부서별 출근율</h2>{data.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">집계 가능한 부서 데이터가 없습니다.</p> : <div className="space-y-4">{data.map((item) => <div key={item.name}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-gray-700">{item.name}</span><span className="font-semibold text-gray-900">{item.rate}%</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${rateColor(item.rate)}`} style={{ width: `${item.rate}%` }} /></div></div>)}</div>}</section>;
}

export function EmployeeMonthlySummary({ rows, departments }: { rows: EmployeeMonthlyRow[], departments: DepartmentRate[] }) {
  const [department, setDepartment] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortOption, setSortOption] = useState("name");

  const filteredAndSorted = useMemo(() => {
    let result = rows;
    if (department) result = result.filter(r => r.departmentName === department);
    if (keyword) result = result.filter(r => r.employeeName.includes(keyword));

    return result.sort((a, b) => {
      if (sortOption === "name") return a.employeeName.localeCompare(b.employeeName, "ko");
      if (sortOption === "attendance") return (a.attendanceRate ?? 0) - (b.attendanceRate ?? 0);
      if (sortOption === "late") return b.lateCount - a.lateCount;
      if (sortOption === "absent") return b.absentCount - a.absentCount;
      return 0;
    });
  }, [rows, department, keyword, sortOption]);

  return <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col h-full"><div className="border-b border-gray-100 p-4 space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">직원별 월간 요약</h2></div><div className="flex flex-wrap items-center gap-2"><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20"><option value="">전체 부서</option>{departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}</select><select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20"><option value="name">이름순</option><option value="attendance">출근율 낮은 순</option><option value="late">지각 많은 순</option><option value="absent">결근 많은 순</option></select><input type="text" placeholder="직원명 검색..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" /></div></div><div className="flex-1 overflow-auto max-h-[340px]"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 shadow-[0_1px_0_0_#f3f4f6]"><tr>{["직원","출근일","지각","결근","초과근무","출근율"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{filteredAndSorted.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-gray-500">데이터가 없습니다.</td></tr> : filteredAndSorted.map((row) => <tr key={row.employeeId} className="border-b border-gray-50 last:border-0"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{row.employeeName.charAt(0)}</div><div><p className="font-semibold text-gray-900">{row.employeeName}</p><p className="text-xs text-gray-400">{row.departmentName}</p></div></div></td><td className="px-4 py-3 text-gray-600">{row.normalDays}일</td><td className="px-4 py-3 font-semibold text-amber-600">{row.lateCount}회</td><td className="px-4 py-3 font-semibold text-rose-600">{row.absentCount}회</td><td className="px-4 py-3 text-indigo-600">{row.overtimeMinutes === null ? "-" : `${(row.overtimeMinutes / 60).toFixed(1)}h`}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-gray-100"><div className={`h-full rounded-full ${rateColor(row.attendanceRate ?? 0)}`} style={{ width: `${row.attendanceRate ?? 0}%` }} /></div><span className="text-xs font-semibold text-gray-700 tabular-nums">{row.attendanceRate === null ? "-" : `${row.attendanceRate}%`}</span></div></td></tr>)}</tbody></table></div></section>;
}

export function AttendanceWarningEmployees({ rows }: { rows: EmployeeMonthlyRow[] }) {
  const warnings = warningEmployees(rows);
  return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />주의 직원</h2><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{warnings.length}명</span></div>{warnings.length === 0 ? <p className="py-10 text-center text-sm text-gray-500">주의 기준에 해당하는 직원이 없습니다.</p> : <div className="space-y-3">{warnings.map((row) => <div key={row.employeeId} className="rounded-lg bg-amber-50/70 p-3"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white mt-0.5">{row.employeeName.charAt(0)}</div><div className="flex-1"><p className="font-semibold text-gray-900">{row.employeeName}</p><p className="text-xs text-gray-600 mt-1 leading-relaxed">{row.departmentName}<br />지각 {row.lateCount}회 / 결근 {row.absentCount}회</p></div><span className="text-xs font-bold text-rose-600 whitespace-nowrap">{row.absentCount > 0 ? "경고" : "주의"}</span></div></div>)}</div>}</section>;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AttendanceResponse, Department, EmployeePage } from "../types";
import { DailyAttendanceTrend, MonthlyAttendanceDonut } from "./MonthlyAttendanceCharts";
import { AttendanceWarningEmployees, DepartmentAttendanceRates, EmployeeMonthlySummary } from "./MonthlyAttendanceDetails";
import MonthlyAttendanceStats from "./MonthlyAttendanceStats";
import type { MonthlySummaryResponse, MonthlyViewData } from "./monthlyAttendanceTypes";
import { aggregateMonthly, weekdayDates } from "./monthlyAttendanceUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
function currentMonth() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; }
function getAuthHeaders(): HeadersInit { const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken"); return token ? { Authorization: `Bearer ${token}` } : {}; }
function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export default function MonthlyAttendanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [data, setData] = useState<MonthlyViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const handleMonthChange = (event: Event) => setSelectedMonth((event as CustomEvent<{ month: string }>).detail.month);
    window.addEventListener("attendance:monthly-change", handleMonthChange);
    return () => window.removeEventListener("attendance:monthly-change", handleMonthChange);
  }, []);

  useEffect(() => { window.dispatchEvent(new CustomEvent("attendance:monthly-sync", { detail: { month: selectedMonth } })); }, [selectedMonth]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const dates = weekdayDates(selectedMonth);
        const headers = getAuthHeaders();
        const [summaryResponse, employeesResponse, departmentsResponse, dailyResponses] = await Promise.all([
          fetch(`${API_BASE_URL}/attendances/monthly-summary?yearMonth=${selectedMonth}`, { headers }),
          fetch(`${API_BASE_URL}/employees?page=0&size=1000`),
          fetch(`${API_BASE_URL}/departments`),
          Promise.all(dates.map((date) => fetch(`${API_BASE_URL}/attendances?date=${date}`, { headers }))),
        ]);
        if (!summaryResponse.ok || !employeesResponse.ok || !departmentsResponse.ok || dailyResponses.some((response) => !response.ok)) throw new Error("request failed");
        const [summaries, employeePage] = await Promise.all([summaryResponse.json() as Promise<MonthlySummaryResponse[]>, employeesResponse.json() as Promise<EmployeePage>]);
        await departmentsResponse.json() as Department[];
        const dailyData = await Promise.all(dailyResponses.map((response) => response.json() as Promise<AttendanceResponse[]>));
        const byDate = new Map(dates.map((date, index) => [date, Array.isArray(dailyData[index]) ? dailyData[index] : []]));
        const activeEmployees = (employeePage.content ?? []).filter((employee) => employee.employeeStatusCode === "ACTIVE");
        if (!cancelled) setData(aggregateMonthly(selectedMonth, activeEmployees, Array.isArray(summaries) ? summaries : [], byDate));
      } catch { if (!cancelled) { setData(null); setError("월간 근태 정보를 불러오지 못했습니다."); } }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [retryKey, selectedMonth]);

  const reportRows = useMemo(() => data?.employees ?? [], [data]);
  const exportReport = useCallback(() => {
    const headers = ["직원명","부서","직급","정상출근일","지각횟수","결근횟수","휴가일수","초과근무시간","출근율"];
    const rows = reportRows.map((row) => [row.employeeName, row.departmentName, row.positionName, row.normalDays, row.lateCount, row.absentCount, row.leaveDays, row.overtimeMinutes === null ? "-" : (row.overtimeMinutes / 60).toFixed(1), row.attendanceRate === null ? "-" : `${row.attendanceRate}%`]);
    const blob = new Blob([`\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `monthly-attendance-${selectedMonth}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }, [reportRows, selectedMonth]);

  useEffect(() => { const handleReport = () => exportReport(); window.addEventListener("attendance:monthly-report", handleReport); return () => window.removeEventListener("attendance:monthly-report", handleReport); }, [exportReport]);

  return <div className="mx-auto max-w-[1600px] space-y-4 pb-8">{error && <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => setRetryKey((key) => key + 1)} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 font-semibold hover:bg-rose-50">재시도</button></div>}<MonthlyAttendanceStats data={data} loading={loading} /><div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"><DailyAttendanceTrend month={selectedMonth} data={data?.trend ?? []} loading={loading} /><MonthlyAttendanceDonut data={data} loading={loading} /></div><div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px]"><DepartmentAttendanceRates data={data?.departments ?? []} /><EmployeeMonthlySummary rows={data?.employees ?? []} /><AttendanceWarningEmployees rows={data?.employees ?? []} /></div></div>;
}

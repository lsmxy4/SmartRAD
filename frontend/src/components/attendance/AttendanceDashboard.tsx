"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AttendanceSidePanel from "./AttendanceSidePanel";
import AttendanceStats from "./AttendanceStats";
import AttendanceTable from "./AttendanceTable";
import type { AttendanceResponse, AttendanceRow, Department, EmployeePage, EmployeeSummary } from "./types";
import { attendanceStatusLabel, normalizeAttendanceStatus } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function localDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }
function timeLabel(value: string | null) { return value?.match(/T(\d{2}:\d{2})/)?.[1] ?? "-"; }
function workLabel(value: number | null) { return value === null ? "-" : `${Math.floor(value / 60)}h ${value % 60}m`; }

export default function AttendanceDashboard() {
  const [date, setDate] = useState(localDateString);
  const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredRows, setFilteredRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [attendanceRes, employeesRes, departmentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/attendances?date=${date}`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/employees?page=0&size=1000`),
          fetch(`${API_BASE_URL}/departments`),
        ]);
        if (!attendanceRes.ok || !employeesRes.ok || !departmentsRes.ok) throw new Error("request failed");
        const [attendanceData, employeeData, departmentData] = await Promise.all([
          attendanceRes.json() as Promise<AttendanceResponse[]>, employeesRes.json() as Promise<EmployeePage>, departmentsRes.json() as Promise<Department[]>,
        ]);
        if (!cancelled) { setAttendance(Array.isArray(attendanceData) ? attendanceData : []); setEmployees(employeeData.content ?? []); setDepartments(Array.isArray(departmentData) ? departmentData : []); setLastUpdated(new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())); }
      } catch {
        if (!cancelled) { setAttendance([]); setEmployees([]); setDepartments([]); setError("근태 정보를 불러오지 못했습니다."); }
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [date]);

  const rows = useMemo(() => {
    const employeeMap = new Map(employees.map((employee) => [employee.employeeId, employee]));
    return attendance.map((item): AttendanceRow => {
      const employee = employeeMap.get(item.employeeId);
      return { ...item, employeeNo: employee?.employeeNo ?? null, employeeName: item.employeeName || employee?.name || "미확인", departmentName: employee?.departmentName ?? null, positionName: employee?.positionName ?? null, normalizedStatus: normalizeAttendanceStatus(item.attendanceStatusCode) };
    });
  }, [attendance, employees]);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.employeeStatusCode === "ACTIVE"), [employees]);
  const counts = useMemo(() => ({
    totalEmployees: employees.length,
    normal: rows.filter((row) => row.normalizedStatus === "normal").length,
    late: rows.filter((row) => row.normalizedStatus === "late").length,
    absent: rows.filter((row) => row.normalizedStatus === "absent").length,
    leave: rows.filter((row) => row.normalizedStatus === "leave").length,
  }), [employees.length, rows]);
  const handleFilteredRowsChange = useCallback((nextRows: AttendanceRow[]) => setFilteredRows(nextRows), []);

  const exportCsv = useCallback(() => {
    const headers = ["직원번호","직원명","부서","직급","근태일","출근시간","퇴근시간","근무시간","상태","비고"];
    const lines = filteredRows.map((row) => [row.employeeNo || "-", row.employeeName, row.departmentName || "-", row.positionName || "-", row.workDate, timeLabel(row.checkInTime), timeLabel(row.checkOutTime), workLabel(row.workMinutes), attendanceStatusLabel(row), "-"]);
    const csv = `\uFEFF${[headers, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `attendance-${date}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }, [date, filteredRows]);
  const registerNotice = useCallback(() => window.alert("근태 등록 기능 준비 중입니다."), []);

  useEffect(() => {
    const handleExportEvent = () => exportCsv();
    const handleRegisterEvent = () => registerNotice();

    window.addEventListener("attendance:export", handleExportEvent);
    window.addEventListener("attendance:register", handleRegisterEvent);

    return () => {
      window.removeEventListener("attendance:export", handleExportEvent);
      window.removeEventListener("attendance:register", handleRegisterEvent);
    };
  }, [exportCsv, registerNotice]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <AttendanceStats counts={counts} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <AttendanceTable rows={rows} departments={departments} date={date} loading={loading} error={error} onDateChange={setDate} onFilteredRowsChange={handleFilteredRowsChange} />
        <AttendanceSidePanel counts={{ ...counts, totalEmployees: activeEmployees.length }} lastUpdated={lastUpdated} onRegister={registerNotice} />
      </div>
    </div>
  );
}

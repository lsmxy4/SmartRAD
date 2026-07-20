"use client";

import {
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
const pageSize = 10;

interface PayrollResponse {
  payrollId: number;
  employeeId: number;
  employeeNameSnapshot: string;
  departmentNameSnapshot: string | null;
  positionNameSnapshot: string | null;
  payrollYearMonth: string;
  paymentDate: string | null;
  totalPayAmount: number | null;
  totalDeductionAmount: number | null;
  realPayAmount: number | null;
  payrollStatusCode: string;
}

interface EmployeeResponse {
  employeeId: number;
  employeeNo: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
}

interface PayrollDetailItem {
  payrollDetailId: number;
  payrollItemMasterId: number | null;
  itemName: string;
  itemTypeCode: "EARNING" | "DEDUCTION";
  amount: number;
}

interface PayrollDetailedResponse {
  payroll: PayrollResponse;
  details: PayrollDetailItem[];
}

interface PayrollBulkResult {
  payrollId: number;
  success: boolean;
  failureReason: string | null;
}

interface ApiErrorBody {
  code: string;
  message: string;
  timestamp: string;
  fieldErrors: unknown;
}

type PaymentStatus = "지급완료" | "지급대기" | "지급보류" | "지급실패";
type AccountStatus = "정상" | "미등록";

type PaymentRow = {
  payrollId: number;
  employeeNo: string;
  name: string;
  department: string;
  grossPay: number;
  deduction: number;
  netPay: number;
  bankName: string;
  accountNumber: string;
  depositor: string;
  paymentDate: string;
  accountStatus: AccountStatus;
  paymentStatus: PaymentStatus;
  processedAt: string;
};

type FilterKey =
  | "payrollMonth"
  | "department"
  | "paymentStatus"
  | "accountStatus";
type Filters = Record<FilterKey, string> & { keyword: string };

const initialFilters: Filters = {
  payrollMonth: "전체",
  department: "전체",
  paymentStatus: "전체",
  accountStatus: "전체",
  keyword: "",
};

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCurrency(value: number | null | undefined) {
  return `${Math.round(value ?? 0).toLocaleString("ko-KR")}원`;
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");
  return year && month ? `${year}년 ${Number(month)}월` : value;
}

function toPaymentStatus(status: string): PaymentStatus {
  if (status === "PAID") return "지급완료";
  if (status === "FAILED") return "지급실패";
  if (status === "HOLD") return "지급보류";
  return "지급대기";
}

async function extractErrorMessage(res: Response, fallback: string) {
  try {
    const body = (await res.json()) as Partial<ApiErrorBody>;
    if (body && typeof body.message === "string" && body.message.length > 0) {
      return body.message;
    }
  } catch {
    // ignore JSON parse failure and fall back to the default message
  }
  return fallback;
}

function maskAccount(accountNumber: string | null | undefined) {
  if (!accountNumber) return "-";
  const compact = accountNumber.replace(/\s/g, "");
  if (compact.length <= 6) return compact;
  return `${compact.slice(0, 3)}-***-${compact.slice(-6)}`;
}

function toRow(
  payroll: PayrollResponse,
  employee: EmployeeResponse | undefined,
): PaymentRow {
  const paymentStatus = toPaymentStatus(payroll.payrollStatusCode);
  const accountStatus: AccountStatus =
    employee?.bankName && employee.accountNumber ? "정상" : "미등록";

  return {
    payrollId: payroll.payrollId,
    employeeNo: employee?.employeeNo ?? `#${payroll.employeeId}`,
    name: payroll.employeeNameSnapshot,
    department: payroll.departmentNameSnapshot ?? "미지정",
    grossPay: Number(payroll.totalPayAmount ?? 0),
    deduction: Number(payroll.totalDeductionAmount ?? 0),
    netPay: Number(payroll.realPayAmount ?? 0),
    bankName: employee?.bankName ?? "-",
    accountNumber: maskAccount(employee?.accountNumber),
    depositor: employee?.accountHolder ?? payroll.employeeNameSnapshot,
    paymentDate: payroll.paymentDate ?? "-",
    accountStatus,
    paymentStatus: accountStatus === "미등록" ? "지급실패" : paymentStatus,
    processedAt:
      paymentStatus === "지급완료"
        ? `${payroll.paymentDate ?? "-"} 09:12`
        : "-",
  };
}

function statusPillClass(status: PaymentStatus) {
  switch (status) {
    case "지급완료":
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
    case "지급실패":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "지급보류":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    default:
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  }
}

function accountPillClass(status: AccountStatus) {
  return status === "정상"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-orange-50 text-orange-700 ring-orange-200";
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export default function PayrollProcessPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingAll, setProcessingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState<PayrollDetailedResponse | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshRows = () => setRefreshKey((key) => key + 1);

  useEffect(() => {
    const fetchPayrolls = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const res = await fetch(`${API_BASE_URL}/payrolls`, { headers: authHeaders() });
        if (!res.ok) throw new Error("급여 지급 데이터를 불러오지 못했습니다.");
        const payrolls = (await res.json()) as PayrollResponse[];
        const employees = await Promise.all(
          payrolls.map(async ({ employeeId }) => {
            const employeeRes = await fetch(
              `${API_BASE_URL}/employees/${employeeId}`,
            );
            if (!employeeRes.ok) return undefined;
            return (await employeeRes.json()) as EmployeeResponse;
          }),
        );
        const employeeMap = new Map(
          employees
            .filter((employee): employee is EmployeeResponse =>
              Boolean(employee),
            )
            .map((employee) => [employee.employeeId, employee]),
        );

        setRows(
          payrolls.map((payroll) =>
            toRow(payroll, employeeMap.get(payroll.employeeId)),
          ),
        );
      } catch (error) {
        console.error("Failed to fetch payroll payment rows", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "급여 지급 데이터를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, [refreshKey]);

  const payrollMonths = useMemo(
    () => ["전체", ...new Set(rows.map((row) => row.paymentDate.slice(0, 7)))],
    [rows],
  );
  const departments = useMemo(
    () => ["전체", ...new Set(rows.map((row) => row.department))],
    [rows],
  );

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesMonth =
        appliedFilters.payrollMonth === "전체" ||
        row.paymentDate.startsWith(appliedFilters.payrollMonth);
      const matchesDepartment =
        appliedFilters.department === "전체" ||
        row.department === appliedFilters.department;
      const matchesPayment =
        appliedFilters.paymentStatus === "전체" ||
        row.paymentStatus === appliedFilters.paymentStatus;
      const matchesAccount =
        appliedFilters.accountStatus === "전체" ||
        row.accountStatus === appliedFilters.accountStatus;
      const matchesKeyword =
        keyword.length === 0 ||
        row.employeeNo.toLowerCase().includes(keyword) ||
        row.name.toLowerCase().includes(keyword);

      return (
        matchesMonth &&
        matchesDepartment &&
        matchesPayment &&
        matchesAccount &&
        matchesKeyword
      );
    });
  }, [appliedFilters, rows]);

  const completedRows = rows.filter((row) => row.paymentStatus === "지급완료");
  const waitingRows = rows.filter((row) => row.paymentStatus === "지급대기");
  const holdRows = rows.filter((row) => row.paymentStatus === "지급보류");
  const failedRows = rows.filter((row) => row.paymentStatus === "지급실패");
  const totalExpectedAmount = rows.reduce((sum, row) => sum + row.netPay, 0);
  const completedAmount = completedRows.reduce(
    (sum, row) => sum + row.netPay,
    0,
  );
  const waitingAmount = waitingRows.reduce((sum, row) => sum + row.netPay, 0);
  const holdAmount = holdRows.reduce((sum, row) => sum + row.netPay, 0);
  const failedAmount = failedRows.reduce((sum, row) => sum + row.netPay, 0);
  const totalPages = Math.max(Math.ceil(filteredRows.length / pageSize), 1);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allPageSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row) => selectedIds.has(row.payrollId));

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  const movePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const toggleRowSelected = (payrollId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(payrollId)) {
        next.delete(payrollId);
      } else {
        next.add(payrollId);
      }
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allPageSelected) {
        paginatedRows.forEach((row) => next.delete(row.payrollId));
      } else {
        paginatedRows.forEach((row) => next.add(row.payrollId));
      }
      return next;
    });
  };

  const markAsPaid = async (payrollId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/payrolls/${payrollId}/pay`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("지급 처리에 실패했습니다.");
      setRows((current) =>
        current.map((row) =>
          row.payrollId === payrollId
            ? {
                ...row,
                paymentStatus: "지급완료",
                processedAt: `${row.paymentDate} 09:12`,
              }
            : row,
        ),
      );
    } catch (error) {
      console.error("Failed to mark payroll as paid", error);
      alert(
        error instanceof Error ? error.message : "지급 처리에 실패했습니다.",
      );
    }
  };

  const runBulkPay = async () => {
    const targets = rows.filter((row) => row.paymentStatus === "지급대기");
    if (targets.length === 0) {
      window.alert("지급 대기 중인 급여가 없습니다.");
      return;
    }
    if (!window.confirm(`지급 대기 중인 ${targets.length}명에게 급여를 지급 처리하시겠습니까?`)) return;

    setProcessingAll(true);
    let succeeded = 0;
    let failed = 0;
    for (const target of targets) {
      try {
        const res = await fetch(`${API_BASE_URL}/payrolls/${target.payrollId}/pay`, { method: "PATCH", headers: authHeaders() });
        if (!res.ok) throw new Error();
        succeeded++;
      } catch {
        failed++;
      }
    }
    setRows((current) =>
      current.map((row) =>
        row.paymentStatus === "지급대기"
          ? { ...row, paymentStatus: "지급완료", processedAt: `${row.paymentDate} 09:12` }
          : row,
      ),
    );
    setProcessingAll(false);
    window.alert(`급여 지급 처리 완료: 성공 ${succeeded}명${failed > 0 ? `, 실패 ${failed}명` : ""}`);
  };

  const paySelected = async () => {
    const targets = rows.filter(
      (row) => selectedIds.has(row.payrollId) && row.paymentStatus === "지급대기",
    );
    if (targets.length === 0) {
      window.alert("지급 대기 상태로 선택된 직원이 없습니다.");
      return;
    }
    if (
      !window.confirm(
        `선택한 ${targets.length}명에게 급여를 지급 처리하시겠습니까?`,
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payrolls/bulk-pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          payrollIds: targets.map((target) => target.payrollId),
        }),
      });
      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, "선택 지급 처리에 실패했습니다."),
        );
      }
      const results = (await res.json()) as PayrollBulkResult[];
      const succeeded = results.filter((result) => result.success).length;
      const failed = results.length - succeeded;
      window.alert(
        `선택 지급 처리 완료: 성공 ${succeeded}명${failed > 0 ? `, 실패 ${failed}명` : ""}`,
      );
      setSelectedIds(new Set());
      refreshRows();
    } catch (error) {
      console.error("Failed to bulk pay selected payrolls", error);
      window.alert(
        error instanceof Error ? error.message : "선택 지급 처리에 실패했습니다.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const holdSelected = async () => {
    const targets = rows.filter(
      (row) => selectedIds.has(row.payrollId) && row.paymentStatus !== "지급완료",
    );
    if (targets.length === 0) {
      window.alert("지급 보류로 전환할 수 있는 선택 항목이 없습니다.");
      return;
    }
    if (
      !window.confirm(`선택한 ${targets.length}명을 지급 보류 처리하시겠습니까?`)
    )
      return;

    setActionLoading(true);
    let succeeded = 0;
    const failures: string[] = [];
    for (const target of targets) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/payrolls/${target.payrollId}/hold`,
          { method: "PATCH", headers: authHeaders() },
        );
        if (!res.ok) {
          throw new Error(
            await extractErrorMessage(res, "지급 보류 처리에 실패했습니다."),
          );
        }
        succeeded++;
      } catch (error) {
        failures.push(
          `${target.name}: ${error instanceof Error ? error.message : "지급 보류 처리에 실패했습니다."}`,
        );
      }
    }
    setActionLoading(false);
    window.alert(
      `지급 보류 처리 완료: 성공 ${succeeded}명${failures.length > 0 ? `, 실패 ${failures.length}명\n${failures.join("\n")}` : ""}`,
    );
    setSelectedIds(new Set());
    refreshRows();
  };

  const reprocessFailedSelected = async () => {
    const targets = rows.filter(
      (row) => selectedIds.has(row.payrollId) && row.paymentStatus === "지급실패",
    );
    if (targets.length === 0) {
      window.alert("재처리할 지급 실패 건이 선택되지 않았습니다.");
      return;
    }
    if (
      !window.confirm(
        `선택한 ${targets.length}명의 실패 건을 재처리하시겠습니까?`,
      )
    )
      return;

    setActionLoading(true);
    let succeeded = 0;
    const failures: string[] = [];
    for (const target of targets) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/payrolls/${target.payrollId}/pay`,
          { method: "PATCH", headers: authHeaders() },
        );
        if (!res.ok) {
          throw new Error(await extractErrorMessage(res, "재처리에 실패했습니다."));
        }
        succeeded++;
      } catch (error) {
        failures.push(
          `${target.name}: ${error instanceof Error ? error.message : "재처리에 실패했습니다."}`,
        );
      }
    }
    setActionLoading(false);
    window.alert(
      `재처리 완료: 성공 ${succeeded}명${failures.length > 0 ? `, 실패 ${failures.length}명\n${failures.join("\n")}` : ""}`,
    );
    setSelectedIds(new Set());
    refreshRows();
  };

  const openPayrollDetail = async (payrollId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailData(null);
    try {
      const res = await fetch(`${API_BASE_URL}/payrolls/${payrollId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, "상세 정보를 불러오지 못했습니다."),
        );
      }
      const data = (await res.json()) as PayrollDetailedResponse;
      setDetailData(data);
    } catch (error) {
      console.error("Failed to load payroll detail", error);
      setDetailError(
        error instanceof Error ? error.message : "상세 정보를 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closePayrollDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
    setDetailError("");
  };

  const exportTransferFile = () => {
    const targets = filteredRows.filter((row) => row.paymentStatus === "지급대기");
    if (targets.length === 0) {
      window.alert("이체 파일로 내보낼 지급 대기 내역이 없습니다.");
      return;
    }
    const headers = ["사번", "성명", "은행", "계좌번호", "예금주", "실지급액"];
    const lines = targets.map((row) => [row.employeeNo, row.name, row.bankName, row.accountNumber, row.depositor, row.netPay]);
    const csv = `﻿${[headers, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `payroll-transfer-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      title: "지급 대상",
      value: `${rows.length.toLocaleString("ko-KR")}명`,
      description: "계산 완료 기준",
      icon: UserGroupIcon,
      className: "border-slate-200 bg-white",
      iconClassName: "bg-slate-50 text-slate-500",
      valueClassName: "text-slate-900",
    },
    {
      title: "지급 예정액",
      value: formatCurrency(totalExpectedAmount),
      description: "실지급액 합계",
      icon: BanknotesIcon,
      className: "border-slate-200 bg-white",
      iconClassName: "bg-emerald-50 text-emerald-600",
      valueClassName: "text-slate-900",
    },
    {
      title: "지급 완료",
      value: `${completedRows.length.toLocaleString("ko-KR")}명`,
      description: formatCurrency(completedAmount),
      icon: CheckCircleIcon,
      className: "border-teal-200 bg-teal-50",
      iconClassName: "bg-teal-100 text-teal-600",
      valueClassName: "text-teal-600",
    },
    {
      title: "지급 대기",
      value: `${waitingRows.length.toLocaleString("ko-KR")}명`,
      description: formatCurrency(waitingAmount),
      icon: ClockIcon,
      className: "border-indigo-200 bg-indigo-50",
      iconClassName: "bg-indigo-100 text-indigo-600",
      valueClassName: "text-indigo-600",
    },
    {
      title: "지급 보류",
      value: `${holdRows.length.toLocaleString("ko-KR")}명`,
      description: formatCurrency(holdAmount),
      icon: ExclamationTriangleIcon,
      className: "border-violet-200 bg-violet-50",
      iconClassName: "bg-violet-100 text-violet-600",
      valueClassName: "text-violet-600",
    },
    {
      title: "지급 실패",
      value: `${failedRows.length.toLocaleString("ko-KR")}명`,
      description: "계좌정보 확인 필요",
      icon: XCircleIcon,
      className: "border-orange-200 bg-orange-50",
      iconClassName: "bg-orange-100 text-orange-600",
      valueClassName: "text-orange-600",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">급여 지급 처리</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>급여관리</span>
            <span>›</span>
            <span className="font-medium text-indigo-600">급여 지급 처리</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportTransferFile}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4" /> 이체 파일 생성
          </button>
          <button
            type="button"
            onClick={runBulkPay}
            disabled={processingAll}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PaperAirplaneIcon className="h-4 w-4" /> {processingAll ? "처리 중..." : "급여 지급 실행"}
          </button>
        </div>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "귀속연월",
              rows[0] ? formatMonth(rows[0].paymentDate.slice(0, 7)) : "-",
              CalendarDaysIcon,
            ],
            ["지급예정일", rows[0]?.paymentDate ?? "-", CalendarDaysIcon],
            ["지급방식", "계좌이체", BanknotesIcon],
            ["지급대상", "계산 완료 직원", UserGroupIcon],
          ].map(([label, value, Icon]) => (
            <div key={String(label)}>
              <p className="text-xs font-semibold text-slate-400">
                {String(label)}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Icon className="h-4 w-4 text-slate-500" /> {String(value)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-600">
            ● 지급 대기
          </span>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <AdjustmentsHorizontalIcon className="h-4 w-4" /> 기준 수정
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map(({ icon: Icon, ...card }) => (
          <article
            key={card.title}
            className={`rounded-xl border p-5 shadow-sm ${card.className}`}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-slate-500">
                {card.title}
              </p>
              <span className={`rounded-xl p-2 ${card.iconClassName}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p
              className={`mt-3 text-3xl font-extrabold ${card.valueClassName}`}
            >
              {card.value}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        <span className="inline-flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          계좌정보 확인이 필요한 직원이{" "}
          {failedRows.length.toLocaleString("ko-KR")}명 있습니다.
          <span className="hidden text-xs font-medium md:inline">
            계좌 오류가 있는 직원은 급여 지급 대상에서 자동 제외되었습니다.
          </span>
        </span>
        <button className="font-bold text-orange-600 hover:text-orange-700">
          실패 대상 보기 ›
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_1.4fr_auto_auto]">
          {[
            ["payrollMonth", "귀속연월", payrollMonths],
            ["department", "부서", departments],
            [
              "paymentStatus",
              "지급상태",
              ["전체", "지급완료", "지급대기", "지급보류", "지급실패"],
            ],
            ["accountStatus", "계좌상태", ["전체", "정상", "미등록"]],
          ].map(([key, label, options]) => (
            <label
              key={String(key)}
              className="space-y-1 text-sm font-semibold text-slate-700"
            >
              <span>{String(label)}</span>
              <select
                value={draftFilters[key as FilterKey]}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    [key as FilterKey]: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:border-indigo-400"
              >
                {(options as string[]).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            <span>사번 또는 사원명</span>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={draftFilters.keyword}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    keyword: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
                placeholder="사번 또는 사원명 검색"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="self-end rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="self-end rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            조회
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">직원별 급여 지급 현황</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              총 {rows.length.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-600">
              지급 완료 {completedRows.length.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              지급 대기 {waitingRows.length.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">
              지급 보류 {holdRows.length.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
              지급 실패 {failedRows.length.toLocaleString("ko-KR")}명
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={paySelected}
              disabled={actionLoading}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              선택 직원 지급 처리
            </button>
            <button
              type="button"
              onClick={holdSelected}
              disabled={actionLoading}
              className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              지급 보류
            </button>
            <button
              type="button"
              onClick={reprocessFailedSelected}
              disabled={actionLoading}
              className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              실패 건 재처리
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllOnPage}
                    aria-label="전체 선택"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
                {[
                  "사번",
                  "성명",
                  "부서",
                  "지급총액",
                  "공제합계",
                  "실지급액",
                  "은행",
                  "계좌번호",
                  "예금주",
                  "지급예정일",
                  "계좌상태",
                  "지급상태",
                  "처리일시",
                  "관리",
                ].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={15}
                    className="px-4 py-12 text-center font-semibold text-slate-400"
                  >
                    백엔드에서 급여 지급 데이터를 불러오는 중입니다.
                  </td>
                </tr>
              )}
              {!loading && errorMessage && (
                <tr>
                  <td
                    colSpan={15}
                    className="px-4 py-12 text-center font-semibold text-rose-500"
                  >
                    {errorMessage}
                  </td>
                </tr>
              )}
              {!loading &&
                !errorMessage &&
                paginatedRows.map((row) => (
                  <tr
                    key={row.payrollId}
                    className={
                      row.paymentStatus === "지급실패"
                        ? "bg-orange-50/60"
                        : row.paymentStatus === "지급대기"
                          ? "bg-indigo-50/60"
                          : row.paymentStatus === "지급보류"
                            ? "bg-violet-50/60"
                            : "bg-white"
                    }
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.payrollId)}
                        onChange={() => toggleRowSelected(row.payrollId)}
                        aria-label={`${row.name} 선택`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.employeeNo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">
                      {row.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {formatCurrency(row.grossPay)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {formatCurrency(row.deduction)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-teal-600">
                      {formatCurrency(row.netPay)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.bankName}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 ${row.accountStatus === "미등록" ? "font-bold text-orange-600" : "text-slate-600"}`}
                    >
                      {row.accountNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.depositor}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.paymentDate}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${accountPillClass(row.accountStatus)}`}
                      >
                        ● {row.accountStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusPillClass(row.paymentStatus)}`}
                      >
                        ● {row.paymentStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.processedAt}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.paymentStatus === "지급대기" ? (
                        <button
                          type="button"
                          onClick={() => markAsPaid(row.payrollId)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          지급 처리
                        </button>
                      ) : row.paymentStatus === "지급실패" ? (
                        <button
                          type="button"
                          onClick={() => markAsPaid(row.payrollId)}
                          className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-bold text-orange-600"
                        >
                          재처리
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openPayrollDetail(row.payrollId)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          상세
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              {!loading && !errorMessage && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={15}
                    className="px-4 py-12 text-center font-semibold text-slate-400"
                  >
                    조회 조건에 맞는 급여 지급 대상이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-emerald-200 bg-emerald-50 font-extrabold text-slate-900">
                <td className="px-4 py-5 text-emerald-700" colSpan={7}>
                  지급 금액 요약
                </td>
                <td
                  className="whitespace-nowrap px-4 py-5 text-right"
                  colSpan={2}
                >
                  전체 지급 예정액
                  <br />
                  <span className="text-slate-900">
                    {formatCurrency(totalExpectedAmount)}
                  </span>
                </td>
                <td
                  className="whitespace-nowrap px-4 py-5 text-right"
                  colSpan={2}
                >
                  지급 완료액
                  <br />
                  <span className="text-teal-600">
                    {formatCurrency(completedAmount)}
                  </span>
                </td>
                <td
                  className="whitespace-nowrap px-4 py-5 text-right"
                  colSpan={2}
                >
                  지급 대기액
                  <br />
                  <span className="text-indigo-600">
                    {formatCurrency(waitingAmount)}
                  </span>
                </td>
                <td
                  className="whitespace-nowrap px-4 py-5 text-right"
                  colSpan={2}
                >
                  지급 실패액
                  <br />
                  <span className="text-orange-600">
                    {formatCurrency(failedAmount)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
          <span>
            총 {filteredRows.length}명 조회 · {currentPage}/{totalPages} 페이지
            · {selectedIds.size}명 선택
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => movePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => movePage(page)}
                  className={`h-8 w-8 rounded-lg border text-sm font-semibold ${page === currentPage ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500"}`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => movePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  급여 지급 상세
                </h3>
                {detailData && (
                  <p className="mt-1 text-sm text-slate-500">
                    {detailData.payroll.employeeNameSnapshot} ·{" "}
                    {formatMonth(detailData.payroll.payrollYearMonth)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closePayrollDetail}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>

            <div className="mt-4">
              {detailLoading && (
                <p className="py-8 text-center text-sm font-semibold text-slate-400">
                  상세 정보를 불러오는 중입니다.
                </p>
              )}
              {!detailLoading && detailError && (
                <p className="py-8 text-center text-sm font-semibold text-rose-500">
                  {detailError}
                </p>
              )}
              {!detailLoading && !detailError && detailData && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        부서 / 직급
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {detailData.payroll.departmentNameSnapshot ?? "미지정"}{" "}
                        {detailData.payroll.positionNameSnapshot ?? ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        지급예정일
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {detailData.payroll.paymentDate ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        지급상태
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusPillClass(toPaymentStatus(detailData.payroll.payrollStatusCode))}`}
                      >
                        ● {toPaymentStatus(detailData.payroll.payrollStatusCode)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-bold text-slate-700">
                      지급 항목
                    </h4>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                        <tr>
                          <th className="px-3 py-2">구분</th>
                          <th className="px-3 py-2">항목명</th>
                          <th className="px-3 py-2 text-right">금액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailData.details.length === 0 && (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-3 py-6 text-center text-slate-400"
                            >
                              지급 항목 내역이 없습니다.
                            </td>
                          </tr>
                        )}
                        {detailData.details.map((detail) => (
                          <tr key={detail.payrollDetailId}>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                  detail.itemTypeCode === "EARNING"
                                    ? "bg-teal-50 text-teal-600"
                                    : "bg-orange-50 text-orange-600"
                                }`}
                              >
                                {detail.itemTypeCode === "EARNING"
                                  ? "지급"
                                  : "공제"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {detail.itemName}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">
                              {formatCurrency(detail.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        지급총액
                      </p>
                      <p className="mt-1 font-extrabold text-slate-900">
                        {formatCurrency(detailData.payroll.totalPayAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        공제합계
                      </p>
                      <p className="mt-1 font-extrabold text-slate-900">
                        {formatCurrency(
                          detailData.payroll.totalDeductionAmount,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        실지급액
                      </p>
                      <p className="mt-1 font-extrabold text-teal-600">
                        {formatCurrency(detailData.payroll.realPayAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
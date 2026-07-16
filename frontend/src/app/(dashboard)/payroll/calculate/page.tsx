"use client";

import {
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

interface PayrollResponse {
  payrollId: number;
  employeeId: number;
  employeeNameSnapshot: string;
  departmentNameSnapshot: string | null;
  positionNameSnapshot: string | null;
  payrollYearMonth: string;
  paymentDate: string;
  totalPayAmount: number | null;
  totalDeductionAmount: number | null;
  realPayAmount: number | null;
  payrollStatusCode: string;
}

type PayrollRow = {
  payrollId: number;
  employeeNo: string;
  name: string;
  department: string;
  position: string;
  basePay: string;
  allowance: string;
  bonus: string;
  grossPay: string;
  deduction: string;
  netPay: string;
  calcStatus: string;
  reviewStatus: string;
  reviewClassName: string;
  rowClassName: string;
  payrollMonth: string;
  paymentDate: string;
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");
  return year && month ? `${year}년 ${Number(month)}월` : value;
}

function statusText(status: string) {
  switch (status) {
    case "PAID":
      return "지급완료";
    case "CALCULATED":
      return "계산완료";
    default:
      return status || "계산 전";
  }
}

function toRow(payroll: PayrollResponse): PayrollRow {
  return {
    payrollId: payroll.payrollId,
    employeeNo: `#${payroll.employeeId}`,
    name: payroll.employeeNameSnapshot,
    department: payroll.departmentNameSnapshot ?? "미지정",
    position: payroll.positionNameSnapshot ?? "미지정",
    basePay: "-",
    allowance: "-",
    bonus: "-",
    grossPay: formatCurrency(payroll.totalPayAmount),
    deduction: formatCurrency(payroll.totalDeductionAmount),
    netPay: formatCurrency(payroll.realPayAmount),
    calcStatus: statusText(payroll.payrollStatusCode),
    reviewStatus: "정상",
    reviewClassName: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    rowClassName: "bg-white",
    payrollMonth: formatMonth(payroll.payrollYearMonth),
    paymentDate: payroll.paymentDate ?? "-",
  };
}

type FilterKey =
  | "payrollMonth"
  | "department"
  | "position"
  | "calcStatus"
  | "reviewStatus";

type Filters = Record<FilterKey, string> & { keyword: string };

const initialFilters: Filters = {
  payrollMonth: "전체",
  department: "전체",
  position: "전체",
  calcStatus: "전체",
  reviewStatus: "전체",
  keyword: "",
};

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollCalculatePage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPayrolls = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const res = await fetch(`${API_BASE_URL}/payrolls`, { headers: authHeaders() });
        if (!res.ok) throw new Error("급여 계산 결과를 불러오지 못했습니다.");
        const payrolls = (await res.json()) as PayrollResponse[];
        setPayrollRows(payrolls.map(toRow));
      } catch (error) {
        console.error("Failed to fetch payrolls", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "급여 계산 결과를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, [refreshKey]);

  const runCalculation = async () => {
    const input = window.prompt("급여를 계산할 연월을 입력하세요 (예: 2026-07)", currentYearMonth());
    if (!input) return;
    if (!/^\d{4}-\d{2}$/.test(input)) {
      window.alert("연월 형식이 올바르지 않습니다. 예: 2026-07");
      return;
    }

    setCalculating(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/payrolls/calculate-all?payrollYearMonth=${input}`,
        { method: "POST", headers: authHeaders() },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "급여 계산 실행에 실패했습니다.");
      }
      const result = (await res.json()) as { calculated: number; skipped: number };
      window.alert(`${input} 급여 계산 완료: ${result.calculated}명 계산, ${result.skipped}명 제외(기본급 미등록 또는 지급 완료)`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "급여 계산 실행에 실패했습니다.");
    } finally {
      setCalculating(false);
    }
  };

  const filterConfigs = useMemo<
    { key: FilterKey; label: string; options: string[] }[]
  >(
    () => [
      {
        key: "payrollMonth",
        label: "귀속연월",
        options: [
          "전체",
          ...Array.from(new Set(payrollRows.map((row) => row.payrollMonth))),
        ],
      },
      {
        key: "department",
        label: "부서",
        options: [
          "전체",
          ...Array.from(new Set(payrollRows.map((row) => row.department))),
        ],
      },
      {
        key: "position",
        label: "직급",
        options: [
          "전체",
          ...Array.from(new Set(payrollRows.map((row) => row.position))),
        ],
      },
      {
        key: "calcStatus",
        label: "계산상태",
        options: [
          "전체",
          ...Array.from(new Set(payrollRows.map((row) => row.calcStatus))),
        ],
      },
      {
        key: "reviewStatus",
        label: "검토상태",
        options: [
          "전체",
          ...Array.from(new Set(payrollRows.map((row) => row.reviewStatus))),
        ],
      },
    ],
    [payrollRows],
  );

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return payrollRows.filter((row) => {
      const matchesSelects = filterConfigs.every(({ key }) => {
        return (
          appliedFilters[key] === "전체" || row[key] === appliedFilters[key]
        );
      });
      const matchesKeyword =
        keyword.length === 0 ||
        row.employeeNo.toLowerCase().includes(keyword) ||
        row.name.toLowerCase().includes(keyword);

      return matchesSelects && matchesKeyword;
    });
  }, [appliedFilters, filterConfigs, payrollRows]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const completedCount = payrollRows.filter(
    (row) => row.calcStatus === "계산완료" || row.calcStatus === "지급완료",
  ).length;
  const reviewCount = payrollRows.filter(
    (row) => row.reviewStatus !== "정상",
  ).length;
  const pendingCount = Math.max(payrollRows.length - completedCount, 0);
  const totalGrossPay = payrollRows.reduce(
    (sum, row) => sum + Number(row.grossPay.replace(/[^0-9]/g, "")),
    0,
  );
  const totalDeduction = payrollRows.reduce(
    (sum, row) => sum + Number(row.deduction.replace(/[^0-9]/g, "")),
    0,
  );
  const totalNetPay = payrollRows.reduce(
    (sum, row) => sum + Number(row.netPay.replace(/[^0-9]/g, "")),
    0,
  );
  const periodInfo = [
    {
      label: "귀속연월",
      value: payrollRows[0]?.payrollMonth ?? "-",
      icon: CalendarDaysIcon,
    },
    {
      label: "지급일",
      value: payrollRows[0]?.paymentDate ?? "-",
      icon: BanknotesIcon,
    },
    {
      label: "근태 반영 기간",
      value: "백엔드 계산 기준",
      icon: CalendarDaysIcon,
    },
    {
      label: "계산 기준일",
      value: new Date().toISOString().slice(0, 10),
      icon: CalendarDaysIcon,
    },
  ];
  const summaryCards = [
    {
      title: "계산 대상",
      value: `${payrollRows.length.toLocaleString("ko-KR")}명`,
      description: "백엔드 급여대장 기준",
      icon: UserGroupIcon,
      className: "border-slate-200 bg-white",
      iconClassName: "bg-slate-50 text-slate-500",
      valueClassName: "text-slate-900",
    },
    {
      title: "계산 완료",
      value: `${completedCount.toLocaleString("ko-KR")}명`,
      description: `진행률 ${payrollRows.length ? ((completedCount / payrollRows.length) * 100).toFixed(1) : "0.0"}%`,
      icon: CheckCircleIcon,
      className: "border-indigo-200 bg-indigo-50",
      iconClassName: "bg-indigo-100 text-indigo-600",
      valueClassName: "text-indigo-600",
    },
    {
      title: "검토 필요",
      value: `${reviewCount.toLocaleString("ko-KR")}명`,
      description: "오류 및 누락 확인",
      icon: ExclamationTriangleIcon,
      className: "border-orange-200 bg-orange-50",
      iconClassName: "bg-orange-100 text-orange-600",
      valueClassName: "text-orange-600",
    },
    {
      title: "총 지급액",
      value: formatCurrency(totalGrossPay),
      description: "지급항목 합계",
      icon: BanknotesIcon,
      className: "border-slate-200 bg-white",
      iconClassName: "bg-emerald-50 text-emerald-600",
      valueClassName: "text-slate-900",
    },
    {
      title: "예상 실지급액",
      value: formatCurrency(totalNetPay),
      description: "공제 후 지급액",
      icon: BanknotesIcon,
      className: "border-teal-200 bg-teal-50",
      iconClassName: "bg-teal-100 text-teal-600",
      valueClassName: "text-teal-600",
    },
  ];
  const totals = {
    basePay: "-",
    allowance: "-",
    bonus: "-",
    grossPay: formatCurrency(totalGrossPay),
    deduction: formatCurrency(totalDeduction),
    netPay: formatCurrency(totalNetPay),
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">급여계산</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>급여관리</span>
            <span>›</span>
            <span className="font-medium text-indigo-600">급여계산</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
            <CheckCircleIcon className="h-4 w-4" />
            계산 결과 확정
          </button>
          <button
            type="button"
            onClick={runCalculation}
            disabled={calculating}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlayIcon className="h-4 w-4" />
            {calculating ? "계산 중..." : "급여 계산 실행"}
          </button>
        </div>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="grid flex-1 grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {periodInfo.map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-4 py-2 first:pl-0">
              <p className="text-xs font-semibold text-slate-400">{label}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Icon className="h-4 w-4 text-slate-500" />
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
            ● 계산 전
          </span>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            기준 수정
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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

      <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
        <span className="inline-flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          급여 계산 결과 중 확인이 필요한 직원이{" "}
          {reviewCount.toLocaleString("ko-KR")}명 있습니다.
          <span className="hidden text-xs font-medium md:inline">
            근태 누락 또는 급여 기준정보를 확인해주세요.
          </span>
        </span>
        <button className="font-bold text-orange-600 hover:text-orange-700">
          검토 대상 보기 ›
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_1.4fr_auto_auto]">
          {filterConfigs.map(({ key, label, options }) => (
            <label
              key={key}
              className="space-y-1 text-sm font-semibold text-slate-700"
            >
              <span>{label}</span>
              <select
                value={draftFilters[key]}
                onChange={(event) => updateFilter(key, event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:border-indigo-400"
              >
                {options.map((option) => (
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
                  updateFilter("keyword", event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setAppliedFilters(draftFilters);
                  }
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
            onClick={() => setAppliedFilters(draftFilters)}
            className="self-end rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            조회
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">직원별 급여 계산 결과</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              총 {payrollRows.length.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              계산 완료 {completedCount.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
              검토 필요 {reviewCount.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              계산 전 {pendingCount.toLocaleString("ko-KR")}명
            </span>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">
              선택 직원 재계산
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">
              계산 제외
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">
              검토 완료 처리
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                {[
                  "",
                  "사번",
                  "성명",
                  "부서",
                  "직급",
                  "기본급",
                  "수당 합계",
                  "상여금",
                  "지급 총액",
                  "공제 합계",
                  "실지급액",
                  "계산상태",
                  "검토상태",
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
                    colSpan={14}
                    className="px-4 py-12 text-center font-semibold text-slate-400"
                  >
                    백엔드에서 급여 계산 결과를 불러오는 중입니다.
                  </td>
                </tr>
              )}
              {!loading && errorMessage && (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-12 text-center font-semibold text-rose-500"
                  >
                    {errorMessage}
                  </td>
                </tr>
              )}
              {!loading &&
                !errorMessage &&
                filteredRows.map((row) => (
                  <tr key={row.payrollId} className={row.rowClassName}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
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
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.position}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {row.basePay}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {row.allowance}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">
                      {row.bonus}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-slate-900">
                      {row.grossPay}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {row.deduction}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-teal-600">
                      {row.netPay}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${row.calcStatus === "계산완료" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-500 ring-slate-200"}`}
                      >
                        ● {row.calcStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${row.reviewClassName}`}
                      >
                        ● {row.reviewStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && !errorMessage && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-12 text-center font-semibold text-slate-400"
                  >
                    조회 조건에 맞는 급여 계산 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-extrabold text-slate-900">
                <td className="px-4 py-8" colSpan={5}>
                  합계
                </td>
                <td className="whitespace-nowrap px-4 py-8 text-right">
                  {totals.basePay}
                </td>
                <td className="whitespace-nowrap px-4 py-8 text-right">
                  {totals.allowance}
                </td>
                <td className="whitespace-nowrap px-4 py-8 text-right">
                  {totals.bonus}
                </td>
                <td className="whitespace-nowrap px-4 py-8 text-right text-indigo-600">
                  {totals.grossPay}
                </td>
                <td className="whitespace-nowrap px-4 py-8 text-right">
                  {totals.deduction}
                </td>
                <td className="whitespace-nowrap px-4 py-8 text-right text-teal-600">
                  {totals.netPay}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
          <span>총 {filteredRows.length}명 조회 · 0명 선택</span>
          <div className="flex gap-1">
            {["‹", "1", "2", "3", "›"].map((page) => (
              <button
                key={page}
                className={`h-8 w-8 rounded-lg border text-sm font-semibold ${page === "1" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500"}`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
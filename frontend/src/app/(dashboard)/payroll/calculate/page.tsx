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
import { useMemo, useState } from "react";

const periodInfo = [
  { label: "귀속연월", value: "2026년 7월", icon: CalendarDaysIcon },
  { label: "지급일", value: "2026-07-25", icon: BanknotesIcon },
  { label: "근태 반영 기간", value: "2026-06-21 ~ 2026-07-20", icon: CalendarDaysIcon },
  { label: "계산 기준일", value: "2026-07-14", icon: CalendarDaysIcon },
];

const summaryCards = [
  {
    title: "계산 대상",
    value: "248명",
    description: "2026년 7월 기준",
    icon: UserGroupIcon,
    className: "border-slate-200 bg-white",
    iconClassName: "bg-slate-50 text-slate-500",
    valueClassName: "text-slate-900",
  },
  {
    title: "계산 완료",
    value: "231명",
    description: "진행률 93.1%",
    icon: CheckCircleIcon,
    className: "border-indigo-200 bg-indigo-50",
    iconClassName: "bg-indigo-100 text-indigo-600",
    valueClassName: "text-indigo-600",
  },
  {
    title: "검토 필요",
    value: "3명",
    description: "오류 및 누락 확인",
    icon: ExclamationTriangleIcon,
    className: "border-orange-200 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-600",
    valueClassName: "text-orange-600",
  },
  {
    title: "총 지급액",
    value: "678,450,000원",
    description: "지급항목 합계",
    icon: BanknotesIcon,
    className: "border-slate-200 bg-white",
    iconClassName: "bg-emerald-50 text-emerald-600",
    valueClassName: "text-slate-900",
  },
  {
    title: "예상 실지급액",
    value: "606,280,000원",
    description: "공제 후 지급액",
    icon: BanknotesIcon,
    className: "border-teal-200 bg-teal-50",
    iconClassName: "bg-teal-100 text-teal-600",
    valueClassName: "text-teal-600",
  },
];

const payrollRows = [
  {
    employeeNo: "T0004",
    name: "민성",
    department: "IT본부",
    position: "사원",
    basePay: "4,166,667원",
    allowance: "250,000원",
    bonus: "0원",
    grossPay: "4,416,667원",
    deduction: "486,230원",
    netPay: "3,930,437원",
    calcStatus: "계산완료",
    reviewStatus: "정상",
    reviewClassName: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    rowClassName: "bg-white",
  },
  {
    employeeNo: "T9950",
    name: "동훈",
    department: "ERP개발팀",
    position: "차장",
    basePay: "3,750,000원",
    allowance: "840,000원",
    bonus: "500,000원",
    grossPay: "5,090,000원",
    deduction: "612,410원",
    netPay: "4,477,590원",
    calcStatus: "계산완료",
    reviewStatus: "정상",
    reviewClassName: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    rowClassName: "bg-white",
  },
  {
    employeeNo: "T8012",
    name: "예린",
    department: "인사팀",
    position: "대리",
    basePay: "3,200,000원",
    allowance: "350,000원",
    bonus: "0원",
    grossPay: "3,550,000원",
    deduction: "401,500원",
    netPay: "3,148,500원",
    calcStatus: "계산완료",
    reviewStatus: "근태 누락",
    reviewClassName: "bg-orange-50 text-orange-600 ring-orange-200",
    rowClassName: "bg-orange-50/70",
  },
  {
    employeeNo: "T0000",
    name: "리훈",
    department: "IT본부",
    position: "사원",
    basePay: "-",
    allowance: "-",
    bonus: "-",
    grossPay: "-",
    deduction: "-",
    netPay: "-",
    calcStatus: "계산 전",
    reviewStatus: "정보 누락",
    reviewClassName: "bg-orange-50 text-orange-600 ring-orange-200",
    rowClassName: "bg-white",
  },
];

const totals = {
  basePay: "552,300,000원",
  allowance: "76,150,000원",
  bonus: "50,000,000원",
  grossPay: "678,450,000원",
  deduction: "72,170,000원",
  netPay: "606,280,000원",
};

type FilterKey = "payrollMonth" | "department" | "position" | "calcStatus" | "reviewStatus";

type Filters = Record<FilterKey, string> & { keyword: string };

const initialFilters: Filters = {
  payrollMonth: "2026년 7월",
  department: "전체",
  position: "전체",
  calcStatus: "전체",
  reviewStatus: "전체",
  keyword: "",
};

const filterConfigs: { key: FilterKey; label: string; options: string[] }[] = [
  { key: "payrollMonth", label: "귀속연월", options: ["2026년 7월"] },
  { key: "department", label: "부서", options: ["전체", ...Array.from(new Set(payrollRows.map((row) => row.department)))] },
  { key: "position", label: "직급", options: ["전체", ...Array.from(new Set(payrollRows.map((row) => row.position)))] },
  { key: "calcStatus", label: "계산상태", options: ["전체", ...Array.from(new Set(payrollRows.map((row) => row.calcStatus)))] },
  { key: "reviewStatus", label: "검토상태", options: ["전체", ...Array.from(new Set(payrollRows.map((row) => row.reviewStatus)))] },
];

export default function PayrollCalculatePage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return payrollRows.filter((row) => {
      const matchesSelects = filterConfigs.every(({ key }) => {
        if (key === "payrollMonth") {
          return appliedFilters[key] === "2026년 7월";
        }
        return appliedFilters[key] === "전체" || row[key] === appliedFilters[key];
      });
      const matchesKeyword =
        keyword.length === 0 ||
        row.employeeNo.toLowerCase().includes(keyword) ||
        row.name.toLowerCase().includes(keyword);

      return matchesSelects && matchesKeyword;
    });
  }, [appliedFilters]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
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
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <PlayIcon className="h-4 w-4" />
            급여 계산 실행
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
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">● 계산 전</span>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            기준 수정
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map(({ icon: Icon, ...card }) => (
          <article key={card.title} className={`rounded-xl border p-5 shadow-sm ${card.className}`}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-slate-500">{card.title}</p>
              <span className={`rounded-xl p-2 ${card.iconClassName}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className={`mt-3 text-3xl font-extrabold ${card.valueClassName}`}>{card.value}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{card.description}</p>
          </article>
        ))}
      </section>

      <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
        <span className="inline-flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          급여 계산 결과 중 확인이 필요한 직원이 3명 있습니다.
          <span className="hidden text-xs font-medium md:inline">근태 누락 또는 급여 기준정보를 확인해주세요.</span>
        </span>
        <button className="font-bold text-orange-600 hover:text-orange-700">검토 대상 보기 ›</button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_1.4fr_auto_auto]">
          {filterConfigs.map(({ key, label, options }) => (
            <label key={key} className="space-y-1 text-sm font-semibold text-slate-700">
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
                onChange={(event) => updateFilter("keyword", event.target.value)}
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
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">총 248명</span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">계산 완료 231명</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">검토 필요 3명</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">계산 전 14명</span>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">선택 직원 재계산</button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">계산 제외</button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">검토 완료 처리</button>
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
                  <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.employeeNo} className={row.rowClassName}>
                  <td className="px-4 py-3"><input type="checkbox" className="h-4 w-4 rounded border-slate-300" /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.employeeNo}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.department}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.position}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">{row.basePay}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">{row.allowance}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">{row.bonus}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-slate-900">{row.grossPay}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">{row.deduction}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-teal-600">{row.netPay}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${row.calcStatus === "계산완료" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-500 ring-slate-200"}`}>● {row.calcStatus}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${row.reviewClassName}`}>● {row.reviewStatus}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">상세</button></td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center font-semibold text-slate-400">
                    조회 조건에 맞는 급여 계산 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-extrabold text-slate-900">
                <td className="px-4 py-8" colSpan={5}>합계</td>
                <td className="whitespace-nowrap px-4 py-8 text-right">{totals.basePay}</td>
                <td className="whitespace-nowrap px-4 py-8 text-right">{totals.allowance}</td>
                <td className="whitespace-nowrap px-4 py-8 text-right">{totals.bonus}</td>
                <td className="whitespace-nowrap px-4 py-8 text-right text-indigo-600">{totals.grossPay}</td>
                <td className="whitespace-nowrap px-4 py-8 text-right">{totals.deduction}</td>
                <td className="whitespace-nowrap px-4 py-8 text-right text-teal-600">{totals.netPay}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
          <span>총 {filteredRows.length}명 조회 · 0명 선택</span>
          <div className="flex gap-1">
            {["‹", "1", "2", "3", "›"].map((page) => (
              <button key={page} className={`h-8 w-8 rounded-lg border text-sm font-semibold ${page === "1" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500"}`}>{page}</button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
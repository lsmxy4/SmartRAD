"use client";

import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

const summaryCards = [
  {
    title: "급여 대상 직원",
    value: "248명",
    description: "재직자 기준",
    icon: UserGroupIcon,
    className: "border-gray-200 bg-white",
    iconClassName: "bg-slate-100 text-slate-600",
    valueClassName: "text-slate-900",
  },
  {
    title: "등록 완료",
    value: "231명",
    description: "등록률 93.1%",
    icon: CheckCircleIcon,
    className: "border-indigo-200 bg-indigo-50",
    iconClassName: "bg-indigo-100 text-indigo-600",
    valueClassName: "text-indigo-600",
  },
  {
    title: "미등록 직원",
    value: "17명",
    description: "정보 등록 필요",
    icon: UserMinusIcon,
    className: "border-orange-200 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-600",
    valueClassName: "text-orange-600",
  },
  {
    title: "이번 달 변경",
    value: "8명",
    description: "기본급 또는 수당 변경",
    icon: ArrowPathIcon,
    className: "border-gray-200 bg-white",
    iconClassName: "bg-emerald-50 text-emerald-600",
    valueClassName: "text-slate-900",
  },
];


const employees = [
  {
    employeeNo: "T0000",
    name: "리훈",
    department: "IT본부",
    position: "사원",
    payType: "월급",
    basePay: "미등록",
    allowance: "미등록",
    account: "미등록",
    registeredAt: "-",
    status: "미등록",
    statusClassName: "bg-orange-50 text-orange-600 ring-orange-200",
    rowClassName: "bg-orange-50/55",
    action: "등록",
  },
  {
    employeeNo: "T0004",
    name: "민성",
    department: "IT본부",
    position: "사원",
    payType: "연봉",
    basePay: "4,166,667원",
    allowance: "250,000원",
    account: "국민은행 123-***-456789",
    registeredAt: "2026-07-12",
    status: "등록완료",
    statusClassName: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rowClassName: "bg-white",
    action: "수정",
  },
  {
    employeeNo: "T9950",
    name: "동훈",
    department: "ERP개발팀",
    position: "차장",
    payType: "월급",
    basePay: "3,750,000원",
    allowance: "550,000원",
    account: "신한은행 110-***-987654",
    registeredAt: "2026-07-14",
    status: "등록완료",
    statusClassName: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rowClassName: "bg-emerald-50/70",
    action: "수정",
  },
  {
    employeeNo: "T8012",
    name: "예린",
    department: "인사팀",
    position: "대리",
    payType: "월급",
    basePay: "3,200,000원",
    allowance: "350,000원",
    account: "우리은행 1002-***-123456",
    registeredAt: "2026-07-10",
    status: "등록완료",
    statusClassName: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rowClassName: "bg-white",
    action: "수정",
  },
];

type FilterKey = "department" | "position" | "payType" | "status";

type Filters = Record<FilterKey, string> & { keyword: string };

const initialFilters: Filters = {
  department: "전체",
  position: "전체",
  payType: "전체",
  status: "전체",
  keyword: "",
};

const filterConfigs: { key: FilterKey; label: string }[] = [
  { key: "department", label: "부서" },
  { key: "position", label: "직급" },
  { key: "payType", label: "급여형태" },
  { key: "status", label: "등록상태" },
];

function getOptions(key: FilterKey) {
  return ["전체", ...Array.from(new Set(employees.map((employee) => employee[key])))];
}

export default function PayrollBasicPage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);

  const filteredEmployees = useMemo(() => {
    const normalizedKeyword = appliedFilters.keyword.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSelects = filterConfigs.every(({ key }) => {
        return appliedFilters[key] === "전체" || employee[key] === appliedFilters[key];
      });
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        employee.employeeNo.toLowerCase().includes(normalizedKeyword) ||
        employee.name.toLowerCase().includes(normalizedKeyword);

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
          <h1 className="text-2xl font-bold tracking-tight">급여기본정보관리</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>급여관리</span>
            <span>›</span>
            <span className="font-medium text-indigo-600">급여기본정보관리</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <DocumentArrowUpIcon className="h-4 w-4" />
            엑셀 일괄등록
          </button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            + 급여정보 등록
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        <span className="inline-flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          급여 기본정보가 등록되지 않은 직원이 17명 있습니다.
        </span>
        <button className="font-bold text-orange-600 hover:text-orange-700">미등록 직원 보기 ›</button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_1.1fr_auto_auto]">
          {filterConfigs.map(({ key, label }) => (
            <label key={key} className="space-y-1 text-sm font-semibold text-slate-700">
              <span>{label}</span>
              <select
                value={draftFilters[key]}
                onChange={(event) => updateFilter(key, event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:border-indigo-400"
              >
                {getOptions(key).map((option) => (
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
                placeholder="사번, 사원명"
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">직원별 급여 기본정보</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">총 248명</span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">등록 완료 231명</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">미등록 17명</span>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">급여정보 일괄등록</button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">급여형태 변경</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                {['', '사번', '성명', '부서', '직급', '급여형태', '기본급', '고정수당', '급여계좌', '등록상태', '최종수정일', '관리'].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((employee) => (
                <tr key={employee.employeeNo} className={employee.rowClassName}>
                  <td className="px-4 py-3"><input type="checkbox" className="h-4 w-4 rounded border-slate-300" /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.employeeNo}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold">{employee.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.department}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.position}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.payType}</td>
                  <td className={`whitespace-nowrap px-4 py-3 font-bold ${employee.basePay === '미등록' ? 'text-orange-600' : 'text-slate-900'}`}>{employee.basePay}</td>
                  <td className={`whitespace-nowrap px-4 py-3 ${employee.allowance === '미등록' ? 'font-bold text-orange-600' : 'text-slate-600'}`}>{employee.allowance}</td>
                  <td className={`whitespace-nowrap px-4 py-3 ${employee.account === '미등록' ? 'font-bold text-orange-600' : 'text-slate-600'}`}>{employee.account}</td>
                  <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${employee.statusClassName}`}>● {employee.status}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.registeredAt}</td>
                  <td className="whitespace-nowrap px-4 py-3"><button className={`rounded-lg px-3 py-1.5 text-xs font-bold ${employee.action === '등록' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600'}`}>{employee.action}</button></td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center font-semibold text-slate-400">
                    조회 조건에 맞는 직원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
          <span>총 {filteredEmployees.length}명 조회 · 0명 선택</span>
          <div className="flex gap-1">
            {['‹', '1', '2', '3', '›'].map((page) => <button key={page} className={`h-8 w-8 rounded-lg border text-sm font-semibold ${page === '1' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}>{page}</button>)}
          </div>
        </div>
      </section>
    </div>
  );
}
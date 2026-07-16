"use client";

import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserMinusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
const pageSize = 10;

interface EmployeeResponse {
  employeeId: number;
  employeeNo: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
  employmentTypeName: string | null;
  employeeStatusCode: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  baseSalary: number | null;
  updatedAt: string | null;
}

interface EmployeePage {
  content: Pick<EmployeeResponse, "employeeId">[];
  totalElements: number;
}

type PayrollBasicRow = {
  employeeId: number;
  employeeNo: string;
  name: string;
  department: string;
  position: string;
  payType: string;
  baseSalary: number | null;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  basePay: string;
  allowance: string;
  account: string;
  registeredAt: string;
  status: "등록완료" | "미등록";
  statusClassName: string;
  rowClassName: string;
  action: "수정" | "등록";
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "미등록";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function maskAccount(bankName: string | null, accountNumber: string | null) {
  if (!bankName || !accountNumber) return "미등록";
  const compact = accountNumber.replace(/\s/g, "");
  if (compact.length <= 6) return `${bankName} ${compact}`;
  return `${bankName} ${compact.slice(0, 3)}-***-${compact.slice(-6)}`;
}

function toDate(value: string | null) {
  return value ? value.slice(0, 10) : "-";
}

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function toRow(employee: EmployeeResponse): PayrollBasicRow {
  const registered =
    employee.baseSalary != null &&
    employee.bankName != null &&
    employee.accountNumber != null;

  return {
    employeeId: employee.employeeId,
    employeeNo: employee.employeeNo,
    name: employee.name,
    department: employee.departmentName ?? "미지정",
    position: employee.positionName ?? "미지정",
    payType: employee.employmentTypeName ?? "미지정",
    baseSalary: employee.baseSalary,
    bankName: employee.bankName ?? "",
    accountNumber: employee.accountNumber ?? "",
    accountHolder: employee.accountHolder ?? employee.name,
    basePay: formatCurrency(employee.baseSalary),
    allowance: "0원",
    account: maskAccount(employee.bankName, employee.accountNumber),
    registeredAt: registered ? toDate(employee.updatedAt) : "-",
    status: registered ? "등록완료" : "미등록",
    statusClassName: registered
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-orange-50 text-orange-600 ring-orange-200",
    rowClassName: registered ? "bg-white" : "bg-orange-50/55",
    action: registered ? "수정" : "등록",
  };
}

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

function getOptions(rows: PayrollBasicRow[], key: FilterKey) {
  return [
    "전체",
    ...Array.from(new Set(rows.map((employee) => employee[key]))),
  ];
}

export default function PayrollBasicPage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
  const [employees, setEmployees] = useState<PayrollBasicRow[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] =
    useState<PayrollBasicRow | null>(null);
  const [salaryInput, setSalaryInput] = useState("");
  const [bankNameInput, setBankNameInput] = useState("");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [accountHolderInput, setAccountHolderInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const listRes = await fetch(
          `${API_BASE_URL}/employees?page=0&size=1000&sort=name,asc`,
        );
        if (!listRes.ok) throw new Error("직원 목록을 불러오지 못했습니다.");

        const page: EmployeePage = await listRes.json();
        const details = await Promise.all(
          (page.content ?? []).map(async ({ employeeId }) => {
            const detailRes = await fetch(
              `${API_BASE_URL}/employees/${employeeId}`,
            );
            if (!detailRes.ok)
              throw new Error("직원 급여 기본정보를 불러오지 못했습니다.");
            return (await detailRes.json()) as EmployeeResponse;
          }),
        );

        setEmployees(details.map(toRow));
        setTotalEmployees(page.totalElements ?? details.length);
      } catch (error) {
        console.error("Failed to fetch payroll basic employees", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "급여 기본정보를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const registeredCount = employees.filter(
    (employee) => employee.status === "등록완료",
  ).length;
  const unregisteredCount = employees.length - registeredCount;

  const summaryCards = [
    {
      title: "급여 대상 직원",
      value: `${totalEmployees.toLocaleString("ko-KR")}명`,
      description: "백엔드 직원 기준",
      icon: UserGroupIcon,
      className: "border-gray-200 bg-white",
      iconClassName: "bg-slate-100 text-slate-600",
      valueClassName: "text-slate-900",
    },
    {
      title: "등록 완료",
      value: `${registeredCount.toLocaleString("ko-KR")}명`,
      description: `등록률 ${employees.length ? ((registeredCount / employees.length) * 100).toFixed(1) : "0.0"}%`,
      icon: CheckCircleIcon,
      className: "border-indigo-200 bg-indigo-50",
      iconClassName: "bg-indigo-100 text-indigo-600",
      valueClassName: "text-indigo-600",
    },
    {
      title: "미등록 직원",
      value: `${unregisteredCount.toLocaleString("ko-KR")}명`,
      description: "기본급/계좌 등록 필요",
      icon: UserMinusIcon,
      className: "border-orange-200 bg-orange-50",
      iconClassName: "bg-orange-100 text-orange-600",
      valueClassName: "text-orange-600",
    },
    {
      title: "이번 달 변경",
      value: "-",
      description: "백엔드 수정일 기준",
      icon: ArrowPathIcon,
      className: "border-gray-200 bg-white",
      iconClassName: "bg-emerald-50 text-emerald-600",
      valueClassName: "text-slate-900",
    },
  ];

  const filteredEmployees = useMemo(() => {
    const normalizedKeyword = appliedFilters.keyword.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSelects = filterConfigs.every(({ key }) => {
        return (
          appliedFilters[key] === "전체" ||
          employee[key] === appliedFilters[key]
        );
      });
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        employee.employeeNo.toLowerCase().includes(normalizedKeyword) ||
        employee.name.toLowerCase().includes(normalizedKeyword);

      return matchesSelects && matchesKeyword;
    });
  }, [appliedFilters, employees]);

  const totalPages = Math.max(
    Math.ceil(filteredEmployees.length / pageSize),
    1,
  );
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const updateFilter = (key: keyof Filters, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

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

  const openRegisterFromHeader = () => {
    const target = employees.find((employee) => employee.status === "미등록");
    if (!target) {
      window.alert("급여 정보가 미등록된 직원이 없습니다.");
      return;
    }
    openPayrollModal(target);
  };

  const openPayrollModal = (employee: PayrollBasicRow) => {
    setSelectedEmployee(employee);
    setSalaryInput(employee.baseSalary?.toString() ?? "");
    setBankNameInput(employee.bankName);
    setAccountNumberInput(employee.accountNumber);
    setAccountHolderInput(employee.accountHolder);
    setModalError("");
  };

  const closePayrollModal = () => {
    if (saving) return;
    setSelectedEmployee(null);
    setModalError("");
  };

  const savePayrollBasicInfo = async () => {
    if (!selectedEmployee) return;

    const baseSalary = Number(salaryInput.replace(/,/g, ""));
    if (!Number.isFinite(baseSalary) || baseSalary < 0) {
      setModalError("기본급은 0 이상의 숫자로 입력해주세요.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      const detailRes = await fetch(
        `${API_BASE_URL}/employees/${selectedEmployee.employeeId}`,
      );
      if (!detailRes.ok) throw new Error("직원 정보를 불러오지 못했습니다.");
      const detail = (await detailRes.json()) as EmployeeResponse & {
        employmentTypeId: number | null;
        birthDate: string | null;
        email: string;
        phone: string | null;
        address: string | null;
        hireDate: string | null;
        resignationDate: string | null;
        employeeStatusCode: string;
        profileImage: string | null;
      };

      const updateRes = await fetch(
        `${API_BASE_URL}/employees/${selectedEmployee.employeeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            employmentTypeId: detail.employmentTypeId,
            name: detail.name,
            birthDate: detail.birthDate,
            phone: detail.phone,
            email: detail.email,
            address: detail.address,
            hireDate: detail.hireDate,
            resignationDate: detail.resignationDate,
            employeeStatusCode: detail.employeeStatusCode,
            bankName: bankNameInput.trim() || null,
            accountNumber: accountNumberInput.trim() || null,
            accountHolder: accountHolderInput.trim() || null,
            profileImage: detail.profileImage,
          }),
        },
      );
      if (!updateRes.ok) throw new Error("급여 계좌정보 저장에 실패했습니다.");

      const salaryRes = await fetch(
        `${API_BASE_URL}/employees/${selectedEmployee.employeeId}/base-salary`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ baseSalary }),
        },
      );
      if (!salaryRes.ok) throw new Error("급여 기본정보 저장에 실패했습니다.");

      const updatedEmployee = (await salaryRes.json()) as EmployeeResponse;
      const updatedRow = toRow({
        ...updatedEmployee,
        bankName: bankNameInput.trim() || null,
        accountNumber: accountNumberInput.trim() || null,
        accountHolder: accountHolderInput.trim() || null,
      });

      setEmployees((current) =>
        current.map((employee) =>
          employee.employeeId === selectedEmployee.employeeId
            ? updatedRow
            : employee,
        ),
      );
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to save payroll basic info", error);
      setModalError(
        error instanceof Error
          ? error.message
          : "급여 기본정보 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            급여기본정보관리
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>급여관리</span>
            <span>›</span>
            <span className="font-medium text-indigo-600">
              급여기본정보관리
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <DocumentArrowUpIcon className="h-4 w-4" />
            엑셀 일괄등록
          </button>
          <button
            type="button"
            onClick={openRegisterFromHeader}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            + 급여정보 등록
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          급여 기본정보가 등록되지 않은 직원이{" "}
          {unregisteredCount.toLocaleString("ko-KR")}명 있습니다.
        </span>
        <button className="font-bold text-orange-600 hover:text-orange-700">
          미등록 직원 보기 ›
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_1.1fr_auto_auto]">
          {filterConfigs.map(({ key, label }) => (
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
                {getOptions(employees, key).map((option) => (
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
                    applyFilters();
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
            onClick={applyFilters}
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
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              총 {totalEmployees.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              등록 완료 {registeredCount.toLocaleString("ko-KR")}명
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
              미등록 {unregisteredCount.toLocaleString("ko-KR")}명
            </span>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">
              급여정보 일괄등록
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400">
              급여형태 변경
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
                  "급여형태",
                  "기본급",
                  "고정수당",
                  "급여계좌",
                  "등록상태",
                  "최종수정일",
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
                    colSpan={12}
                    className="px-4 py-12 text-center font-semibold text-slate-400"
                  >
                    백엔드에서 급여 기본정보를 불러오는 중입니다.
                  </td>
                </tr>
              )}
              {!loading && errorMessage && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-12 text-center font-semibold text-rose-500"
                  >
                    {errorMessage}
                  </td>
                </tr>
              )}
              {!loading &&
                !errorMessage &&
                paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.employeeNo}
                    className={employee.rowClassName}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {employee.employeeNo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">
                      {employee.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {employee.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {employee.position}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {employee.payType}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 font-bold ${employee.basePay === "미등록" ? "text-orange-600" : "text-slate-900"}`}
                    >
                      {employee.basePay}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 ${employee.allowance === "미등록" ? "font-bold text-orange-600" : "text-slate-600"}`}
                    >
                      {employee.allowance}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 ${employee.account === "미등록" ? "font-bold text-orange-600" : "text-slate-600"}`}
                    >
                      {employee.account}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${employee.statusClassName}`}
                      >
                        ● {employee.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {employee.registeredAt}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openPayrollModal(employee)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${employee.action === "등록" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600"}`}
                      >
                        {employee.action}
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && !errorMessage && filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-12 text-center font-semibold text-slate-400"
                  >
                    조회 조건에 맞는 직원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
          <span>
            총 {filteredEmployees.length}명 조회 · {currentPage}/{totalPages}{" "}
            페이지 · 0명 선택
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

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <section className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  급여 기본정보 등록
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedEmployee.employeeNo} · {selectedEmployee.name} ·{" "}
                  {selectedEmployee.department}
                </p>
              </div>
              <button
                type="button"
                onClick={closePayrollModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="급여 기본정보 등록 닫기"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400">직급</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedEmployee.position}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    급여형태
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedEmployee.payType}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    등록상태
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedEmployee.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>기본급</span>
                  <input
                    value={salaryInput}
                    onChange={(event) => setSalaryInput(event.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="예: 3200000"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>고정수당</span>
                  <input
                    value="0"
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>은행</span>
                  <input
                    value={bankNameInput}
                    onChange={(event) => setBankNameInput(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="예: 국민은행"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>계좌번호</span>
                  <input
                    value={accountNumberInput}
                    onChange={(event) =>
                      setAccountNumberInput(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="예: 123-456-7890"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700 md:col-span-2">
                  <span>예금주</span>
                  <input
                    value={accountHolderInput}
                    onChange={(event) =>
                      setAccountHolderInput(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="예금주명을 입력하세요"
                  />
                </label>
              </div>

              {modalError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {modalError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closePayrollModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={savePayrollBasicInfo}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
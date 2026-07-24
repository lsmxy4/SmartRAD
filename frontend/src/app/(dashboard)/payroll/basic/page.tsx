"use client";

import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Modal, { ModalCancelButton, ModalPrimaryButton } from "@/components/common/Modal";

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
  allowanceAmount: number | null;
  updatedAt: string | null;
}

interface EmploymentTypeOption {
  employmentTypeId: number;
  employmentTypeName: string;
}

interface AllowanceOption {
  allowanceId: number;
  allowanceName: string;
  taxable: boolean;
  fixed: boolean;
}

interface EmployeeBulkResult {
  employeeId: number;
  success: boolean;
  failureReason: string | null;
}

type BulkPayrollItem = {
  employeeId: number;
  employeeNo: string;
  name: string;
  baseSalary: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

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
  monthlyPay: string | null;
  allowance: string;
  allowanceAmount: number;
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

function formatMonthlyEquivalent(annualSalary: number | null | undefined) {
  if (annualSalary == null) return null;
  return `월 환산 ${Math.round(annualSalary / 12).toLocaleString("ko-KR")}원`;
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
    monthlyPay: formatMonthlyEquivalent(employee.baseSalary),
    allowance: formatCurrency(employee.allowanceAmount ?? 0),
    allowanceAmount: employee.allowanceAmount ?? 0,
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
  const [allowanceInput, setAllowanceInput] = useState("");
  const [fixedAllowanceOption, setFixedAllowanceOption] =
    useState<AllowanceOption | null>(null);
  const [bankNameInput, setBankNameInput] = useState("");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [accountHolderInput, setAccountHolderInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<
    EmploymentTypeOption[]
  >([]);
  const [bulkEmploymentTypeOpen, setBulkEmploymentTypeOpen] = useState(false);
  const [bulkEmploymentTypeValue, setBulkEmploymentTypeValue] = useState("");
  const [bulkEmploymentTypeError, setBulkEmploymentTypeError] = useState("");
  const [bulkEmploymentTypeSaving, setBulkEmploymentTypeSaving] =
    useState(false);

  const [unregisteredModalOpen, setUnregisteredModalOpen] = useState(false);

  const [bulkPayrollOpen, setBulkPayrollOpen] = useState(false);
  const [bulkPayrollItems, setBulkPayrollItems] = useState<BulkPayrollItem[]>(
    [],
  );
  const [bulkPayrollError, setBulkPayrollError] = useState("");
  const [bulkPayrollSaving, setBulkPayrollSaving] = useState(false);
  const [excelUploading, setExcelUploading] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const listRes = await fetch(
        `${API_BASE_URL}/employees/payroll-summary`,
        { headers: authHeaders() },
      );
      if (!listRes.ok) throw new Error("직원 급여 기본정보를 불러오지 못했습니다.");

      const details = (await listRes.json()) as EmployeeResponse[];
      const sorted = [...details].sort((a, b) => a.name.localeCompare(b.name, "ko"));

      setEmployees(sorted.map(toRow));
      setTotalEmployees(sorted.length);
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const paramKeyword = new URLSearchParams(window.location.search).get("keyword");
    if (paramKeyword) {
      setDraftFilters((current) => ({ ...current, keyword: paramKeyword }));
      setAppliedFilters((current) => ({ ...current, keyword: paramKeyword }));
    }
  }, []);

  useEffect(() => {
    const fetchEmploymentTypes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employment-types`, { headers: authHeaders() });
        if (!res.ok) throw new Error("급여형태 목록을 불러오지 못했습니다.");
        const data = (await res.json()) as EmploymentTypeOption[];
        setEmploymentTypeOptions(data);
      } catch (error) {
        console.error("Failed to fetch employment types", error);
      }
    };

    fetchEmploymentTypes();
  }, []);

  useEffect(() => {
    const fetchAllowances = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/allowances`, { headers: authHeaders() });
        if (!res.ok) throw new Error("수당 목록을 불러오지 못했습니다.");
        const data = (await res.json()) as AllowanceOption[];
        setFixedAllowanceOption(data.find((option) => option.fixed) ?? null);
      } catch (error) {
        console.error("Failed to fetch allowances", error);
      }
    };

    fetchAllowances();
  }, []);

  const registeredCount = employees.filter(
    (employee) => employee.status === "등록완료",
  ).length;
  const unregisteredRows = employees.filter((employee) => employee.status === "미등록");
  const unregisteredCount = unregisteredRows.length;

  const summaryCards = [
    {
      title: "급여 대상 직원",
      value: `${totalEmployees.toLocaleString("ko-KR")}명`,
      description: "전체 직원 기준",
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
      description: "연봉/계좌 등록 필요",
      icon: UserMinusIcon,
      className: "border-orange-200 bg-orange-50",
      iconClassName: "bg-orange-100 text-orange-600",
      valueClassName: "text-orange-600",
    },
    {
      title: "이번 달 변경",
      value: "-",
      description: "최근 수정일 기준",
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
    setAllowanceInput(employee.allowanceAmount.toString());
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
      setModalError("연봉은 0 이상의 숫자로 입력해주세요.");
      return;
    }

    const allowanceAmount = Number(allowanceInput.replace(/,/g, "") || "0");
    if (!Number.isFinite(allowanceAmount) || allowanceAmount < 0) {
      setModalError("고정수당은 0 이상의 숫자로 입력해주세요.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      const detailRes = await fetch(
        `${API_BASE_URL}/employees/${selectedEmployee.employeeId}`,
        { headers: authHeaders() },
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

      if (fixedAllowanceOption) {
        const allowanceRes = await fetch(`${API_BASE_URL}/employee-allowances`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            employeeId: selectedEmployee.employeeId,
            allowanceId: fixedAllowanceOption.allowanceId,
            amount: allowanceAmount,
          }),
        });
        if (!allowanceRes.ok) throw new Error("고정수당 저장에 실패했습니다.");
      }

      const updatedEmployee = (await salaryRes.json()) as EmployeeResponse;
      const updatedRow = toRow({
        ...updatedEmployee,
        bankName: bankNameInput.trim() || null,
        accountNumber: accountNumberInput.trim() || null,
        accountHolder: accountHolderInput.trim() || null,
        allowanceAmount,
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

  const toggleSelectEmployee = (employeeId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => selectedIds.has(employee.employeeId));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredEmployees.forEach((employee) => next.delete(employee.employeeId));
      } else {
        filteredEmployees.forEach((employee) => next.add(employee.employeeId));
      }
      return next;
    });
  };

  const openBulkEmploymentTypeModal = () => {
    if (selectedIds.size === 0) {
      window.alert("급여형태를 변경할 직원을 선택해주세요.");
      return;
    }
    setBulkEmploymentTypeValue("");
    setBulkEmploymentTypeError("");
    setBulkEmploymentTypeOpen(true);
  };

  const closeBulkEmploymentTypeModal = () => {
    if (bulkEmploymentTypeSaving) return;
    setBulkEmploymentTypeOpen(false);
  };

  const saveBulkEmploymentType = async () => {
    if (!bulkEmploymentTypeValue) {
      setBulkEmploymentTypeError("변경할 급여형태를 선택해주세요.");
      return;
    }

    setBulkEmploymentTypeSaving(true);
    setBulkEmploymentTypeError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/employees/bulk-employment-type`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            employeeIds: Array.from(selectedIds),
            employmentTypeId: Number(bulkEmploymentTypeValue),
          }),
        },
      );
      if (!res.ok) throw new Error("급여형태 일괄 변경에 실패했습니다.");

      const results = (await res.json()) as EmployeeBulkResult[];
      const successCount = results.filter((result) => result.success).length;
      const failCount = results.length - successCount;

      window.alert(
        failCount === 0
          ? `${successCount}명의 급여형태를 변경했습니다.`
          : `${successCount}명 변경 성공, ${failCount}명 실패했습니다.`,
      );

      setBulkEmploymentTypeOpen(false);
      setSelectedIds(new Set());
      await fetchEmployees();
    } catch (error) {
      console.error("Failed to bulk update employment type", error);
      setBulkEmploymentTypeError(
        error instanceof Error
          ? error.message
          : "급여형태 일괄 변경에 실패했습니다.",
      );
    } finally {
      setBulkEmploymentTypeSaving(false);
    }
  };

  const openBulkPayrollModal = () => {
    if (selectedIds.size === 0) {
      window.alert("급여정보를 등록할 직원을 선택해주세요.");
      return;
    }

    const selectedRows = employees.filter((employee) =>
      selectedIds.has(employee.employeeId),
    );
    const unregistered = selectedRows.filter(
      (employee) => employee.status === "미등록",
    );
    const alreadyRegisteredCount = selectedRows.length - unregistered.length;

    if (unregistered.length === 0) {
      window.alert("선택한 직원 중 급여정보가 미등록인 직원이 없습니다.");
      return;
    }
    if (alreadyRegisteredCount > 0) {
      window.alert(
        `이미 등록완료된 ${alreadyRegisteredCount}명은 제외하고, 미등록 ${unregistered.length}명만 일괄등록을 진행합니다.`,
      );
    }

    setBulkPayrollItems(
      unregistered.map((employee) => ({
        employeeId: employee.employeeId,
        employeeNo: employee.employeeNo,
        name: employee.name,
        baseSalary: "",
        bankName: "",
        accountNumber: "",
        accountHolder: employee.name,
      })),
    );
    setBulkPayrollError("");
    setBulkPayrollOpen(true);
  };

  const closeBulkPayrollModal = () => {
    if (bulkPayrollSaving) return;
    setBulkPayrollOpen(false);
  };

  const updateBulkPayrollItem = (
    employeeId: number,
    field: keyof Omit<BulkPayrollItem, "employeeId" | "employeeNo" | "name">,
    value: string,
  ) => {
    setBulkPayrollItems((current) =>
      current.map((item) =>
        item.employeeId === employeeId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const saveBulkPayrollBasic = async () => {
    const parsedItems: {
      employeeId: number;
      baseSalary: number;
      bankName: string | null;
      accountNumber: string | null;
      accountHolder: string | null;
    }[] = [];

    for (const item of bulkPayrollItems) {
      const baseSalary = Number(item.baseSalary.replace(/,/g, ""));
      if (
        !item.baseSalary.trim() ||
        !Number.isFinite(baseSalary) ||
        baseSalary < 0
      ) {
        setBulkPayrollError(
          `${item.name}(${item.employeeNo})의 연봉을 0 이상의 숫자로 입력해주세요.`,
        );
        return;
      }
      parsedItems.push({
        employeeId: item.employeeId,
        baseSalary,
        bankName: item.bankName.trim() || null,
        accountNumber: item.accountNumber.trim() || null,
        accountHolder: item.accountHolder.trim() || null,
      });
    }

    setBulkPayrollSaving(true);
    setBulkPayrollError("");

    try {
      const res = await fetch(`${API_BASE_URL}/employees/bulk-payroll-basic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ items: parsedItems }),
      });
      if (!res.ok) throw new Error("급여정보 일괄등록에 실패했습니다.");

      const results = (await res.json()) as EmployeeBulkResult[];
      const successCount = results.filter((result) => result.success).length;
      const failCount = results.length - successCount;

      window.alert(
        failCount === 0
          ? `${successCount}명의 급여정보를 등록했습니다.`
          : `${successCount}명 등록 성공, ${failCount}명 실패했습니다.`,
      );

      setBulkPayrollOpen(false);
      setSelectedIds(new Set());
      await fetchEmployees();
    } catch (error) {
      console.error("Failed to bulk register payroll basic info", error);
      setBulkPayrollError(
        error instanceof Error
          ? error.message
          : "급여정보 일괄등록에 실패했습니다.",
      );
    } finally {
      setBulkPayrollSaving(false);
    }
  };

  const downloadExcelTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["사번", "연봉", "은행", "계좌번호", "예금주"],
      ["E2026001", 50000000, "국민은행", "123-456-7890", "홍길동"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "급여정보");
    XLSX.writeFile(workbook, "급여정보_일괄등록_양식.xlsx");
  };

  const handleExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setExcelUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (rows.length === 0) {
        window.alert("엑셀 파일에 데이터가 없습니다.");
        return;
      }

      const byEmployeeNo = new Map(
        employees.map((employee) => [employee.employeeNo, employee]),
      );
      const items: {
        employeeId: number;
        baseSalary: number;
        bankName: string | null;
        accountNumber: string | null;
        accountHolder: string | null;
      }[] = [];
      const notFound: string[] = [];
      const invalid: string[] = [];

      rows.forEach((row, index) => {
        const employeeNo = String(row["사번"] ?? "").trim();
        if (!employeeNo) return;
        const target = byEmployeeNo.get(employeeNo);
        if (!target) {
          notFound.push(employeeNo);
          return;
        }
        const baseSalary = Number(
          String(row["연봉"] ?? "").replace(/,/g, ""),
        );
        if (!Number.isFinite(baseSalary) || baseSalary < 0) {
          invalid.push(`${index + 2}행(${employeeNo})`);
          return;
        }
        items.push({
          employeeId: target.employeeId,
          baseSalary,
          bankName: String(row["은행"] ?? "").trim() || null,
          accountNumber: String(row["계좌번호"] ?? "").trim() || null,
          accountHolder: String(row["예금주"] ?? "").trim() || null,
        });
      });

      if (items.length === 0) {
        window.alert(
          "등록할 수 있는 유효한 행이 없습니다. 사번과 연봉을 확인해주세요.",
        );
        return;
      }

      const res = await fetch(`${API_BASE_URL}/employees/bulk-payroll-basic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("엑셀 일괄등록에 실패했습니다.");

      const results = (await res.json()) as EmployeeBulkResult[];
      const successCount = results.filter((result) => result.success).length;
      const failCount = results.length - successCount;

      const messages = [`${successCount}명 등록 성공`];
      if (failCount > 0) messages.push(`${failCount}명 실패`);
      if (notFound.length > 0)
        messages.push(
          `사번 불일치 ${notFound.length}건(${notFound.slice(0, 5).join(", ")}${notFound.length > 5 ? " 외" : ""})`,
        );
      if (invalid.length > 0)
        messages.push(`연봉 형식 오류 ${invalid.length}건`);

      window.alert(messages.join("\n"));
      await fetchEmployees();
    } catch (error) {
      console.error("Failed to upload excel", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "엑셀 파일을 처리하지 못했습니다.",
      );
    } finally {
      setExcelUploading(false);
    }
  };

  return (
    <div className="payroll-basic-page mx-auto max-w-[1600px] space-y-5 text-slate-900">
      <div className="payroll-basic-header flex flex-wrap items-start justify-between gap-4">
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
        <div className="payroll-basic-header-actions flex gap-2">
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            양식 다운로드
          </button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelUpload}
          />
          <button
            type="button"
            onClick={() => excelInputRef.current?.click()}
            disabled={excelUploading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            {excelUploading ? "등록 중..." : "엑셀 일괄등록"}
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

      {unregisteredCount > 0 && (
        <div className="payroll-basic-alert flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          <span className="inline-flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            급여 기본정보가 등록되지 않은 직원이{" "}
            {unregisteredCount.toLocaleString("ko-KR")}명 있습니다.
          </span>
          <button 
            type="button" 
            onClick={() => setUnregisteredModalOpen(true)}
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            미등록 직원 보기 ›
          </button>
        </div>
      )}

      <section className="payroll-basic-filters rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
            className="payroll-basic-filter-button self-end rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="payroll-basic-filter-button self-end rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            조회
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="payroll-basic-list-header flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">직원별 급여 기본정보</h2>
            <label className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 sm:hidden">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                aria-label="전체 선택"
                className="h-4 w-4 rounded border-slate-300"
              />
              전체 선택
            </label>
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
          <div className="payroll-basic-list-actions flex gap-2">
            <button
              type="button"
              onClick={openBulkPayrollModal}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              급여정보 일괄등록
            </button>
            <button
              type="button"
              onClick={openBulkEmploymentTypeModal}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              급여형태 변경
            </button>
          </div>
        </div>
        <div className="payroll-basic-table hidden overflow-x-auto sm:block">
          <table className="min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                {[
                  "",
                  "사번",
                  "성명",
                  "부서",
                  "직급",
                  "급여형태",
                  "연봉",
                  "고정수당",
                  "급여계좌",
                  "등록상태",
                  "최종수정일",
                  "관리",
                ].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3">
                    {header === "" ? (
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        aria-label="전체 선택"
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    ) : (
                      header
                    )}
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
                    급여 기본정보를 불러오는 중입니다.
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
                        checked={selectedIds.has(employee.employeeId)}
                        onChange={() =>
                          toggleSelectEmployee(employee.employeeId)
                        }
                        aria-label={`${employee.name} 선택`}
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
                      {employee.monthlyPay && (
                        <p className="mt-0.5 text-xs font-medium text-slate-400">{employee.monthlyPay}</p>
                      )}
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
        <div className="payroll-basic-mobile-list divide-y divide-slate-100 sm:hidden">
          {loading && (
            <p className="px-4 py-12 text-center text-sm font-semibold text-slate-400">
              급여 기본정보를 불러오는 중입니다.
            </p>
          )}
          {!loading && errorMessage && (
            <p className="px-4 py-12 text-center text-sm font-semibold text-rose-500">
              {errorMessage}
            </p>
          )}
          {!loading && !errorMessage && paginatedEmployees.map((employee) => (
            <article key={employee.employeeNo} className={`space-y-3 px-4 py-4 ${employee.status === "미등록" ? "bg-orange-50/55" : "bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <label className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(employee.employeeId)}
                    onChange={() => toggleSelectEmployee(employee.employeeId)}
                    aria-label={`${employee.name} 선택`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-900">{employee.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{employee.employeeNo} · {employee.department} · {employee.position}</span>
                  </span>
                </label>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${employee.statusClassName}`}>
                  {employee.status}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-lg bg-slate-50 p-3 text-xs">
                <div><dt className="text-slate-400">급여 형태</dt><dd className="mt-1 font-semibold text-slate-700">{employee.payType}</dd></div>
                <div><dt className="text-slate-400">고정 수당</dt><dd className={`mt-1 ${employee.allowance === "미등록" ? "font-bold text-orange-600" : "font-semibold text-slate-700"}`}>{employee.allowance}</dd></div>
                <div><dt className="text-slate-400">연봉</dt><dd className={`mt-1 ${employee.basePay === "미등록" ? "font-bold text-orange-600" : "font-bold text-slate-900"}`}>{employee.basePay}{employee.monthlyPay && <span className="mt-0.5 block font-medium text-slate-400">{employee.monthlyPay}</span>}</dd></div>
                <div><dt className="text-slate-400">급여 계좌</dt><dd className={`mt-1 break-all ${employee.account === "미등록" ? "font-bold text-orange-600" : "font-medium text-slate-700"}`}>{employee.account}</dd></div>
              </dl>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">최종 수정 {employee.registeredAt}</span>
                <button
                  type="button"
                  onClick={() => openPayrollModal(employee)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${employee.action === "등록" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600"}`}
                >
                  {employee.action}
                </button>
              </div>
            </article>
          ))}
          {!loading && !errorMessage && filteredEmployees.length === 0 && (
            <p className="px-4 py-12 text-center text-sm font-semibold text-slate-400">
              조회 조건에 맞는 직원이 없습니다.
            </p>
          )}
        </div>
        <div className="payroll-basic-pagination flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
          <span>
            총 {filteredEmployees.length}명 조회 · {currentPage}/{totalPages}{" "}
            페이지 · {selectedIds.size}명 선택
          </span>
          <div className="payroll-basic-page-buttons flex gap-1 mr-20">
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
        <Modal
          icon={BanknotesIcon}
          title="급여 기본정보 등록"
          subtitle={`${selectedEmployee.employeeNo} · ${selectedEmployee.name} · ${selectedEmployee.department}`}
          onClose={closePayrollModal}
          maxWidth="2xl"
          bodyClassName="max-h-[65vh] space-y-5 overflow-y-auto p-6"
          footer={<>
            <ModalCancelButton onClick={closePayrollModal} />
            <ModalPrimaryButton onClick={savePayrollBasicInfo} disabled={saving}>{saving ? "저장 중..." : "저장"}</ModalPrimaryButton>
          </>}
        >
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
                  <span>연봉</span>
                  <input
                    value={salaryInput}
                    onChange={(event) => setSalaryInput(event.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="예: 42000000"
                  />
                  {formatMonthlyEquivalent(Number(salaryInput.replace(/,/g, "")) || null) && (
                    <p className="text-xs font-normal text-slate-400">
                      {formatMonthlyEquivalent(Number(salaryInput.replace(/,/g, "")) || null)}
                    </p>
                  )}
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>고정수당{fixedAllowanceOption ? ` (${fixedAllowanceOption.allowanceName})` : ""}</span>
                  <input
                    value={allowanceInput}
                    onChange={(event) => setAllowanceInput(event.target.value)}
                    disabled={!fixedAllowanceOption}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder={fixedAllowanceOption ? "예: 200000" : "등록된 고정수당 항목이 없습니다"}
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
        </Modal>
      )}

      {bulkEmploymentTypeOpen && (
        <Modal
          icon={UserGroupIcon}
          title="급여형태 변경"
          subtitle={`선택된 ${selectedIds.size}명의 급여형태를 일괄 변경합니다.`}
          onClose={closeBulkEmploymentTypeModal}
          footer={<>
            <ModalCancelButton onClick={closeBulkEmploymentTypeModal} />
            <ModalPrimaryButton onClick={saveBulkEmploymentType} disabled={bulkEmploymentTypeSaving}>{bulkEmploymentTypeSaving ? "변경 중..." : "변경"}</ModalPrimaryButton>
          </>}
        >
              <label className="space-y-1 text-sm font-semibold text-slate-700">
                <span>변경할 급여형태</span>
                <select
                  value={bulkEmploymentTypeValue}
                  onChange={(event) =>
                    setBulkEmploymentTypeValue(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">선택하세요</option>
                  {employmentTypeOptions.map((option) => (
                    <option
                      key={option.employmentTypeId}
                      value={option.employmentTypeId}
                    >
                      {option.employmentTypeName}
                    </option>
                  ))}
                </select>
              </label>

              {bulkEmploymentTypeError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {bulkEmploymentTypeError}
                </p>
              )}
        </Modal>
      )}

      {bulkPayrollOpen && (
        <Modal
          icon={DocumentArrowUpIcon}
          title="급여정보 일괄등록"
          subtitle={`미등록 ${bulkPayrollItems.length}명의 연봉/계좌정보를 입력하세요.`}
          onClose={closeBulkPayrollModal}
          maxWidth="3xl"
          bodyClassName="max-h-[65vh] space-y-4 overflow-y-auto p-6"
          footer={<>
            <ModalCancelButton onClick={closeBulkPayrollModal} />
            <ModalPrimaryButton onClick={saveBulkPayrollBasic} disabled={bulkPayrollSaving}>{bulkPayrollSaving ? "저장 중..." : "저장"}</ModalPrimaryButton>
          </>}
        >
              {bulkPayrollItems.map((item) => (
                <div
                  key={item.employeeId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="mb-3 text-sm font-bold text-slate-800">
                    {item.employeeNo} · {item.name}
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      <span>연봉</span>
                      <input
                        value={item.baseSalary}
                        onChange={(event) =>
                          updateBulkPayrollItem(
                            item.employeeId,
                            "baseSalary",
                            event.target.value,
                          )
                        }
                        inputMode="numeric"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        placeholder="예: 42000000"
                      />
                      {formatMonthlyEquivalent(Number(item.baseSalary.replace(/,/g, "")) || null) && (
                        <p className="text-xs font-normal text-slate-400">
                          {formatMonthlyEquivalent(Number(item.baseSalary.replace(/,/g, "")) || null)}
                        </p>
                      )}
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      <span>은행</span>
                      <input
                        value={item.bankName}
                        onChange={(event) =>
                          updateBulkPayrollItem(
                            item.employeeId,
                            "bankName",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        placeholder="예: 국민은행"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      <span>계좌번호</span>
                      <input
                        value={item.accountNumber}
                        onChange={(event) =>
                          updateBulkPayrollItem(
                            item.employeeId,
                            "accountNumber",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        placeholder="예: 123-456-7890"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      <span>예금주</span>
                      <input
                        value={item.accountHolder}
                        onChange={(event) =>
                          updateBulkPayrollItem(
                            item.employeeId,
                            "accountHolder",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        placeholder="예금주명을 입력하세요"
                      />
                    </label>
                  </div>
                </div>
              ))}

              {bulkPayrollError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {bulkPayrollError}
                </p>
              )}
        </Modal>
      )}

      {unregisteredModalOpen && (
        <Modal
          icon={ExclamationTriangleIcon}
          title="미등록 직원 목록"
          subtitle={`총 ${unregisteredRows.length}명의 직원이 기본정보가 미등록 상태입니다.`}
          onClose={() => setUnregisteredModalOpen(false)}
          maxWidth="xl"
          footer={
            <ModalCancelButton onClick={() => setUnregisteredModalOpen(false)}>닫기</ModalCancelButton>
          }
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">사번</th>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">부서</th>
                  <th className="px-4 py-3 font-medium">고용형태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unregisteredRows.map(row => (
                  <tr key={row.employeeId}>
                    <td className="px-4 py-3 text-slate-600">{row.employeeNo}</td>
                    <td className="px-4 py-3 font-bold">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.department}</td>
                    <td className="px-4 py-3 text-slate-600">{row.payType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
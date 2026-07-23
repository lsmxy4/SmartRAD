"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { EMPLOYEE_DOCUMENT_TYPE_OPTIONS, employeeDocumentTypeLabel } from "@/components/employee/documentTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string; zonecode: string }) => void;
        width?: string | number;
        height?: string | number;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Option = {
  label: string;
  value: string;
};

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  muted?: boolean;
  suffix?: string;
  placeholder?: string;
  type?: string;
  invalid?: boolean;
};

const Input = ({ label, name, value, onChange, required, muted, suffix, placeholder, type = "text", invalid }: InputProps) => (
  <label className="block" htmlFor={name}>
    <span className="mb-2 block text-xs font-bold text-slate-700">
      {label} {required ? <b className="text-rose-500">*</b> : null}
    </span>
    <div
      className={`flex h-10 items-center rounded-lg border px-3 text-sm ${
        muted
          ? "border-slate-200 bg-slate-50 text-slate-300"
          : invalid
          ? "border-rose-400 bg-rose-50/40 ring-1 ring-rose-200 focus-within:border-rose-500"
          : "border-slate-200 bg-white text-slate-900 focus-within:border-indigo-500"
      }`}
    >
      <input
        id={name}
        name={name}
        className="w-full bg-transparent outline-none placeholder:text-slate-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={muted}
        disabled={muted}
        placeholder={placeholder}
        type={type}
      />
      {suffix ? <span className="text-xs text-slate-400">{suffix}</span> : null}
    </div>
  </label>
);

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  invalid,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  required?: boolean;
  invalid?: boolean;
}) => (
  <label className="block" htmlFor={name}>
    <span className="mb-2 block text-xs font-bold text-slate-700">
      {label} {required ? <b className="text-rose-500">*</b> : null}
    </span>
    <select
      id={name}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none ${
        invalid ? "border-rose-400 bg-rose-50/40 ring-1 ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"
      } ${value ? "text-slate-900" : "text-slate-300"}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const SearchableSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((option) => option.value === value);
  const filtered = query.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div className="relative" ref={containerRef}>
      <span className="mb-2 block text-xs font-bold text-slate-700">{label}</span>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm focus-within:border-indigo-500">
        <input
          type="text"
          value={open ? query : selected?.label ?? ""}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-300"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            aria-label="선택 해제"
          >
            ×
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">검색 결과가 없습니다.</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
                className={`block w-full truncate px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                  option.value === value ? "bg-indigo-50 font-semibold text-indigo-600" : "text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};

const Card = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex h-14 items-center justify-between border-b border-slate-200 px-6">
      <h2 className="text-base font-extrabold text-slate-950">{title}</h2>
      {badge ? <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-400">{badge}</span> : null}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const emptyEmployee = {
  name: "",
  birthDate: "",
  phone: "",
  email: "",
  address: "",
  addressDetail: "",
  gender: "",
  department: "",
  position: "",
  employmentType: "",
  manager: "",
  hireDate: "",
};

const REQUIRED_FIELDS: { key: keyof typeof emptyEmployee; label: string }[] = [
  { key: "name", label: "이름" },
  { key: "birthDate", label: "생년월일" },
  { key: "gender", label: "성별" },
  { key: "phone", label: "연락처" },
  { key: "email", label: "이메일" },
  { key: "address", label: "주소" },
  { key: "department", label: "부서" },
  { key: "position", label: "직급" },
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [employee, setEmployee] = useState(emptyEmployee);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [positions, setPositions] = useState<Option[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<Option[]>([]);
  const [managers, setManagers] = useState<Option[]>([]);
  const [profileImage, setProfileImage] = useState<{ name: string; file: File; preview: string } | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  const [fileInputKey, setFileInputKey] = useState(0);
  const [profileImageInputKey, setProfileImageInputKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const addressLayerRef = useRef<HTMLDivElement>(null);
  const [employeeNoToId, setEmployeeNoToId] = useState<Record<string, number>>({});
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ total: number; success: number; failures: string[] } | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
        const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [departmentsRes, positionsRes, employmentTypesRes, employeesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/departments`),
          fetch(`${API_BASE_URL}/positions`, { headers: authHeaders }),
          fetch(`${API_BASE_URL}/employment-types`, { headers: authHeaders }),
          fetch(`${API_BASE_URL}/employees?page=0&size=1000`),
        ]);
        if (departmentsRes.ok) {
          const data = await departmentsRes.json();
          setDepartments(data.map((d: { departmentId: number; departmentName: string }) => ({ label: d.departmentName, value: String(d.departmentId) })));
        }
        if (positionsRes.ok) {
          const data = await positionsRes.json();
          setPositions(data.map((p: { positionId: number; positionName: string }) => ({ label: p.positionName, value: String(p.positionId) })));
        }
        if (employmentTypesRes.ok) {
          const data = await employmentTypesRes.json();
          setEmploymentTypes(data.map((t: { employmentTypeId: number; employmentTypeName: string }) => ({ label: t.employmentTypeName, value: String(t.employmentTypeId) })));
        }
        if (employeesRes.ok) {
          const data = await employeesRes.json();
          setManagers(
            data.content.map((e: { employeeId: number; name: string; departmentName: string | null; positionName: string | null }) => ({
              label: `${e.name}${e.departmentName ? ` (${e.departmentName}${e.positionName ? ` ${e.positionName}` : ""})` : ""}`,
              value: String(e.employeeId),
            }))
          );
          const noToId: Record<string, number> = {};
          data.content.forEach((e: { employeeId: number; employeeNo: string }) => {
            if (e.employeeNo) noToId[e.employeeNo] = e.employeeId;
          });
          setEmployeeNoToId(noToId);
        }
      } catch (err) {
        console.error("Failed to fetch department/position options", err);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (document.getElementById("daum-postcode-script")) return;
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!addressSearchOpen || !addressLayerRef.current || !window.daum?.Postcode) return;
    addressLayerRef.current.innerHTML = "";
    new window.daum.Postcode({
      oncomplete: (data) => {
        updateEmployee("address")(data.roadAddress || data.jibunAddress);
        setAddressSearchOpen(false);
        document.getElementById("addressDetail")?.focus();
      },
      width: "100%",
      height: "100%",
    }).embed(addressLayerRef.current);
  }, [addressSearchOpen]);

  const openAddressSearch = () => {
    if (!window.daum?.Postcode) {
      window.alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setAddressSearchOpen(true);
  };

  const updateEmployee = (field: keyof typeof emptyEmployee) => (value: string) => {
    setEmployee((currentEmployee) => ({ ...currentEmployee, [field]: value }));
    if (value && fieldErrors.has(field)) {
      setFieldErrors((current) => {
        const next = new Set(current);
        next.delete(field);
        return next;
      });
    }
  };

  const handleSave = async () => {
    const missing = REQUIRED_FIELDS.filter((field) => !employee[field.key]);
    if (missing.length > 0) {
      setFieldErrors(new Set(missing.map((field) => field.key)));
      setError("필수 항목을 모두 입력해주세요.");
      const target = document.getElementById(missing[0].key);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus();
      return;
    }

    setFieldErrors(new Set());
    setError(null);
    setIsSubmitting(true);
    try {
      let profileImageUrl: string | null = null;
      if (profileImage) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", profileImage.file);
        const uploadRes = await fetch(`${API_BASE_URL}/employees/profile-image`, {
          method: "POST",
          headers: authHeaders(),
          body: uploadFormData,
        });
        if (!uploadRes.ok) throw new Error("프로필 사진 업로드에 실패했습니다.");
        profileImageUrl = ((await uploadRes.json()) as { url: string }).url;
      }

      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          departmentId: Number(employee.department),
          positionId: Number(employee.position),
          employmentTypeId: employee.employmentType ? Number(employee.employmentType) : null,
          managerId: employee.manager ? Number(employee.manager) : null,
          name: employee.name,
          birthDate: employee.birthDate,
          phone: employee.phone,
          email: employee.email,
          address: employee.address
            ? `${employee.address}${employee.addressDetail ? ` ${employee.addressDetail}` : ""}`
            : null,
          hireDate: employee.hireDate || null,
          password: employee.birthDate.replaceAll("-", ""),
          profileImage: profileImageUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "등록에 실패했습니다.");
      }

      const created = await res.json();
      const failedDocumentLabels: string[] = [];

      for (const [documentType, file] of Object.entries(documentFiles)) {
        const formData = new FormData();
        formData.append("documentType", documentType);
        formData.append("file", file);
        try {
          const documentRes = await fetch(`${API_BASE_URL}/employees/${created.employeeId}/documents`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
          });
          if (!documentRes.ok) {
            failedDocumentLabels.push(employeeDocumentTypeLabel(documentType));
          }
        } catch {
          failedDocumentLabels.push(employeeDocumentTypeLabel(documentType));
        }
      }

      alert(
        failedDocumentLabels.length > 0
          ? `직원이 등록되었습니다.\n초기 비밀번호는 생년월일 8자리입니다.\n다음 서류는 업로드에 실패했습니다: ${failedDocumentLabels.join(", ")}`
          : "직원이 등록되었습니다.\n초기 비밀번호는 생년월일 8자리입니다."
      );
      router.push("/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmployee(emptyEmployee);
    setProfileImage(null);
    setDocumentFiles({});
    setFileInputKey((currentKey) => currentKey + 1);
    setProfileImageInputKey((currentKey) => currentKey + 1);
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImageInputKey((currentKey) => currentKey + 1);
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfileImage({ name: file.name, file, preview: URL.createObjectURL(file) });
  };

  const handleDocumentFileChange = (documentType: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocumentFiles((current) => ({ ...current, [documentType]: file }));
  };

  const removeDocumentFile = (documentType: string) => {
    setDocumentFiles((current) => {
      const next = { ...current };
      delete next[documentType];
      return next;
    });
  };

  const downloadBulkTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["이름", "생년월일(YYYY-MM-DD)", "연락처", "이메일", "주소", "부서", "직급", "고용형태", "직속관리자 사번", "입사일(YYYY-MM-DD)"],
      ["홍길동", "1995-03-02", "010-1234-5678", "hong@example.com", "서울특별시 종로구", "개발팀", "사원", "정규직", "E2026001", "2026-07-01"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "직원등록");
    XLSX.writeFile(workbook, "직원_일괄등록_양식.xlsx");
  };

  const findOptionId = (options: Option[], label: string) => {
    const normalized = label.trim().toLowerCase();
    return options.find((option) => option.label.trim().toLowerCase() === normalized)?.value;
  };

  const handleBulkUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBulkUploading(true);
    setBulkResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      if (rows.length === 0) {
        setBulkResult({ total: 0, success: 0, failures: ["엑셀 파일에 데이터가 없습니다."] });
        return;
      }

      const items: Record<string, unknown>[] = [];
      const preValidationFailures: string[] = [];

      rows.forEach((row, index) => {
        const rowNo = index + 2;
        const name = String(row["이름"] ?? "").trim();
        const birthDate = String(row["생년월일(YYYY-MM-DD)"] ?? "").trim();
        const departmentName = String(row["부서"] ?? "").trim();
        const positionName = String(row["직급"] ?? "").trim();

        if (!name || !birthDate || !departmentName || !positionName) {
          preValidationFailures.push(`${rowNo}행: 이름/생년월일/부서/직급은 필수입니다.`);
          return;
        }

        const departmentId = findOptionId(departments, departmentName);
        const positionId = findOptionId(positions, positionName);
        if (!departmentId) {
          preValidationFailures.push(`${rowNo}행(${name}): "${departmentName}" 부서를 찾을 수 없습니다.`);
          return;
        }
        if (!positionId) {
          preValidationFailures.push(`${rowNo}행(${name}): "${positionName}" 직급을 찾을 수 없습니다.`);
          return;
        }

        const employmentTypeName = String(row["고용형태"] ?? "").trim();
        const managerEmployeeNo = String(row["직속관리자 사번"] ?? "").trim();
        const hireDate = String(row["입사일(YYYY-MM-DD)"] ?? "").trim();

        items.push({
          departmentId: Number(departmentId),
          positionId: Number(positionId),
          employmentTypeId: employmentTypeName ? findOptionId(employmentTypes, employmentTypeName) ?? null : null,
          managerId: managerEmployeeNo ? employeeNoToId[managerEmployeeNo] ?? null : null,
          name,
          birthDate,
          phone: String(row["연락처"] ?? "").trim() || null,
          email: String(row["이메일"] ?? "").trim() || null,
          address: String(row["주소"] ?? "").trim() || null,
          hireDate: hireDate || null,
          password: birthDate.replaceAll("-", ""),
        });
      });

      if (items.length === 0) {
        setBulkResult({ total: rows.length, success: 0, failures: preValidationFailures });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/employees/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("직원 일괄등록에 실패했습니다.");

      const results = (await res.json()) as { rowIndex: number; name: string; success: boolean; failureReason: string | null }[];
      const successCount = results.filter((result) => result.success).length;
      const failureMessages = results
        .filter((result) => !result.success)
        .map((result) => `${result.name || "(이름 없음)"}: ${result.failureReason}`);

      setBulkResult({
        total: rows.length,
        success: successCount,
        failures: [...preValidationFailures, ...failureMessages],
      });
    } catch (err) {
      setBulkResult({
        total: 0,
        success: 0,
        failures: [err instanceof Error ? err.message : "엑셀 파일을 처리하지 못했습니다."],
      });
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-8">
      <div className="space-y-6">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-200 text-indigo-700">♧</div>
          <div>
            <p className="text-sm font-extrabold">신규 직원 등록</p>
            <p className="text-xs text-indigo-500">필수 항목을 모두 입력한 뒤 등록하기를 눌러 등록을 완료하세요.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900">엑셀로 여러 명 한 번에 등록</p>
              <p className="mt-0.5 text-xs text-slate-400">양식을 내려받아 작성한 뒤 업로드하면 여러 직원을 한 번에 등록할 수 있습니다. (이름·생년월일·부서·직급은 필수)</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadBulkTemplate}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                ⇩ 양식 다운로드
              </button>
              <input
                ref={bulkInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleBulkUpload}
              />
              <button
                type="button"
                onClick={() => bulkInputRef.current?.click()}
                disabled={bulkUploading}
                className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {bulkUploading ? "등록 중..." : "⇧ 엑셀 업로드"}
              </button>
            </div>
          </div>

          {bulkResult && (
            <div className={`mt-4 rounded-lg border p-3 text-xs ${bulkResult.failures.length > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              <p className="font-bold">
                총 {bulkResult.total}건 중 {bulkResult.success}명 등록 성공
                {bulkResult.failures.length > 0 ? `, ${bulkResult.failures.length}건 실패` : ""}
              </p>
              {bulkResult.failures.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-amber-700">
                  {bulkResult.failures.map((message, index) => (
                    <li key={index}>· {message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <Card title="①  기본 정보" badge="* 표시 항목은 필수입니다">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="이름" name="name" value={employee.name} onChange={updateEmployee("name")} required placeholder="이름을 입력하세요" invalid={fieldErrors.has("name")} />
                <Input label="직원 번호" name="employeeNumber" value="" onChange={() => undefined} muted placeholder="등록 시 자동 생성됩니다" />
                <Input label="생년월일" name="birthDate" value={employee.birthDate} onChange={updateEmployee("birthDate")} required placeholder="YYYY-MM-DD" type="date" invalid={fieldErrors.has("birthDate")} />
                <div id="gender" tabIndex={-1}>
                  <span className="mb-2 block text-xs font-bold text-slate-700">
                    성별 <b className="text-rose-500">*</b>
                  </span>
                  <div className={`grid grid-cols-2 gap-2 rounded-lg ${fieldErrors.has("gender") ? "ring-1 ring-rose-300" : ""}`}>
                    {[
                      { label: "남성", value: "male" },
                      { label: "여성", value: "female" },
                    ].map((gender) => {
                      const selected = employee.gender === gender.value;
                      return (
                        <button
                          key={gender.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => updateEmployee("gender")(gender.value)}
                          className={`h-10 rounded-lg border text-sm font-bold transition ${
                            selected
                              ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                              : fieldErrors.has("gender")
                              ? "border-rose-400 bg-rose-50/40 text-slate-500 hover:border-rose-300"
                              : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-500"
                          }`}
                        >
                          {gender.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Input label="연락처" name="phone" value={employee.phone} onChange={updateEmployee("phone")} required placeholder="010-0000-0000" type="tel" invalid={fieldErrors.has("phone")} />
                <Input label="이메일" name="email" value={employee.email} onChange={updateEmployee("email")} required placeholder="email@example.com" type="email" invalid={fieldErrors.has("email")} />
                <div className="md:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-700">
                    주소 <b className="text-rose-500">*</b>
                  </span>
                  <div className="flex gap-2">
                    <div
                      id="address"
                      tabIndex={-1}
                      className={`flex h-10 flex-1 items-center rounded-lg border px-3 text-sm ${
                        fieldErrors.has("address")
                          ? "border-rose-400 bg-rose-50/40 ring-1 ring-rose-200"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <span className={employee.address ? "text-slate-900" : "text-slate-300"}>
                        {employee.address || "주소 검색 버튼을 눌러주세요"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={openAddressSearch}
                      className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    >
                      주소 검색
                    </button>
                  </div>
                  <div className="mt-3">
                    <Input
                      label="상세주소 (선택)"
                      name="addressDetail"
                      value={employee.addressDetail}
                      onChange={updateEmployee("addressDetail")}
                      placeholder="상세주소를 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="②  소속 및 고용 정보">
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="부서" name="department" value={employee.department} onChange={updateEmployee("department")} options={departments} placeholder="부서를 선택하세요" required invalid={fieldErrors.has("department")} />
                <Select label="직급" name="position" value={employee.position} onChange={updateEmployee("position")} options={positions} placeholder="직급을 선택하세요" required invalid={fieldErrors.has("position")} />
                <Select label="고용형태" name="employmentType" value={employee.employmentType} onChange={updateEmployee("employmentType")} options={employmentTypes} placeholder="고용형태를 선택하세요" />
                <SearchableSelect label="직속 관리자" value={employee.manager} onChange={updateEmployee("manager")} options={managers} placeholder="이름, 부서, 직급으로 검색" />
                <Input label="입사일" name="hireDate" value={employee.hireDate} onChange={updateEmployee("hireDate")} placeholder="YYYY-MM-DD" type="date" />
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card title="프로필 사진">
              <div className="text-center">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileImage.preview} alt={`${profileImage.name} 미리보기`} className="mx-auto h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-3xl font-bold text-slate-300">?</div>
                )}
                <p className="mt-4 text-sm font-bold">사진을 업로드하세요</p>
                <p className="text-xs text-slate-400">JPG, PNG 최대 2MB</p>
                {profileImage ? <p className="mt-2 truncate text-xs font-semibold text-indigo-600">{profileImage.name}</p> : null}
                <div className="mt-4 flex gap-2">
                  <label className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-sm hover:border-indigo-300 hover:text-indigo-600">
                    ⇧ 파일 선택
                    <input key={`profile-${profileImageInputKey}`} type="file" accept="image/png,image/jpeg" onChange={handleProfileImageChange} className="sr-only" />
                  </label>
                  {profileImage ? (
                    <button
                      type="button"
                      onClick={removeProfileImage}
                      className="flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      삭제
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
            <Card title="서류 첨부" badge="종류별 첨부">
              <div className="space-y-2">
                {EMPLOYEE_DOCUMENT_TYPE_OPTIONS.map((docType) => {
                  const file = documentFiles[docType.value];
                  return (
                    <div key={docType.value} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700">
                          {docType.label} {docType.required ? <b className="text-rose-500">*</b> : null}
                        </p>
                        {file ? (
                          <p className="mt-1 truncate text-xs font-semibold text-indigo-600">{file.name}</p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">선택된 파일 없음</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
                          {file ? "재선택" : "파일 선택"}
                          <input
                            key={`document-${docType.value}-${fileInputKey}`}
                            type="file"
                            onChange={handleDocumentFileChange(docType.value)}
                            className="sr-only"
                          />
                        </label>
                        {file ? (
                          <button
                            type="button"
                            onClick={() => removeDocumentFile(docType.value)}
                            className="text-rose-400 hover:text-rose-600"
                            aria-label={`${docType.label} 삭제`}
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4">
          <p className="text-xs text-slate-400">
            {error ? <span className="font-bold text-rose-500">{error}</span> : "ⓘ * 표시 항목은 모두 입력해야 등록이 가능합니다."}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/employees")} className="h-10 rounded-lg border border-slate-200 px-5 text-sm">취소</button>
            <button type="button" onClick={resetForm} className="h-10 rounded-lg border border-orange-200 bg-orange-50 px-5 text-sm font-bold text-orange-500">
              초기화
            </button>
            <button type="button" onClick={handleSave} disabled={isSubmitting} className="h-10 rounded-lg bg-indigo-600 px-7 text-sm font-bold text-white disabled:opacity-50">
              {isSubmitting ? "등록 중..." : "✓ 등록하기"}
            </button>
          </div>
        </div>
      </div>

      {addressSearchOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setAddressSearchOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">주소 검색</h3>
              <button
                type="button"
                onClick={() => setAddressSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="주소 검색 닫기"
              >
                ×
              </button>
            </div>
            <div ref={addressLayerRef} className="h-[450px] w-full" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
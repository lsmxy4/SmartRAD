"use client";

import { useEffect, useState } from "react";
import { XMarkIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CERTIFICATE_TYPE_OPTIONS } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

type Option = { label: string; value: string };

const inputClasses = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function CertificateRegisterModal({ onClose, onSaved }: Props) {
  const [employees, setEmployees] = useState<Option[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [certificateType, setCertificateType] = useState("EMPLOYMENT");
  const [purpose, setPurpose] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employees?page=0&size=1000`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(
            data.content.map((e: { employeeId: number; name: string; departmentName: string | null; positionName: string | null }) => ({
              label: `${e.name}${e.departmentName ? ` (${e.departmentName}${e.positionName ? ` ${e.positionName}` : ""})` : ""}`,
              value: String(e.employeeId),
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employeeId || !certificateType) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/certificate-issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          employeeId: Number(employeeId),
          certificateType,
          purpose: purpose || null,
          memo: memo || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "발급 신청에 실패했습니다.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "발급 신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            증명서 발급 신청
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div>
              <label className={labelClasses}>신청자 *</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required className={inputClasses}>
                <option value="">직원을 선택하세요</option>
                {employees.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>증명서 종류 *</label>
              <select value={certificateType} onChange={(e) => setCertificateType(e.target.value)} required className={inputClasses}>
                {CERTIFICATE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>용도</label>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="예: 은행 제출용" className={inputClasses} />
            </div>

            <div>
              <label className={labelClasses}>메모</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className={inputClasses} />
            </div>

            {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">취소</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "신청 중..." : "신청"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

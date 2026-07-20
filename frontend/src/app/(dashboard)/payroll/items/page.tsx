"use client";

import { useEffect, useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

interface PayrollItemMaster {
  payrollItemMasterId: number;
  itemName: string;
  itemTypeCode: "EARNING" | "DEDUCTION" | string;
  taxable: boolean;
  fixed: boolean;
  defaultAmount: number | null;
  rate: number | null;
  active: boolean;
}

interface ErrorResponse {
  code: string;
  message: string;
}

const TYPE_LABEL: Record<string, string> = {
  EARNING: "지급",
  DEDUCTION: "공제",
};

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatAmount(value: number | null) {
  return value == null ? "-" : `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatRate(value: number | null) {
  return value == null ? "-" : `${(value * 100).toFixed(2)}%`;
}

export default function PayrollItemsPage() {
  const [items, setItems] = useState<PayrollItemMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemTypeCode, setItemTypeCode] = useState<"EARNING" | "DEDUCTION">("EARNING");
  const [taxable, setTaxable] = useState(true);
  const [fixed, setFixed] = useState(true);
  const [defaultAmount, setDefaultAmount] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/payroll-items`, { headers: authHeaders() });
      if (!res.ok) throw new Error("급여항목 목록을 불러오지 못했습니다.");
      setItems(await res.json());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "급여항목 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openModal = () => {
    setItemName("");
    setItemTypeCode("EARNING");
    setTaxable(true);
    setFixed(true);
    setDefaultAmount("");
    setRate("");
    setModalError("");
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!itemName.trim()) {
      setModalError("항목명을 입력해주세요.");
      return;
    }
    setSaving(true);
    setModalError("");
    try {
      const res = await fetch(`${API_BASE_URL}/payroll-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          itemName: itemName.trim(),
          itemTypeCode,
          taxable,
          fixed,
          defaultAmount: defaultAmount.trim() ? Number(defaultAmount) : null,
          rate: rate.trim() ? Number(rate) / 100 : null,
        }),
      });
      if (!res.ok) {
        const body: ErrorResponse = await res.json();
        throw new Error(body.message || "급여항목 등록에 실패했습니다.");
      }
      setShowModal(false);
      await fetchItems();
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "급여항목 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">급여항목 관리</h1>
          <p className="mt-1 text-sm text-slate-500">급여 계산에 사용되는 지급/공제 항목을 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4" />
          새 항목 등록
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{errorMessage}</p>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">항목명</th>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">과세</th>
              <th className="px-4 py-3">고정</th>
              <th className="px-4 py-3">기본금액</th>
              <th className="px-4 py-3">비율</th>
              <th className="px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">불러오는 중...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">등록된 급여항목이 없습니다.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.payrollItemMasterId}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.itemName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                        item.itemTypeCode === "EARNING"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-rose-50 text-rose-600 ring-rose-200"
                      }`}
                    >
                      {TYPE_LABEL[item.itemTypeCode] ?? item.itemTypeCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.taxable ? "과세" : "비과세"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.fixed ? "고정" : "변동"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatAmount(item.defaultAmount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatRate(item.rate)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${item.active ? "bg-indigo-50 text-indigo-700 ring-indigo-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
                      {item.active ? "사용중" : "미사용"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-extrabold text-slate-900">급여항목 등록</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="space-y-1 text-sm font-semibold text-slate-700">
                <span>항목명</span>
                <input
                  value={itemName}
                  onChange={(event) => setItemName(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="예: 식대"
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-slate-700">
                <span>유형</span>
                <select
                  value={itemTypeCode}
                  onChange={(event) => setItemTypeCode(event.target.value as "EARNING" | "DEDUCTION")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="EARNING">지급</option>
                  <option value="DEDUCTION">공제</option>
                </select>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={taxable} onChange={(event) => setTaxable(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                  과세
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={fixed} onChange={(event) => setFixed(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                  고정 항목
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>기본금액</span>
                  <input
                    value={defaultAmount}
                    onChange={(event) => setDefaultAmount(event.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="예: 10000"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>비율(%)</span>
                  <input
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    placeholder="예: 4.5"
                  />
                </label>
              </div>
              {modalError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{modalError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                취소
              </button>
              <button
                type="button"
                onClick={handleCreate}
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


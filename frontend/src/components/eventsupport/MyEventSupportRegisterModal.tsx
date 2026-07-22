"use client";

import { useState } from "react";
import { XMarkIcon, GiftIcon } from "@heroicons/react/24/outline";
import { EVENT_TYPE_OPTIONS } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

const inputClasses = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function MyEventSupportRegisterModal({ onClose, onSaved }: Props) {
  const [eventType, setEventType] = useState("SELF_MARRIAGE");
  const [eventDate, setEventDate] = useState(todayString());
  const [requestAmount, setRequestAmount] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(requestAmount);
    if (!amount || amount <= 0) {
      setError("신청 금액을 올바르게 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("eventType", eventType);
      formData.append("eventDate", eventDate);
      formData.append("requestAmount", String(amount));
      if (reason) formData.append("reason", reason);
      if (file) formData.append("attachment", file);

      const res = await fetch(`${API_BASE_URL}/event-supports/me`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "경조비 신청에 실패했습니다.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "경조비 신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <GiftIcon className="w-5 h-5 text-blue-600" />
            경조비 신청
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div>
              <label className={labelClasses}>경조사 유형 *</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} required className={inputClasses}>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>경조사 일자 *</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className={inputClasses} />
            </div>

            <div>
              <label className={labelClasses}>신청 금액 *</label>
              <input
                type="number"
                min={1}
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                required
                placeholder="예: 500000"
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>상세 사유 <span className="text-gray-400 font-normal text-xs ml-1">(선택)</span></label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="경조사 관련 상세 내용을 입력해주세요." className={inputClasses} />
            </div>

            <div>
              <label className={labelClasses}>증빙 서류 <span className="text-gray-400 font-normal text-xs ml-1">(선택)</span></label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-600 hover:file:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-400">청첩장, 가족관계증명서, 사망진단서 등 (나중에 첨부해도 됩니다)</p>
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

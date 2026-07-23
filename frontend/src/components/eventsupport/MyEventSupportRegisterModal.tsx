"use client";

import { useState } from "react";
import { GiftIcon } from "@heroicons/react/24/outline";
import { EVENT_TYPE_OPTIONS, getPolicyAmount, formatAmount } from "./types";
import Modal, { ModalCancelButton, ModalPrimaryButton } from "@/components/common/Modal";

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
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("eventType", eventType);
      formData.append("eventDate", eventDate);
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
    <Modal
      icon={GiftIcon}
      title="경조비 신청"
      onClose={onClose}
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <ModalCancelButton onClick={onClose} />
          <ModalPrimaryButton type="submit" disabled={loading}>
            {loading ? "신청 중..." : "신청"}
          </ModalPrimaryButton>
        </>
      }
    >
            <div>
              <label className={labelClasses}>경조사 유형 *</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} required className={inputClasses}>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-sm text-blue-600 font-medium bg-blue-50 py-1.5 px-3 rounded-md border border-blue-100 flex items-center">
                <span>예상 지원 금액:</span>
                <span className="ml-auto font-bold text-base">{formatAmount(getPolicyAmount(eventType))}</span>
              </p>
            </div>

            <div>
              <label className={labelClasses}>경조사 일자 *</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className={inputClasses} />
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
    </Modal>
  );
}

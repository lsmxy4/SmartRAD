"use client";

import { useEffect, useState } from "react";
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import Modal, { ModalCancelButton, ModalPrimaryButton } from "@/components/common/Modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

interface Position {
  positionId: number;
  positionName: string;
  level: number;
}

interface LeavePolicy {
  leavePolicyId: number;
  positionId: number | null;
  positionName: string | null;
  annualLeaveDays: number | null;
  maxCarryOverDays: number | null;
  halfDayAllowed: boolean;
  note: string | null;
}

interface ErrorResponse {
  code: string;
  message: string;
}

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function LeavePoliciesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [positionId, setPositionId] = useState("");
  const [annualLeaveDays, setAnnualLeaveDays] = useState("15");
  const [maxCarryOverDays, setMaxCarryOverDays] = useState("5");
  const [halfDayAllowed, setHalfDayAllowed] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [positionsRes, policiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/positions`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/leave-policies`, { headers: authHeaders() }),
      ]);
      if (!positionsRes.ok || !policiesRes.ok) throw new Error("휴가정책 정보를 불러오지 못했습니다.");
      setPositions(await positionsRes.json());
      setPolicies(await policiesRes.json());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "휴가정책 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const availablePositions = positions.filter(
    (position) => !policies.some((policy) => policy.positionId === position.positionId),
  );

  const openModal = (policy?: LeavePolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setPositionId(String(policy.positionId));
      setAnnualLeaveDays(String(policy.annualLeaveDays ?? 0));
      setMaxCarryOverDays(String(policy.maxCarryOverDays ?? 0));
      setHalfDayAllowed(policy.halfDayAllowed);
      setNote(policy.note ?? "");
    } else {
      setEditingPolicy(null);
      setPositionId(availablePositions[0] ? String(availablePositions[0].positionId) : "");
      setAnnualLeaveDays("15");
      setMaxCarryOverDays("5");
      setHalfDayAllowed(true);
      setNote("");
    }
    setModalError("");
    setShowModal(true);
  };

  const deletePolicy = async (policy: LeavePolicy) => {
    if (!window.confirm(`${policy.positionName ?? "이 직책"}의 휴가정책을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/leave-policies/${policy.leavePolicyId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body: ErrorResponse = await res.json();
        throw new Error(body.message || "휴가정책 삭제에 실패했습니다.");
      }
      await fetchAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "휴가정책 삭제에 실패했습니다.");
    }
  };

  const handleSubmit = async () => {
    if (!positionId) {
      setModalError("직책을 선택해주세요.");
      return;
    }
    setSaving(true);
    setModalError("");
    try {
      const url = editingPolicy
        ? `${API_BASE_URL}/leave-policies/${editingPolicy.leavePolicyId}`
        : `${API_BASE_URL}/leave-policies`;
      const method = editingPolicy ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          positionId: Number(positionId),
          annualLeaveDays: Number(annualLeaveDays || "0"),
          maxCarryOverDays: Number(maxCarryOverDays || "0"),
          halfDayAllowed,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const body: ErrorResponse = await res.json();
        throw new Error(body.message || `휴가정책 ${editingPolicy ? "수정" : "등록"}에 실패했습니다.`);
      }
      setShowModal(false);
      await fetchAll();
    } catch (error) {
      setModalError(error instanceof Error ? error.message : `휴가정책 ${editingPolicy ? "수정" : "등록"}에 실패했습니다.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">휴가정책 관리</h1>
          <p className="mt-1 text-sm text-slate-500">직책별 연차 발생일수와 이월 한도를 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          disabled={availablePositions.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          새 정책 등록
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{errorMessage}</p>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">직책</th>
              <th className="px-4 py-3">연차 발생일수</th>
              <th className="px-4 py-3">이월 한도</th>
              <th className="px-4 py-3">반차 허용</th>
              <th className="px-4 py-3">비고</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">불러오는 중...</td>
              </tr>
            ) : policies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">등록된 휴가정책이 없습니다.</td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy.leavePolicyId}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{policy.positionName ?? "(삭제된 직책)"}</td>
                  <td className="px-4 py-3 text-slate-600">{policy.annualLeaveDays ?? "-"}일</td>
                  <td className="px-4 py-3 text-slate-600">{policy.maxCarryOverDays ?? "-"}일</td>
                  <td className="px-4 py-3 text-slate-600">{policy.halfDayAllowed ? "가능" : "불가"}</td>
                  <td className="px-4 py-3 text-slate-500">{policy.note ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(policy)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePolicy(policy)}
                        className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {showModal && (
        <Modal
          icon={CalendarDaysIcon}
          title={editingPolicy ? "휴가정책 수정" : "휴가정책 등록"}
          onClose={() => setShowModal(false)}
          footer={<>
            <ModalCancelButton onClick={() => setShowModal(false)} />
            <ModalPrimaryButton onClick={handleSubmit} disabled={saving}>{saving ? "저장 중..." : "저장"}</ModalPrimaryButton>
          </>}
        >
          <div className="space-y-5 py-2 px-1">
            <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
              <span>직책</span>
              <select
                value={positionId}
                onChange={(event) => setPositionId(event.target.value)}
                disabled={!!editingPolicy}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {editingPolicy ? (
                  <option value={editingPolicy.positionId || ""}>{editingPolicy.positionName}</option>
                ) : (
                  availablePositions.map((position) => (
                    <option key={position.positionId} value={position.positionId}>
                      {position.positionName}
                    </option>
                  ))
                )}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-5">
              <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
                <span>연차 발생일수</span>
                <input
                  value={annualLeaveDays}
                  onChange={(event) => setAnnualLeaveDays(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
                <span>이월 한도</span>
                <input
                  value={maxCarryOverDays}
                  onChange={(event) => setMaxCarryOverDays(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
            </div>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 py-1">
              <input
                type="checkbox"
                checked={halfDayAllowed}
                onChange={(event) => setHalfDayAllowed(event.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              반차 허용
            </label>
            <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
              <span>비고</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                placeholder="선택 입력"
              />
            </label>
            {modalError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 mt-2">{modalError}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

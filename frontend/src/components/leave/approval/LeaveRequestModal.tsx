"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { LeaveApprovalRow } from "./leaveApprovalTypes";
import { STATUS_LABELS } from "./leaveApprovalTypes";

function date(value: string) {
  return value?.slice(0, 10).replaceAll("-", ".") || "-";
}
function dateTime(value: string | null) {
  if (!value) return "-";
  return value.slice(0, 16).replace("T", " ").replaceAll("-", ".");
}
function period(row: LeaveApprovalRow) {
  return row.startDate === row.endDate ? date(row.startDate) : `${date(row.startDate)} ~ ${date(row.endDate)}`;
}

interface Props {
  mode: "detail" | "approve" | "bulk" | "reject";
  row?: LeaveApprovalRow;
  selectedRows?: LeaveApprovalRow[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm?: (rejectionReason?: string) => void;
}

export default function LeaveRequestModal({ mode, row, selectedRows = [], busy, error, onClose, onConfirm }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy, onClose]);

  const title = mode === "detail" ? "휴가 신청 상세" : mode === "approve" ? "휴가 승인 확인" : mode === "bulk" ? "선택 일괄 승인" : "휴가 반려";

  const handleConfirm = () => {
    if (mode === "reject") {
      if (!rejectionReason.trim()) {
        setRejectionError("반려 사유를 입력해주세요.");
        return;
      }
      setRejectionError(null);
      onConfirm?.(rejectionReason.trim());
      return;
    }
    onConfirm?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="leave-modal-title">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="leave-modal-title" className="text-lg font-bold text-gray-900">{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} disabled={busy} aria-label="닫기" className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          {mode === "bulk" ? (
            <>
              <p className="text-sm text-gray-600">선택한 <strong className="text-gray-900">{selectedRows.length}건</strong>을 승인하시겠습니까?</p>
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                {selectedRows.slice(0, 4).map((item) => item.employeeName).join(", ")}
                {selectedRows.length > 4 ? ` 외 ${selectedRows.length - 4}명` : ""}
              </div>
            </>
          ) : row && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Info label="직원" value={`${row.employeeName}${row.employeeNo ? ` (${row.employeeNo})` : ""}`} />
                <Info label="부서 / 직급" value={`${row.departmentName || "-"} / ${row.positionName || "-"}`} />
                <Info label="휴가 유형" value={row.leaveTypeName} />
                <Info label="휴가 기간" value={period(row)} />
                <Info label="사용 일수" value={`${row.leaveDays}일`} />
                <Info label="신청일" value={date(row.createdAt)} />
                <Info label="상태" value={STATUS_LABELS[row.status]} />
                <Info label="승인자" value={row.approverName || "-"} />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">신청 사유</p>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{row.reason || "-"}</p>
              </div>
              {mode === "detail" && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Info label="이메일" value={row.email || "-"} />
                  <Info label="처리일" value={dateTime(row.processedAt)} />
                  <Info label="반려 사유" value={row.rejectionReason || "-"} />
                </div>
              )}
              {mode === "approve" && <p className="text-sm font-medium text-gray-700">이 휴가 신청을 승인하시겠습니까?</p>}
              {mode === "reject" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500" htmlFor="rejection-reason">반려 사유 *</label>
                  <textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="반려 사유를 입력하세요"
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {rejectionError && <p className="mt-1 text-xs text-rose-600">{rejectionError}</p>}
                </div>
              )}
            </>
          )}
          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">닫기</button>
          {mode !== "detail" && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${mode === "reject" ? "bg-rose-600 hover:bg-rose-700" : "bg-[#4A5DDF] hover:bg-blue-700"}`}
            >
              {busy ? "처리 중..." : mode === "bulk" ? "선택 승인" : mode === "reject" ? "반려" : "승인"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">{value}</p>
    </div>
  );
}

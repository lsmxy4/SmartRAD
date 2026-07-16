"use client";

import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { LeaveApprovalRow } from "./leaveApprovalTypes";
import { STATUS_LABELS } from "./leaveApprovalTypes";

function date(value: string) { return value?.slice(0, 10).replaceAll("-", ".") || "-"; }
function period(row: LeaveApprovalRow) { return row.startDate === row.endDate ? date(row.startDate) : `${date(row.startDate)} ~ ${date(row.endDate)}`; }
interface Props { mode: "detail" | "approve" | "bulk" | "reject"; row?: LeaveApprovalRow; selectedRows?: LeaveApprovalRow[]; busy: boolean; error: string | null; onClose: () => void; onConfirm?: () => void; }

export default function LeaveRequestModal({ mode, row, selectedRows = [], busy, error, onClose, onConfirm }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", handleKey); return () => window.removeEventListener("keydown", handleKey); }, [busy, onClose]);
  const title = mode === "detail" ? "휴가 신청 상세" : mode === "approve" ? "휴가 승인 확인" : mode === "bulk" ? "선택 일괄 승인" : "휴가 반려";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="leave-modal-title"><div className="w-full max-w-lg rounded-xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-gray-100 px-6 py-4"><h2 id="leave-modal-title" className="text-lg font-bold text-gray-900">{title}</h2><button ref={closeRef} type="button" onClick={onClose} disabled={busy} aria-label="닫기" className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button></div><div className="space-y-4 p-6">
    {mode === "bulk" ? <><p className="text-sm text-gray-600">선택한 <strong className="text-gray-900">{selectedRows.length}건</strong>을 승인하시겠습니까?</p><div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{selectedRows.slice(0, 4).map((item) => item.employeeName).join(", ")}{selectedRows.length > 4 ? ` 외 ${selectedRows.length - 4}명` : ""}</div></> : row && <><div className="grid grid-cols-2 gap-4 text-sm"><Info label="직원" value={`${row.employeeName}${row.employeeNo ? ` (${row.employeeNo})` : ""}`} /><Info label="부서 / 직급" value={`${row.departmentName || "-"} / ${row.positionName || "-"}`} /><Info label="휴가 유형" value={row.leaveTypeName} /><Info label="휴가 기간" value={period(row)} /><Info label="사용 일수" value={`${row.leaveDays}일`} /><Info label="신청일" value={date(row.createdAt)} /><Info label="상태" value={STATUS_LABELS[row.status]} /><Info label="승인자" value={row.approverName || "-"} /></div><div><p className="mb-1 text-xs font-medium text-gray-500">신청 사유</p><p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{row.reason || "-"}</p></div>{mode === "detail" && <div className="grid grid-cols-2 gap-4 text-sm"><Info label="이메일" value={row.email || "-"} /><Info label="처리일" value="-" /><Info label="반려 사유" value="-" /><Info label="수정일" value="-" /></div>}{mode === "approve" && <p className="text-sm font-medium text-gray-700">이 휴가 신청을 승인하시겠습니까?</p>}{mode === "reject" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">현재 백엔드 반려 API는 반려 사유를 전달하거나 저장할 수 없습니다. 반려 기능은 API 보강 후 연결할 수 있습니다.</div>}</>}
    {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  </div><div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">닫기</button>{mode !== "detail" && mode !== "reject" && <button type="button" onClick={onConfirm} disabled={busy} className="rounded-md bg-[#4A5DDF] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "처리 중..." : mode === "bulk" ? "선택 승인" : "승인"}</button>}</div></div></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-1 font-medium text-gray-900">{value}</p></div>; }

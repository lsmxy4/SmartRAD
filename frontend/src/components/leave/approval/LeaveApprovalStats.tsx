import { CheckCircleIcon, ClipboardDocumentListIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import type { LeaveApprovalRow } from "./leaveApprovalTypes";

export default function LeaveApprovalStats({ rows, loading }: { rows: LeaveApprovalRow[]; loading: boolean }) {
  const cards = [
    { label: "전체 신청", value: rows.length, icon: ClipboardDocumentListIcon, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "승인 대기", value: rows.filter((row) => row.status === "PENDING").length, icon: ClockIcon, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "승인 완료", value: rows.filter((row) => row.status === "APPROVED").length, icon: CheckCircleIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "반려", value: rows.filter((row) => row.status === "REJECTED").length, icon: XCircleIcon, color: "text-rose-600", bg: "bg-rose-50" },
  ];
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div><p className={`text-sm font-medium ${card.color}`}>{card.label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{loading ? "-" : `${card.value}건`}</p></div><div className={`flex h-13 w-13 items-center justify-center rounded-full ${card.bg} ${card.color}`}><Icon className="h-6 w-6" /></div></div>; })}</div>;
}

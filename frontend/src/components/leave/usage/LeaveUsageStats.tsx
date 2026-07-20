import { CalendarDaysIcon, CheckBadgeIcon, ClipboardDocumentCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import type { UsageSummary } from "./leaveUsageTypes";
import { formatDays } from "./leaveUsageUtils";

export default function LeaveUsageStats({ summary, loading }: { summary: UsageSummary; loading: boolean }) { const cards = [
  { label: "전체 직원", value: `${summary.employeeCount}명`, note: "재직 직원 기준", icon: UserGroupIcon, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "전체 연차 지급", value: `${formatDays(summary.totalGranted)}일`, note: "현재 잔액 합계", icon: CalendarDaysIcon, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "전체 연차 사용", value: `${formatDays(summary.totalUsed)}일`, note: `사용률 ${summary.usageRate}%`, icon: ClipboardDocumentCheckIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "전체 연차 잔여", value: `${formatDays(summary.totalRemaining)}일`, note: `잔여율 ${summary.remainingRate}%`, icon: CheckBadgeIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
]; return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => { const Icon=card.icon; return <div key={card.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div><p className="text-sm font-medium text-gray-500">{card.label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{loading ? "-" : card.value}</p><p className="mt-1 text-xs text-gray-400">{loading ? "" : card.note}</p></div><div className={`flex h-13 w-13 items-center justify-center rounded-full ${card.bg} ${card.color}`}><Icon className="h-6 w-6" /></div></div>; })}</div>; }

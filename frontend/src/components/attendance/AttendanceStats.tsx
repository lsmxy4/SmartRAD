import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type { AttendanceCounts } from "./types";

export default function AttendanceStats({ counts }: { counts: AttendanceCounts }) {
  const ratio = (value: number) =>
    counts.totalEmployees > 0 ? `${Math.round((value / counts.totalEmployees) * 100)}%` : "0%";
  const cards = [
    { label: "전체 직원", value: counts.totalEmployees, icon: UserGroupIcon, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "정상 출근", value: counts.normal, ratio: ratio(counts.normal), icon: CheckCircleIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "지각", value: counts.late, ratio: ratio(counts.late), icon: ClockIcon, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "결근", value: counts.absent, ratio: ratio(counts.absent), icon: ExclamationCircleIcon, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "휴가", value: counts.leave, ratio: ratio(counts.leave), icon: CalendarDaysIcon, color: "text-sky-600", bg: "bg-sky-50" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${card.bg} ${card.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{card.value}<span className="ml-0.5 text-base">명</span></p>
                {card.ratio && <span className={`text-xs font-semibold ${card.color}`}>{card.ratio}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

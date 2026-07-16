"use client";

import {
  BellAlertIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import type { AttendanceCounts } from "./types";

interface Props { counts: AttendanceCounts; lastUpdated: string | null; onRegister: () => void; }

export default function AttendanceSidePanel({ counts, lastUpdated, onRegister }: Props) {
  const chartTotal = counts.normal + counts.late + counts.absent + counts.leave;
  let offset = 0;
  const segments = [
    { label: "정상출근", value: counts.normal, color: "#10b981" },
    { label: "지각", value: counts.late, color: "#f59e0b" },
    { label: "결근", value: counts.absent, color: "#f43f5e" },
    { label: "휴가", value: counts.leave, color: "#0ea5e9" },
  ];
  const stops = segments.map((segment) => {
    const start = offset;
    offset += chartTotal > 0 ? (segment.value / chartTotal) * 100 : 0;
    return `${segment.color} ${start}% ${offset}%`;
  }).join(", ");
  const chartBackground = chartTotal > 0 ? `conic-gradient(${stops})` : "#e5e7eb";
  const checkedIn = counts.normal + counts.late;
  const notCheckedIn = counts.totalEmployees >= chartTotal ? counts.totalEmployees - chartTotal : null;
  const actionClass = "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition";

  return (
    <aside className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">출결 현황</h2>
        <div className="relative mx-auto my-5 h-36 w-36 rounded-full" style={{ background: chartBackground }}>
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white"><span className="text-xs text-gray-500">전체</span><strong className="text-2xl text-gray-900">{chartTotal}명</strong></div>
        </div>
        <div className="space-y-2.5">{segments.map((item) => <div key={item.label} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong className="text-gray-900">{item.value}명</strong></div>)}</div>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="text-base font-bold text-gray-900">실시간 현황</h2><span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />LIVE</span></div>
        <div className="mt-4 space-y-2"><div className="flex items-center justify-between rounded-lg bg-indigo-50 p-3"><div><p className="text-xs text-gray-500">현재 출근 인원</p><p className="mt-1 text-xl font-bold text-gray-900">{checkedIn}명</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 text-indigo-600"><UserPlusIcon className="h-5 w-5" /></div></div><div className="flex items-center justify-between rounded-lg bg-amber-50 p-3"><div><p className="text-xs text-gray-500">미출근 인원</p><p className="mt-1 text-xl font-bold text-gray-900">{notCheckedIn === null ? '-' : `${notCheckedIn}명`}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 text-amber-600"><UserMinusIcon className="h-5 w-5" /></div></div></div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400"><ClockIcon className="h-4 w-4" />마지막 업데이트 {lastUpdated || '-'}</p>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">빠른 작업</h2><div className="space-y-2">
          <button type="button" onClick={onRegister} className={`${actionClass} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}><span className="flex items-center gap-2"><ClockIcon className="h-4 w-4" />수동 출근 등록</span><span aria-hidden="true">›</span></button>
          <button type="button" onClick={() => window.alert("결근자 알림 기능 준비 중입니다.")} className={`${actionClass} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`}><span className="flex items-center gap-2"><BellAlertIcon className="h-4 w-4" />결근자 알림 발송</span><span aria-hidden="true">›</span></button>
          <button type="button" onClick={() => window.print()} className={`${actionClass} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}><span className="flex items-center gap-2"><DocumentArrowDownIcon className="h-4 w-4" />근태 보고서 출력</span><span aria-hidden="true">›</span></button>
        </div>
      </section>
    </aside>
  );
}

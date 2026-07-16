"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  BellIcon,
  ClockIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { dashboardMenuGroups } from "@/lib/dashboardMenu";

const flatItems = dashboardMenuGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupTitle: group.title }))
);

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const current = flatItems.find((item) => item.href === pathname) ?? flatItems[0];
  const isDailyAttendance = pathname === "/attendance/daily";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{current.name}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <span>홈</span>
          {current.groupTitle !== "메인" && (
            <>
              <span>&gt;</span>
              <span>{current.groupTitle}</span>
            </>
          )}
          <span>&gt;</span>
          <span className="text-blue-600 font-medium">{current.name}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <BellIcon className="w-5 h-5" />
        </button>
        {isDailyAttendance ? (
          <>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("attendance:export"))}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              내보내기
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("attendance:register"))}
              className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <ClockIcon className="h-4 w-4" />
              근태 등록
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/employees/new")}
            className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlusIcon className="w-4 h-4" />
            직원 등록
          </button>
        )}
      </div>
    </header>
  );
}

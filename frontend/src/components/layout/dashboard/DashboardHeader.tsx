"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  ArrowDownTrayIcon,
  BellIcon,
  PlusIcon,
  ClockIcon,
  ArrowPathIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline"

import { dashboardMenuGroups } from "@/lib/dashboardMenu"

const flatItems = dashboardMenuGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupTitle: group.title })),
)

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number)
  const next = new Date(year, monthNumber - 1 + amount, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
}

export default function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const current =
    flatItems.find((item) => item.href === pathname) ?? flatItems[0]
  const isDailyAttendance = pathname === "/attendance/daily"
  const isSelfAttendance = pathname === "/attendance/self"
  const isMyAttendance = pathname === "/attendance/my"
  const isMyLeave = pathname === "/leave/my"
  const isLeaveApproval = pathname === "/leave/approve"
  const isLeaveUsage = pathname === "/leave/status"
  const [monthlySelection, setMonthlySelection] = useState(currentMonth)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const storedRole = window.localStorage.getItem("role") ?? window.sessionStorage.getItem("role")
    setRole(storedRole)
    
    const handleSync = (event: Event) => {
      const { month } = (event as CustomEvent<{ month: string }>).detail
      setMonthlySelection(month)
    }
    window.addEventListener("attendance:monthly-sync", handleSync)
    return () =>
      window.removeEventListener("attendance:monthly-sync", handleSync)
  }, [])

  const changeMonth = (amount: number) => {
    const month = shiftMonth(monthlySelection, amount)
    setMonthlySelection(month)
    window.dispatchEvent(
      new CustomEvent("attendance:monthly-change", { detail: { month } }),
    )
  }

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

        {isSelfAttendance ? (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("attendance:self-refresh"))
            }
            className="flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:px-4"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span className="hidden sm:inline">오늘 기록 새로고침</span>
          </button>
        ) : pathname === "/appointments" ? (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("appointment:register"))
            }
            className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            신규 발령 등록
          </button>
        ) : isDailyAttendance ? (
          <>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("attendance:export"))
              }
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              내보내기
            </button>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("attendance:register"))
              }
              className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <ClockIcon className="h-4 w-4" />
              근태 등록
            </button>
          </>
        ) : pathname === "/certificates" ? (
          <>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("certificate:export"))
              }
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              일괄 다운로드
            </button>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("certificate:register"))
              }
              className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              발급 신청
            </button>
          </>
        ) : pathname === "/notices" ? (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("notice:register"))
            }
            className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            공지사항 등록
          </button>
        ) : isLeaveApproval ? (
          <>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("leave:approval-export"))
              }
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              내보내기
            </button>

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("leave:approval-pending"))
              }
              className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <ClockIcon className="h-4 w-4" />
              승인 대기만 보기
            </button>
          </>
        ) : isLeaveUsage ? (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("leave:usage-report"))
            }
            className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            리포트 출력
          </button>
        ) : isMyAttendance || isMyLeave ? null : (
          role === "ADMIN" && (
            <button
              type="button"
              onClick={() => router.push("/employees/new")}
              className="flex items-center gap-2 bg-[#4A5DDF] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <UserPlusIcon className="w-4 h-4" />
              직원 등록
            </button>
          )
        )}
      </div>
    </header>
  )
}

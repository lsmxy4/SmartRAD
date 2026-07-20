"use client";

import { useEffect, useState } from "react";
import { ClipboardDocumentListIcon, ViewfinderCircleIcon, CalendarDaysIcon, EyeIcon } from "@heroicons/react/24/outline";
import type { NoticePage, NoticeSummary } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function NoticeStats({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<NoticeSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/notices?page=0&size=1000`, { headers: authHeaders() });
        if (res.ok) {
          const json = (await res.json()) as NoticePage;
          if (!cancelled) setRows(json.content);
        } else if (!cancelled) {
          setRows(null);
        }
      } catch {
        if (!cancelled) setRows(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const total = rows?.length ?? null;
  const pinned = rows?.filter((r) => r.pinned).length ?? null;
  const thisMonth = currentYearMonth();
  const monthly = rows?.filter((r) => r.createdAt.startsWith(thisMonth)).length ?? null;
  const totalViews = rows?.reduce((sum, r) => sum + r.viewCount, 0) ?? null;

  const cards = [
    { label: "전체 공지", value: total === null ? "-" : `${total}건`, description: "전체 등록 공지", icon: ClipboardDocumentListIcon, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
    { label: "상단 고정", value: pinned === null ? "-" : `${pinned}건`, description: "중요 공지", icon: ViewfinderCircleIcon, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
    { label: "이번달 등록", value: monthly === null ? "-" : `${monthly}건`, description: "이번달 신규 공지", icon: CalendarDaysIcon, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "총 조회수", value: totalViews === null ? "-" : `${totalViews}회`, description: "전체 공지 조회 합계", icon: EyeIcon, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`bg-white rounded-xl border ${stat.border} p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{stat.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowsRightLeftIcon, BuildingOffice2Icon, ArrowTrendingUpIcon, Square3Stack3DIcon } from "@heroicons/react/24/outline";
import type { AppointmentPage, AppointmentResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AppointmentStats({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<AppointmentResponse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/appointments/search?page=0&size=1000&yearMonth=${currentYearMonth()}`,
          { headers: authHeaders() }
        );
        if (res.ok) {
          const json = (await res.json()) as AppointmentPage;
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
  const transferCount = rows?.filter((r) => r.appointmentType === "TRANSFER").length ?? null;
  const promotionCount = rows?.filter((r) => r.appointmentType === "PROMOTION").length ?? null;
  const otherCount = rows ? rows.length - (transferCount ?? 0) - (promotionCount ?? 0) : null;

  const cards = [
    {
      label: "이번달 총 발령",
      value: total === null ? "-" : `${total}건`,
      icon: ArrowsRightLeftIcon,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "부서 이동",
      value: transferCount === null ? "-" : `${transferCount}건`,
      icon: BuildingOffice2Icon,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "직급 승진",
      value: promotionCount === null ? "-" : `${promotionCount}건`,
      icon: ArrowTrendingUpIcon,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "기타 발령",
      value: otherCount === null ? "-" : `${otherCount}건`,
      icon: Square3Stack3DIcon,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import type { CertificateIssuePage, CertificateIssueResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function CertificateStats({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<CertificateIssueResponse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/certificate-issues/search?page=0&size=1000`, { headers: authHeaders() });
        if (res.ok) {
          const json = (await res.json()) as CertificateIssuePage;
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

  const thisMonth = currentYearMonth();
  const monthlyRows = rows?.filter((r) => r.applicationDate.startsWith(thisMonth)) ?? null;
  const monthlyTotal = monthlyRows?.length ?? null;
  const completed = rows?.filter((r) => r.issueStatus === "ISSUED").length ?? null;
  const pending = rows?.filter((r) => r.approvalStatus === "PENDING" || (r.approvalStatus === "APPROVED" && r.issueStatus !== "ISSUED")).length ?? null;
  const rejected = rows?.filter((r) => r.approvalStatus === "REJECTED").length ?? null;

  const cards = [
    {
      label: "이번달 신청 건수",
      value: monthlyTotal === null ? "-" : `${monthlyTotal}건`,
      icon: DocumentTextIcon,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "처리 완료",
      value: completed === null ? "-" : `${completed}건`,
      icon: CheckCircleIcon,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "처리 대기",
      value: pending === null ? "-" : `${pending}건`,
      icon: ClockIcon,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "반려",
      value: rejected === null ? "-" : `${rejected}건`,
      icon: XCircleIcon,
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

"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = window.localStorage.getItem("role") ?? window.sessionStorage.getItem("role");
    setRole(storedRole);
  }, []);

  if (!role) {
    return <div className="text-center py-10 text-gray-500">로딩 중...</div>;
  }

  return role === "ADMIN" ? <AdminDashboard /> : <EmployeeDashboard />;
}

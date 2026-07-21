"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dashboardMenuGroups } from "@/lib/dashboardMenu";
import { isAdmin } from "@/lib/auth";

const adminOnlyPaths = dashboardMenuGroups
  .flatMap((group) => group.items)
  .filter((item) => item.adminOnly)
  .map((item) => item.href);

const employeePaths = dashboardMenuGroups
  .flatMap((group) => group.items)
  .filter((item) => !item.adminOnly)
  .map((item) => item.href);

function isAdminOnlyPath(pathname: string) {
  // `/notices/view` is an employee route nested below the administrator's
  // `/notices` route, so public routes must win before prefix matching.
  if (employeePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return false;
  }
  return adminOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function RoleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (isAdminOnlyPath(pathname) && !isAdmin()) {
      setBlocked(true);
      router.replace("/dashboard");
    } else {
      setBlocked(false);
    }
  }, [pathname, router]);

  if (!blocked) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">접근 권한이 없습니다</h2>
        <p className="mt-2 text-sm text-slate-500">관리자만 접근할 수 있는 페이지입니다.</p>
      </div>
    </div>
  );
}

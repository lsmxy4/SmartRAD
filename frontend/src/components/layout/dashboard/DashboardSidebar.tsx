"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRightStartOnRectangleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { dashboardMenuGroups as menuGroups } from "@/lib/dashboardMenu";
import { clearAuthStorage, isAdmin } from "@/lib/auth";
import Logo from "@/components/ui/Logo";
import Modal, { ModalCancelButton, ModalPrimaryButton } from "@/components/common/Modal";

function getStoredValue(key: string) {
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export default function DashboardSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setEmployeeName(getStoredValue("employeeName") ?? "");
    setEmployeeEmail(getStoredValue("employeeEmail") ?? "");
    setAdmin(isAdmin());
  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    setShowLogoutConfirm(false);
    router.push("/login");
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items
      .filter(item => admin ? !("userOnly" in item && item.userOnly) : !item.adminOnly)
      .filter(item => item.name.includes(searchQuery))
  })).filter(group => group.items.length > 0);

  return (
    <>
      <button
        type="button"
        aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
        className="dashboard-menu-toggle"
      >
        {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
      </button>

      {mobileOpen && <button type="button" aria-label="메뉴 닫기" className="dashboard-sidebar-backdrop" onClick={closeMobileSidebar} />}

      <aside className={`dashboard-sidebar w-64 bg-[#0B1120] text-gray-300 min-h-screen flex flex-col fixed h-full ${mobileOpen ? "dashboard-sidebar-open" : ""}`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 shrink-0">
        <span className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
            <Logo className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">SmartHR</span>
        </span>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          title="로그아웃"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-[#1A2234] hover:text-white transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-4 flex-1 overflow-y-auto dark-scrollbar pb-24">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="메뉴 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A2234] border border-gray-700 rounded-md py-2 px-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          />
        </div>

        {filteredGroups.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            검색 결과가 없습니다.
          </div>
        ) : (
          filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={groupIdx === 0 && group.title === "메인" ? "mb-6" : "mb-6"}>
              {group.title !== "메인" && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      onClick={closeMobileSidebar}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? "bg-[#1A2234] text-white border-l-2 border-blue-500"
                          : "hover:bg-[#1A2234] hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-blue-500" : ""}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-800 p-4 absolute bottom-0 w-64 bg-[#0B1120] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {employeeName ? employeeName.charAt(0) : "관"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{employeeName || "시스템 관리자"}</p>
            <p className="text-xs text-gray-400 truncate">{employeeEmail || "admin@smarthr.com"}</p>
          </div>
        </div>
      </div>
    </aside>

      {showLogoutConfirm && (
        <Modal
          icon={ArrowRightStartOnRectangleIcon}
          iconColor="rose"
          title="로그아웃"
          subtitle="정말로 로그아웃 하시겠습니까?"
          onClose={() => setShowLogoutConfirm(false)}
          maxWidth="sm"
          bodyClassName="hidden"
          footer={
            <>
              <ModalCancelButton onClick={() => setShowLogoutConfirm(false)} />
              <ModalPrimaryButton tone="rose" onClick={handleLogout}>로그아웃</ModalPrimaryButton>
            </>
          }
        >
          {null}
        </Modal>
      )}
    </>
  );
}

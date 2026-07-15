import Link from "next/link";
import Logo from "@/components/ui/Logo";

const menuGroups = [
  {
    title: "",
    items: [{ label: "대시보드", href: "/dashboard", icon: "⌘" }],
  },
  {
    title: "인사 관리",
    items: [
      { label: "직원 목록 조회", href: "/dashboard/employees", icon: "♧" },
      { label: "신규 직원 등록", href: "/dashboard/employees/new", icon: "♧" },
      { label: "인사 발령 관리", href: "/dashboard/appointments", icon: "⇄" },
      { label: "제증명서 관리", href: "/dashboard/certificates", icon: "▤" },
    ],
  },
  {
    title: "근태 및 휴가 관리",
    items: [
      { label: "일일 근태 현황", href: "/dashboard/attendance", icon: "◷" },
      { label: "월간 근태 통계", href: "/dashboard/attendance/monthly", icon: "▤" },
      { label: "휴가 승인/관리", href: "/dashboard/vacations", icon: "▧" },
      { label: "휴가 사용 현황", href: "/dashboard/vacations/usage", icon: "▦" },
    ],
  },
  {
    title: "급여 관리",
    items: [
      { label: "급여 기본정보 관리", href: "/dashboard/payroll/base", icon: "⌘" },
      { label: "급여 계산", href: "/dashboard/payroll/calculate", icon: "▣" },
      { label: "급여 지급 처리", href: "/dashboard/payroll/payment", icon: "▭" },
      { label: "급여 대장 조회", href: "/dashboard/payroll/ledger", icon: "▤" },
    ],
  },
  {
    title: "사내 소통",
    items: [{ label: "공지사항 관리", href: "/dashboard/notices", icon: "☞" }],
  },
];

export default function DashboardShell({ children, activePath = "/dashboard" }: { children: React.ReactNode; activePath?: string }) {
  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[210px] flex-col bg-[#080e1d] text-slate-400 shadow-2xl md:flex">
        <div className="flex h-[54px] items-center gap-2 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600">
            <Logo className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-white">SmartHR</span>
        </div>
        <div className="px-4 pb-3">
          <div className="flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-[11px] text-slate-500">
            <span>⌕</span>
            <span>메뉴 검색...</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto border-t border-white/10 py-2">
          {menuGroups.map((group) => (
            <div key={group.title || "root"} className="border-b border-white/10 py-2 last:border-b-0">
              {group.title ? <p className="px-4 pb-1 text-[10px] font-semibold text-slate-600">{group.title}</p> : null}
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const active = activePath === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex h-9 items-center gap-3 rounded-md px-3 text-[12px] font-medium transition ${
                        active
                          ? "border border-indigo-500/40 bg-indigo-500/15 text-white shadow-[inset_0_0_20px_rgba(79,70,229,0.12)]"
                          : "hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span className={active ? "text-indigo-300" : "text-slate-500"}>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">관</div>
            <div>
              <p className="text-xs font-bold text-white">시스템 관리자</p>
              <p className="text-[10px] text-slate-500">admin@smarthr.com</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="md:pl-[210px]">{children}</div>
    </div>
  );
}
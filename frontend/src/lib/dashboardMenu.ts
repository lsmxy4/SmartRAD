import {
  UsersIcon,
  UserIcon,
  HomeIcon,
  UserPlusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  BanknotesIcon,
  MegaphoneIcon,
  FingerPrintIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

export const dashboardMenuGroups = [
  {
    title: "메인",
    items: [
      { name: "대시보드", href: "/dashboard", icon: HomeIcon, adminOnly: false }
    ]
  },
  {
    title: "인사 관리",
    items: [
      { name: "내 정보(프로필) 조회", href: "/profile", icon: UserIcon, adminOnly: false },
      { name: "직원 목록 조회", href: "/employees", icon: UsersIcon, adminOnly: false },
      { name: "제증명서 신청/조회", href: "/certificates/my", icon: DocumentTextIcon, adminOnly: false, userOnly: true },
      { name: "신규 직원 등록", href: "/employees/new", icon: UserPlusIcon, adminOnly: true },
      { name: "인사 발령 관리", href: "/appointments", icon: ArrowPathIcon, adminOnly: true },
      { name: "제증명서 관리", href: "/certificates", icon: DocumentTextIcon, adminOnly: true },
    ]
  },
  {
    title: "근태 및 휴가 관리",
    items: [
      { name: "내 근태 체크", href: "/attendance/self", icon: FingerPrintIcon, adminOnly: false },
      { name: "내 근태 현황", href: "/attendance/my", icon: CalendarDaysIcon, adminOnly: false, userOnly: true },
      { name: "휴가 신청/내역 조회", href: "/leave/my", icon: CalendarIcon, adminOnly: false, userOnly: true },
      { name: "일일 근태 현황", href: "/attendance/daily", icon: ClockIcon, adminOnly: true },
      { name: "월간 근태 통계", href: "/attendance/monthly", icon: ChartBarIcon, adminOnly: true },
      { name: "휴가 승인/관리", href: "/leave/approve", icon: CheckBadgeIcon, adminOnly: true },
      { name: "휴가 사용 현황", href: "/leave/status", icon: CalendarIcon, adminOnly: true },
      { name: "휴가정책 관리", href: "/leave/policies", icon: AdjustmentsHorizontalIcon, adminOnly: true },
    ]
  },
  {
    title: "급여 관리",
    items: [
      { name: "내 급여 명세서", href: "/payroll/mine", icon: ReceiptPercentIcon, adminOnly: false },
      { name: "급여 기본정보 관리", href: "/payroll/basic", icon: CurrencyDollarIcon, adminOnly: true },
      { name: "급여 계산", href: "/payroll/calculate", icon: CalculatorIcon, adminOnly: true },
      { name: "급여 지급 처리", href: "/payroll/process", icon: BanknotesIcon, adminOnly: true },
      { name: "급여항목 관리", href: "/payroll/items", icon: TagIcon, adminOnly: true },
    ]
  },
  {
    title: "사내 소통",
    items: [
      { name: "공지사항 관리", href: "/notices", icon: MegaphoneIcon, adminOnly: true },
    ]
  }
];

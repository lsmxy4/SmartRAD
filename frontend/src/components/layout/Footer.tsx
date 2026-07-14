import Link from "next/link";
import Container from "@/components/ui/Container";

const footerMenus = [
  {
    title: "주요 기능",
    ariaLabel: "주요 기능",
    items: [
      { label: "통합 대시보드", href: "#features" },
      { label: "조직·구성원 관리", href: "#features" },
      { label: "근태·휴가 관리", href: "#features" },
      { label: "급여 정산 자동화", href: "#features" },
    ],
  },
  {
    title: "장점",
    ariaLabel: "SmartHR 장점",
    items: [
      { label: "업무 효율", href: "#benefits" },
      { label: "도입 비용", href: "#benefits" },
      { label: "직관적 UI", href: "#benefits" },
      { label: "데이터 보안", href: "#benefits" },
    ],
  },
  {
    title: "요금제",
    ariaLabel: "요금제",
    items: [
      { label: "스타터 플랜", href: "#pricing" },
      { label: "비즈니스 플랜", href: "#pricing" },
      { label: "엔터프라이즈", href: "#pricing" },
    ],
  },
  {
    title: "고객지원",
    ariaLabel: "고객지원",
    items: [
      { label: "도입 문의", href: "#contact" },
      { label: "FAQ", href: "#contact" },
      { label: "고객 센터", href: "#contact" },
    ],
    note: "평일 09:00 - 18:00",
  },
];

const policies = [
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "이용약관", href: "/terms" },
  { label: "이메일무단수집거부", href: "/email-policy" },
  { label: "보안정책", href: "/security" },
  { label: "사이트맵", href: "/sitemap" },
];

const linkClassName =
  "font-bold text-[#637696] transition-colors duration-300 hover:text-brand-primary focus-visible:text-brand-primary focus-visible:outline-none";

export default function Footer() {
  return (
    <footer className="min-h-[420px] w-full bg-brand-soft py-10 pt-16">
      <Container>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <Link
              href="/"
              aria-label="SmartHR 홈"
              className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-primary font-bold text-white">
                S
              </span>
              <span className="text-[20px] font-extrabold text-brand-navy">
                SmartHR
              </span>
            </Link>

            <div className="mt-6 space-y-4 text-[12px] font-semibold leading-5 text-brand-text">
              <div>
                <p className="font-extrabold">ADDRESS</p>
                <address className="break-keep not-italic">
                  서울특별시 강남구 테헤란로 000, 00층
                </address>
              </div>
              <div>
                <p className="font-extrabold">TEL</p>
                <a className="transition-colors hover:text-brand-primary" href="tel:16660000">
                  1666-0000
                </a>
              </div>
              <div>
                <p className="font-extrabold">EMAIL</p>
                <a
                  className="break-words transition-colors hover:text-brand-primary"
                  href="mailto:support@smarthr.co.kr"
                >
                  support@smarthr.co.kr
                </a>
              </div>
            </div>
          </div>

          {footerMenus.map((menu) => (
            <nav key={menu.title} aria-label={menu.ariaLabel}>
              <h2 className="text-[14px] font-extrabold text-brand-navy">
                {menu.title}
              </h2>
              <ul className="mt-[18px] space-y-3 text-[13px]">
                {menu.items.map((item) => (
                  <li key={item.label}>
                    <a className={linkClassName} href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
                {menu.note ? (
                  <li className="font-bold text-[#637696]">{menu.note}</li>
                ) : null}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-11 border-t border-brand-border">
          <nav
            aria-label="정책 및 약관"
            className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[12px]"
          >
            {policies.map((policy) => (
              <Link
                key={policy.label}
                href={policy.href}
                className="font-extrabold text-brand-text transition-colors duration-300 hover:text-brand-primary focus-visible:text-brand-primary focus-visible:outline-none"
              >
                {policy.label}
              </Link>
            ))}
          </nav>

          <div className="mt-[22px] flex flex-col gap-3 text-[12px] font-semibold text-brand-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="break-keep">
              (주)스마트에이치알 · 대표이사 홍길동 · 사업자등록번호 000-00-00000 · © 2026 SmartHR. All rights reserved.
            </p>
            <p className="shrink-0">
              기업 인사관리의 새로운 기준, <strong className="font-extrabold">SmartHR</strong>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

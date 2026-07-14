import Link from "next/link";
import Container from "@/components/ui/Container";

const navigation = [
  { label: "주요 기능", href: "#features" },
  { label: "장점", href: "#benefits" },
  { label: "요금제", href: "#pricing" },
  { label: "문의", href: "#contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 h-[84px] w-full bg-white shadow-[0_1px_0_rgba(16,42,80,0.06)]">
      <Container className="flex h-full items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="SmartHR 홈"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-brand-primary text-xl font-bold text-white">
            S
          </span>
          <span className="text-xl font-bold text-brand-navy">SmartHR</span>
        </Link>

        <nav
          className="hidden items-center gap-12 md:flex"
          aria-label="주요 메뉴"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group text-[15px] font-extrabold tracking-[0]"
            >
              <span className="text-brand-text transition-colors duration-300 ease-out group-hover:text-brand-primary motion-reduce:transition-none">
                {item.label}
              </span>
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="flex h-12 w-[104px] items-center justify-center rounded-full bg-brand-primary text-base font-semibold transition-all duration-300 ease-out hover:bg-brand-primary-dark motion-reduce:transition-none"
        >
          <span className="text-white">로그인</span>
        </Link>
      </Container>
    </header>
  );
}

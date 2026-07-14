import Image from "next/image"
import Container from "@/components/ui/Container"
import SectionBadge from "@/components/ui/SectionBadge"

const highlights = [
  { title: "4 Core", description: "핵심 HR 기능 통합" },
  {
    title: "1/10",
    description: "구축 대비 합리적 비용",
  },
  {
    title: "Secure",
    description: "민감 정보 암호화 보관",
  },
]

export default function Hero() {
  return (
    <section className="w-full bg-[radial-gradient(circle_at_82%_8%,var(--color-brand-soft-strong)_0%,#F5F9FF_26%,#FFFFFF_58%)]">
      <Container className="flex flex-col items-center gap-14 py-20 lg:flex-row lg:gap-16">
        <div className="w-full max-w-[540px] shrink-0">
          <SectionBadge className="mb-7 tracking-[0]">
            기업 인사관리를 위한 HR ERP
          </SectionBadge>

          <h1 className="text-[44px] font-bold leading-[50px] tracking-[-5px] sm:text-[52px] sm:leading-[58px] sm:tracking-[-6px] lg:text-[60px] lg:leading-[65px] lg:tracking-[-8px]">
            <span className="block text-brand-navy">
              인사관리의
            </span>
            <span className="block text-brand-navy">흐름을</span>
            <span className="block text-brand-primary">하나로</span>
            <span className="block text-brand-primary">
              연결합니다.
            </span>
          </h1>

          <p className="mt-8 max-w-[530px] text-[18px] font-bold leading-[30px] tracking-[0] text-brand-text sm:text-[22px] sm:leading-[35.6px]">
            <span className="block">
              직원 정보, 조직, 근태, 휴가, 급여 정산까지.
            </span>
            <span className="block">
              SmartHR은 기업 인사관리에 필요한 핵심 업무를
            </span>
            <span className="block">
              직관적인 화면과 자동화된 흐름으로 제공합니다.
            </span>
          </p>

          <div className="mt-[42px] flex flex-wrap gap-[14px]">
            <a
              href="#features"
              className="flex h-[54px] items-center justify-center whitespace-nowrap rounded-full bg-brand-primary px-9 text-[15px] font-extrabold transition-colors duration-300 ease-out hover:bg-brand-primary-dark motion-reduce:transition-none"
            >
              <span className="text-white">주요 기능 보기</span>
            </a>
            <a
              href="#contact"
              className="flex h-[54px] items-center justify-center whitespace-nowrap rounded-full border border-brand-border-light bg-white px-9 text-[15px] font-extrabold transition-colors duration-300 ease-out hover:bg-brand-soft motion-reduce:transition-none"
            >
              <span className="text-brand-blue-text">도입 상담 요청</span>
            </a>
          </div>

          <div className="mt-11 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="h-[84px] rounded-[18px] border border-brand-border bg-white px-[18px] py-4 shadow-[0_12px_30px_rgba(50,94,160,0.07)]"
              >
                <p className="text-[24px] font-extrabold leading-none text-brand-navy">
                  {item.title}
                </p>
                <p className="mt-2 whitespace-nowrap text-[12px] font-bold leading-none text-brand-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end">
          <Image
            src="/hero-dashboard.svg"
            alt="SmartHR 인사관리 대시보드 화면"
            width={3844}
            height={3120}
            priority
            sizes="(max-width: 1023px) 100vw, 750px"
            className="h-auto w-full max-w-[750px] object-contain"
          />
        </div>
      </Container>
    </section>
  )
}

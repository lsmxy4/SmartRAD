import Container from "@/components/ui/Container";
import SectionBadge from "@/components/ui/SectionBadge";

const plans = [
  {
    badge: "Starter",
    title: "스터터 플랜",
    description: "인사 관리를 막 시작하는 소규모 팀을 위한 기본 플랜입니다.",
    price: "₩15,000",
    suffix: "/ 월",
    features: ["직원 정보 관리", "기본 근태 관리", "휴가 요청 관리"],
    button: "상담하기",
  },
  {
    badge: "Business",
    title: "비즈니스 플랜",
    description: "체계가 필요한 성장형 중소기업을 위한 추천 플랜입니다.",
    price: "₩29,000",
    suffix: "/ 월",
    features: ["조직·구성원 관리", "근태·휴가 승인", "급여 정산 자동화"],
    button: "시작하기",
  },
  {
    badge: "Enterprise",
    title: "엔터프라이즈",
    description: "맞춤형 기능이 필요한 대규모 기업을 위한 별도 상담 플랜입니다.",
    price: "별도 문의",
    suffix: "",
    features: ["맞춤형 기능 설계", "전담 도입 컨설팅", "보안 정책 지원"],
    button: "문의하기",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="w-full bg-white py-24 sm:py-32">
      <Container>
        <div className="text-center">
          <SectionBadge>요금제</SectionBadge>
          <h2 className="mt-6 text-[36px] font-extrabold leading-[48px] tracking-[-3px] text-brand-navy sm:text-[46px] sm:leading-[62px]">
            <span className="block">기업 규모에 맞는 플랜으로</span>
            <span className="block">시작하세요</span>
          </h2>
          <p className="mt-10 text-[16px] font-bold leading-7 text-brand-text">인사 관리를 막 시작하는 팀부터 맞춤형 기능이 필요한 대규모 기업까지, 필요한 범위에 맞춰 선택할 수 있습니다.</p>
        </div>
        <div className="mt-20 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.badge} className="group flex min-h-[528px] flex-col rounded-[26px] border border-brand-border bg-white p-9 text-brand-navy transition-all duration-300 ease-out hover:z-10 hover:border-brand-primary hover:bg-gradient-to-br hover:from-brand-primary-deep hover:via-[#246BFE] hover:to-brand-primary-light hover:text-white hover:shadow-xl md:hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none">
              <span className="w-fit rounded-full bg-brand-soft-strong px-3 py-2 text-[11px] font-bold text-brand-primary transition-colors duration-300 ease-out group-hover:bg-white/15 group-hover:text-white motion-reduce:transition-none">{plan.badge}</span>
              <h3 className="mt-6 text-[27px] font-extrabold text-brand-navy transition-colors duration-300 ease-out group-hover:text-white motion-reduce:transition-none">{plan.title}</h3>
              <p className="mt-3 min-h-[48px] text-[14px] font-semibold leading-6 text-brand-text transition-colors duration-300 ease-out group-hover:text-white/75 motion-reduce:transition-none">{plan.description}</p>
              <p className="mt-12 flex items-end gap-1 text-brand-navy transition-colors duration-300 ease-out group-hover:text-white motion-reduce:transition-none"><span className="text-[42px] font-extrabold tracking-[-2px]">{plan.price}</span>{plan.suffix && <span className="pb-2 text-[12px] font-bold text-brand-muted transition-colors duration-300 ease-out group-hover:text-white/70 motion-reduce:transition-none">{plan.suffix}</span>}</p>
              <ul className="mt-6 space-y-3 text-[14px] font-bold text-brand-text transition-colors duration-300 ease-out group-hover:text-white/85 motion-reduce:transition-none">
                {plan.features.map((feature) => <li key={feature}>{`✓ ${feature}`}</li>)}
              </ul>
              <a href="#contact" className="mt-auto flex h-[54px] items-center justify-center rounded-[14px] border border-transparent bg-brand-navy text-[15px] font-extrabold transition-colors duration-300 ease-out group-hover:bg-white motion-reduce:transition-none">
                <span className="text-white transition-colors duration-300 ease-out group-hover:text-brand-primary motion-reduce:transition-none">
                  {plan.button}
                </span>
              </a>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

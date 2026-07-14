"use client"

import Image from "next/image"
import { useState } from "react"
import Container from "@/components/ui/Container"
import SectionBadge from "@/components/ui/SectionBadge"

type Feature = {
  number: string
  title: string
  summary: string
  previewTitle: string
  previewImage: string
  detailTitle: string
  detailDescription: string
  detailItems: {
    title: string
    description: string
  }[]
  stats: {
    value: string
    label: string
  }[]
}

const features: Feature[] = [
  {
    number: "01",
    title: "조직·구성원 관리",
    summary:
      "직원 정보, 부서, 직급, 재직 상태를 하나의 기준으로 통합 관리합니다.",
    previewTitle: "조직·구성원 관리 미리보기",
    previewImage: "/feature-members.svg",
    detailTitle: "구성원 정보를 체계적으로 관리",
    detailDescription:
      "직원 기본 정보와 부서, 직급, 재직 상태를 한 화면에서 관리하고 필요한 정보를 빠르게 조회할 수 있습니다.",
    detailItems: [
      {
        title: "직원 정보 통합",
        description: "구성원의 기본 정보와 인사 이력을 한곳에서 관리합니다.",
      },
      {
        title: "부서·직급 관리",
        description: "조직 구조와 부서, 직급 체계를 체계적으로 설정합니다.",
      },
      {
        title: "재직 상태 관리",
        description: "재직, 휴직, 퇴직 상태를 구분해 빠르게 조회합니다.",
      },
    ],
    stats: [
      { value: "248명", label: "전체 직원" },
      { value: "12개", label: "운영 부서" },
      { value: "8개", label: "직급 체계" },
    ],
  },
  {
    number: "02",
    title: "근태·휴가 관리",
    summary: "출퇴근 기록 연동과 휴가 신청, 승인 흐름을 간편하게 처리합니다.",
    previewTitle: "근태·휴가 관리 미리보기",
    previewImage: "/feature-attendance.svg",
    detailTitle: "근태와 휴가 흐름을 간편하게",
    detailDescription:
      "출퇴근 기록과 휴가 신청, 승인 상태를 한곳에서 확인하고 관리할 수 있습니다.",
    detailItems: [
      {
        title: "출퇴근 기록",
        description: "직원별 출근과 퇴근 시간을 자동으로 기록하고 관리합니다.",
      },
      {
        title: "휴가 신청",
        description: "휴가 신청부터 담당자의 승인까지 간편하게 처리합니다.",
      },
      {
        title: "승인 상태 확인",
        description: "신청, 승인, 반려 상태를 실시간으로 확인합니다.",
      },
    ],
    stats: [
      { value: "231명", label: "오늘 출근" },
      { value: "8명", label: "휴가자" },
      { value: "12건", label: "휴가 신청" },
    ],
  },
  {
    number: "03",
    title: "급여 정산 자동화",
    summary:
      "수당과 공제를 자동 계산하고 급여명세서 발송까지 효율적으로 관리합니다.",
    previewTitle: "급여 정산 자동화 미리보기",
    previewImage: "/feature-payroll.svg",
    detailTitle: "복잡한 급여 정산을 자동화",
    detailDescription:
      "근태 데이터를 기반으로 수당과 공제를 계산하고 급여명세서 발송까지 한 번에 처리합니다.",
    detailItems: [
      {
        title: "수당 자동 계산",
        description: "근태 기록을 기반으로 각종 수당을 자동 계산합니다.",
      },
      {
        title: "공제 항목 관리",
        description: "세금과 보험 등 공제 항목을 체계적으로 관리합니다.",
      },
      {
        title: "급여명세서 발송",
        description: "직원별 급여명세서를 생성하고 일괄 발송합니다.",
      },
    ],
    stats: [
      { value: "248명", label: "정산 대상" },
      { value: "100%", label: "자동 계산" },
      { value: "1일", label: "일괄 발송" },
    ],
  },
]

export default function Features() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImage, setFailedImage] = useState<string | null>(null)

  const activeFeature = features[activeIndex]
  const imageFailed = failedImage === activeFeature.previewImage

  return (
    <section id="features" className="w-full bg-white py-24 sm:py-32">
      <Container>
        <div className="text-center">
          <SectionBadge>주요 기능</SectionBadge>

          <h2 className="mt-5 text-[34px] font-extrabold tracking-[-2px] text-brand-navy sm:text-[44px] sm:tracking-[-3px]">
            인사관리 ERP의 핵심 기능
          </h2>

          <p className="mt-4 text-[16px] font-bold leading-7 text-brand-text">
            조직 관리부터 급여 정산까지, 기업 인사관리에 필요한 핵심 기능을
            직관적인 화면으로 제공합니다.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={feature.number}
                type="button"
                aria-pressed={isActive}
                aria-label={`${feature.title} 기능 보기`}
                onClick={() => setActiveIndex(index)}
                className={`flex min-h-[220px] cursor-pointer flex-col rounded-[22px] border p-7 text-left transition-all duration-300 ease-out motion-reduce:transition-none ${
                  isActive
                    ? "border-brand-primary bg-gradient-to-br from-[#246BFE] to-brand-primary-light text-white shadow-[0_14px_32px_rgba(36,107,254,0.16)]"
                    : "border-brand-border bg-white text-brand-navy shadow-none"
                }`}
              >
                <span
                  className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[15px] text-[15px] font-bold transition-colors duration-300 ease-out motion-reduce:transition-none ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-brand-soft-strong text-brand-primary"
                  }`}
                >
                  {feature.number}
                </span>

                <span className="mt-6 block text-[20px] font-extrabold leading-[24px] transition-colors duration-300 ease-out motion-reduce:transition-none">
                  {feature.title}
                </span>

                <span
                  className={`mt-3 block text-[14px] font-semibold leading-[22px] transition-colors duration-300 ease-out motion-reduce:transition-none ${
                    isActive ? "text-white/80" : "text-brand-text"
                  }`}
                >
                  {feature.summary}
                </span>
              </button>
            )
          })}
        </div>

        <div
          key={activeFeature.number}
          className="mt-10 grid items-stretch gap-5 transition-[opacity,transform] duration-200 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transform-none motion-reduce:transition-none lg:grid-cols-2"
        >
          <div className="min-h-[350px] rounded-[24px] border border-brand-border bg-white p-6 shadow-[0_18px_45px_rgba(50,94,160,0.08)] sm:p-7">
            <h3 className="text-[24px] font-extrabold text-brand-navy">
              {activeFeature.previewTitle}
            </h3>

            <div className="mt-5 flex aspect-[667/334] w-full max-w-[620px] items-center justify-center overflow-hidden rounded-[20px] bg-[#F4F8FF]">
              {!imageFailed ? (
                <Image
                  src={activeFeature.previewImage}
                  alt={`${activeFeature.title} 화면 미리보기`}
                  width={667}
                  height={334}
                  className="h-auto w-full object-contain"
                  onError={() => setFailedImage(activeFeature.previewImage)}
                />
              ) : (
                <p className="px-6 text-center text-[16px] font-bold text-brand-muted">
                  {activeFeature.title} 화면 미리보기
                </p>
              )}
            </div>
          </div>

          <div className="flex min-h-[350px] flex-col rounded-[24px] bg-gradient-to-br from-brand-primary-deep via-[#246BFE] to-brand-primary-light p-6 text-white sm:p-8">
            <h3 className="text-[24px] font-extrabold">
              {activeFeature.detailTitle}
            </h3>

            <p className="mt-3 text-[14px] font-semibold leading-[23px] text-white/80">
              {activeFeature.detailDescription}
            </p>

            <div className="mt-6 grid flex-1 grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
              {activeFeature.detailItems.map((item) => (
                <div
                  key={item.title}
                  className="flex min-h-[150px] flex-col justify-center rounded-[18px] border border-white/20 bg-white/10 px-5 py-6 sm:h-full"
                >
                  <p className="text-[19px] font-extrabold leading-[1.3] text-white">
                    {item.title}
                  </p>

                  <p className="mt-4 text-[12px] font-semibold leading-5 text-white/70">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {activeFeature.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[14px] bg-[#164BAF]/65 px-4 py-4"
                >
                  <p className="text-[18px] font-extrabold">{stat.value}</p>

                  <p className="mt-2 text-[11px] font-semibold text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

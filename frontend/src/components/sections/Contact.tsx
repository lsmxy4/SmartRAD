"use client"

import { FormEvent, useState } from "react"
import Container from "@/components/ui/Container"
import SectionBadge from "@/components/ui/SectionBadge"

const faqs = [
  {
    question: "직원 수가 적어도 사용할 수 있나요?",
    answer:
      "소규모 팀도 직원 정보, 근태, 휴가 기능을 필요한 범위부터 사용할 수 있습니다.",
  },
  {
    question: "기존 직원 데이터를 이전할 수 있나요?",
    answer:
      "기존 데이터를 확인한 후 가능한 형식에 맞춰 이전 범위를 안내합니다.",
  },
  {
    question: "급여명세서 발송 기능도 제공하나요?",
    answer:
      "선택한 플랜과 도입 범위에 따라 급여 정산 및 명세서 발송 기능을 사용할 수 있습니다.",
  },
]

export default function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    window.alert("상담 신청이 접수되었습니다.")
  }

  return (
    <section
      id="contact"
      className="w-full bg-[linear-gradient(180deg,#F4F8FF_0%,#FFFFFF_100%)] py-24 sm:py-32"
    >
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex min-h-[680px] flex-col rounded-[28px] bg-gradient-to-br from-[#17458F] via-[#1E55C7] to-[#246BFE] p-7 text-white sm:p-10">
          <SectionBadge variant="inverse" className="w-fit">
            문의
          </SectionBadge>
          <h2 className="mt-6 text-[38px] font-extrabold leading-[1.5] tracking-[-3px] sm:text-[46px]">
            <span className="block">우리 회사에 맞는</span>
            <span className="block">인사관리 ERP를</span>
            <span className="block">상담해보세요</span>
          </h2>
          <p className="mt-4 max-w-[520px] text-[17px] font-semibold leading-8 text-white/70">
            도입 규모, 필요한 기능, 운영 방식에 맞춰 SmartHR 활용 방법과 견적을
            빠르게 안내합니다.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "도입 문의 및 견적 · 빠른 세일즈 상담 연결",
              "자주 묻는 질문 · 고객이 가장 궁금해하는 질문 모음",
              "고객 센터 · 서비스 이용 가이드 및 헬프데스크",
            ].map((item) => (
              <p
                key={item}
                className="rounded-[14px] border border-white/20 bg-white/10 px-4 py-4 text-[14px] font-bold text-white/85"
              >
                {item}
              </p>
            ))}
          </div>
          <div className="mt-auto pt-4">
            <span className="inline-block w-fit rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[13px] font-bold">
              평일 09:00 - 18:00 상담 가능
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-[680px] flex-col rounded-[28px] border border-brand-border bg-white p-7 shadow-[0_18px_45px_rgba(50,94,160,0.08)] sm:p-10"
        >
          <h2 className="text-[25px] font-extrabold text-brand-navy">
            도입 문의 및 견적
          </h2>
          <p className="mt-4 text-[15px] font-bold text-brand-text">
            회사 규모와 필요한 기능을 기준으로 빠른 상담을 연결합니다.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { name: "name", label: "담당자 이름", type: "text" },
              { name: "company", label: "회사명", type: "text" },
              { name: "email", label: "회사 이메일", type: "email" },
              { name: "phone", label: "연락처", type: "tel" },
            ].map((field) => (
              <input
                key={field.name}
                name={field.name}
                type={field.type}
                required
                aria-label={field.label}
                placeholder={field.label}
                className="h-[58px] rounded-[14px] border border-[#D5E4FA] bg-[#F4F8FF] px-4 text-[14px] font-semibold text-brand-navy outline-none transition-[color,background-color,border-color,box-shadow] duration-300 ease-out placeholder:text-[#7890B3] focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/20 motion-reduce:transition-none"
              />
            ))}
          </div>
          <textarea
            required
            name="message"
            aria-label="문의 내용"
            placeholder="도입 목적이나 궁금한 내용을 남겨주세요"
            className="mt-8 min-h-[260px] flex-1 resize-none rounded-[14px] border border-[#D5E4FA] bg-[#F4F8FF] p-4 text-[14px] font-semibold text-brand-navy outline-none transition-[color,background-color,border-color,box-shadow] duration-300 ease-out placeholder:text-[#7890B3] focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/20 motion-reduce:transition-none"
          />

          <button
            type="submit"
            className="mt-8 h-[58px] shrink-0 cursor-pointer rounded-[14px] bg-gradient-to-r from-[#246BFE] to-[#6AACF8] text-[15px] font-extrabold text-white transition-all duration-300 ease-out hover:shadow-[0_10px_24px_rgba(36,107,254,0.22)] hover:brightness-95 motion-reduce:transition-none"
          >
            상담 신청하기
          </button>
        </form>

        <div className="rounded-[28px] border border-brand-border bg-white p-7 shadow-[0_18px_45px_rgba(50,94,160,0.06)] sm:p-8">
          <h2 className="text-[24px] font-extrabold text-brand-navy">
            자주 묻는 질문
          </h2>
          <p className="mt-3 text-[14px] font-bold text-brand-text">
            도입 전 고객들이 가장 많이 확인하는 항목을 한눈에 정리했습니다.
          </p>
          <div className="mt-6 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={faq.question}
                  className={`overflow-hidden rounded-[14px] border transition-colors duration-300 ease-out motion-reduce:transition-none ${isOpen ? "border-[#BFD5F5] bg-white" : "border-[#D5E4FA] bg-[#F4F8FF]"}`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-[14px] font-bold text-[#29496F] transition-colors duration-300 ease-out hover:bg-white/60 motion-reduce:transition-none"
                  >
                    <span>{faq.question}</span>
                    <span
                      aria-hidden="true"
                      className={`text-[18px] transition-transform duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none ${isOpen ? "rotate-45" : "rotate-0"}`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="border-t border-[#D5E4FA] px-4 py-4 text-[13px] font-semibold leading-6 text-[#5C7395]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="self-start rounded-[28px] border border-brand-border bg-white p-7 shadow-[0_18px_45px_rgba(50,94,160,0.06)] sm:p-8">
          <h2 className="text-[24px] font-extrabold text-brand-navy">
            고객 센터
          </h2>
          <p className="mt-3 text-[14px] font-bold leading-6 text-brand-text">
            서비스 이용 가이드와 헬프데스크를 통해 도입 이후에도 안정적으로
            운영할 수 있습니다.
          </p>
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-[16px] border border-[#D5E4FA] bg-[#F4F8FF] p-5">
              <h3 className="text-[15px] font-extrabold text-brand-navy">
                이용 가이드
              </h3>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-brand-text">
                관리자 설정, 직원 등록, 근태 관리 방법 안내
              </p>
            </div>
            <div className="rounded-[16px] border border-[#D5E4FA] bg-[#F4F8FF] p-5">
              <h3 className="text-[15px] font-extrabold text-brand-navy">
                헬프데스크
              </h3>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-brand-text">
                도입, 결제, 기능 문의를 빠르게 접수
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

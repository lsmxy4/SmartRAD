"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import SectionBadge from "@/components/ui/SectionBadge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  employeeId: number;
  employeeNo: string;
  name: string;
}

interface ErrorResponse {
  code: string;
  message: string;
}

const STATS = [
  { value: "2,400+", label: "도입 기업" },
  { value: "98%", label: "고객 만족도" },
  { value: "15년", label: "운영 경력" },
];

const FEATURES = [
  {
    title: "인사관리",
    description: "조직도, 인사발령, 직원 정보 통합 관리",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM21 20v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "급여관리",
    description: "자동 급여 계산, 세금 신고, 명세서 발송",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 6V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "근태관리",
    description: "출퇴근, 휴가, 초과근무 실시간 모니터링",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body: ErrorResponse = await res.json();
        throw new Error(body.message || "로그인에 실패했습니다.");
      }

      const data: LoginResponse = await res.json();
      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      storage.setItem("accessToken", data.accessToken);
      storage.setItem("employeeName", data.name);

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* 좌측 브랜드 패널 */}
      <div className="relative flex w-full flex-col justify-center overflow-hidden bg-[#0b1023] px-8 py-14 sm:px-14 lg:w-1/2 lg:px-20">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute -left-32 bottom-[-10%] h-96 w-96 rounded-full bg-brand-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-brand-primary-light/10 blur-3xl" />

        <Link href="/" className="relative z-10 flex w-fit items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary">
            <Logo className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">SmartHR</span>
        </Link>

        <div className="relative z-10 mt-14 max-w-md">
          <SectionBadge variant="inverse" className="w-fit">
            차세대 인사관리 플랫폼
          </SectionBadge>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-[2.75rem]">
            직원 관리의 모든 것
            <br />
            <span className="text-brand-primary-light">하나로 연결하다</span>
          </h1>

          <p className="mt-5 text-[15px] leading-relaxed text-white/70">
            채용부터 퇴직까지, 복잡한 인사 업무를
            <br />
            자동화하고 더 중요한 일에 집중하세요.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-b border-white/10 pb-10">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-xs text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary-light">
                    {feature.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{feature.title}</div>
                    <div className="text-xs text-white/50">{feature.description}</div>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 로그인 패널 */}
      <div className="flex w-full flex-1 items-center justify-center bg-white px-6 py-14 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-brand-muted transition-colors hover:text-brand-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M15 5 8 12l7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            뒤로가기
          </button>

          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
                <Logo className="h-4 w-4 text-white" />
              </div>
              <span className="hidden text-sm font-semibold text-brand-navy sm:inline">SmartHR</span>
            </Link>
            <Link
              href="/#contact"
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark"
            >
              문의하기
            </Link>
          </div>

          <div className="rounded-3xl border border-brand-border bg-white p-8 shadow-[0_8px_30px_rgb(15,23,42,0.06)] sm:p-10">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-primary">
                <Logo className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-muted">SmartHR</span>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-brand-navy">로그인</h2>
            <p className="mt-1.5 text-sm text-brand-muted">계정에 로그인하여 업무를 시작하세요</p>

            <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-text">
                  이메일
                </label>
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-brand-muted"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소를 입력하세요"
                    className="w-full rounded-xl border border-brand-border-light bg-brand-soft py-3 pl-10 pr-4 text-sm text-brand-navy placeholder:text-brand-muted outline-none transition-colors focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-brand-text">
                  비밀번호
                </label>
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-brand-muted"
                  >
                    <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full rounded-xl border border-brand-border-light bg-brand-soft py-3 pl-10 pr-11 text-sm text-brand-navy placeholder:text-brand-muted outline-none transition-colors focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보이기"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                        <path
                          d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.83 2.83M6.5 6.7C4.6 8 3.2 9.7 2.5 12c1.5 4 5 7 9.5 7 1.7 0 3.2-.4 4.6-1.1M9.9 4.2A10.7 10.7 0 0 1 12 4c4.5 0 8 3 9.5 8-.4 1.3-1 2.5-1.8 3.6"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                        <path
                          d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="-mt-1 text-sm text-red-500">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex select-none items-center gap-2 text-brand-text">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-brand-border-light text-brand-primary focus:ring-brand-primary"
                  />
                  로그인 상태 유지
                </label>
                <Link href="/find-password" className="font-medium text-brand-primary hover:text-brand-primary-dark">
                  비밀번호 찾기
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M13 5l7 7-7 7M4 12h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isSubmitting ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-brand-muted">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="font-semibold text-brand-primary hover:text-brand-primary-dark">
                회원가입 신청
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

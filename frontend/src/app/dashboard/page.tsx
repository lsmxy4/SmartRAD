import Link from "next/link";
import DashboardShell from "./DashboardShell"

const cards = [
  { label: "전체 직원", value: "248명", note: "이번 달 +8명" },
  { label: "오늘 출근", value: "231명", note: "정상 출근 93%" },
  { label: "승인 대기", value: "12건", note: "휴가 및 증명서" },
];

export default function DashboardPage() {
  return (
    <DashboardShell activePath="/dashboard">
      <header className="flex min-h-[60px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-bold">대시보드</h1>
          <p className="text-xs text-slate-500">홈 · 대시보드</p>
        </div>
        <Link href="/dashboard/employees/new" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700">
          + 신규 직원 등록
        </Link>
      </header>
      <main className="p-8">
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
          <p className="text-sm font-bold text-indigo-700">빠른 업무</p>
          <h2 className="mt-2 text-2xl font-extrabold">신규 직원 정보를 등록하고 온보딩을 시작하세요.</h2>
          <p className="mt-2 text-sm text-slate-600">좌측 메뉴의 신규 직원 등록 또는 아래 버튼을 통해 등록 페이지로 이동할 수 있습니다.</p>
          <Link href="/dashboard/employees/new" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">
            신규 직원 등록 페이지로 이동
          </Link>
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-extrabold">{card.value}</p>
              <p className="mt-2 text-xs text-slate-400">{card.note}</p>
            </div>
          ))}
        </section>
      </main>
    </DashboardShell>
  );
}
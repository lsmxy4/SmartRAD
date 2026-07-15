import DashboardShell from "../../DashboardShell";

const Input = ({ label, value, required, muted, suffix }: { label: string; value: string; required?: boolean; muted?: boolean; suffix?: string }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold text-slate-700">{label} {required ? <b className="text-rose-500">*</b> : null}</span>
    <div className={`flex h-10 items-center rounded-lg border px-3 text-sm ${muted ? "border-slate-200 bg-slate-50 text-slate-300" : "border-slate-200 bg-white text-slate-900 focus-within:border-indigo-500"}`}>
      <input className="w-full bg-transparent outline-none" value={value} readOnly />
      {suffix ? <span className="text-xs text-slate-400">{suffix}</span> : null}
    </div>
  </label>
);

const Card = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex h-14 items-center justify-between border-b border-slate-200 px-6">
      <h2 className="text-base font-extrabold text-slate-950">{title}</h2>
      {badge ? <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-400">{badge}</span> : null}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

export default function NewEmployeePage() {
  return (
    <DashboardShell activePath="/dashboard/employees/new">
      <header className="sticky top-0 z-10 flex min-h-[60px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-extrabold">신규 직원 등록</h1>
          <p className="mt-1 text-xs text-slate-400">홈 · 인사 관리 · <span className="text-indigo-500">신규 직원 등록</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500">♧</button>
          <button className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-semibold">취소</button>
          <button className="h-9 rounded-lg bg-indigo-600 px-6 text-sm font-bold text-white shadow-sm">✓ 저장하기</button>
        </div>
      </header>

      <main className="p-8 pb-24">
        <div className="mb-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-200 text-indigo-700">♧</div>
            <div>
              <p className="text-sm font-extrabold">신규 직원 등록</p>
              <p className="text-xs text-indigo-500">필수 항목을 모두 입력한 뒤 저장하기를 눌러 등록을 완료하세요.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">등록 모드 <span className="h-7 w-12 rounded-full bg-indigo-500 after:ml-6 after:mt-1 after:block after:h-5 after:w-5 after:rounded-full after:bg-white" /> <span className="text-slate-400">수정 모드</span></div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <Card title="①  기본 정보" badge="* 표시 항목은 필수입니다">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="이름" value="김민준" required />
                <Input label="직원 번호" value="자동 생성됩니다" muted />
                <Input label="생년월일" value="1990.07.22" required suffix="□" />
                <div>
                  <span className="mb-2 block text-xs font-bold text-slate-700">성별 <b className="text-rose-500">*</b></span>
                  <div className="grid grid-cols-2 gap-2"><button className="h-10 rounded-lg border border-indigo-500 bg-indigo-50 text-sm font-bold text-indigo-600">남성</button><button className="h-10 rounded-lg border border-slate-200 text-sm text-slate-500">여성</button></div>
                </div>
                <Input label="연락처" value="010-1234-5678" required />
                <Input label="이메일" value="kim@smarthr.com" required />
              </div>
            </Card>

            <Card title="②  소속 및 고용 정보">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="부서" value="개발팀" required suffix="⌄" />
                <Input label="직급" value="시니어 개발자" required suffix="⌄" />
                <div><span className="mb-2 block text-xs font-bold text-slate-700">고용 형태 <b className="text-rose-500">*</b></span><div className="grid grid-cols-3 gap-2"><button className="h-10 rounded-lg border border-indigo-500 bg-indigo-50 text-sm font-bold text-indigo-600">정규직</button><button className="h-10 rounded-lg border border-slate-200 text-sm text-slate-500">계약직</button><button className="h-10 rounded-lg border border-slate-200 text-sm text-slate-500">파트타임</button></div></div>
                <Input label="직속 관리자" value="박준혁 (개발팀 팀장)" suffix="⌄" />
                <Input label="입사일" value="2021.03.15" required suffix="□" />
                <Input label="계약 만료일" value="2027.03.14" suffix="□" />
                <div><span className="mb-2 block text-xs font-bold text-slate-700">재직 상태 <b className="text-rose-500">*</b></span><div className="flex gap-2"><button className="h-9 rounded-lg border border-emerald-500 bg-emerald-50 px-4 text-sm font-bold text-emerald-600">• 재직중</button><button className="h-9 rounded-lg border border-slate-200 px-4 text-sm text-slate-500">• 휴직중</button><button className="h-9 rounded-lg border border-slate-200 px-4 text-sm text-slate-500">• 퇴직</button></div></div>
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card title="프로필 사진"><div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500 text-3xl font-bold text-white">김</div><p className="mt-4 text-sm font-bold">사진을 업로드하세요</p><p className="text-xs text-slate-400">JPG, PNG 최대 2MB</p><button className="mt-4 h-9 w-full rounded-lg border border-slate-200 text-sm">⇧ 파일 선택</button></div></Card>
            <Card title="서류 첨부" badge="선택사항"><div className="rounded-xl border border-indigo-200 bg-slate-50 p-6 text-center"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">⇧</div><p className="text-sm font-bold">파일을 드래그하거나</p><p className="text-xs text-slate-400">클릭하여 업로드하세요</p><button className="mt-3 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600">파일 선택</button></div>{["근로계약서.pdf", "개인정보동의서.pdf"].map((file) => <div key={file} className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 p-3 text-xs"><span className="font-bold">▣ {file}<br/><small className="ml-5 font-normal text-slate-400">245 KB</small></span><span className="text-emerald-500">✓ <b className="ml-2 text-rose-400">×</b></span></div>)}<button className="mt-2 h-9 w-full rounded-lg border border-slate-200 text-sm text-slate-400">+ 서류 추가</button></Card>
            <Card title="급여 정보" badge="선택사항"><div className="space-y-3"><Input label="기본급 (월)" value="4,200,000" suffix="원" /><Input label="수당 합계 (월)" value="300,000" suffix="원" /><div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-4 text-sm"><span className="text-slate-500">예상 실지급액</span><b>4,068,000 원</b></div></div></Card>
          </aside>
        </div>
      </main>

      <footer className="fixed bottom-0 right-0 left-0 z-20 border-t border-slate-200 bg-white px-8 py-3 md:left-[210px]">
        <div className="flex items-center justify-between"><p className="text-xs text-slate-400">ⓘ * 표시 항목은 모두 입력해야 저장이 가능합니다.</p><div className="flex gap-3"><button className="h-10 rounded-lg border border-slate-200 px-5 text-sm">취소</button><button className="h-10 rounded-lg border border-orange-200 bg-orange-50 px-5 text-sm font-bold text-orange-500">초기화</button><button className="h-10 rounded-lg bg-indigo-600 px-7 text-sm font-bold text-white">✓ 저장하기</button></div></div>
      </footer>
    </DashboardShell>
  );
}
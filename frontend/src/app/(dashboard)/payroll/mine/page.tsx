"use client";

import {
  BanknotesIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EyeIcon,
  PrinterIcon,
  ReceiptPercentIcon,
  WalletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

interface Payroll {
  payrollId: number;
  payrollYearMonth: string;
  paymentDate: string | null;
  totalPayAmount: number | null;
  totalDeductionAmount: number | null;
  realPayAmount: number | null;
  payrollStatusCode: string;
}

interface PayrollDetail {
  itemName: string;
  itemTypeCode: "EARNING" | "DEDUCTION";
  amount: number;
}

interface PayrollDetailedResponse {
  payroll: Payroll;
  details: PayrollDetail[];
}

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCurrency(value: number | null | undefined) {
  return `₩${Math.round(value ?? 0).toLocaleString("ko-KR")}`;
}

function formatMonth(value: string) {
  const normalized = value.replace(/(\d{4})(\d{2})$/, "$1-$2");
  const [year, month] = normalized.split("-");
  return year && month ? `${year}년 ${Number(month)}월` : value;
}

function formatDate(value: string | null) {
  return value ? value.replaceAll("-", ".") : "지급 예정";
}

function statusLabel(status: string) {
  if (status === "PAID") return "지급완료";
  if (status === "CONFIRMED") return "지급확정";
  if (status === "HOLD") return "지급보류";
  if (status === "FAILED") return "지급실패";
  return "계산완료";
}

export default function MyPayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PayrollDetailedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/payrolls/me`, { headers: authHeaders() });
        if (!response.ok) throw new Error("급여 명세서를 불러오지 못했습니다.");
        const result = (await response.json()) as Payroll[];
        const sorted = [...result].sort((a, b) => b.payrollYearMonth.localeCompare(a.payrollYearMonth));
        setPayrolls(sorted);
        setSelectedPayrollId(sorted[0]?.payrollId ?? null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "급여 명세서를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayrolls();
  }, []);

  useEffect(() => {
    if (selectedPayrollId == null) return;
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/payrolls/me/${selectedPayrollId}`, { headers: authHeaders() });
        if (!response.ok) throw new Error("급여 상세 내역을 불러오지 못했습니다.");
        setDetail((await response.json()) as PayrollDetailedResponse);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "급여 상세 내역을 불러오지 못했습니다.");
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selectedPayrollId]);

  const selectedPayroll = payrolls.find((payroll) => payroll.payrollId === selectedPayrollId) ?? null;
  const earnings = useMemo(() => detail?.details.filter((item) => item.itemTypeCode === "EARNING") ?? [], [detail]);
  const deductions = useMemo(() => detail?.details.filter((item) => item.itemTypeCode === "DEDUCTION") ?? [], [detail]);
  const totalEarnings = detail?.payroll.totalPayAmount ?? 0;
  const totalDeductions = detail?.payroll.totalDeductionAmount ?? 0;
  const netPay = detail?.payroll.realPayAmount ?? 0;
  const latest = payrolls[0];

  const downloadStatement = () => {
    if (!detail) return;
    const lines = [
      "SmartHR 급여 명세서",
      `${formatMonth(detail.payroll.payrollYearMonth)} 급여`,
      `지급일: ${formatDate(detail.payroll.paymentDate)}`,
      "",
      "[지급 항목]",
      ...earnings.map((item) => `${item.itemName}: ${formatCurrency(item.amount)}`),
      `지급 합계: ${formatCurrency(totalEarnings)}`,
      "",
      "[공제 항목]",
      ...deductions.map((item) => `${item.itemName}: -${formatCurrency(item.amount)}`),
      `공제 합계: -${formatCurrency(totalDeductions)}`,
      "",
      `실수령액: ${formatCurrency(netPay)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${formatMonth(detail.payroll.payrollYearMonth)}_급여명세서.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openPayrollDetail = (payrollId: number) => {
    setSelectedPayrollId(payrollId);
    setShowDetailModal(true);
  };

  return (
    <div className="payroll-statement-print mx-auto max-w-[1600px] space-y-4 text-slate-800">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">내 급여 명세서</h2>
        <p className="mt-1 text-base text-slate-500">매월 지급된 본인의 급여 명세서를 조회하고 인쇄할 수 있습니다.</p>
      </section>

      {errorMessage && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{errorMessage}</p>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="이번 달 실수령액" value={formatCurrency(latest?.realPayAmount)} caption={latest ? `${formatMonth(latest.payrollYearMonth)} 기준` : "급여 내역 없음"} icon={WalletIcon} tone="indigo" />
        <SummaryCard label="세전 총액" value={formatCurrency(latest?.totalPayAmount)} caption="지급 항목 합계" icon={BanknotesIcon} tone="emerald" />
        <SummaryCard label="총 공제액" value={formatCurrency(latest?.totalDeductionAmount)} caption="4대보험 · 세금 등" icon={ReceiptPercentIcon} tone="rose" />
        <SummaryCard label="올해 누적 수령액" value={formatCurrency(payrolls.reduce((sum, payroll) => sum + (payroll.realPayAmount ?? 0), 0))} caption={`${payrolls.length}건의 급여 내역`} icon={CalendarDaysIcon} tone="violet" />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><h3 className="text-base font-bold text-slate-900">급여 명세서 목록</h3><p className="mt-0.5 text-sm text-slate-400">지급월을 선택하면 상세 내역을 확인할 수 있습니다.</p></div>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">총 {payrolls.length}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 font-medium">지급 연월</th><th className="px-4 py-3 font-medium">지급일</th><th className="px-4 py-3 text-right font-medium">지급 합계</th><th className="px-4 py-3 text-right font-medium">공제 합계</th><th className="px-4 py-3 text-right font-medium">실수령액</th><th className="px-4 py-3 text-center font-medium">상태</th><th className="px-5 py-3 text-center font-medium">관리</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">급여 명세서를 불러오는 중입니다.</td></tr> : payrolls.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">조회 가능한 급여 명세서가 없습니다.</td></tr> : payrolls.map((payroll) => <tr key={payroll.payrollId} className={payroll.payrollId === selectedPayrollId ? "bg-indigo-50/60" : "hover:bg-slate-50"}><td className="px-5 py-3.5 font-semibold text-slate-700">{formatMonth(payroll.payrollYearMonth)}</td><td className="px-4 py-3.5 text-slate-500">{formatDate(payroll.paymentDate)}</td><td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(payroll.totalPayAmount)}</td><td className="px-4 py-3.5 text-right font-semibold text-rose-500">-{formatCurrency(payroll.totalDeductionAmount)}</td><td className="px-4 py-3.5 text-right font-bold text-indigo-600">{formatCurrency(payroll.realPayAmount)}</td><td className="px-4 py-3.5 text-center"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600">{statusLabel(payroll.payrollStatusCode)}</span></td><td className="px-5 py-3.5 text-center"><button type="button" onClick={() => openPayrollDetail(payroll.payrollId)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"><EyeIcon className="h-3.5 w-3.5" /> 조회</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><DocumentTextIcon className="h-5 w-5 text-indigo-500" /><div><h3 className="text-base font-bold text-slate-900">이번달 명세서 요약</h3><p className="text-sm text-slate-400">{selectedPayroll ? `${formatMonth(selectedPayroll.payrollYearMonth)} 급여 내역` : "급여 내역을 선택해주세요."}</p></div></div>{selectedPayroll && <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-600">{formatMonth(selectedPayroll.payrollYearMonth)} · {statusLabel(selectedPayroll.payrollStatusCode)}</span>}</div>
        {detailLoading ? <div className="px-5 py-12 text-center text-base text-slate-400">상세 내역을 불러오는 중입니다.</div> : detail ? <div className="grid gap-0 lg:grid-cols-[1fr_1fr_1.05fr]"><StatementItems title="지급 내역" items={earnings} total={totalEarnings} totalLabel="지급 총액" /><StatementItems title="공제 내역" items={deductions} total={totalDeductions} totalLabel="공제 합계" negative /><div className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0"><p className="text-base font-semibold text-slate-700">최종 정산</p><div className="mt-4 space-y-2 text-base"><div className="flex justify-between text-slate-500"><span>세전 총액</span><strong className="text-slate-800">{formatCurrency(totalEarnings)}</strong></div><div className="flex justify-between text-slate-500"><span>공제 합계</span><strong className="text-rose-500">-{formatCurrency(totalDeductions)}</strong></div></div><div className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-500 p-4 text-white"><p className="text-sm font-medium text-indigo-100">실수령액</p><p className="mt-1 text-3xl font-bold">{formatCurrency(netPay)}</p></div><div className="mt-3 grid gap-2"><button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"><PrinterIcon className="h-4 w-4" /> 명세서 인쇄</button><button onClick={downloadStatement} className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"><DocumentArrowDownIcon className="h-4 w-4" /> 파일 저장</button></div></div></div> : <div className="px-5 py-12 text-center text-base text-slate-400">상세 내역을 선택해주세요.</div>}
      </section>

      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="payroll-detail-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 id="payroll-detail-title" className="text-lg font-bold text-slate-900">급여 명세서 상세</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedPayroll ? `${formatMonth(selectedPayroll.payrollYearMonth)} 급여 내역` : "급여 내역"}</p>
              </div>
              <button type="button" onClick={() => setShowDetailModal(false)} aria-label="급여 명세서 상세 닫기" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            {detailLoading ? <div className="px-6 py-16 text-center text-sm text-slate-400">상세 내역을 불러오는 중입니다.</div> : detail ? <div className="p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3"><div><p className="text-xs text-slate-500">지급일</p><p className="mt-1 text-sm font-bold text-slate-700">{formatDate(detail.payroll.paymentDate)}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">{statusLabel(detail.payroll.payrollStatusCode)}</span></div><div className="grid overflow-hidden rounded-lg border border-slate-200 md:grid-cols-2"><StatementItems title="지급 내역" items={earnings} total={totalEarnings} totalLabel="지급 총액" /><StatementItems title="공제 내역" items={deductions} total={totalDeductions} totalLabel="공제 합계" negative /></div><div className="mt-5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-500 p-5 text-white"><p className="text-sm font-medium text-indigo-100">실수령액</p><p className="mt-1 text-3xl font-bold">{formatCurrency(netPay)}</p></div></div> : <div className="px-6 py-16 text-center text-sm text-slate-400">표시할 급여 상세 내역이 없습니다.</div>}
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={() => setShowDetailModal(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">닫기</button></div>
          </div>
        </div>
      )}
      
    </div>
  );
}

function SummaryCard({ label, value, caption, icon: Icon, tone }: { label: string; value: string; caption: string; icon: typeof WalletIcon; tone: "indigo" | "emerald" | "rose" | "violet" }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-500", emerald: "bg-emerald-50 text-emerald-500", rose: "bg-rose-50 text-rose-500", violet: "bg-violet-50 text-violet-500" };
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{caption}</p></div><span className={`rounded-full p-3 ${colors[tone]}`}><Icon className="h-5 w-5" /></span></div></div>;
}

function StatementItems({ title, items, total, totalLabel, negative = false }: { title: string; items: PayrollDetail[]; total: number; totalLabel: string; negative?: boolean }) {
  return <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r"><p className="text-base font-semibold text-slate-700">{title}</p><div className="mt-4 space-y-2 text-sm">{items.length ? items.map((item) => <div key={`${item.itemName}-${item.amount}`} className="flex justify-between"><span className="text-slate-500">{item.itemName}</span><strong className={negative ? "text-rose-500" : "text-slate-800"}>{negative && "-"}{formatCurrency(item.amount)}</strong></div>) : <p className="text-slate-400">등록된 항목이 없습니다.</p>}</div><div className={`mt-4 flex justify-between rounded-md px-3 py-2 text-sm font-bold ${negative ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"}`}><span>{totalLabel}</span><span>{negative && "-"}{formatCurrency(total)}</span></div></div>;
}
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
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import Modal, { ModalCancelButton } from "@/components/common/Modal";
import * as XLSX from "xlsx";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

interface Payroll {
  payrollId: number;
  employeeId?: number;
  employeeNo?: string;
  employeeNameSnapshot?: string;
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
  const [errorMessage, setErrorMessage] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/payrolls/me`, { headers: authHeaders() });
        if (!response.ok) throw new Error("급여 명세서를 불러오지 못했습니다.");
        const result = (await response.json()) as Payroll[];
        const sorted = [...result].sort((a, b) => b.payrollYearMonth.localeCompare(a.payrollYearMonth));
        setPayrolls(sorted);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "급여 명세서를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayrolls();
  }, []);

  const handleOpenDetail = (id: number) => {
    setSelectedPayrollId(id);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  useEffect(() => {
    if (!detailOpen || selectedPayrollId == null) return;
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
  }, [detailOpen, selectedPayrollId]);

  const earnings = useMemo(() => detail?.details.filter((item) => item.itemTypeCode === "EARNING") ?? [], [detail]);
  const deductions = useMemo(() => detail?.details.filter((item) => item.itemTypeCode === "DEDUCTION") ?? [], [detail]);
  const totalEarnings = detail?.payroll.totalPayAmount ?? 0;
  const totalDeductions = detail?.payroll.totalDeductionAmount ?? 0;
  const netPay = detail?.payroll.realPayAmount ?? 0;
  const latest = payrolls[0];

  const downloadStatement = () => {
    if (!detail) return;
    const wsData = [
      ["SmartHR 급여 명세서"],
      [`사번: ${detail.payroll.employeeNo ?? detail.payroll.employeeId ?? ""} | 성명: ${detail.payroll.employeeNameSnapshot ?? ""}`],
      [`귀속연월: ${formatMonth(detail.payroll.payrollYearMonth)}`, `지급일자: ${formatDate(detail.payroll.paymentDate)}`],
      [],
      ["[지급 항목]"],
      ...earnings.map((item) => [item.itemName, item.amount]),
      ["지급 합계", totalEarnings],
      [],
      ["[공제 항목]"],
      ...deductions.map((item) => [item.itemName, item.amount]),
      ["공제 합계", totalDeductions],
      [],
      ["실수령액", netPay]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여명세서");
    XLSX.writeFile(wb, `${formatMonth(detail.payroll.payrollYearMonth).replace(" ", "")}_급여명세서.xlsx`);
  };

  return (
    <>
    <div className="print:hidden payroll-statement-print payroll-statement-page mx-auto max-w-[1600px] space-y-4 text-slate-800">
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
          <div><h3 className="text-base font-bold text-slate-900">급여 명세서 목록</h3><p className="mt-0.5 text-sm text-slate-400">조회 버튼을 눌러 명세서를 미리보고 인쇄/저장할 수 있습니다.</p></div>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">총 {payrolls.length}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 font-medium">지급 연월</th><th className="px-4 py-3 font-medium">지급일</th><th className="px-4 py-3 text-right font-medium">지급 합계</th><th className="px-4 py-3 text-right font-medium">공제 합계</th><th className="px-4 py-3 text-right font-medium">실수령액</th><th className="px-4 py-3 text-center font-medium">상태</th><th className="px-5 py-3 text-center font-medium">관리</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">급여 명세서를 불러오는 중입니다.</td></tr> : payrolls.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">조회 가능한 급여 명세서가 없습니다.</td></tr> : payrolls.map((payroll) => <tr key={payroll.payrollId} className="hover:bg-slate-50"><td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-700">{formatMonth(payroll.payrollYearMonth)}</td><td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{formatDate(payroll.paymentDate)}</td><td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">{formatCurrency(payroll.totalPayAmount)}</td><td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-rose-500">-{formatCurrency(payroll.totalDeductionAmount)}</td><td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-indigo-600">{formatCurrency(payroll.realPayAmount)}</td><td className="px-4 py-3.5 text-center"><span className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">{statusLabel(payroll.payrollStatusCode)}</span></td><td className="px-5 py-3.5 text-center"><button onClick={() => handleOpenDetail(payroll.payrollId)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"><EyeIcon className="h-3.5 w-3.5" /> 미리보기</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {detailOpen && (
        <Modal
          icon={DocumentTextIcon}
          title="급여 명세서 상세 미리보기"
          subtitle={detail?.payroll ? `${formatMonth(detail.payroll.payrollYearMonth)} 급여 내역` : undefined}
          onClose={handleCloseDetail}
          maxWidth="2xl"
          footer={
            detail && (
              <div className="payroll-detail-footer flex w-full justify-between gap-3">
                <div className="payroll-detail-actions flex gap-2">
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <PrinterIcon className="h-4 w-4" /> 명세서 인쇄
                  </button>
                  <button type="button" onClick={downloadStatement} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                    <DocumentArrowDownIcon className="h-4 w-4" /> 파일 저장
                  </button>
                </div>
                <ModalCancelButton onClick={handleCloseDetail}>닫기</ModalCancelButton>
              </div>
            )
          }
        >
          {detailLoading ? (
            <div className="px-5 py-12 text-center text-base text-slate-400">상세 내역을 불러오는 중입니다.</div>
          ) : detail ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-700">지급 총액</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatCurrency(totalEarnings)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-bold text-slate-700">공제 합계</p>
                  <p className="mt-1 text-2xl font-extrabold text-rose-500">-{formatCurrency(totalDeductions)}</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-800">실수령액</h4>
                  <span className="text-xl font-extrabold text-indigo-600">{formatCurrency(netPay)}</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h5 className="mb-3 text-sm font-bold text-slate-700">지급 내역</h5>
                    <ul className="space-y-2 text-sm">
                      {earnings.length ? earnings.map((item) => (
                        <li key={item.itemName} className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-600">{item.itemName}</span>
                          <span className="font-medium text-slate-900">{formatCurrency(item.amount)}</span>
                        </li>
                      )) : <li className="text-slate-400">항목 없음</li>}
                    </ul>
                  </div>
                  <div>
                    <h5 className="mb-3 text-sm font-bold text-slate-700">공제 내역</h5>
                    <ul className="space-y-2 text-sm">
                      {deductions.length ? deductions.map((item) => (
                        <li key={item.itemName} className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-600">{item.itemName}</span>
                          <span className="font-medium text-rose-500">-{formatCurrency(item.amount)}</span>
                        </li>
                      )) : <li className="text-slate-400">항목 없음</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-base text-slate-400">상세 내역을 선택해주세요.</div>
          )}
        </Modal>
      )}
    </div>

    {detail && detailOpen && (
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-12 text-black text-sm min-h-screen">
        <h1 className="text-3xl font-extrabold text-center mb-10 pb-4">급여 명세서</h1>
        <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-4">
          <div>
            {detail.payroll.employeeNameSnapshot && (
              <p className="font-bold text-lg mb-2">사번: {detail.payroll.employeeNo ?? detail.payroll.employeeId} | 성명: {detail.payroll.employeeNameSnapshot}</p>
            )}
            <p className="font-bold text-lg">귀속연월: {formatMonth(detail.payroll.payrollYearMonth)}</p>
            <p className="mt-1 text-base">지급일자: {formatDate(detail.payroll.paymentDate)}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-800">SmartHR</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-2 border-b-2 border-black mb-8">
          <div className="border-r border-black p-4">
            <h3 className="font-bold text-lg mb-4 text-center">지급 내역</h3>
            <div className="space-y-3">
              {earnings.map(item => (
                <div key={item.itemName} className="flex justify-between text-base">
                  <span>{item.itemName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {earnings.length === 0 && <p className="text-center text-gray-500">내역 없음</p>}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-4 text-center">공제 내역</h3>
            <div className="space-y-3">
              {deductions.map(item => (
                <div key={item.itemName} className="flex justify-between text-base">
                  <span>{item.itemName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {deductions.length === 0 && <p className="text-center text-gray-500">내역 없음</p>}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-gray-100 p-4 font-bold text-lg border-b border-black">
          <span>지급 총액: {formatCurrency(totalEarnings)}</span>
          <span>공제 총액: {formatCurrency(totalDeductions)}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-200 p-6 font-extrabold text-2xl mt-4">
          <span>차인지급액(실수령액)</span>
          <span>{formatCurrency(netPay)}</span>
        </div>
      </div>
    )}
    </>
  );
}

function SummaryCard({ label, value, caption, icon: Icon, tone }: { label: string; value: string; caption: string; icon: typeof WalletIcon; tone: "indigo" | "emerald" | "rose" | "violet" }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-500", emerald: "bg-emerald-50 text-emerald-500", rose: "bg-rose-50 text-rose-500", violet: "bg-violet-50 text-violet-500" };
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{caption}</p></div><span className={`rounded-full p-3 ${colors[tone]}`}><Icon className="h-5 w-5" /></span></div></div>;
}
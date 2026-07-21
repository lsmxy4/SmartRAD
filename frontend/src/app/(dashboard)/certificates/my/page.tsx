"use client";

import { useEffect, useState } from "react";
import { DocumentPlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon, CheckBadgeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { certificateTypeLabel, type CertificateIssueResponse, statusBadge } from "@/components/certificate/types";
import MyCertificateRegisterModal from "@/components/certificate/MyCertificateRegisterModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MyCertificatesPage() {
  const [data, setData] = useState<CertificateIssueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    const storedId = window.localStorage.getItem("employeeId") ?? window.sessionStorage.getItem("employeeId");
    if (storedId) {
      setEmployeeId(Number(storedId));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!employeeId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/certificate-issues?employeeId=${employeeId}`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        } else {
          if (!cancelled) setError("증명서 내역을 불러오는데 실패했습니다.");
        }
      } catch {
        if (!cancelled) setError("네트워크 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [employeeId, refreshKey]);

  const handleSaved = () => {
    setShowModal(false);
    setRefreshKey((key) => key + 1);
  };

  const [memoModal, setMemoModal] = useState<{ title: string; content: string } | null>(null);

  const getStatusIcon = (status: string, issueStatus: string) => {
    if (status === "REJECTED") return <XCircleIcon className="w-5 h-5 text-rose-500" />;
    if (issueStatus === "ISSUED") return <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />;
    if (status === "APPROVED") return <CheckCircleIcon className="w-5 h-5 text-sky-500" />;
    return <ClockIcon className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제증명서 신청/조회</h1>
          <p className="mt-1 text-sm text-gray-500">본인의 재직증명서, 경력증명서 등을 신청하고 내역을 확인합니다.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!employeeId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <DocumentPlusIcon className="w-5 h-5" />
          증명서 발급 신청
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">나의 신청 내역</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            총 {data.length}건
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-50/50 text-sm text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 whitespace-nowrap">신청일</th>
                <th className="py-4 px-6 whitespace-nowrap">증명서 종류</th>
                <th className="py-4 px-6">용도</th>
                <th className="py-4 px-6 whitespace-nowrap">신청번호</th>
                <th className="py-4 px-6 whitespace-nowrap">처리 상태</th>
                <th className="py-4 px-6 whitespace-nowrap">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      내역을 불러오는 중입니다...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <DocumentTextIcon className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900 mb-1">신청 내역이 없습니다</p>
                      <p className="text-sm">우측 상단의 버튼을 눌러 증명서를 신청해보세요.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const badge = statusBadge(row);
                  return (
                    <tr key={row.employeeCertificateIssueId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">{row.applicationDate}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {certificateTypeLabel(row.certificateType)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 break-keep max-w-[200px]">
                        {row.purpose || <span className="text-gray-400 italic">없음</span>}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono text-gray-500 whitespace-nowrap">
                        {row.applicationNo}
                      </td>
                      <td className="py-4 px-6 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(row.approvalStatus, row.issueStatus)}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.approvalStatus === "REJECTED" && row.memo && (
                            <button onClick={() => setMemoModal({ title: "반려 사유", content: row.memo! })} className="text-xs px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-md border border-rose-200 hover:bg-rose-100 font-medium">
                              반려사유
                            </button>
                          )}
                          {row.approvalStatus !== "REJECTED" && row.memo && (
                            <button onClick={() => setMemoModal({ title: "메모", content: row.memo! })} className="text-xs px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-100 font-medium">
                              메모 보기
                            </button>
                          )}
                          {row.issueStatus === "ISSUED" && (
                            <button onClick={() => window.print()} className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 font-medium inline-flex items-center gap-1">
                              인쇄
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && employeeId && (
        <MyCertificateRegisterModal
          employeeId={employeeId}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {memoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{memoModal.title}</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{memoModal.content}</p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setMemoModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

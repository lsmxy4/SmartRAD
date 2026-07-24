"use client";

import { useEffect, useState } from "react";
import { GiftIcon, ClockIcon, CheckCircleIcon, XCircleIcon, CheckBadgeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { eventTypeLabel, eventStatusBadge, formatAmount, getPolicyAmount, type EventSupportResponse } from "@/components/eventsupport/types";
import MyEventSupportRegisterModal from "@/components/eventsupport/MyEventSupportRegisterModal";
import Modal, { ModalCancelButton } from "@/components/common/Modal";
import { resolveFileUrl } from "@/lib/fileUrl";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MyEventSupportPage() {
  const [data, setData] = useState<EventSupportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [reasonModal, setReasonModal] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const storedId = window.localStorage.getItem("employeeId") ?? window.sessionStorage.getItem("employeeId");
    if (storedId) setEmployeeId(Number(storedId));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!employeeId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/event-supports/me`, { headers: authHeaders() });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        } else if (!cancelled) {
          setError("경조비 신청 내역을 불러오는데 실패했습니다.");
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

  const getStatusIcon = (status: string) => {
    if (status === "REJECTED") return <XCircleIcon className="w-5 h-5 text-rose-500" />;
    if (status === "PAID") return <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />;
    if (status === "APPROVED") return <CheckCircleIcon className="w-5 h-5 text-sky-500" />;
    return <ClockIcon className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 p-0 sm:space-y-6 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">경조비 신청</h1>
          <p className="mt-1 text-sm text-gray-500">결혼, 출산, 상조 등 경조사 발생 시 경조비를 신청하고 내역을 확인합니다.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!employeeId}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
        >
          <GiftIcon className="w-5 h-5" />
          경조비 신청
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">나의 신청 내역</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            총 {data.length}건
          </span>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead className="bg-gray-50/50 text-sm text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 whitespace-nowrap">신청일</th>
                <th className="py-4 px-6 whitespace-nowrap">경조사 유형</th>
                <th className="py-4 px-6 whitespace-nowrap">경조사 일자</th>
                <th className="py-4 px-6 whitespace-nowrap">사유</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">지원 금액</th>
                <th className="py-4 px-6 whitespace-nowrap">처리 상태</th>
                <th className="py-4 px-6 whitespace-nowrap">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      내역을 불러오는 중입니다...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-rose-500">{error}</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <GiftIcon className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900 mb-1">신청 내역이 없습니다</p>
                      <p className="text-sm">우측 상단의 버튼을 눌러 경조비를 신청해보세요.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const badge = eventStatusBadge(row.status);
                  return (
                    <tr key={row.eventSupportId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">{row.createdAt.substring(0, 10)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-900 whitespace-nowrap">{eventTypeLabel(row.eventType)}</td>
                      <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">{row.eventDate}</td>
                      <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate" title={row.reason || ""}>{row.reason || "-"}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">{formatAmount(getPolicyAmount(row.eventType))}</td>
                      <td className="py-4 px-6 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(row.status)}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.status === "REJECTED" && row.rejectionReason && (
                            <button onClick={() => setReasonModal({ title: "반려 사유", content: row.rejectionReason! })} className="text-xs px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-md border border-rose-200 hover:bg-rose-100 font-medium">
                              반려사유
                            </button>
                          )}
                          {row.attachmentUrl && (
                            <a href={resolveFileUrl(row.attachmentUrl)} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-100 font-medium">
                              첨부파일
                            </a>
                          )}
                          {!row.attachmentUrl && row.status !== "REJECTED" && <span className="text-xs text-gray-400">-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-gray-100 sm:hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-gray-500"><ArrowPathIcon className="h-5 w-5 animate-spin" />내역을 불러오는 중입니다...</div>
          ) : error ? (
            <p className="px-4 py-12 text-center text-sm text-rose-500">{error}</p>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-gray-500"><GiftIcon className="mb-3 h-12 w-12 text-gray-300" /><p className="mb-1 text-base font-medium text-gray-900">신청 내역이 없습니다</p><p className="text-sm">상단 버튼을 눌러 경조비를 신청해보세요.</p></div>
          ) : data.map((row) => {
            const badge = eventStatusBadge(row.status);
            return (
              <article key={row.eventSupportId} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-gray-900">{eventTypeLabel(row.eventType)}</p><p className="mt-0.5 text-xs text-gray-500">신청일 {row.createdAt.substring(0, 10)} · 경조일 {row.eventDate}</p></div><div className="flex shrink-0 items-center gap-1.5">{getStatusIcon(row.status)}<span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span></div></div>
                <dl className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 text-xs"><div><dt className="text-gray-400">지원 금액</dt><dd className="mt-1 font-semibold text-gray-900">{formatAmount(getPolicyAmount(row.eventType))}</dd></div><div><dt className="text-gray-400">사유</dt><dd className="mt-1 break-words text-gray-700">{row.reason || "-"}</dd></div></dl>
                {(row.status === "REJECTED" && row.rejectionReason) || row.attachmentUrl ? <div className="flex flex-wrap gap-2">{row.status === "REJECTED" && row.rejectionReason && <button onClick={() => setReasonModal({ title: "반려 사유", content: row.rejectionReason! })} className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600">반려사유</button>}{row.attachmentUrl && <a href={resolveFileUrl(row.attachmentUrl)} target="_blank" rel="noreferrer" className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">첨부파일</a>}</div> : null}
              </article>
            );
          })}
        </div>
      </div>

      {showModal && employeeId && (
        <MyEventSupportRegisterModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}

      {reasonModal && (
        <Modal
          icon={GiftIcon}
          title={reasonModal.title}
          onClose={() => setReasonModal(null)}
          maxWidth="sm"
          footer={<ModalCancelButton onClick={() => setReasonModal(null)}>닫기</ModalCancelButton>}
        >
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reasonModal.content}</p>
        </Modal>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PaperClipIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { NoticeDetail, NoticePage, NoticeSummary } from "./types";
import { useSummarize } from "@/lib/useSummarize";
import Modal, { ModalCancelButton, ModalPrimaryButton } from "@/components/common/Modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
const PAGE_SIZE = 10;
const FILTER_TABS = ["전체", "중요", "일반"] as const;
type NoticeTab = (typeof FILTER_TABS)[number];

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value: string) {
  return value ? value.slice(0, 10) : "-";
}

function noticeType(row: NoticeSummary): NoticeTab {
  return row.pinned ? "중요" : "일반";
}

export default function EmployeeNoticeList() {
  const refreshKey = undefined;
  const onActionComplete = () => undefined;
  const onEdit = (notice: NoticeDetail) => { void notice; };
  const canManage = false;
  const [data, setData] = useState<NoticePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedType, setSelectedType] = useState<NoticeTab>("전체");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [viewingNotice, setViewingNotice] = useState<NoticeDetail | null>(null);
  const { summary, loading: summarizing, error: summarizeError, summarize, reset: resetSummary } = useSummarize();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/notices?page=${page}&size=${PAGE_SIZE}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        const res = await fetch(url, { headers: authHeaders() });
        if (res.ok && !cancelled) {
          setData((await res.json()) as NoticePage);
          setCheckedIds([]);
        } else if (!cancelled) setData(null);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, keyword, refreshKey, internalRefresh]);

  const rows = useMemo(() => (data?.content ?? []).filter((row) => {
    const date = formatDate(row.createdAt);
    return (selectedType === "전체" || noticeType(row) === selectedType)
      && (!startDate || date >= startDate)
      && (!endDate || date <= endDate);
  }), [data?.content, endDate, selectedType, startDate]);
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const pinnedNotice = data?.content.find((row) => row.pinned);
  const allChecked = rows.length > 0 && rows.every((row) => checkedIds.includes(row.noticeId));

  const runSearch = () => { setPage(0); setKeyword(searchInput.trim()); };
  const resetFilters = () => {
    setSearchInput(""); setKeyword(""); setSelectedType("전체"); setStartDate(""); setEndDate(""); setPage(0);
  };
  const refreshAfterAction = () => { setInternalRefresh((key) => key + 1); onActionComplete(); };
  const toggleAll = () => setCheckedIds(allChecked ? [] : rows.map((row) => row.noticeId));
  const toggleOne = (id: number) => setCheckedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);

  const openView = async (noticeId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${noticeId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      resetSummary();
      setViewingNotice((await res.json()) as NoticeDetail);
    } catch { setActionError("공지사항을 불러오지 못했습니다."); }
  };
  const closeView = () => { setViewingNotice(null); resetSummary(); };
  const openEdit = async (noticeId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${noticeId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      onEdit((await res.json()) as NoticeDetail);
    } catch { setActionError("공지사항을 불러오지 못했습니다."); }
  };
  const deleteOne = async (noticeId: number) => {
    if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${noticeId}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      refreshAfterAction();
    } catch { setActionError("삭제에 실패했습니다."); }
  };

  return (
    <div className="space-y-3">
      {!canManage && pinnedNotice && (
        <section className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3" aria-label="상단 고정 공지">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-100 text-sm">📌</span>
            <div className="min-w-0"><p className="text-sm font-bold text-amber-800">상단 고정 공지</p><p className="truncate text-base font-semibold text-amber-950">{pinnedNotice.title} <span className="ml-1 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">NEW</span></p></div>
          </div>
          <button type="button" onClick={() => openView(pinnedNotice.noticeId)} className="shrink-0 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50">공지 보기</button>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 md:grid-cols-[80px_132px_minmax(220px,1fr)_auto] md:items-end">
          <label className="text-sm font-semibold text-slate-600">공지 유형<select value={selectedType} onChange={(e) => setSelectedType(e.target.value as NoticeTab)} className="mt-1 block h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"><option>전체</option><option>중요</option><option>일반</option></select></label>
          <label className="text-sm font-semibold text-slate-600">게시 기간<div className="relative mt-1"><CalendarDaysIcon className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-slate-400" /><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="게시 시작일" className="h-9 w-full rounded-md border border-slate-200 pl-7 pr-1 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none" /></div></label>
          <label className="text-sm font-semibold text-slate-600">제목 검색<div className="relative mt-1"><MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-slate-400" /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder="제목으로 검색" className="h-9 w-full rounded-md border border-slate-200 pl-7 pr-3 text-sm focus:border-indigo-500 focus:outline-none" /></div></label>
          <div className="flex gap-1"><button type="button" onClick={resetFilters} className="mt-5 inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"><ArrowPathIcon className="h-3.5 w-3.5" />초기화</button><button type="button" onClick={runSearch} className="mt-5 inline-flex h-9 items-center gap-1 rounded-md bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"><MagnifyingGlassIcon className="h-3.5 w-3.5" />조회</button></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2"><h1 className="text-base font-bold text-slate-900">공지사항 목록</h1><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">총 {totalElements}건</span></div>
          <nav className="flex items-center gap-5 text-sm font-semibold text-slate-400" aria-label="공지사항 분류">{FILTER_TABS.map((tab) => <button key={tab} type="button" onClick={() => setSelectedType(tab)} className={`relative py-1 ${selectedType === tab ? "text-indigo-600 after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-full after:bg-indigo-500" : "hover:text-slate-700"}`}>{tab}</button>)}</nav>
        </div>
        {actionError && <p className="px-4 pt-3 text-sm font-medium text-rose-500">{actionError}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr>{canManage && <th className="w-10 border-b border-slate-200 px-3 py-2 text-center"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="전체 선택" /></th>}<th className="w-14 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">번호</th><th className="w-16 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">유형</th><th className="border-b border-slate-200 px-3 py-2 font-medium">제목</th><th className="w-24 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">공개 대상</th><th className="w-14 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">첨부</th><th className="w-24 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">작성자</th><th className="w-28 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">게시일</th><th className="w-16 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">조회수</th><th className="w-20 whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-medium">상세</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={canManage ? 10 : 9} className="py-16 text-center text-slate-400">로딩 중...</td></tr> : rows.length === 0 ? <tr><td colSpan={canManage ? 10 : 9} className="py-16 text-center text-slate-400">등록된 공지사항이 없습니다.</td></tr> : rows.map((row, index) => <tr key={row.noticeId} className={row.pinned ? "bg-amber-50/70" : "hover:bg-slate-50"}>{canManage && <td className="px-3 py-3 text-center"><input type="checkbox" checked={checkedIds.includes(row.noticeId)} onChange={() => toggleOne(row.noticeId)} aria-label={`${row.title} 선택`} /></td>}<td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">{totalElements - (page * PAGE_SIZE + index)}</td><td className="whitespace-nowrap px-3 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.pinned ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{noticeType(row)}</span></td><td className="px-3 py-3 font-semibold text-slate-800"><button type="button" onClick={() => openView(row.noticeId)} className="text-left hover:text-indigo-600 hover:underline">{row.pinned && <span className="mr-1 text-amber-500">📌</span>}{row.title}{row.pinned && <span className="ml-2 rounded bg-rose-500 px-1 py-0.5 text-[10px] text-white">NEW</span>}</button></td><td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">전체 직원</td><td className="whitespace-nowrap px-3 py-3 text-center text-slate-400">{row.pinned ? <PaperClipIcon className="mx-auto h-3.5 w-3.5" /> : "-"}</td><td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">{row.writerName}</td><td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">{formatDate(row.createdAt)}</td><td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">{row.viewCount}</td><td className="whitespace-nowrap px-3 py-3 text-center"><button type="button" onClick={() => openView(row.noticeId)} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">상세보기</button>{canManage && <div className="mt-1 flex justify-center gap-1"><button type="button" onClick={() => openEdit(row.noticeId)} className="text-xs text-indigo-600">수정</button><button type="button" onClick={() => deleteOne(row.noticeId)} className="text-xs text-rose-500">삭제</button></div>}</td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2"><p className="text-xs text-slate-400">총 {totalElements}건{canManage && ` · ${checkedIds.length}건 선택`}</p><div className="flex gap-1 mr-20"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded border border-slate-200 p-1 text-slate-400 disabled:opacity-40"><ChevronLeftIcon className="h-3.5 w-3.5" /></button><span className="rounded bg-indigo-600 px-2 py-1 text-xs font-bold text-white">{page + 1}</span><button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)} className="rounded border border-slate-200 p-1 text-slate-400 disabled:opacity-40"><ChevronRightIcon className="h-3.5 w-3.5" /></button></div></div>
      </section>

      {viewingNotice && <Modal icon={MegaphoneIcon} title={<>{viewingNotice.pinned && "📌 "}{viewingNotice.title}</>} subtitle={`${viewingNotice.writerName} · ${formatDate(viewingNotice.createdAt)} · 조회 ${viewingNotice.viewCount}`} onClose={closeView} maxWidth="2xl" bodyClassName="max-h-[70vh] overflow-y-auto p-6" footer={<><ModalCancelButton onClick={closeView}>닫기</ModalCancelButton>{canManage && <ModalPrimaryButton type="button" onClick={() => { const notice = viewingNotice; closeView(); onEdit(notice); }}>수정하기</ModalPrimaryButton>}</>}><button type="button" onClick={() => summarize(viewingNotice.content)} disabled={summarizing} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 disabled:opacity-60"><SparklesIcon className="h-3.5 w-3.5" />{summarizing ? "요약 중..." : "AI 요약"}</button>{(summary || summarizeError) && <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${summarizeError ? "border-rose-200 bg-rose-50 text-rose-600" : "border-indigo-200 bg-indigo-50 text-indigo-700"}`}>{summarizeError || summary}</div>}<div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{viewingNotice.content}</div></Modal>}
    </div>
  );
}
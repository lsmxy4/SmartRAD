"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { NoticeDetail, NoticePage, NoticeSummary } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
const PAGE_SIZE = 10;

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value: string) {
  return value ? value.slice(0, 10) : "-";
}

interface Props {
  refreshKey?: number;
  onActionComplete?: () => void;
  onEdit: (notice: NoticeDetail) => void;
}

export default function NoticeList({ refreshKey, onActionComplete, onEdit }: Props) {
  const [data, setData] = useState<NoticePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [internalRefresh, setInternalRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/notices?page=${page}&size=${PAGE_SIZE}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        const res = await fetch(url, { headers: authHeaders() });
        if (res.ok) {
          const json = (await res.json()) as NoticePage;
          if (!cancelled) { setData(json); setCheckedIds([]); }
        } else if (!cancelled) {
          setData(null);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, keyword, refreshKey, internalRefresh]);

  const runSearch = () => {
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const resetFilters = () => {
    setSearchInput("");
    setKeyword("");
    setPage(0);
  };

  const refreshAfterAction = () => {
    setInternalRefresh((key) => key + 1);
    onActionComplete?.();
  };

  const rows = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const pinnedCount = rows.filter((row) => row.pinned).length;

  const allChecked = rows.length > 0 && rows.every((row) => checkedIds.includes(row.noticeId));
  const toggleAll = () => setCheckedIds(allChecked ? [] : rows.map((row) => row.noticeId));
  const toggleOne = (id: number) => setCheckedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const openEdit = async (noticeId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${noticeId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const detail = (await res.json()) as NoticeDetail;
      onEdit(detail);
    } catch {
      setActionError("공지사항을 불러오지 못했습니다.");
    }
  };

  const deleteOne = async (noticeId: number) => {
    if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${noticeId}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      refreshAfterAction();
    } catch {
      setActionError("삭제에 실패했습니다.");
    }
  };

  const setPinnedFor = async (notice: NoticeSummary, pinned: boolean) => {
    try {
      const detailRes = await fetch(`${API_BASE_URL}/notices/${notice.noticeId}`, { headers: authHeaders() });
      if (!detailRes.ok) throw new Error();
      const detail = (await detailRes.json()) as NoticeDetail;
      const res = await fetch(`${API_BASE_URL}/notices/${notice.noticeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: detail.title, content: detail.content, pinned }),
      });
      if (!res.ok) throw new Error();
    } catch {
      throw new Error(`${notice.title} 처리에 실패했습니다.`);
    }
  };

  const bulkSetPinned = async (pinned: boolean) => {
    if (checkedIds.length === 0) {
      window.alert("선택된 공지사항이 없습니다.");
      return;
    }
    setActionError(null);
    const targets = rows.filter((row) => checkedIds.includes(row.noticeId));
    for (const target of targets) {
      try {
        await setPinnedFor(target, pinned);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "처리에 실패했습니다.");
      }
    }
    refreshAfterAction();
  };

  const bulkDelete = async () => {
    if (checkedIds.length === 0) {
      window.alert("선택된 공지사항이 없습니다.");
      return;
    }
    if (!window.confirm(`선택한 ${checkedIds.length}건을 삭제하시겠습니까?`)) return;
    setActionError(null);
    for (const id of checkedIds) {
      try {
        const res = await fetch(`${API_BASE_URL}/notices/${id}`, { method: "DELETE", headers: authHeaders() });
        if (!res.ok) throw new Error();
      } catch {
        setActionError("일부 항목 삭제에 실패했습니다.");
      }
    }
    refreshAfterAction();
  };

  return (
    <div className="flex flex-col gap-6 min-h-0 flex-1">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 또는 작성자</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                placeholder="제목 또는 작성자 검색"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetFilters} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowPathIcon className="w-4 h-4" />
              초기화
            </button>
            <button type="button" onClick={runSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#4A5DDF] hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm">
              <MagnifyingGlassIcon className="w-4 h-4" />
              조회
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0 flex-1 shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">공지사항 목록</h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">총 {totalElements}건</span>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">상단 고정 {pinnedCount}건</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => bulkSetPinned(true)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">상단 고정</button>
            <button type="button" onClick={() => bulkSetPinned(false)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">고정 해제</button>
            <button type="button" onClick={bulkDelete} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">삭제</button>
          </div>
        </div>
        {actionError && <p className="px-5 pt-3 text-sm font-medium text-rose-500">{actionError}</p>}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-center border-b border-gray-200 w-12">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200">제목</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">작성자</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">등록일</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">조회수</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">고정</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">로딩 중...</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <p className="text-base font-medium text-gray-900 mb-1">데이터가 없습니다</p>
                      <p className="text-sm">등록된 공지사항이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.noticeId} className={row.pinned ? "bg-orange-50/40" : ""}>
                    <td className="py-3 px-4 text-center">
                      <input type="checkbox" checked={checkedIds.includes(row.noticeId)} onChange={() => toggleOne(row.noticeId)} className="rounded border-gray-300" />
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {row.pinned && <span className="mr-1.5 text-orange-500">📌</span>}
                      {row.title}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center whitespace-nowrap">{row.writerName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">{row.viewCount}</td>
                    <td className="py-3 px-4 text-sm text-center">
                      {row.pinned ? <span className="text-orange-500 font-semibold text-xs">고정됨</span> : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-center whitespace-nowrap">
                      <div className="flex justify-center gap-1.5">
                        <button type="button" onClick={() => openEdit(row.noticeId)} className="px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50">수정</button>
                        <button type="button" onClick={() => deleteOne(row.noticeId)} className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 {totalElements}건 조회 · {checkedIds.length}건 선택
          </p>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"><ChevronLeftIcon className="w-4 h-4" /></button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-blue-600 text-white text-sm">{page + 1}</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { XMarkIcon, MegaphoneIcon } from "@heroicons/react/24/outline";
import type { NoticeDetail } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

const inputClasses = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Props {
  notice?: NoticeDetail | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function NoticeRegisterModal({ notice, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(notice?.title ?? "");
  const [content, setContent] = useState(notice?.content ?? "");
  const [pinned, setPinned] = useState(notice?.pinned ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(notice?.title ?? "");
    setContent(notice?.content ?? "");
    setPinned(notice?.pinned ?? false);
  }, [notice]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = notice ? `${API_BASE_URL}/notices/${notice.noticeId}` : `${API_BASE_URL}/notices`;
      const res = await fetch(url, {
        method: notice ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), pinned }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "저장에 실패했습니다.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MegaphoneIcon className="w-5 h-5 text-blue-600" />
            {notice ? "공지사항 수정" : "공지사항 등록"}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div>
              <label className={labelClasses}>제목 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className={inputClasses} placeholder="공지 제목을 입력하세요" />
            </div>

            <div>
              <label className={labelClasses}>내용 *</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className={inputClasses} placeholder="공지 내용을 입력하세요" />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              상단 고정
            </label>

            {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">취소</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

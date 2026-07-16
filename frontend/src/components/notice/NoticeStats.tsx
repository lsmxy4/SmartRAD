"use client";

import { ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon, DocumentIcon, ViewfinderCircleIcon } from "@heroicons/react/24/outline";

export default function NoticeStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-gray-500 font-medium">전체 공지</p>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
            <ClipboardDocumentListIcon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">-건</h3>
        <p className="text-xs text-gray-400 mt-1">전체 등록 공지</p>
      </div>

      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5 flex flex-col shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-blue-600 font-medium">게시 중</p>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <CheckCircleIcon className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-blue-900">-건</h3>
        <p className="text-xs text-blue-500 mt-1">현재 노출 중</p>
      </div>

      <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-5 flex flex-col shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-emerald-600 font-medium">예약 게시</p>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <ClockIcon className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-emerald-900">-건</h3>
        <p className="text-xs text-emerald-500 mt-1">게시 예정</p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex flex-col shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gray-400"></div>
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-gray-600 font-medium">임시 저장</p>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100">
            <DocumentIcon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">-건</h3>
        <p className="text-xs text-gray-500 mt-1">작성 중</p>
      </div>

      <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-5 flex flex-col shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-orange-600 font-medium">상단 고정</p>
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <ViewfinderCircleIcon className="w-4 h-4 text-orange-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-orange-900">-건</h3>
        <p className="text-xs text-orange-500 mt-1">중요 공지</p>
      </div>
    </div>
  );
}

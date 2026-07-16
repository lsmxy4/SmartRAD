"use client";

import { MagnifyingGlassIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, PaperClipIcon } from "@heroicons/react/24/outline";

// 데이터 형식을 참고하시라고 주석으로 남겨둡니다.
/*
const NoticeDataTemplate = {
  id: 24, // 번호
  type: "중요", // 공지 유형
  typeColor: "bg-yellow-100 text-yellow-700", // 유형 배지 색상
  title: "2026년 하계 휴가 운영 안내", // 제목
  audience: "전체 직원", // 공개 대상
  attach: 1, // 첨부파일 개수
  author: "박성민", // 작성자
  startDate: "2026-07-14", // 게시 시작일
  endDate: "2026-08-31", // 게시 종료일
  status: "게시 중", // 게시 상태
  statusColor: "text-blue-600", // 상태 배지 색상
  views: 186, // 조회수
  pinned: true // 상단 고정 여부
};
*/

export default function NoticeList() {
  return (
    <div className="flex flex-col gap-6 min-h-0 flex-1">
      {/* Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">게시 상태</label>
            <select className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">전체</option>
              <option value="ACTIVE">게시 중</option>
              <option value="SCHEDULED">예약 게시</option>
              <option value="DRAFT">임시 저장</option>
              <option value="CLOSED">게시 종료</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">공지 유형</label>
            <select className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">전체</option>
              <option value="URGENT">긴급</option>
              <option value="IMPORTANT">중요</option>
              <option value="HR">인사</option>
              <option value="SYSTEM">시스템</option>
              <option value="GENERAL">일반</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">공개 대상</label>
            <select className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">전체</option>
              <option value="ALL_EMP">전체 직원</option>
              <option value="EXEC">임원진</option>
              <option value="HR_TEAM">인사팀</option>
              <option value="IT_TEAM">IT본부</option>
            </select>
          </div>
          <div className="w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">게시 기간</label>
            <input type="text" placeholder="시작일 ~ 종료일" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 또는 작성자</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="제목 또는 작성자 검색" className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowPathIcon className="w-4 h-4" />
              초기화
            </button>
            <button className="flex items-center gap-1.5 px-6 py-2 bg-[#4A5DDF] hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm">
              <MagnifyingGlassIcon className="w-4 h-4" />
              조회
            </button>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0 flex-1 shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">공지사항 목록</h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">총 -건</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">게시 중 -건</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">예약 -건</span>
              <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 text-xs font-medium">임시 저장 -건</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">상단 고정</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">고정 해제</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">게시 종료</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">삭제</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-center border-b border-gray-200 w-12"><input type="checkbox" className="rounded border-gray-300" /></th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">번호</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">유형</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200">제목</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">공개 대상</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">첨부</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">작성자</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">게시 시작일</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">게시 종료일</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">게시 상태</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">조회수</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">고정</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td colSpan={13} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-base font-medium text-gray-900 mb-1">데이터가 없습니다</p>
                    <p className="text-sm">등록된 공지사항이 없거나 서버 연동 전입니다.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 -건 조회 - 0건 선택
          </p>
          <div className="flex gap-1">
            <button disabled className="p-2 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed"><ChevronLeftIcon className="w-4 h-4" /></button>
            <button disabled className="px-3 py-1.5 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed">1</button>
            <button disabled className="p-2 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed"><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

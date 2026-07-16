import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { LeaveFilters, LeaveTypeResponse } from "./leaveApprovalTypes";

const fieldClass = "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
interface Props { filters: LeaveFilters; leaveTypes: LeaveTypeResponse[]; onChange: (next: Partial<LeaveFilters>) => void; onReset: () => void; }

export default function LeaveApprovalFilters({ filters, leaveTypes, onChange, onReset }: Props) {
  return <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1.6fr_auto] xl:items-end">
    <label className="space-y-1.5 text-sm font-medium text-gray-600"><span>신청 기간 시작</span><input type="date" value={filters.startDate} onChange={(event) => onChange({ startDate: event.target.value })} className={`${fieldClass} w-full`} /></label>
    <label className="space-y-1.5 text-sm font-medium text-gray-600"><span>신청 기간 종료</span><input type="date" value={filters.endDate} onChange={(event) => onChange({ endDate: event.target.value })} className={`${fieldClass} w-full`} /></label>
    <label className="space-y-1.5 text-sm font-medium text-gray-600"><span>휴가 유형</span><select value={filters.leaveTypeId} onChange={(event) => onChange({ leaveTypeId: event.target.value })} className={`${fieldClass} w-full`}><option value="">전체</option>{leaveTypes.map((type) => <option key={type.leaveTypeId} value={type.leaveTypeId}>{type.leaveTypeName}</option>)}</select></label>
    <label className="space-y-1.5 text-sm font-medium text-gray-600"><span>상태</span><select value={filters.status} onChange={(event) => onChange({ status: event.target.value })} className={`${fieldClass} w-full`}><option value="">전체</option><option value="PENDING">승인 대기</option><option value="APPROVED">승인 완료</option><option value="REJECTED">반려</option></select></label>
    <label className="space-y-1.5 text-sm font-medium text-gray-600"><span>이름, 부서 검색</span><span className="relative block"><MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={filters.keyword} onChange={(event) => onChange({ keyword: event.target.value })} placeholder="이름, 부서로 검색" className={`${fieldClass} w-full pl-9`} /></span></label>
    <button type="button" onClick={onReset} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"><ArrowPathIcon className="h-4 w-4" />초기화</button>
  </section>;
}

"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

// types
export interface Employee {
  employeeId: number;
  name: string;
  departmentId: number | null;
  departmentName: string;
  positionId: number | null;
  positionName: string;
  employmentTypeId: number | null;
  employmentTypeName: string;
  employeeStatusCode: string; // "ACTIVE", "LEAVE", "RESIGNED"
  email: string;
}

interface PageData {
  content: Employee[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface EmployeeListProps {
  onSelectEmployee: (id: number) => void;
  selectedId: number | null;
  refreshKey?: number;
  role?: string | null;
}

export default function EmployeeList({ onSelectEmployee, selectedId, refreshKey, role }: EmployeeListProps) {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, selectedDepartment, selectedStatus, sortBy, keyword, refreshKey]);

  const runSearch = () => {
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setKeyword("");
    setPage(0);
  };

  const resetFilters = () => {
    setSearchInput("");
    setKeyword("");
    setSortBy("name");
    setSelectedDepartment("");
    setSelectedStatus("");
    setPage(0);
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/departments`);
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  };

  const sortParam = sortBy === "position" ? "position.level,desc" : "name,asc";

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/employees?page=${page}&size=5&sort=${sortParam}`;
      if (selectedDepartment) url += `&departmentId=${selectedDepartment}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setCheckedIds([]); // Reset checks on page change
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ACTIVE": return "text-emerald-600 before:bg-emerald-500";
      case "LEAVE": return "text-orange-600 before:bg-orange-500";
      case "RESIGNED": return "text-rose-600 before:bg-rose-500";
      default: return "text-gray-600 before:bg-gray-500";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE": return "재직";
      case "LEAVE": return "휴직";
      case "RESIGNED": return "퇴사";
      default: return status;
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data) {
      setCheckedIds(data.content.map(emp => emp.employeeId));
    } else {
      setCheckedIds([]);
    }
  };

  const handleCheck = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isAllChecked = data && data.content.length > 0 && checkedIds.length === data.content.length;

  const hasActiveFilters = sortBy !== "name" || selectedDepartment !== "" || selectedStatus !== "" || keyword !== "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">직원 목록</h2>
          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {data?.totalElements || 0}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={runSearch}
            aria-label="검색"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            className="pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">이름순</option>
          <option value="position">직급순</option>
        </select>
        <select
          value={selectedDepartment}
          onChange={(e) => { setSelectedDepartment(e.target.value); setPage(0); }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">부서 전체</option>
          {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">재직 상태 전체</option>
          <option value="ACTIVE">재직</option>
          <option value="LEAVE">휴직</option>
          <option value="RESIGNED">퇴사</option>
        </select>
        <button
          onClick={resetFilters}
          title="검색/필터 초기화"
          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
            hasActiveFilters
              ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
              : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
          }`}
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50 uppercase border-y border-gray-200">
            <tr>
              {role === "ADMIN" && (
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={isAllChecked || false}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                  />
                </th>
              )}
              <th className="px-6 py-3 font-semibold">이름</th>
              <th className="px-6 py-3 font-semibold">부서</th>
              <th className="px-6 py-3 font-semibold">직급</th>
              <th className="px-6 py-3 font-semibold text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">로딩 중...</td></tr>
            ) : data?.content?.map((emp) => (
              <tr 
                key={emp.employeeId} 
                onClick={() => onSelectEmployee(emp.employeeId)}
                className={`border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedId === emp.employeeId ? "bg-blue-50/50" : "hover:bg-gray-50"
                }`}
              >
                {role === "ADMIN" && (
                  <td className="px-6 py-4" onClick={(e) => handleCheck(e, emp.employeeId)}>
                    <input 
                      type="checkbox" 
                      checked={checkedIds.includes(emp.employeeId)} 
                      onChange={() => {}} // dummy onChange to silence warning, handled by td click
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                  </td>
                )}
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedId === emp.employeeId ? 'bg-blue-600' : 'bg-gray-400'}`}>
                    {emp.name ? emp.name.charAt(0) : '?'}
                  </div>
                  {emp.name}
                </td>
                <td className="px-6 py-4 text-gray-600">{emp.departmentName || "-"}</td>
                <td className="px-6 py-4 text-gray-600">{emp.positionName || "-"}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 font-medium before:content-[''] before:block before:w-1.5 before:h-1.5 before:rounded-full ${getStatusStyle(emp.employeeStatusCode)}`}>
                    {getStatusText(emp.employeeStatusCode)}
                  </span>
                </td>
              </tr>
            ))}
            {(!data || data.content.length === 0) && !loading && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {data ? `${data.number * data.size + 1}-${Math.min((data.number + 1) * data.size, data.totalElements)} / ${data.totalElements}명` : "0명"}
        </span>
        <div className="flex items-center gap-1">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          
          {[...Array(data?.totalPages || 0)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                page === i ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            disabled={page >= (data?.totalPages || 1) - 1}
            onClick={() => setPage(p => p + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import EmployeeStats from "@/components/employee/EmployeeStats";
import EmployeeList from "@/components/employee/EmployeeList";
import EmployeeDetail from "@/components/employee/EmployeeDetail";
import EmployeeEditModal from "@/components/employee/EmployeeEditModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EmployeesPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger re-fetch in List and Detail

  const handleDelete = async (id: number) => {
    if (confirm("정말로 이 직원을 삭제하시겠습니까?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (res.ok) {
          alert("삭제되었습니다.");
          setSelectedEmployeeId(null);
          setRefreshKey((prev) => prev + 1);
        } else {
          alert("삭제 실패");
        }
      } catch (error) {
        alert("오류 발생");
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
      <EmployeeStats refreshKey={refreshKey} />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <EmployeeList
          refreshKey={refreshKey}
          onSelectEmployee={setSelectedEmployeeId}
          selectedId={selectedEmployeeId}
        />
        <EmployeeDetail
          refreshKey={refreshKey}
          employeeId={selectedEmployeeId}
          onEditClick={setEditEmployee}
          onDeleteClick={handleDelete}
        />
      </div>

      {editEmployee && (
        <EmployeeEditModal 
          employee={editEmployee} 
          onClose={() => setEditEmployee(null)} 
          onSave={() => {
            setEditEmployee(null);
            setRefreshKey((prev) => prev + 1);
          }} 
        />
      )}
    </div>
  );
}

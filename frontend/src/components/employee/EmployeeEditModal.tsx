"use client";

import { useState } from "react";
import { XMarkIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "재직", selectedClasses: "border-emerald-500 bg-emerald-50 text-emerald-600" },
  { value: "LEAVE", label: "휴직", selectedClasses: "border-orange-500 bg-orange-50 text-orange-600" },
  { value: "RESIGNED", label: "퇴사", selectedClasses: "border-rose-500 bg-rose-50 text-rose-600" },
];

const inputClasses = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

export default function EmployeeEditModal({ employee, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    ...employee,
    name: employee.name || "",
    email: employee.email || "",
    phone: employee.phone || "",
    address: employee.address || "",
    employeeStatusCode: employee.employeeStatusCode || "ACTIVE",
    employmentTypeId: employee.employmentTypeId || 1,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev: any) => ({ ...prev, profileImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employee.employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onSave();
      } else {
        alert("수정 실패");
      }
    } catch (error) {
      console.error(error);
      alert("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-blue-600" />
            직원 정보 수정
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">프로필 사진</h3>
              </div>
              <div className="p-4 flex items-center gap-4">
                {formData.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.profileImage} alt="프로필 사진" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                ) : (
                  <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
                    {formData.name ? formData.name.charAt(0) : "?"}
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  사진 변경
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                </label>
                {formData.profileImage && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, profileImage: null }))}
                    className="px-3 py-1.5 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-md hover:bg-rose-50"
                  >
                    사진 삭제
                  </button>
                )}
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">기본 정보</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className={labelClasses}>이름</label>
                  <input name="name" value={formData.name} onChange={handleChange} required className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>이메일</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>연락처</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>주소</label>
                  <input name="address" value={formData.address} onChange={handleChange} placeholder="주소를 입력하세요" className={inputClasses} />
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">재직 상태</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((option) => {
                    const selected = formData.employeeStatusCode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setFormData({ ...formData, employeeStatusCode: option.value })}
                        className={`h-10 rounded-lg border text-sm font-bold transition-colors ${
                          selected ? option.selectedClasses : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
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

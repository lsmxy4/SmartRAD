"use client";

import { useCallback, useEffect, useState } from "react";
import NoticeStats from "@/components/notice/NoticeStats";
import NoticeList from "@/components/notice/NoticeList";
import NoticeRegisterModal from "@/components/notice/NoticeRegisterModal";
import type { NoticeDetail } from "@/components/notice/types";

export default function NoticesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeDetail | null>(null);

  useEffect(() => {
    const handleRegisterEvent = () => { setEditingNotice(null); setShowModal(true); };
    window.addEventListener("notice:register", handleRegisterEvent);
    return () => window.removeEventListener("notice:register", handleRegisterEvent);
  }, []);

  const handleEdit = useCallback((notice: NoticeDetail) => {
    setEditingNotice(notice);
    setShowModal(true);
  }, []);

  const handleSaved = useCallback(() => {
    setShowModal(false);
    setEditingNotice(null);
    setRefreshKey((key) => key + 1);
  }, []);

  const handleActionComplete = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col p-6">
      <NoticeStats refreshKey={refreshKey} />
      <NoticeList refreshKey={refreshKey} onActionComplete={handleActionComplete} onEdit={handleEdit} />
      {showModal && (
        <NoticeRegisterModal
          notice={editingNotice}
          onClose={() => { setShowModal(false); setEditingNotice(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

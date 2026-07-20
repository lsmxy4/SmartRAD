"use client";

import { useCallback, useEffect, useState } from "react";
import CertificateStats from "@/components/certificate/CertificateStats";
import CertificateList from "@/components/certificate/CertificateList";
import CertificateRegisterModal from "@/components/certificate/CertificateRegisterModal";

export default function CertificatesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleRegisterEvent = () => setShowModal(true);
    window.addEventListener("certificate:register", handleRegisterEvent);
    return () => window.removeEventListener("certificate:register", handleRegisterEvent);
  }, []);

  const handleSaved = useCallback(() => {
    setShowModal(false);
    setRefreshKey((key) => key + 1);
  }, []);

  const handleActionComplete = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col p-6">
      <CertificateStats refreshKey={refreshKey} />
      <CertificateList refreshKey={refreshKey} onActionComplete={handleActionComplete} />
      {showModal && (
        <CertificateRegisterModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}

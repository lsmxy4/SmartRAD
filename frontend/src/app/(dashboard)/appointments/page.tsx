"use client";

import { useCallback, useEffect, useState } from "react";
import AppointmentStats from "@/components/appointment/AppointmentStats";
import AppointmentList from "@/components/appointment/AppointmentList";
import AppointmentRegisterModal from "@/components/appointment/AppointmentRegisterModal";

export default function AppointmentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleRegisterEvent = () => setShowModal(true);
    window.addEventListener("appointment:register", handleRegisterEvent);
    return () => window.removeEventListener("appointment:register", handleRegisterEvent);
  }, []);

  const handleSaved = useCallback(() => {
    setShowModal(false);
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col p-6">
      <AppointmentStats refreshKey={refreshKey} />
      <AppointmentList refreshKey={refreshKey} />
      {showModal && (
        <AppointmentRegisterModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}

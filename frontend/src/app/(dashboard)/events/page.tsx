"use client";

import { useCallback, useState } from "react";
import EventSupportStats from "@/components/eventsupport/EventSupportStats";
import EventSupportList from "@/components/eventsupport/EventSupportList";

export default function EventSupportAdminPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionComplete = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col p-6">
      <EventSupportStats refreshKey={refreshKey} />
      <EventSupportList refreshKey={refreshKey} onActionComplete={handleActionComplete} />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
        online
          ? "bg-sage/10 text-sage-600 dark:text-sage-300"
          : "bg-amber/10 text-amber dark:text-amber-300"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          online ? "bg-sage" : "bg-amber animate-pulse-gentle"
        }`}
      />
      {online ? "Connected" : "Offline — saved locally"}
    </div>
  );
}

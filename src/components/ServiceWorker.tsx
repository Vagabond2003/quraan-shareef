"use client";
import { useEffect } from "react";
import { BASE } from "@/lib/base";

export default function ServiceWorker() {
  useEffect(() => {
    // Re-evaluate the sun-following theme every five minutes.
    const id = setInterval(() => (window as unknown as { __qsApply?: () => void }).__qsApply?.(), 5 * 60 * 1000);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE}/sw.js`).catch(() => {});
    }
    return () => clearInterval(id);
  }, []);
  return null;
}

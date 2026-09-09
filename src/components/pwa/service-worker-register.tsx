"use client";

import { useEffect } from "react";

// Registers the hand-written service worker (public/sw.js) once on the client.
// Production only: dev has its own asset pipeline and we do not want a cache
// sitting in front of it.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures are non-fatal; the app works online without it.
    });
  }, []);

  return null;
}

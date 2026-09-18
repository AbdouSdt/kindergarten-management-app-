"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// Android hardware back button inside the Capacitor shell: navigate the
// WebView history, and only close the app when there is nothing to go back to.
// Renders nothing and is a no-op on the web / installed PWA.
export function NativeBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let remove: (() => Promise<void>) | undefined;

    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        void App.exitApp();
      }
    })
      .then((handle) => {
        // Effect may have been cleaned up before the listener registered.
        if (cancelled) void handle.remove();
        else remove = () => handle.remove();
      })
      .catch(() => {
        // Plugin unavailable: fall back to the WebView default behaviour.
      });

    return () => {
      cancelled = true;
      void remove?.();
    };
  }, []);

  return null;
}

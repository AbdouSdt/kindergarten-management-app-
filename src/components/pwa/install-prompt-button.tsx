"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

// The install-prompt event is not in the DOM lib types yet.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Renders «ثبّت التطبيق» only while the browser is offering a PWA install.
// Hides itself once the app is installed or already running standalone.
export function InstallPromptButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (!installEvent) return null;

  const onClick = async () => {
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } catch {
      // Prompt rejected (dismissed via browser chrome) or event went stale.
      // Fall through to clearing the captured event either way.
    } finally {
      setInstallEvent(null);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="min-h-[44px]"
    >
      ثبّت التطبيق
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

/** Chromium's install event. It is not in the TypeScript DOM types. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * The "Install" button in the header. It shows only when the browser can
 * install the site as an app (Chromium browsers). Other browsers use their
 * own menu, for example Safari's "Add to Home Screen".
 */
export function InstallButton({ lang }: { lang: Lang }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  const install = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    // The browser lets each event prompt one time only.
    setInstallEvent(null);
  };

  return (
    <button
      type="button"
      onClick={install}
      aria-label={UI[lang].installApp}
      title={UI[lang].installApp}
      className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-bg-raised/60 text-text-dim transition-colors hover:border-border-strong hover:text-text"
    >
      <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden="true">
        <path
          d="M10 3v9M6.5 8.5 10 12l3.5-3.5M4 14.5v1.2c0 .7.6 1.3 1.3 1.3h9.4c.7 0 1.3-.6 1.3-1.3v-1.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

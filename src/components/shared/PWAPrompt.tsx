"use client";

import { useEffect, useState } from "react";
import { Download, Bell, X } from "lucide-react";

export function PWAPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // PWA install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Notification permission banner
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        setShowNotifBanner(true);
      } else if (Notification.permission === "granted") {
        setNotifGranted(true);
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
    setInstallPrompt(null);
  };

  const handleEnableNotifications = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifGranted(true);
    }
    setShowNotifBanner(false);
  };

  return (
    <>
      {/* PWA Install Banner */}
      {showInstall && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <Download className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Install DOAMS</p>
            <p className="text-xs text-gray-400 leading-tight">Add to home screen for quick access</p>
          </div>
          <button
            onClick={handleInstall}
            className="bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 hover:bg-gray-100 transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstall(false)}
            className="text-gray-500 hover:text-white transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Notification Permission Banner */}
      {showNotifBanner && !notifGranted && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3"
          style={{ bottom: showInstall ? "5rem" : undefined }}>
          <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Enable notifications</p>
            <p className="text-xs text-gray-500 leading-tight">Get reminders for daily entry submissions</p>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 hover:bg-blue-700 transition-colors"
          >
            Enable
          </button>
          <button
            onClick={() => setShowNotifBanner(false)}
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}

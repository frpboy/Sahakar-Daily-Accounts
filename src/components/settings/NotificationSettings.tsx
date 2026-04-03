"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
        setSwRegistered(!!reg);
      });
    }
  }, []);

  const handleEnable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.register("/sw.js");
      setSwRegistered(!!reg);
    }
  };

  const handleTest = () => {
    if (permission !== "granted") return;
    new Notification("Sahakar Daily Accounts", {
      body: "Notifications are working correctly.",
      icon: "/icons/icon-192x192.png",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1 mb-8">
        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        <p className="text-xs text-gray-500">Manage push notification preferences</p>
      </div>

      {permission === "unsupported" ? (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-4">
          <BellOff className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Not supported</p>
            <p className="text-xs text-gray-500 mt-1">Your browser does not support push notifications. Try Chrome or Edge.</p>
          </div>
        </div>
      ) : permission === "denied" ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-start gap-4">
          <BellOff className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Notifications blocked</p>
            <p className="text-xs text-red-600 mt-1">
              You have blocked notifications for this site. To re-enable, click the lock icon in your browser's address bar and allow notifications.
            </p>
          </div>
        </div>
      ) : permission === "granted" ? (
        <div className="space-y-4">
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">Notifications enabled</p>
              <p className="text-xs text-emerald-700 mt-1">You will receive push notifications for daily entry reminders and admin alerts.</p>
            </div>
          </div>
          <div className="p-6 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Service worker</p>
                <p className="text-xs text-gray-500">{swRegistered ? "Registered and active" : "Not yet registered"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleTest} className="text-xs">
              Send test
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-4 mb-4">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Enable push notifications</p>
              <p className="text-xs text-blue-700 mt-1">
                Get reminders when daily entries are due and receive admin alerts in real time.
              </p>
            </div>
          </div>
          <Button onClick={handleEnable} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            Enable Notifications
          </Button>
        </div>
      )}
    </div>
  );
}

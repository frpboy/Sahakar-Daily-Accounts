"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Download } from "lucide-react";
import { toast } from "sonner";

export function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);

  useEffect(() => {
    // 1. PWA Install Prompt Logic
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallDialog(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 2. Standalone mode check
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!isStandalone) {
      // If we're not running as PWA, we suggest installation on every load
      // Note: native prompt will only work if handleBeforeInstallPrompt fired
      setShowInstallDialog(true);
    }

    // 3. Notification Permission Logic
    const checkNotificationPermission = () => {
      if (!("Notification" in window)) return;
      
      // If permission is default, we show the dialog every time the page loads
      if (Notification.permission === "default") {
        setShowNotificationDialog(true);
      }
    };

    checkNotificationPermission();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallDialog(false);
      toast.success("Thank you for installing Sahakar ERP!");
    } else {
      setShowInstallDialog(false);
    }
  };

  const handleNotificationRequest = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notifications enabled successfully!");
    } else {
      toast.error("Notification permission denied.");
    }
    setShowNotificationDialog(false);
  };

  return (
    <>
      {/* PWA Install Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Download className="h-8 w-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tighter">Install Sahakar ERP</DialogTitle>
              <DialogDescription className="text-gray-500 font-medium leading-relaxed">
                Experience Sahakar ERP with full offline capabilities, faster load times, and real-time data synchronization.
                <br /><br />
                <span className="text-xs font-black uppercase text-gray-400 tracking-widest block mb-1">How to Install</span>
                • On Chrome: Just click &quot;Install App Now&quot;<br />
                • On iOS: Tap the <span className="font-bold">Share</span> button and select <span className="font-bold">&quot;Add to Home Screen&quot;</span>
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:justify-center">
            <Button 
                variant="outline" 
                onClick={() => setShowInstallDialog(false)}
                className="w-full sm:w-auto h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 border-gray-200"
            >
              Maybe Later
            </Button>
            <Button 
                onClick={handleInstallClick}
                className="w-full sm:w-auto h-12 rounded-xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
            >
              Install App Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Permission Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Bell className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tighter">Enable Notifications</DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                Stay updated with critical alerts, branch status, and account updates in real-time. We promise to only send important info.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:justify-center">
            <Button 
                variant="outline" 
                onClick={() => setShowNotificationDialog(false)}
                className="w-full sm:w-auto h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 border-gray-200"
            >
              No Thanks
            </Button>
            <Button 
                onClick={handleNotificationRequest}
                className="w-full sm:w-auto h-12 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 hover:scale-105 transition-all"
            >
              Allow Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

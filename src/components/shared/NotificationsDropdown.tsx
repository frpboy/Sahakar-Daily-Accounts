"use client";

import { useState, useEffect } from "react";
import { Bell, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { markNotificationAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleReadAll = async () => {
    const res = await markAllAsRead("all"); // Current implementation uses "all" for global admin mocks
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "security": return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-none h-10 w-10 border border-transparent hover:border-gray-200 transition-all">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-red-500 text-white text-[8px] font-black rounded-none flex items-center justify-center border border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 mt-2 border border-gray-200 shadow-2xl rounded-none bg-white">
        <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm tracking-tight uppercase">Notifications</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Real-time System Updates</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReadAll}
              className="text-[10px] font-black uppercase h-7 px-2 hover:bg-white/10 text-blue-500"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 bg-gray-50 rounded-none flex items-center justify-center text-gray-300">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No new updates</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`group relative flex gap-3 p-3 rounded-none transition-all cursor-pointer m-px border border-transparent ${notification.isRead ? 'hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50 border-blue-100/50'}`}
                  onMouseEnter={() => {
                    if (!notification.isRead) {
                       handleMarkAsRead(notification.id);
                    }
                  }}
                  onClick={() => {
                    if (notification.link) {
                       router.push(notification.link);
                    }
                  }}
                >
                  <div className={`mt-1 h-8 w-8 rounded-none flex items-center justify-center shrink-0 border ${
                    notification.isRead ? 'bg-gray-100 border-gray-200' : 'bg-white border-blue-200 shadow-sm'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                       <p className={`text-[11px] font-bold truncate uppercase tracking-tight ${notification.isRead ? 'text-gray-900' : 'text-blue-900'}`}>
                        {notification.title}
                      </p>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap mt-0.5">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed font-medium">
                      {notification.message}
                    </p>
                    
                    {notification.link && (
                      <div className="flex items-center gap-1 text-[9px] uppercase font-black tracking-widest text-blue-500 mt-2">
                        View details
                      </div>
                    )}
                  </div>

                  {!notification.isRead && (
                    <div className="absolute right-3 bottom-3 h-1.5 w-1.5 bg-blue-500 rounded-none animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator className="m-0 bg-gray-50" />
        <Link href="/admin/audit-logs">
          <Button variant="ghost" className="w-full rounded-none h-12 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-50">
            View all activity
          </Button>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

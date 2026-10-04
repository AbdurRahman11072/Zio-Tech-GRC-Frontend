"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  Mail,
  FileText,
  Clock,
  ExternalLink,
  CheckCheck,
  X,
  Sparkles,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/api";

interface NotificationBellProps {
  token: string | null;
}

export default function NotificationBell({ token }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const data = await fetchNotifications(token);
      setNotifications(data);
    } catch {
      // Ignore polling errors quietly
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      await markNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Activity & Alerts
              </span>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Bell className="h-6 w-6 text-slate-300" />
                <span>No notifications yet</span>
              </div>
            ) : (
              notifications.map((item) => {
                const isTorAlert =
                  item.type === "TOR_FINALIZED_UPLOAD_REQUIRED";
                const isEvidenceAlert =
                  item.type === "EVIDENCE_UPLOADED_REVIEW_REQUIRED";

                return (
                  <div
                    key={item.id}
                    onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                    className={`p-3.5 text-xs transition-colors cursor-pointer flex gap-3 ${
                      item.isRead
                        ? "bg-white hover:bg-slate-50"
                        : "bg-indigo-50/40 hover:bg-indigo-50/70"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center ${
                        isTorAlert
                          ? "bg-indigo-100 text-indigo-700"
                          : isEvidenceAlert
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isTorAlert ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <h4
                          className={`truncate text-xs ${
                            item.isRead
                              ? "font-semibold text-slate-800"
                              : "font-bold text-slate-900"
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate text-indigo-600 font-mono">
                          To: {item.recipientEmail}
                        </span>
                        {!item.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

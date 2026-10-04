"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCheck,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/api";

interface NotificationsCenterProps {
  token: string | null;
  onNavigateToAudit?: (auditId: string) => void;
  onNavigateToDrt?: (auditId: string) => void;
}

export default function NotificationsCenter({
  token,
  onNavigateToAudit,
  onNavigateToDrt,
}: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadNotifications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await fetchNotifications(token);
      setNotifications(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      await markNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
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

  const filtered = notifications.filter((n) => {
    const matchesFilter = filter === "all" || !n.isRead;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string, title: string) => {
    if (title.toLowerCase().includes("revision") || type.toLowerCase().includes("revision")) {
      return <AlertTriangle className="h-4 w-4 text-rose-500" />;
    }
    if (title.toLowerCase().includes("task") || type.toLowerCase().includes("task")) {
      return <Clock className="h-4 w-4 text-purple-500" />;
    }
    if (title.toLowerCase().includes("completed") || title.toLowerCase().includes("approved")) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    return <Bell className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700 tracking-wider uppercase">
              Notifications & Alerts
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 shadow-xs">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Audit Activity & Dispatches
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time notifications for TOR finalizations, evidence uploads, task assignments, and review remarks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadNotifications}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 text-indigo-600" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === "unread"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Notifications</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filter === "unread"
                ? "You have caught up with all activity alerts!"
                : "Audit dispatches and system updates will appear here."}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.isRead && handleMarkAsRead(item.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                !item.isRead ? "bg-indigo-50/40" : "bg-white"
              }`}
            >
              <div className="rounded-xl p-2.5 bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                {getNotificationIcon(item.type, item.title)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{item.title}</span>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {item.message}
                </p>

                <div className="flex items-center gap-3">
                  {item.auditProjectId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateToDrt) onNavigateToDrt(item.auditProjectId!);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Open in DRT Tracker</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

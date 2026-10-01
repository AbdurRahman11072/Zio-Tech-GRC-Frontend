"use client";

import { useAuth } from "@/context/authContext";
import { ShieldCheck, LogOut, Database, User, FileText, CheckCircle2 } from "lucide-react";

export default function UserDashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleColors: Record<string, string> = {
    admin: "bg-red-50 text-red-700 border-red-200",
    auditor: "bg-purple-50 text-purple-700 border-purple-200",
    auditee: "bg-blue-50 text-blue-700 border-blue-200",
    company_user: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            Z
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">Zio Tech GRC</h1>
            <p className="text-[11px] text-slate-500">Audit & Compliance Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected to Neon DB</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-red-600 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome Card */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-10 shadow-xl relative overflow-hidden mb-8">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                  roleColors[user.role] || "bg-white/10 text-white"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {user.role.replace("_", " ")}
              </span>
              <span className="text-xs text-indigo-200">ID: {user.id.slice(0, 8)}...</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Welcome back, {user.name}!
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 max-w-xl">
              You are signed in as <strong className="text-white">{user.email}</strong>. Your session is authenticated and connected to the backend API.
            </p>
          </div>
        </div>

        {/* Quick Audit Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Audit Projects</h3>
            <p className="text-xs text-slate-500 mb-4">
              Manage audit scopes, guidelines, and TOR parent-child trees.
            </p>
            <span className="text-xs font-semibold text-indigo-600">Active Module &rarr;</span>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">DRT Tracker</h3>
            <p className="text-xs text-slate-500 mb-4">
              Document requirement tracking, review remarks, and verifications.
            </p>
            <span className="text-xs font-semibold text-purple-600">Active Module &rarr;</span>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Neon Database</h3>
            <p className="text-xs text-slate-500 mb-4">
              Serverless PostgreSQL with SSL and instant automated schema sync.
            </p>
            <span className="text-xs font-semibold text-emerald-600">Connected & Verified</span>
          </div>
        </div>
      </main>
    </div>
  );
}

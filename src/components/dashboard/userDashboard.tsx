"use client";

import { useState } from "react";
import { useAuth } from "@/context/authContext";
import {
  ShieldCheck,
  Database,
  FileText,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
  BarChart3,
  Building2,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import CompanyManagement from "@/components/companies/companyManagement";
import AuditProjects from "@/components/audits/auditProjects";
import TorManagement from "@/components/tor/torManagement";

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [selectedAuditIdForTor, setSelectedAuditIdForTor] = useState<string | undefined>(undefined);

  const handleNavigateToTor = (auditId: string) => {
    setSelectedAuditIdForTor(auditId);
    setActiveTab("TOR Management");
  };

  if (!user) return null;

  const roleColors: Record<string, string> = {
    admin: "bg-red-50 text-red-700 border-red-200",
    auditor: "bg-purple-50 text-purple-700 border-purple-200",
    auditee: "bg-blue-50 text-blue-700 border-blue-200",
    company_user: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <SidebarInset>
        {/* Top Header Bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 backdrop-blur px-4 shadow-xs">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900">{activeTab}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected to Neon DB (PostgreSQL)</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          {activeTab === "Companies" ? (
            <CompanyManagement />
          ) : activeTab === "Audit Projects" ? (
            <AuditProjects onNavigateToTor={handleNavigateToTor} />
          ) : activeTab === "TOR Management" || activeTab === "Guidelines" ? (
            <TorManagement initialAuditId={selectedAuditIdForTor} />
          ) : activeTab === "Dashboard" ? (
            <>
              {/* Welcome Card */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-10 shadow-xl relative overflow-hidden mb-8">
                {/* Decorative Circles */}
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/5" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />

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
                    <span className="text-xs text-indigo-200">
                      ID: {user.id.slice(0, 8)}...
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                    Welcome back, {user.name}!
                  </h2>
                  <p className="text-sm sm:text-base text-indigo-200 max-w-xl">
                    You are signed in as{" "}
                    <strong className="text-white">{user.email}</strong>. Your
                    session is authenticated with JWT RBAC and connected to Neon Cloud DB.
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Active Audits
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-xs text-slate-400 mt-1">Phase 2 engine ready</p>
                </div>

                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Pending Reviews
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-xs text-slate-400 mt-1">All clear</p>
                </div>

                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Open Issues
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-xs text-slate-400 mt-1">No active findings</p>
                </div>

                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Compliance
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">100%</p>
                  <p className="text-xs text-slate-400 mt-1">Ready for audit</p>
                </div>
              </div>

              {/* Quick Audit Modules Grid */}
              <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                Quick Access Modules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                  onClick={() => setActiveTab("Companies")}
                  className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Client Companies
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Manage multi-tenant enterprise profiles, audit scopes, and member roles.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
                    <span>Open Module</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("Audit Projects")}
                  className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-200 transition-all duration-200 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Audit Projects
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Manage audit scopes, frameworks, lifecycle states, and teams.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 group-hover:underline">
                    <span>Open Module</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("TOR Management")}
                  className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    TOR & Guidelines
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Hierarchical clause trees, Annex A controls, and 1-click seeder.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:underline">
                    <span>Open Module</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("DRT Tracker")}
                  className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    DRT Tracker
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Document requirement tracking, evidence review, remarks and verification.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:underline">
                    <span>Open Module</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Placeholder for Modules currently scheduled in Roadmap */
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-dashed border-slate-300 text-center">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {activeTab} Module
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">
                This feature is scheduled in the <strong>Zio Tech Implementation Plan</strong>. We are actively sequencing features according to the master roadmap.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("Companies")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Building2 className="h-4 w-4" />
                <span>Switch to Active Module: Companies</span>
              </button>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

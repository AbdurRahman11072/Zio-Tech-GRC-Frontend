"use client";

import { useState, useEffect, useCallback } from "react";
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
  Plus,
  ClipboardList,
  FileCheck2,
  Search,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import CompanyManagement from "@/components/companies/companyManagement";
import AuditProjects from "@/components/audits/auditProjects";
import TorManagement from "@/components/tor/torManagement";
import DrtManagement from "@/components/drt/drtManagement";
import AddGuidelineModal from "@/components/forms/addGuidelineModal";
import AddTorModal from "@/components/forms/addTorModal";
import AddDrtModal from "@/components/forms/addDrtModal";
import SubscriptionModal from "@/components/subscription/subscriptionModal";
import GuidelineCategoriesManagement from "@/components/guidelines/guidelineCategoriesManagement";
import {
  fetchAudits,
  fetchAllTorClauses,
  fetchAllDrtRequirements,
  type AuditProject,
  type TorClause,
  type DrtRequirement,
} from "@/lib/api";

export default function UserDashboard() {
  const { user, token, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [selectedAuditIdForTor, setSelectedAuditIdForTor] = useState<
    string | undefined
  >(undefined);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Live Dashboard Data
  const [audits, setAudits] = useState<AuditProject[]>([]);
  const [torClauses, setTorClauses] = useState<TorClause[]>([]);
  const [guidelines, setGuidelines] = useState<TorClause[]>([]);
  const [drtRequirements, setDrtRequirements] = useState<DrtRequirement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<
    "guidelines" | "tor" | "drt"
  >("guidelines");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [isTorModalOpen, setIsTorModalOpen] = useState(false);
  const [isDrtModalOpen, setIsDrtModalOpen] = useState(false);

  const handleNavigateToTor = (auditId: string) => {
    setSelectedAuditIdForTor(auditId);
    setActiveTab("TOR Management");
  };

  const handleNavigateToDrt = (auditId: string) => {
    setSelectedAuditIdForTor(auditId);
    setActiveTab("DRT Tracker");
  };

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    try {
      const [auditsData, allClausesData, drtData] = await Promise.all([
        fetchAudits(token).catch(() => []),
        fetchAllTorClauses(token).catch(() => []),
        fetchAllDrtRequirements(token).catch(() => []),
      ]);

      setAudits(auditsData);
      setDrtRequirements(drtData);

      // Separate into guidelines vs tor clauses
      const gls = allClausesData.filter((c) => c.clauseType === "guideline");
      const tors = allClausesData.filter((c) => c.clauseType !== "guideline");

      setGuidelines(gls);
      setTorClauses(tors);
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (!user) return null;

  const roleColors: Record<string, string> = {
    admin: "bg-red-50 text-red-700 border-red-200",
    auditor: "bg-purple-50 text-purple-700 border-purple-200",
    auditee: "bg-blue-50 text-blue-700 border-blue-200",
    company_user: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  // Metrics calculations
  const activeAuditsCount =
    audits.filter(
      (a) => a.status === "active" || a.status === "fieldwork"
    ).length || audits.length;

  const pendingReviewsCount = drtRequirements.filter(
    (r) => r.status === "submitted" || r.status === "in_review"
  ).length;

  const approvedDrtCount = drtRequirements.filter(
    (r) => r.status === "approved"
  ).length;

  const revisionRequiredCount = drtRequirements.filter(
    (r) => r.status === "revision_required"
  ).length;

  const complianceRate =
    drtRequirements.length > 0
      ? Math.round((approvedDrtCount / drtRequirements.length) * 100)
      : 100;

  // Filtered lists for dashboard showcase
  const filteredGuidelines = guidelines.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.clauseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.objective &&
        g.objective.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.auditProject?.title &&
        g.auditProject.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTorClauses = torClauses.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clauseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.objective &&
        t.objective.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.auditProject?.title &&
        t.auditProject.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDrt = drtRequirements.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.guidance &&
        d.guidance.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.auditProject?.title &&
        d.auditProject.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getDrtStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3" /> Submitted
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> In Review
          </span>
        );
      case "revision_required":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="h-3 w-3" /> Revise
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Pending
          </span>
        );
    }
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
              <h1 className="text-sm font-semibold text-slate-900">
                {activeTab}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Organization Subscription Plan Badge */}
              {user?.company && (
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                    user.company.subscriptionStatus === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}
                  title="Click to view and manage subscription plan"
                >
                  <Zap className="h-3 w-3" />
                  <span>
                    {user.company.name}:{" "}
                    {user.company.subscriptionPlan
                      ? user.company.subscriptionPlan.toUpperCase()
                      : "FREE"}{" "}
                    ({user.company.subscriptionStatus === "active" ? "Active" : "Locked"})
                  </span>
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected to Neon DB (PostgreSQL)</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          {activeTab === "Companies" ? (
            <CompanyManagement />
          ) : activeTab === "Guideline Categories" ? (
            <GuidelineCategoriesManagement />
          ) : activeTab === "Audit Projects" ? (
            <AuditProjects onNavigateToTor={handleNavigateToTor} />
          ) : activeTab === "TOR Management" || activeTab === "Guidelines" ? (
            <TorManagement initialAuditId={selectedAuditIdForTor} />
          ) : activeTab === "DRT Tracker" ? (
            <DrtManagement initialAuditId={selectedAuditIdForTor} />
          ) : activeTab === "Dashboard" ? (
            <>
              {/* Welcome Card */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 sm:p-10 shadow-xl relative overflow-hidden mb-8 border border-indigo-800/40">
                {/* Decorative Circles */}
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                          roleColors[user.role] || "bg-white/10 text-white"
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {user.role.replace("_", " ")}
                      </span>
                      <span className="text-xs text-indigo-300">
                        Admin Workspace
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                      Welcome back, {user.name}!
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                      Manage compliance controls, TOR clauses, and evidence vault submissions seamlessly.
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsGuidelineModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Add Guideline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTorModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Add TOR Clause</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDrtModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Add DRT Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Active Audits */}
                <div
                  onClick={() => setActiveTab("Audit Projects")}
                  className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Active Audits
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeAuditsCount}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Projects configured
                  </p>
                </div>

                {/* Compliance Guidelines */}
                <div
                  onClick={() => {
                    setDashboardTab("guidelines");
                  }}
                  className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Guidelines
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {guidelines.length}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Standard benchmarks
                  </p>
                </div>

                {/* TOR Clauses */}
                <div
                  onClick={() => {
                    setDashboardTab("tor");
                  }}
                  className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      TOR Clauses
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {torClauses.length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Scope criteria mapped
                  </p>
                </div>

                {/* DRT Requirements */}
                <div
                  onClick={() => {
                    setDashboardTab("drt");
                  }}
                  className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      DRT Evidence
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {drtRequirements.length}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {approvedDrtCount} Approved · {pendingReviewsCount} Review
                  </p>
                </div>

                {/* Compliance Score */}
                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Compliance
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {complianceRate}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {revisionRequiredCount > 0
                      ? `${revisionRequiredCount} Revisions needed`
                      : "Passing benchmarks"}
                  </p>
                </div>
              </div>

              {/* LIVE DASHBOARD SHOWCASE: Guidelines, TOR & DRT Table */}
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden mb-8">
                {/* Showcase Header with Segmented Tabs */}
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <button
                      type="button"
                      onClick={() => setDashboardTab("guidelines")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        dashboardTab === "guidelines"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>Guidelines ({guidelines.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDashboardTab("tor")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        dashboardTab === "tor"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>TOR Clauses ({torClauses.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDashboardTab("drt")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        dashboardTab === "drt"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>DRT Evidence ({drtRequirements.length})</span>
                    </button>
                  </div>

                  {/* Search and Action */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${dashboardTab}...`}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={loadDashboardData}
                      title="Refresh data"
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${
                          isLoadingData ? "animate-spin" : ""
                        }`}
                      />
                    </button>

                    {dashboardTab === "guidelines" && (
                      <button
                        type="button"
                        onClick={() => setIsGuidelineModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Guideline</span>
                      </button>
                    )}

                    {dashboardTab === "tor" && (
                      <button
                        type="button"
                        onClick={() => setIsTorModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add TOR</span>
                      </button>
                    )}

                    {dashboardTab === "drt" && (
                      <button
                        type="button"
                        onClick={() => setIsDrtModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add DRT</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="overflow-x-auto">
                  {/* 1. GUIDELINES VIEW */}
                  {dashboardTab === "guidelines" && (
                    <div className="divide-y divide-slate-100">
                      {filteredGuidelines.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                          <h4 className="text-sm font-bold text-slate-700 mb-1">
                            No Compliance Guidelines Found
                          </h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                            Establish policies and standard control benchmarks across your audit projects.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsGuidelineModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create First Guideline</span>
                          </button>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="py-3 px-4">ID & Title</th>
                              <th className="py-3 px-4">Audit Project</th>
                              <th className="py-3 px-4">Objective & Guidance</th>
                              <th className="py-3 px-4 text-right">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredGuidelines.map((gl) => (
                              <tr
                                key={gl.id}
                                className="hover:bg-slate-50/80 transition-colors group"
                              >
                                <td className="py-3.5 px-4 font-medium">
                                  <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {gl.clauseNumber}
                                    </span>
                                    <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                      {gl.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {gl.auditProject ? (
                                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                      <FolderOpen className="h-3 w-3 text-slate-400" />
                                      {gl.auditProject.title}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">
                                      Global standard
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 max-w-md">
                                  <p className="text-slate-600 line-clamp-1">
                                    {gl.objective || gl.description || "—"}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                                  {new Date(gl.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* 2. TOR CLAUSES VIEW */}
                  {dashboardTab === "tor" && (
                    <div className="divide-y divide-slate-100">
                      {filteredTorClauses.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                          <h4 className="text-sm font-bold text-slate-700 mb-1">
                            No Terms of Reference Clauses
                          </h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                            Structure hierarchical audit scopes and criteria for testing.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsTorModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create First TOR Clause</span>
                          </button>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="py-3 px-4">Clause # & Title</th>
                              <th className="py-3 px-4">Audit Project</th>
                              <th className="py-3 px-4">Scope & Objective</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredTorClauses.map((clause) => (
                              <tr
                                key={clause.id}
                                className="hover:bg-slate-50/80 transition-colors group"
                              >
                                <td className="py-3.5 px-4 font-medium">
                                  <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      {clause.clauseNumber}
                                    </span>
                                    <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                      {clause.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {clause.auditProject ? (
                                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                      <FolderOpen className="h-3 w-3 text-slate-400" />
                                      {clause.auditProject.title}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 max-w-md">
                                  <p className="text-slate-600 line-clamp-1">
                                    {clause.objective ||
                                      clause.description ||
                                      "—"}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNavigateToTor(clause.auditProjectId)
                                    }
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs cursor-pointer"
                                  >
                                    <span>Open Tree</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* 3. DRT EVIDENCE VIEW */}
                  {dashboardTab === "drt" && (
                    <div className="divide-y divide-slate-100">
                      {filteredDrt.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <FileCheck2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                          <h4 className="text-sm font-bold text-slate-700 mb-1">
                            No DRT Evidence Requirements
                          </h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                            Request specific evidence files, logs, and artifacts from auditees.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsDrtModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create First DRT Requirement</span>
                          </button>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="py-3 px-4">Code & Artifact</th>
                              <th className="py-3 px-4">Project & Clause</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Submissions</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredDrt.map((drt) => (
                              <tr
                                key={drt.id}
                                className="hover:bg-slate-50/80 transition-colors group"
                              >
                                <td className="py-3.5 px-4 font-medium">
                                  <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {drt.code}
                                    </span>
                                    <div>
                                      <span className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors block">
                                        {drt.title}
                                      </span>
                                      {drt.dueDate && (
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          Due:{" "}
                                          {new Date(
                                            drt.dueDate
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div>
                                    <span className="text-slate-800 font-medium block">
                                      {drt.auditProject?.title || "Project"}
                                    </span>
                                    {drt.torClause && (
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {drt.torClause.clauseNumber}:{" "}
                                        {drt.torClause.title}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {getDrtStatusBadge(drt.status)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="text-slate-600 font-medium">
                                    {drt.submissions?.length || 0} versions
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNavigateToDrt(drt.auditProjectId)
                                    }
                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold text-xs cursor-pointer"
                                  >
                                    <span>Open Vault</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
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

              {/* Form Modals */}
              <AddGuidelineModal
                isOpen={isGuidelineModalOpen}
                onClose={() => setIsGuidelineModalOpen(false)}
                onSuccess={() => {
                  loadDashboardData();
                  setDashboardTab("guidelines");
                }}
                audits={audits}
              />

              <AddTorModal
                isOpen={isTorModalOpen}
                onClose={() => setIsTorModalOpen(false)}
                onSuccess={() => {
                  loadDashboardData();
                  setDashboardTab("tor");
                }}
                audits={audits}
              />

              <AddDrtModal
                isOpen={isDrtModalOpen}
                onClose={() => setIsDrtModalOpen(false)}
                onSuccess={() => {
                  loadDashboardData();
                  setDashboardTab("drt");
                }}
                audits={audits}
              />
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

      {/* Organization Subscription Management Modal */}
      {token && user?.company && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          token={token}
          companyId={user.company.id}
          companyName={user.company.name}
          currentPlan={user.company.subscriptionPlan || "none"}
          currentStatus={user.company.subscriptionStatus || "inactive"}
          onSubscriptionUpdated={() => {
            refreshProfile();
            loadDashboardData();
          }}
        />
      )}
    </SidebarProvider>
  );
}

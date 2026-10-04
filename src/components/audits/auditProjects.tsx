"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Calendar,
  Building2,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  X,
  FileCode,
  BookOpen,
  Users,
  UserPlus,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import SubscriptionModal from "@/components/subscription/subscriptionModal";
import CreateAuditWizardModal from "./createAuditWizardModal";
import ManageAuditMembersModal from "./manageAuditMembersModal";
import {
  fetchAudits,
  deleteAudit,
  fetchCompanies,
  type AuditProject,
  type Company,
} from "@/lib/api";

const frameworkLabels: Record<string, { label: string; color: string }> = {
  ISO_27001: {
    label: "ISO/IEC 27001:2022",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  SOC_2_TYPE_2: {
    label: "SOC 2 Type II",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  NIST_CSF: {
    label: "NIST CSF 2.0",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  PCI_DSS: {
    label: "PCI-DSS v4.0",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  HIPAA: {
    label: "HIPAA Security Rule",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  CUSTOM: {
    label: "Custom Internal Audit",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const statusStyles: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
  active: {
    label: "Active Scoping",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  fieldwork: {
    label: "Fieldwork & Evidence",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  in_review: {
    label: "Under Auditor Review",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Audit Completed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  archived: {
    label: "Archived",
    color: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

interface AuditProjectsProps {
  onNavigateToTor?: (auditId: string) => void;
  onNavigateToDrt?: (auditId: string) => void;
}

export default function AuditProjects({
  onNavigateToTor,
  onNavigateToDrt,
}: AuditProjectsProps = {}) {
  const { token, user } = useAuth();
  const [audits, setAudits] = useState<AuditProject[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAuditForMembers, setSelectedAuditForMembers] = useState<AuditProject | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const canCreate = user?.role === "admin" || user?.role === "auditor" || user?.role === "company_user";
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionTarget, setSubscriptionTarget] = useState<{
    id: string;
    name: string;
    plan?: any;
    status?: any;
  } | null>(null);

  const handleOpenCreateModal = () => {
    // If company user, verify their organization subscription
    if (user?.role === "company_user") {
      const userCompany = user.company;
      if (
        !userCompany ||
        (userCompany.subscriptionStatus !== "active" &&
          userCompany.subscriptionStatus !== "trial")
      ) {
        setSubscriptionTarget({
          id: user.companyId || userCompany?.id || "",
          name: userCompany?.name || "Your Organization",
          plan: userCompany?.subscriptionPlan || "none",
          status: userCompany?.subscriptionStatus || "inactive",
        });
        setIsSubscriptionModalOpen(true);
        return;
      }
    }
    setIsModalOpen(true);
  };

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [auditsData, companiesData] = await Promise.all([
        fetchAudits(token),
        fetchCompanies(token).catch(() => []),
      ]);
      setAudits(auditsData);
      setCompanies(companiesData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit projects",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleDeleteAudit = async (id: string, auditTitle: string) => {
    if (!token) return;
    if (
      !confirm(
        `Are you sure you want to delete audit project "${auditTitle}"? This will also remove linked TOR clauses and DRTs.`,
      )
    ) {
      return;
    }

    try {
      await deleteAudit(token, id);
      setAudits((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete audit");
    }
  };

  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      audit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audit.company?.name &&
        audit.company.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFramework =
      frameworkFilter === "all" || audit.framework === frameworkFilter;

    const matchesStatus =
      statusFilter === "all" || audit.status === statusFilter;

    return matchesSearch && matchesFramework && matchesStatus;
  });

  const activeAuditsCount = audits.filter(
    (a) => a.status === "active" || a.status === "fieldwork",
  ).length;
  const inReviewCount = audits.filter((a) => a.status === "in_review").length;
  const completedCount = audits.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Audit Projects & Engagements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Initiate, scope, and track regulatory audits against international compliance frameworks.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Audit Project</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Audits
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <FolderOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{audits.length}</p>
          <span className="text-[11px] text-slate-400">All frameworks</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Fieldwork
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activeAuditsCount}
          </p>
          <span className="text-[11px] text-blue-600 font-medium">
            Evidence collection underway
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pending Reviews
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {inReviewCount}
          </p>
          <span className="text-[11px] text-amber-600 font-medium">
            Awaiting auditor remarks
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Completed
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {completedCount}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            Certified & finalized
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by audit code, title, or client company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-slate-50 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Framework:</span>
            <select
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Frameworks</option>
              <option value="ISO_27001">ISO 27001</option>
              <option value="SOC_2_TYPE_2">SOC 2 Type II</option>
              <option value="NIST_CSF">NIST CSF</option>
              <option value="PCI_DSS">PCI-DSS</option>
              <option value="HIPAA">HIPAA</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="fieldwork">Fieldwork</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audits Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">
            Loading audit projects from Neon DB...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
          <button
            onClick={loadData}
            className="ml-auto underline font-medium text-red-700 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            No Audit Projects Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? "No audits match your filter criteria."
              : "Kickstart your compliance program by launching your first audit project."}
          </p>
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Launch First Audit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAudits.map((audit) => {
            const fw = frameworkLabels[audit.framework] || {
              label: audit.framework,
              color: "bg-slate-100 text-slate-700 border-slate-200",
            };
            const st = statusStyles[audit.status] || {
              label: audit.status,
              color: "bg-slate-100 text-slate-600 border-slate-200",
            };

            return (
              <div
                key={audit.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {audit.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${st.color}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                    {audit.title}
                  </h4>

                  {audit.guidelineCategory ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
                      <BookOpen className="h-3 w-3 text-indigo-600" />
                      {audit.guidelineCategory.name} ({audit.guidelineCategory.code})
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border mb-3 ${fw.color}`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {fw.label}
                    </span>
                  )}

                  {audit.scope && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {audit.scope}
                    </p>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">
                        {audit.company?.name || "Client Organization"}
                      </span>
                    </div>

                    {audit.leadAuditor && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Lead: {audit.leadAuditor.name}
                        </span>
                      </div>
                    )}

                    {audit.targetDate && (
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          Target: {new Date(audit.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Created{" "}
                        {new Date(audit.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {audit.members?.length || 0} Member{(audit.members?.length || 0) === 1 ? "" : "s"}
                        </span>
                      </div>
                      {(user?.role === "admin" || user?.role === "auditor" || user?.role === "company_user") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAuditForMembers(audit);
                            setIsMembersModalOpen(true);
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>Manage Team</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {user?.role === "company_user" ? (
                    <button
                      type="button"
                      onClick={() => (onNavigateToDrt || onNavigateToTor)?.(audit.id)}
                      className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer transition-colors hover:text-indigo-800"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Upload Evidence (DRT)</span>
                    </button>
                  ) : user?.role === "auditee" ? (
                    <button
                      type="button"
                      onClick={() => (onNavigateToDrt || onNavigateToTor)?.(audit.id)}
                      className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer transition-colors hover:text-indigo-800"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verification Tasks (DRT)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigateToTor?.(audit.id)}
                      className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer transition-colors hover:text-indigo-800"
                    >
                      <span>Manage TOR & DRTs</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}

                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleDeleteAudit(audit.id, audit.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Audit"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Step Audit Project Creation Wizard Modal */}
      {token && (
        <CreateAuditWizardModal
          token={token}
          currentUser={user}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAuditCreated={(newAudit) => {
            setAudits((prev) => [newAudit, ...prev]);
          }}
          onSubscriptionRequired={(comp) => {
            setSubscriptionTarget({
              id: comp.id,
              name: comp.name,
              plan: comp.subscriptionPlan,
              status: comp.subscriptionStatus,
            });
            setIsSubscriptionModalOpen(true);
          }}
        />
      )}

      {/* Audit Members Management Modal (Auditor & Admin can add auditees) */}
      {token && selectedAuditForMembers && (
        <ManageAuditMembersModal
          token={token}
          audit={selectedAuditForMembers}
          isOpen={isMembersModalOpen}
          onClose={() => {
            setIsMembersModalOpen(false);
            setSelectedAuditForMembers(null);
          }}
          onMembersUpdated={loadData}
        />
      )}

      {/* Subscription Gating Modal */}
      {token && subscriptionTarget && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          token={token}
          companyId={subscriptionTarget.id}
          companyName={subscriptionTarget.name}
          currentPlan={subscriptionTarget.plan || "none"}
          currentStatus={subscriptionTarget.status || "inactive"}
          reasonMessage="An active subscription plan is required to initiate audits for this organization. Upgrade below to immediately unlock audit creation."
          onSubscriptionUpdated={() => {
            loadData();
            setIsSubscriptionModalOpen(false);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

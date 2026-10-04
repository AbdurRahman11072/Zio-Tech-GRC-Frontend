"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  FileText,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Download,
  MessageSquare,
  FileCheck,
  RotateCcw,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  Building2,
  Trash2,
  ExternalLink,
  Paperclip,
  Send,
  Mail,
  UserCheck,
  Sparkles,
  RefreshCw,
  Users,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  fetchAudits,
  fetchAuditDrtRequirements,
  createDrtRequirement,
  deleteDrtRequirement,
  submitDrtEvidence,
  reviewDrtSubmission,
  getEvidenceDownloadUrl,
  fetchAuditTorTree,
  fetchAuditDrtProgress,
  syncAuditTorToDrt,
  submitAllDrtEvidence,
  completeAuditProject,
  type AuditProject,
  type DrtRequirement,
  type DrtRequirementStatus,
  type ReviewDecision,
  type TorClause,
  type DrtProgressSummary,
} from "@/lib/api";
import TaskDistributionModal from "../audits/taskDistributionModal";

const statusConfig: Record<
  DrtRequirementStatus,
  { label: string; badge: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: "Pending Evidence",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  submitted: {
    label: "Evidence Submitted",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: UploadCloud,
  },
  in_review: {
    label: "Under Auditor Review",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    icon: ShieldCheck,
  },
  approved: {
    label: "Verified & Approved",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  revision_required: {
    label: "Revision Requested",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertTriangle,
  },
};

interface DrtManagementProps {
  initialAuditId?: string;
}

export default function DrtManagement({ initialAuditId }: DrtManagementProps) {
  const { token, user } = useAuth();
  const [audits, setAudits] = useState<AuditProject[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string>(
    initialAuditId || "",
  );
  const [requirements, setRequirements] = useState<DrtRequirement[]>([]);
  const [clauses, setClauses] = useState<TorClause[]>([]);
  const [progress, setProgress] = useState<DrtProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Add Requirement Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newGuidance, setNewGuidance] = useState("");
  const [newMandatory, setNewMandatory] = useState(true);
  const [newDueDate, setNewDueDate] = useState("");
  const [newTorClauseId, setNewTorClauseId] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Submit Evidence Modal
  const [evidenceTargetReq, setEvidenceTargetReq] =
    useState<DrtRequirement | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review Modal
  const [reviewTargetReq, setReviewTargetReq] = useState<DrtRequirement | null>(
    null,
  );
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>("approved");
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Submit All Evidence & Sync State (Phase 5)
  const [isSyncingTor, setIsSyncingTor] = useState(false);
  const [isSubmitAllModalOpen, setIsSubmitAllModalOpen] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [submitAllSuccessMessage, setSubmitAllSuccessMessage] = useState<
    string | null
  >(null);

  // Task Distribution & Closure State (Phase 6)
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);
  const [isCompletingAudit, setIsCompletingAudit] = useState(false);
  const [completionSuccessMessage, setCompletionSuccessMessage] = useState<
    string | null
  >(null);

  const isAuditorOrAdmin = user?.role === "admin" || user?.role === "auditor";
  const currentAudit = audits.find((a) => a.id === selectedAuditId);

  // Load audit projects
  useEffect(() => {
    if (!token) return;
    fetchAudits(token)
      .then((data) => {
        setAudits(data);
        if (!selectedAuditId && data.length > 0) {
          setSelectedAuditId(data[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load audit projects");
      });
  }, [token]);

  // Load DRT items, TOR clauses, and Progress for selected audit
  useEffect(() => {
    if (!token || !selectedAuditId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchAuditDrtRequirements(token, selectedAuditId),
      fetchAuditTorTree(token, selectedAuditId).catch(() => []),
      fetchAuditDrtProgress(token, selectedAuditId).catch(() => null),
    ])
      .then(([drtData, torData, progressData]) => {
        setRequirements(drtData);
        setProgress(progressData);

        // Flatten TOR clauses for select dropdown
        const flat: TorClause[] = [];
        const traverse = (nodes: TorClause[]) => {
          for (const n of nodes) {
            flat.push(n);
            if (n.children && n.children.length > 0) {
              traverse(n.children);
            }
          }
        };
        traverse(torData);
        setClauses(flat);
      })
      .catch((err) => {
        setError(err.message || "Failed to load DRT requirements");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, selectedAuditId]);

  const handleSyncTor = async () => {
    if (!token || !selectedAuditId) return;
    setIsSyncingTor(true);
    try {
      const synced = await syncAuditTorToDrt(token, selectedAuditId);
      setRequirements(synced);
      const updatedProgress = await fetchAuditDrtProgress(
        token,
        selectedAuditId,
      );
      setProgress(updatedProgress);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to sync TOR clauses");
    } finally {
      setIsSyncingTor(false);
    }
  };

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAuditId) return;

    setIsSubmittingNew(true);
    try {
      const created = await createDrtRequirement(token, selectedAuditId, {
        code: newCode,
        title: newTitle,
        description: newDesc || undefined,
        guidance: newGuidance || undefined,
        isMandatory: newMandatory,
        dueDate: newDueDate || undefined,
        torClauseId: newTorClauseId || undefined,
      });

      setRequirements((prev) => [...prev, created]);
      const updatedProgress = await fetchAuditDrtProgress(
        token,
        selectedAuditId,
      ).catch(() => null);
      if (updatedProgress) setProgress(updatedProgress);

      setIsAddModalOpen(false);
      setNewCode("");
      setNewTitle("");
      setNewDesc("");
      setNewGuidance("");
      setNewDueDate("");
      setNewTorClauseId("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create requirement");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleDeleteRequirement = async (id: string, code: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete requirement "${code}"?`)) return;

    try {
      await deleteDrtRequirement(token, id);
      setRequirements((prev) => prev.filter((r) => r.id !== id));
      const updatedProgress = await fetchAuditDrtProgress(
        token,
        selectedAuditId,
      ).catch(() => null);
      if (updatedProgress) setProgress(updatedProgress);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete requirement");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !evidenceTargetReq) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("notes", submitNotes);
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const updated = await submitDrtEvidence(
        token,
        evidenceTargetReq.id,
        formData,
      );

      setRequirements((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );

      const [updatedProgress, updatedAudits] = await Promise.all([
        fetchAuditDrtProgress(token, selectedAuditId).catch(() => null),
        fetchAudits(token).catch(() => []),
      ]);
      if (updatedProgress) setProgress(updatedProgress);
      if (updatedAudits.length > 0) setAudits(updatedAudits);

      setEvidenceTargetReq(null);
      setSubmitNotes("");
      setSelectedFiles([]);

      if (updatedProgress?.isAllUploaded) {
        setSubmitAllSuccessMessage(
          `100% of required evidence has been uploaded! An automated notification has been dispatched to Lead Auditor (${updatedProgress.leadAuditor?.name || "Auditor"}).`,
        );
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to upload evidence");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reviewTargetReq) return;
    if (!reviewComment.trim()) {
      alert("Please provide an evaluation remark for the auditee.");
      return;
    }

    setIsReviewing(true);
    try {
      const updated = await reviewDrtSubmission(
        token,
        reviewTargetReq.id,
        reviewDecision,
        reviewComment,
      );

      setRequirements((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );

      const updatedProgress = await fetchAuditDrtProgress(
        token,
        selectedAuditId,
      ).catch(() => null);
      if (updatedProgress) setProgress(updatedProgress);

      setReviewTargetReq(null);
      setReviewComment("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleConfirmSubmitAll = async () => {
    if (!token || !selectedAuditId) return;
    setIsSubmittingAll(true);
    try {
      const result = await submitAllDrtEvidence(token, selectedAuditId);
      setProgress(result.progress);
      setSubmitAllSuccessMessage(result.message);
      setIsSubmitAllModalOpen(false);

      const [updatedReqs, updatedAudits] = await Promise.all([
        fetchAuditDrtRequirements(token, selectedAuditId),
        fetchAudits(token),
      ]);
      setRequirements(updatedReqs);
      setAudits(updatedAudits);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit all evidence");
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const handleCompleteAudit = async () => {
    if (!token || !selectedAuditId) return;
    if (
      !confirm(
        `Are you sure you want to mark audit "${currentAudit?.code}" as COMPLETED and issue final certification?`,
      )
    ) {
      return;
    }

    setIsCompletingAudit(true);
    try {
      const res = await completeAuditProject(token, selectedAuditId);
      setCompletionSuccessMessage(res.message);
      const updatedAudits = await fetchAudits(token);
      setAudits(updatedAudits);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to complete audit");
    } finally {
      setIsCompletingAudit(false);
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch =
      req.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.torClause?.title &&
        req.torClause.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.assignedAuditee?.name &&
        req.assignedAuditee.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    if (statusFilter === "assigned_to_me") {
      return matchesSearch && req.assignedAuditeeId === user?.id;
    }

    const matchesStatus =
      statusFilter === "all" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = requirements.length;
  const approvedCount = requirements.filter((r) => r.status === "approved").length;
  const submittedCount = requirements.filter(
    (r) => r.status === "submitted" || r.status === "in_review",
  ).length;
  const pendingCount = requirements.filter((r) => r.status === "pending").length;
  const revisionCount = requirements.filter(
    (r) => r.status === "revision_required",
  ).length;
  const complianceRate =
    totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const uploadPct =
    progress?.completionPercentage ??
    (totalCount > 0 ? Math.round(((totalCount - pendingCount) / totalCount) * 100) : 0);

  const assignedToMeCount = requirements.filter(
    (r) => r.assignedAuditeeId === user?.id,
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700 tracking-wider uppercase">
              Phase 6: Verification & Task Division
            </span>
            {currentAudit?.status && (
              <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 uppercase">
                {currentAudit.status}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Document Requirement Tracking (DRT)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Task distribution, auditee review queue, remark revisions, and final audit sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Audit Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Building2 className="h-4 w-4 text-slate-400" />
            <select
              value={selectedAuditId}
              onChange={(e) => setSelectedAuditId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[200px] truncate"
            >
              {audits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Phase 6 Auditor Task Division Button */}
          {isAuditorOrAdmin && currentAudit && (
            <button
              type="button"
              onClick={() => setIsDistributionModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
              title="Divide TOR verification tasks among team auditees"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Distribute Tasks</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSyncTor}
            disabled={isSyncingTor}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Sync newly added TOR leaf clauses into DRT requirements"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${isSyncingTor ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Sync TOR</span>
          </button>

          {isAuditorOrAdmin && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Requirement</span>
            </button>
          )}
        </div>
      </div>

      {/* Completion Banner */}
      {completionSuccessMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Audit Successfully Closed & Certified!
              </h4>
              <p className="text-xs text-emerald-800">{completionSuccessMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setCompletionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success Alert Banner for Submit All */}
      {submitAllSuccessMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Auditor Notification Dispatched
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                {submitAllSuccessMessage}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubmitAllSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 100% Verified Sign-Off Callout Banner */}
      {approvedCount === totalCount && totalCount > 0 && (
        <div className="rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded-full">
                Audit Sign-Off Ready
              </span>
              <h4 className="text-base sm:text-lg font-extrabold mt-0.5">
                100% Verification Complete ({approvedCount}/{totalCount} Items Approved)
              </h4>
              <p className="text-xs text-emerald-100">
                All TOR evidence requirements have been verified and approved by the assigned reviewers.
              </p>
            </div>
          </div>

          {isAuditorOrAdmin && currentAudit?.status !== "completed" && (
            <button
              onClick={handleCompleteAudit}
              disabled={isCompletingAudit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-emerald-800 shadow-md hover:bg-emerald-50 transition-all shrink-0 hover:scale-[1.02]"
            >
              {isCompletingAudit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
              <span>Complete & Certify Audit</span>
            </button>
          )}
        </div>
      )}

      {/* Evidence Submission Command Center */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evidence Collection & Verification Status
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${
                  complianceRate === 100
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {complianceRate === 100
                  ? "100% Verified"
                  : `${complianceRate}% Compliance Rate`}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalCount - pendingCount}
                <span className="text-slate-400 font-semibold text-lg sm:text-xl">
                  {" "}/ {totalCount} Requirements Uploaded
                </span>
              </h3>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/70">
              <div
                className={`h-full transition-all duration-700 ${
                  complianceRate === 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-indigo-500 to-blue-500"
                }`}
                style={{ width: `${uploadPct}%` }}
              />
            </div>

            <p className="text-xs text-slate-500">
              {complianceRate === 100 ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All requirements verified and approved. Audit is ready for final closure.
                </span>
              ) : (
                <span>
                  <strong>{approvedCount}</strong> verified,{" "}
                  <strong>{submittedCount}</strong> under review,{" "}
                  <strong>{revisionCount}</strong> revisions requested.
                </span>
              )}
            </p>
          </div>

          {/* Lead Auditor Card & Submit Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 min-w-[200px]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {progress?.leadAuditor?.name
                    ? progress.leadAuditor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "AU"}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-indigo-500" />
                    <span>Lead Auditor</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {progress?.leadAuditor?.name || "Assigned Lead Auditor"}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {progress?.leadAuditor?.email || "auditor@ziotech.com"}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => setIsSubmitAllModalOpen(true)}
              disabled={isSubmittingAll || totalCount === 0}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold shadow-md transition-all ${
                uploadPct === 100
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 hover:scale-[1.02]"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Send className="h-4 w-4" />
              <span>Submit All Evidence</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total DRT Items
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          <span className="text-[11px] text-slate-400">Target artifacts</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pending Evidence
          </span>
          <p className="text-2xl font-bold text-slate-700 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-amber-600">Awaiting auditee upload</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Under Review
          </span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{submittedCount}</p>
          <span className="text-[11px] text-blue-500">Ready for auditor sign-off</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Revisions Required
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{revisionCount}</p>
          <span className="text-[11px] text-rose-500">Changes requested</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Verification Rate
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{complianceRate}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {approvedCount} / {totalCount} verified
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, title, clause, or reviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          {[
            { id: "all", label: `All (${totalCount})` },
            { id: "assigned_to_me", label: `My Tasks (${assignedToMeCount})` },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "submitted", label: `Uploaded (${submittedCount})` },
            { id: "approved", label: `Verified (${approvedCount})` },
            { id: "revision_required", label: `Revision (${revisionCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Requirement List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs text-slate-500">Loading evidence requirements...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No DRT Requirements Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || statusFilter !== "all"
              ? "No requirements match your current search or filter."
              : "Sync leaf clauses from finalized Terms of Reference (TOR) or create custom deliverables."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSyncTor}
              disabled={isSyncingTor}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <RefreshCw
                className={`h-4 w-4 ${isSyncingTor ? "animate-spin" : ""}`}
              />
              <span>Sync from TOR Clauses</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequirements.map((req) => {
            const st = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = st.icon;
            const latestSub =
              req.submissions && req.submissions.length > 0
                ? req.submissions.sort((a, b) => b.version - a.version)[0]
                : null;
            const latestRemark =
              latestSub?.reviewRemarks && latestSub.reviewRemarks.length > 0
                ? latestSub.reviewRemarks[latestSub.reviewRemarks.length - 1]
                : null;

            const hasUploadedFiles =
              latestSub?.evidenceFiles && latestSub.evidenceFiles.length > 0;

            const canReview = isAuditorOrAdmin || user?.role === "auditee";

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                      {req.code}
                    </span>

                    {req.torClause && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Clause {req.torClause.clauseNumber}: {req.torClause.title}</span>
                      </span>
                    )}

                    {/* Assigned Auditee Pill */}
                    {req.assignedAuditee ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        <UserCheck className="h-3 w-3" />
                        <span>Assigned: {req.assignedAuditee.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        <span>Unassigned Reviewer</span>
                      </span>
                    )}

                    {req.isMandatory && (
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
                        Mandatory
                      </span>
                    )}

                    {req.dueDate && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>Due: {new Date(req.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${st.badge}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      <span>{st.label}</span>
                    </span>

                    {isAuditorOrAdmin && (
                      <button
                        onClick={() => handleDeleteRequirement(req.id, req.code)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Requirement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Guidance */}
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    {req.title}
                  </h4>
                  {req.description && (
                    <p className="text-xs text-slate-600 mb-2">
                      {req.description}
                    </p>
                  )}
                  {req.guidance && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600 flex items-start gap-2">
                      <FileCheck className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-700">Auditor Guidance:</strong>{" "}
                        {req.guidance}
                      </div>
                    </div>
                  )}
                </div>

                {/* Evidence Artifacts Section */}
                {latestSub ? (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          Submission v{latestSub.version}
                        </span>
                        <span>•</span>
                        <span>
                          By {latestSub.submittedBy?.name || "Organization Representative"} on{" "}
                          {new Date(latestSub.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {latestSub.notes && (
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        &quot;{latestSub.notes}&quot;
                      </p>
                    )}

                    {hasUploadedFiles && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {latestSub.evidenceFiles.map((f) => (
                          <a
                            key={f.id}
                            href={getEvidenceDownloadUrl(f.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate font-medium text-slate-800 group-hover:text-indigo-600">
                                {f.originalName}
                              </span>
                            </div>
                            <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Auditor Feedback Callout */}
                    {latestRemark && (
                      <div
                        className={`rounded-xl p-3 border text-xs flex items-start gap-2.5 ${
                          latestRemark.decision === "approved"
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                            : "bg-rose-50/80 border-rose-200 text-rose-800"
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold flex items-center gap-2 mb-0.5">
                            <span>
                              Reviewer Remark ({latestRemark.reviewer?.name || "Reviewer"})
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-white/60">
                              {latestRemark.decision.replace("_", " ")}
                            </span>
                          </div>
                          <p>{latestRemark.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-600">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>No evidence files uploaded yet for this requirement.</span>
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEvidenceTargetReq(req);
                      setSubmitNotes("");
                      setSelectedFiles([]);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      hasUploadedFiles
                        ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>
                      {hasUploadedFiles ? "Upload New Version" : "Upload Evidence"}
                    </span>
                  </button>

                  {/* Phase 6 Auditee / Auditor Review Action */}
                  {canReview && latestSub && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewTargetReq(req);
                        setReviewDecision("approved");
                        setReviewComment("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-xs"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Review & Sign-Off</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Modal: Phase 6 Task Distribution */}
      {isDistributionModalOpen && currentAudit && (
        <TaskDistributionModal
          isOpen={isDistributionModalOpen}
          onClose={() => setIsDistributionModalOpen(false)}
          audit={currentAudit}
          requirements={requirements}
          onSuccess={async () => {
            const [updatedReqs, updatedProgress] = await Promise.all([
              fetchAuditDrtRequirements(token!, selectedAuditId),
              fetchAuditDrtProgress(token!, selectedAuditId).catch(() => null),
            ]);
            setRequirements(updatedReqs);
            if (updatedProgress) setProgress(updatedProgress);
          }}
        />
      )}

      {/* 2. Modal: Submit All Evidence & Notify Auditor */}
      {isSubmitAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Submit Evidence for Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official handoff to the Lead Auditor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitAllModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Audit Summary Box */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  {currentAudit?.code} — {currentAudit?.title}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <span>Total DRT Requirements:</span>
                  <span className="font-bold text-slate-900">{totalCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Requirements with Evidence:</span>
                  <span className="font-bold text-emerald-600">
                    {totalCount - pendingCount} / {totalCount} ({uploadPct}%)
                  </span>
                </div>
              </div>

              {/* Recipient Auditor */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {progress?.leadAuditor?.name
                      ? progress.leadAuditor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                    : "AU"}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      Notification Recipient (Lead Auditor)
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {progress?.leadAuditor?.name || "Lead Auditor"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {progress?.leadAuditor?.email || "auditor@ziotech.com"}
                    </p>
                  </div>
                </div>
              </div>

              {uploadPct < 100 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>{pendingCount} requirement(s) are still missing files.</strong>{" "}
                    We recommend uploading evidence for all mandatory items before handoff.
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Submitting will advance the project status to{" "}
                <span className="font-semibold text-slate-700">Under Review</span>{" "}
                and immediately dispatch an in-app alert and transactional email to the Lead Auditor to initiate auditee task distribution.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitAllModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmitAll}
                  disabled={isSubmittingAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmittingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>{isSubmittingAll ? "Dispatching..." : "Confirm & Dispatch"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Submit / Upload Evidence */}
      {evidenceTargetReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Upload Evidence Artifacts
                </h3>
                <p className="text-xs text-slate-500">
                  Deliver compliance proof for <strong>{evidenceTargetReq.code}</strong>
                </p>
              </div>
              <button
                onClick={() => setEvidenceTargetReq(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/60 cursor-pointer transition-colors text-center"
              >
                <UploadCloud className="h-8 w-8 text-indigo-600 mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  Click to browse or drag and drop evidence files
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  PDF, DOCX, XLSX, PNG, JPG, CSV, ZIP (Max 25MB each)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Selected Files ({selectedFiles.length})
                  </span>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 text-xs border border-slate-200"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate font-medium">{file.name}</span>
                        <span className="text-[10px] text-slate-400">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Notes & Context
                </label>
                <textarea
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Explain how these files satisfy the requirement..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvidenceTargetReq(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || selectedFiles.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isUploading ? "Uploading..." : "Submit Evidence"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Review & Sign-Off (Auditor / Auditee) */}
      {reviewTargetReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Verification Evaluation & Sign-Off
                </h3>
                <p className="text-xs text-slate-500">
                  Requirement: <strong>{reviewTargetReq.code}</strong> — {reviewTargetReq.title}
                </p>
              </div>
              <button
                onClick={() => setReviewTargetReq(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Verification Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("approved")}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-semibold transition-all ${
                      reviewDecision === "approved"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Approve & Verify</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision("revision_required")}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-semibold transition-all ${
                      reviewDecision === "revision_required"
                        ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Request Revision</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reviewer Finding & Remark <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Document your objective evidence findings, gap analysis, or approval rationale..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewTargetReq(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isReviewing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm Sign-Off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Add DRT Requirement */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create Document Requirement (DRT)
                </h3>
                <p className="text-xs text-slate-500">
                  Target Project: <strong>{currentAudit?.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requirement Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DRT-001"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Cloud Penetration Test Report"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Map to TOR Clause (Optional)
                </label>
                <select
                  value={newTorClauseId}
                  onChange={(e) => setNewTorClauseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- No Clause Linked --</option>
                  {clauses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clauseNumber}: {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Scope
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail the exact artifact required..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auditor Guidance for Acceptance
                </label>
                <textarea
                  rows={2}
                  value={newGuidance}
                  onChange={(e) => setNewGuidance(e.target.value)}
                  placeholder="e.g. Must be signed by executive management within past 12 months..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mandatoryCheck"
                  checked={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="mandatoryCheck"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Mandatory for Audit Certification
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !newCode || !newTitle}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmittingNew && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Create Requirement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

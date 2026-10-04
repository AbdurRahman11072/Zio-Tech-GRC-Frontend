"use client";

import { useState, useEffect } from "react";
import {
  Users,
  X,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Send,
  Loader2,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  distributeAuditTasks,
  fetchAuditMembers,
  fetchUsers,
  type AuditProject,
  type DrtRequirement,
} from "@/lib/api";

interface TaskDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: AuditProject;
  requirements: DrtRequirement[];
  onSuccess: () => void;
}

interface AuditeeOption {
  id: string;
  name: string;
  email: string;
}

export default function TaskDistributionModal({
  isOpen,
  onClose,
  audit,
  requirements,
  onSuccess,
}: TaskDistributionModalProps) {
  const { token } = useAuth();
  const [auditees, setAuditees] = useState<AuditeeOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [isLoadingAuditees, setIsLoadingAuditees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize assignments from existing requirement state
  useEffect(() => {
    if (requirements.length > 0) {
      const initial: Record<string, string> = {};
      requirements.forEach((req) => {
        if (req.assignedAuditeeId) {
          initial[req.id] = req.assignedAuditeeId;
        }
      });
      setAssignments(initial);
    }
  }, [requirements]);

  // Load audit members & auditees
  useEffect(() => {
    if (!isOpen || !token) return;
    setIsLoadingAuditees(true);
    setError(null);

    Promise.all([
      fetchAuditMembers(token, audit.id).catch(() => []),
      fetchUsers(token, "auditee").catch(() => []),
    ])
      .then(([members, platformAuditees]) => {
        // Collect assigned auditees from audit members
        const memberAuditees = members
          .filter((m) => m.user && m.roleInAudit === "auditee_reviewer")
          .map((m) => ({
            id: m.user!.id,
            name: m.user!.name,
            email: m.user!.email,
          }));

        // Merge unique auditees
        const uniqueMap = new Map<string, AuditeeOption>();
        memberAuditees.forEach((a) => uniqueMap.set(a.id, a));
        platformAuditees.forEach((u) => {
          if (!uniqueMap.has(u.id)) {
            uniqueMap.set(u.id, { id: u.id, name: u.name, email: u.email });
          }
        });

        setAuditees(Array.from(uniqueMap.values()));
      })
      .catch((err) => {
        setError(err.message || "Failed to load auditees");
      })
      .finally(() => {
        setIsLoadingAuditees(false);
      });
  }, [isOpen, token, audit.id]);

  if (!isOpen) return null;

  const handleAssignSingle = (requirementId: string, auditeeId: string) => {
    setAssignments((prev) => {
      const copy = { ...prev };
      if (!auditeeId) {
        delete copy[requirementId];
      } else {
        copy[requirementId] = auditeeId;
      }
      return copy;
    });
  };

  const handleDistributeEvenly = () => {
    if (auditees.length === 0) return;
    const next: Record<string, string> = {};
    requirements.forEach((req, idx) => {
      const assignedAuditee = auditees[idx % auditees.length];
      next[req.id] = assignedAuditee.id;
    });
    setAssignments(next);
  };

  const handleAssignAllTo = (auditeeId: string) => {
    if (!auditeeId) return;
    const next: Record<string, string> = {};
    requirements.forEach((req) => {
      next[req.id] = auditeeId;
    });
    setAssignments(next);
  };

  const handleClearAll = () => {
    setAssignments({});
  };

  const handleSaveDistribution = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = requirements.map((req) => ({
        requirementId: req.id,
        auditeeId: assignments[req.id] || null,
      }));

      await distributeAuditTasks(token, audit.id, payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to distribute tasks",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAssigned = Object.keys(assignments).length;
  const unassignedCount = requirements.length - totalAssigned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Auditor Task Distribution Board
              </h3>
              <p className="text-xs text-slate-500">
                Divide and assign TOR verification requirements to Auditee team members for <strong>{audit.code}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Batch Actions Toolbar */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Quick Distribution:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDistributeEvenly}
              disabled={auditees.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
              <span>Evenly Distribute Across Team ({auditees.length})</span>
            </button>

            {auditees.length > 0 && (
              <select
                onChange={(e) => {
                  handleAssignAllTo(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs"
              >
                <option value="" disabled>
                  Assign All Items to...
                </option>
                {auditees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Requirements Assignment List */}
        {isLoadingAuditees ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs text-slate-500">Loading audit team reviewers...</p>
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
            {requirements.map((req) => {
              const assignedAuditeeId = assignments[req.id] || "";
              const assignedPerson = auditees.find((a) => a.id === assignedAuditeeId);

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    assignedAuditeeId
                      ? "border-indigo-200 bg-indigo-50/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        {req.code}
                      </span>
                      {req.torClause && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Clause {req.torClause.clauseNumber}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {req.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <UserCheck className="h-4 w-4 text-slate-400" />
                    <select
                      value={assignedAuditeeId}
                      onChange={(e) => handleAssignSingle(req.id, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 min-w-[200px]"
                    >
                      <option value="">-- Unassigned --</option>
                      {auditees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Statistics & Confirm */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              Total: <strong className="text-slate-900">{requirements.length}</strong>
            </div>
            <div>
              Assigned:{" "}
              <strong className="text-indigo-600">{totalAssigned}</strong>
            </div>
            <div>
              Unassigned:{" "}
              <strong className="text-amber-600">{unassignedCount}</strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDistribution}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{isSubmitting ? "Distributing..." : "Save & Notify Auditees"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

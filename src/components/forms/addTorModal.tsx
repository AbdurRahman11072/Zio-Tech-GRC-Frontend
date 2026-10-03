"use client";

import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderTree,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  createTorClause,
  fetchAuditTorTree,
  type AuditProject,
  type TorClause,
} from "@/lib/api";

interface AddTorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClause: TorClause) => void;
  audits: AuditProject[];
  defaultAuditId?: string;
  defaultParentClauseId?: string;
}

export default function AddTorModal({
  isOpen,
  onClose,
  onSuccess,
  audits,
  defaultAuditId,
  defaultParentClauseId,
}: AddTorModalProps) {
  const { token } = useAuth();
  const [auditProjectId, setAuditProjectId] = useState(
    defaultAuditId || (audits.length > 0 ? audits[0].id : "")
  );
  const [clauseNumber, setClauseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [parentClauseId, setParentClauseId] = useState<string>(
    defaultParentClauseId || ""
  );
  const [existingClauses, setExistingClauses] = useState<TorClause[]>([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing clauses when audit project changes to populate parent selector
  useEffect(() => {
    if (!token || !auditProjectId || !isOpen) return;
    const loadClauses = async () => {
      setIsLoadingClauses(true);
      try {
        const tree = await fetchAuditTorTree(token, auditProjectId);
        // Flatten tree
        const flattened: TorClause[] = [];
        const traverse = (items: TorClause[]) => {
          for (const item of items) {
            flattened.push(item);
            if (item.children && item.children.length > 0) {
              traverse(item.children);
            }
          }
        };
        traverse(tree);
        setExistingClauses(flattened);
      } catch {
        setExistingClauses([]);
      } finally {
        setIsLoadingClauses(false);
      }
    };
    loadClauses();
  }, [token, auditProjectId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!auditProjectId) {
      setError("Please select an audit project");
      return;
    }
    if (!clauseNumber.trim() || !title.trim()) {
      setError("Clause number and title are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createTorClause(token, auditProjectId, {
        clauseNumber: clauseNumber.trim(),
        title: title.trim(),
        objective: objective.trim() || undefined,
        description: description.trim() || undefined,
        parentClauseId: parentClauseId || undefined,
        clauseType: "tor",
      });

      onSuccess(created);
      onClose();
      // Reset form
      setClauseNumber("");
      setTitle("");
      setObjective("");
      setDescription("");
      setParentClauseId("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create TOR clause"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Add Terms of Reference (TOR) Clause</h3>
              <p className="text-xs text-blue-100">
                Define audit scope boundaries, parent-child clauses, and criteria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Audit Project Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Audit Project <span className="text-red-500">*</span>
            </label>
            <select
              value={auditProjectId}
              onChange={(e) => {
                setAuditProjectId(e.target.value);
                setParentClauseId("");
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              {audits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.framework})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Clause Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Clause # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clauseNumber}
                onChange={(e) => setClauseNumber(e.target.value)}
                placeholder="e.g. CC1.1 or 1.0"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Parent Clause Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Parent Clause (Optional)</span>
                {isLoadingClauses && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    Loading clauses...
                  </span>
                )}
              </label>
              <select
                value={parentClauseId}
                onChange={(e) => setParentClauseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="">(None - Root Clause)</option>
                {existingClauses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clauseNumber}: {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clause Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Clause Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Logical & Physical Access Controls"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Audit Objective */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Audit Scope & Objective
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Ensure the entity restricts logical access to authorized personnel only."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Detailed Scope Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Scope Description & Specific Criteria
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional assessment criteria, systems in scope, or auditing notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating TOR Clause...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Create TOR Clause</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

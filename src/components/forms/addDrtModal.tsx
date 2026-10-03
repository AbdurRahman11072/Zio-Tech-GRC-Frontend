"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Calendar,
  FileCheck2,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  createDrtRequirement,
  fetchAuditTorTree,
  type AuditProject,
  type DrtRequirement,
  type TorClause,
} from "@/lib/api";

interface AddDrtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReq: DrtRequirement) => void;
  audits: AuditProject[];
  defaultAuditId?: string;
  defaultTorClauseId?: string;
}

export default function AddDrtModal({
  isOpen,
  onClose,
  onSuccess,
  audits,
  defaultAuditId,
  defaultTorClauseId,
}: AddDrtModalProps) {
  const { token } = useAuth();
  const [auditProjectId, setAuditProjectId] = useState(
    defaultAuditId || (audits.length > 0 ? audits[0].id : "")
  );
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [guidance, setGuidance] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [torClauseId, setTorClauseId] = useState<string>(
    defaultTorClauseId || ""
  );
  const [clauses, setClauses] = useState<TorClause[]>([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clauses whenever selected audit changes
  useEffect(() => {
    if (!token || !auditProjectId || !isOpen) return;
    const loadClauses = async () => {
      setIsLoadingClauses(true);
      try {
        const tree = await fetchAuditTorTree(token, auditProjectId);
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
        setClauses(flattened);
      } catch {
        setClauses([]);
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
    if (!code.trim() || !title.trim()) {
      setError("Requirement code and title are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createDrtRequirement(token, auditProjectId, {
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        guidance: guidance.trim() || undefined,
        isMandatory,
        dueDate: dueDate || undefined,
        torClauseId: torClauseId || undefined,
      });

      onSuccess(created);
      onClose();
      // Reset form
      setCode("");
      setTitle("");
      setDescription("");
      setGuidance("");
      setIsMandatory(true);
      setDueDate("");
      setTorClauseId("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create DRT requirement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <FileCheck2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Add DRT Evidence Requirement</h3>
              <p className="text-xs text-cyan-100">
                Request specific audit artifacts, logs, and compliance evidence
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
              Target Audit Project <span className="text-red-500">*</span>
            </label>
            <select
              value={auditProjectId}
              onChange={(e) => {
                setAuditProjectId(e.target.value);
                setTorClauseId("");
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
            {/* Requirement Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                DRT Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DRT-001"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Mapped TOR / Guideline Clause */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Mapped Guideline / TOR Clause</span>
                {isLoadingClauses && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    Loading clauses...
                  </span>
                )}
              </label>
              <select
                value={torClauseId}
                onChange={(e) => setTorClauseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="">(None - Unmapped Requirement)</option>
                {clauses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clauseNumber}: {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Artifact / Evidence Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Multi-Factor Authentication (MFA) Logs & Screenshots"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Guidance for Submitter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Auditor Guidance & Specific Evidence Criteria
            </label>
            <textarea
              rows={2}
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="e.g. Upload Okta sign-in log exports for administrative accounts and screenshots of policy configuration."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Due Date & Mandatory Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2.5 text-xs font-semibold text-slate-700">
                  Mandatory Audit Requirement
                </span>
              </label>
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Requirement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Create DRT Requirement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

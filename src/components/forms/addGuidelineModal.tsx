"use client";

import { useState } from "react";
import {
  X,
  ClipboardList,
  Sparkles,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { createTorClause, type AuditProject, type TorClause } from "@/lib/api";

interface AddGuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newGuideline: TorClause) => void;
  audits: AuditProject[];
  defaultAuditId?: string;
}

const COMMON_DOMAINS = [
  "Access Control & Identity",
  "Cloud & Network Security",
  "Data Protection & Encryption",
  "Asset Management",
  "Threat & Vulnerability Management",
  "Incident Response & Disaster Recovery",
  "Human Resources & Training",
  "Vendor Risk Management",
  "Governance & Policy Oversight",
];

export default function AddGuidelineModal({
  isOpen,
  onClose,
  onSuccess,
  audits,
  defaultAuditId,
}: AddGuidelineModalProps) {
  const { token } = useAuth();
  const [auditProjectId, setAuditProjectId] = useState(
    defaultAuditId || (audits.length > 0 ? audits[0].id : "")
  );
  const [clauseNumber, setClauseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState(COMMON_DOMAINS[0]);
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!auditProjectId) {
      setError("Please select an audit project");
      return;
    }
    if (!clauseNumber.trim() || !title.trim()) {
      setError("Guideline code and title are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fullDescription = domain
        ? `[Domain: ${domain}] ${description || ""}`.trim()
        : description;

      const created = await createTorClause(token, auditProjectId, {
        clauseNumber: clauseNumber.trim(),
        title: title.trim(),
        objective: objective.trim() || undefined,
        description: fullDescription || undefined,
        clauseType: "guideline",
      });

      onSuccess(created);
      onClose();
      // Reset form
      setClauseNumber("");
      setTitle("");
      setObjective("");
      setDescription("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create compliance guideline"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Add Compliance Guideline</h3>
              <p className="text-xs text-emerald-100">
                Establish benchmark controls and standard policy guidelines
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
            <div className="relative">
              <select
                value={auditProjectId}
                onChange={(e) => setAuditProjectId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.framework})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Guideline Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Guideline ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clauseNumber}
                onChange={(e) => setClauseNumber(e.target.value)}
                placeholder="e.g. GL-01 or A.5.1"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Guideline Domain */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Security Domain / Category
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {COMMON_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guideline Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Guideline Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Multi-Factor Authentication & Credential Strength Policy"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Compliance Objective */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Control Objective
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Ensure all administrative console access mandates FIDO2/TOTP MFA enforcement."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Detailed Description / Implementation Guidance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Implementation Guidance & Recommended Actions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed technical specifications, audit check criteria, or configuration rules..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Guideline...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Create Guideline</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

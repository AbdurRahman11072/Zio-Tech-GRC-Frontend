"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  X,
  Building2,
  HelpCircle,
  Send,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  fetchAudits,
  fetchAuditTorTree,
  createTorClause,
  importTorTemplate,
  deleteTorClause,
  finalizeAuditTor,
  type AuditProject,
  type TorClause,
} from "@/lib/api";

interface TorManagementProps {
  initialAuditId?: string;
}

export default function TorManagement({ initialAuditId }: TorManagementProps) {
  const { token, user } = useAuth();
  const [audits, setAudits] = useState<AuditProject[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string>(
    initialAuditId || "",
  );
  const [tree, setTree] = useState<TorClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Finalize TORs state
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeSuccessMessage, setFinalizeSuccessMessage] = useState<string | null>(null);

  // Expanded nodes set
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [clauseNumber, setClauseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [parentClauseId, setParentClauseId] = useState<string>("");

  const canEdit = user?.role === "admin" || user?.role === "auditor";

  // Load audit projects list
  useEffect(() => {
    if (!token) return;
    const loadAudits = async () => {
      try {
        const data = await fetchAudits(token);
        setAudits(data);
        if (data.length > 0 && !selectedAuditId) {
          setSelectedAuditId(data[0].id);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load audit projects",
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadAudits();
  }, [token]);

  // Load TOR tree when selected audit changes
  const loadTorTree = async (auditId: string) => {
    if (!token || !auditId) return;
    setIsTreeLoading(true);
    setError(null);
    try {
      const data = await fetchAuditTorTree(token, auditId);
      setTree(data);
      // Automatically expand top-level nodes
      const rootIds = new Set(data.map((c) => c.id));
      setExpandedNodes(rootIds);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load TOR clause tree",
      );
    } finally {
      setIsTreeLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAuditId) {
      loadTorTree(selectedAuditId);
    }
  }, [selectedAuditId, token]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleImportTemplate = async () => {
    if (!token || !selectedAuditId) return;
    const activeAudit = audits.find((a) => a.id === selectedAuditId);
    if (!activeAudit) return;

    if (
      tree.length > 0 &&
      !confirm(
        "Importing standard controls will append framework clauses to this audit. Continue?",
      )
    ) {
      return;
    }

    setIsImporting(true);
    try {
      const updatedTree = await importTorTemplate(
        token,
        selectedAuditId,
        activeAudit.framework,
      );
      setTree(updatedTree);
      const rootIds = new Set(updatedTree.map((c) => c.id));
      setExpandedNodes(rootIds);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to import framework template",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateClause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAuditId) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      await createTorClause(token, selectedAuditId, {
        clauseNumber,
        title,
        objective: objective || undefined,
        description: description || undefined,
        parentClauseId: parentClauseId || undefined,
      });

      await loadTorTree(selectedAuditId);
      setIsModalOpen(false);
      // Reset
      setClauseNumber("");
      setTitle("");
      setObjective("");
      setDescription("");
      setParentClauseId("");
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create clause",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClause = async (id: string, num: string) => {
    if (!token) return;
    if (
      !confirm(
        `Are you sure you want to remove clause "${num}" and all its sub-clauses?`,
      )
    ) {
      return;
    }

    try {
      await deleteTorClause(token, id);
      await loadTorTree(selectedAuditId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete clause");
    }
  };

  const openAddChildModal = (parentId: string, parentNum: string) => {
    setParentClauseId(parentId);
    setClauseNumber(`${parentNum}.`);
    setIsModalOpen(true);
  };

  const handleFinalizeTor = async () => {
    if (!token || !selectedAuditId) return;
    setIsFinalizing(true);
    setError(null);
    try {
      const res = await finalizeAuditTor(token, selectedAuditId);
      setFinalizeSuccessMessage(res.message);
      setIsFinalizeModalOpen(false);
      // Reload audits to reflect updated fieldwork status
      const updatedAudits = await fetchAudits(token);
      setAudits(updatedAudits);
      setTimeout(() => setFinalizeSuccessMessage(null), 8000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to finalize Terms of Reference",
      );
    } finally {
      setIsFinalizing(false);
    }
  };

  const countAllClauses = (nodes: TorClause[]): number => {
    let count = 0;
    for (const node of nodes) {
      count += 1;
      if (node.children && node.children.length > 0) {
        count += countAllClauses(node.children);
      }
    }
    return count;
  };

  const selectedAudit = audits.find((a) => a.id === selectedAuditId);

  // Flatten for parent dropdown
  const allClausesFlat: TorClause[] = [];
  const flatten = (items: TorClause[]) => {
    for (const item of items) {
      allClausesFlat.push(item);
      if (item.children && item.children.length > 0) {
        flatten(item.children);
      }
    }
  };
  flatten(tree);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TorClause, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="group/node">
        <div
          className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
            depth === 0
              ? "bg-white border-slate-200/90 shadow-xs mb-2.5"
              : "bg-slate-50/70 border-slate-200/70 ml-6 sm:ml-8 mb-2"
          } hover:border-indigo-200 hover:bg-white`}
        >
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="mt-0.5 p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6 shrink-0 flex items-center justify-center mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {node.clauseNumber}
                </span>
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {node.title}
                </h4>
              </div>

              {node.objective && (
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                  <span className="font-semibold text-slate-700">Objective: </span>
                  {node.objective}
                </p>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-1 opacity-80 group-hover/node:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => openAddChildModal(node.id, node.clauseNumber)}
                className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                title="Add Sub-Clause"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px] font-semibold">
                  Sub-Clause
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteClause(node.id, node.clauseNumber)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Clause"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="relative border-l-2 border-slate-200/80 ml-3 sm:ml-4 pl-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalClauses = countAllClauses(tree);
  const targetOrgEmail =
    selectedAudit?.company?.contactEmail ||
    `compliance@${selectedAudit?.company?.domain || "organization.com"}`;

  return (
    <div className="space-y-6">
      {/* Header and Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Terms of Reference (TOR) Tree
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Define hierarchical audit scopes, parent-child control guidelines, and compliance objectives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              {/* Finalize TORs Action Button */}
              {selectedAudit && (
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(true)}
                  disabled={isFinalizing || tree.length === 0}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                    selectedAudit.status === "fieldwork"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
                  }`}
                  title={
                    selectedAudit.status === "fieldwork"
                      ? "TORs are finalized and organization has been notified"
                      : "Publish TORs and dispatch notification email to organization"
                  }
                >
                  {selectedAudit.status === "fieldwork" ? (
                    <>
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      <span>TORs Finalized (Fieldwork)</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Finalize TORs & Notify Org</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleImportTemplate}
                disabled={isImporting || !selectedAuditId}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isImporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                )}
                <span>1-Click Template Seed</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParentClauseId("");
                  setClauseNumber("");
                  setIsModalOpen(true);
                }}
                disabled={!selectedAuditId}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Root Clause</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {finalizeSuccessMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">Official Notification Dispatched!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {finalizeSuccessMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFinalizeSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Read-Only Scoping Guidance for Non-Auditors */}
      {!canEdit && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-indigo-50/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
                Terms of Reference (TOR) Authority
              </h4>
              <p className="text-xs text-indigo-800/80 mt-0.5">
                The compliance scope and control clauses are established by the Lead Auditor.
                {user?.role === "company_user"
                  ? " As an organization user, please submit your compliance evidence against these clauses in the Evidence Vault (DRT)."
                  : " As a reviewer, examine submitted evidence against these clauses in your Verification queue."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Selector & Scope Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Audit Engagement
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAuditId}
                  onChange={(e) => setSelectedAuditId(e.target.value)}
                  className="font-bold text-sm sm:text-base text-slate-900 bg-transparent focus:outline-none border-b border-indigo-300 pb-0.5 cursor-pointer"
                >
                  {audits.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedAudit && (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                {selectedAudit.framework}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {selectedAudit.company?.name || "Client Org"}
              </span>
            </div>
          )}
        </div>

        {selectedAudit?.scope && (
          <div className="pt-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Audit Scope: </span>
            {selectedAudit.scope}
          </div>
        )}
      </div>

      {/* Tree View Container */}
      {isTreeLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">
            Loading TOR clause hierarchy...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
          <button
            onClick={() => loadTorTree(selectedAuditId)}
            className="ml-auto underline font-medium text-red-700"
          >
            Retry
          </button>
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FolderTree className="h-6 w-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            No Terms of Reference Clauses Configured
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            You can either import standard framework controls (ISO 27001 / SOC 2) with one click or create custom clauses manually.
          </p>
          {canEdit && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleImportTemplate}
                disabled={isImporting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>Import {selectedAudit?.framework || "Framework"} Controls</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setParentClauseId("");
                  setClauseNumber("");
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Clause</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2 text-xs text-slate-500">
            <span>Clauses & Control Requirements ({tree.length} Root Sections)</span>
            <button
              onClick={() => {
                if (expandedNodes.size > 0) {
                  setExpandedNodes(new Set());
                } else {
                  const allIds = new Set(allClausesFlat.map((c) => c.id));
                  setExpandedNodes(allIds);
                }
              }}
              className="text-indigo-600 hover:underline font-semibold"
            >
              {expandedNodes.size > 0 ? "Collapse All" : "Expand All"}
            </button>
          </div>

          {tree.map((rootNode) => renderTreeNode(rootNode))}
        </div>
      )}

      {/* Add Clause Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {parentClauseId ? "Add Sub-Clause" : "Add Root TOR Clause"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define clause number, title, and evaluation criteria
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClause} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clause Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A.5.15"
                    value={clauseNumber}
                    onChange={(e) => setClauseNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clause Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Access Control Policy"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Clause (Optional)
                </label>
                <select
                  value={parentClauseId}
                  onChange={(e) => setParentClauseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None (Top-Level Root Section)</option>
                  {allClausesFlat.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clauseNumber} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Control Objective & Purpose
                </label>
                <textarea
                  rows={3}
                  placeholder="State the objective that this audit clause is designed to evaluate..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Add Clause</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finalize TORs & Notify Organization Modal */}
      {isFinalizeModalOpen && selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Finalize Terms of Reference (TOR)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish requirements & dispatch email alert to organization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFinalizeModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs">
                <div className="flex justify-between items-start border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Audit Project</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedAudit.code} • {selectedAudit.title}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Target Organization</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAudit.company?.name || "Client Organization"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Recipient Email</span>
                  <span className="font-mono font-semibold text-indigo-600">
                    {targetOrgEmail}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Configured Clauses</span>
                  <span className="font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px]">
                    {totalClauses} Clauses
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="leading-relaxed">
                  Finalizing will officially lock initial authoring and transition the engagement to <strong>Fieldwork (Evidence Collection)</strong>. An automated notification and email will be immediately dispatched to <strong>{targetOrgEmail}</strong> requesting document uploads.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  disabled={isFinalizing}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isFinalizing || totalClauses === 0}
                  onClick={handleFinalizeTor}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isFinalizing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Dispatching Notification...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Confirm & Notify Organization</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

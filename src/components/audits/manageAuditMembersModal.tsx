"use client";

import { useState, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Shield,
  UserCheck,
} from "lucide-react";
import {
  fetchAuditMembers,
  addAuditMember,
  removeAuditMember,
  fetchUsers,
  type AuditMember,
  type AuditProject,
  type UserProfile,
} from "@/lib/api";

interface ManageAuditMembersModalProps {
  token: string;
  audit: AuditProject;
  isOpen: boolean;
  onClose: () => void;
  onMembersUpdated?: () => void;
}

export default function ManageAuditMembersModal({
  token,
  audit,
  isOpen,
  onClose,
  onMembersUpdated,
}: ManageAuditMembersModalProps) {
  const [members, setMembers] = useState<AuditMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [roleInAudit, setRoleInAudit] = useState<
    "auditee_reviewer" | "lead_auditor" | "contributor"
  >("auditee_reviewer");

  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!token || !audit.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [membersData, allUsers] = await Promise.all([
        fetchAuditMembers(token, audit.id),
        fetchUsers(token),
      ]);
      setMembers(membersData);
      setAvailableUsers(allUsers);
      if (allUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(allUsers[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, token, audit.id]);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserId) return;
    setIsAdding(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const newMember = await addAuditMember(token, audit.id, {
        userId: selectedUserId,
        roleInAudit,
      });
      setMembers((prev) => [...prev, newMember]);
      setSuccessMsg("Member assigned to audit project successfully");
      onMembersUpdated?.();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member to audit");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this audit?`)) {
      return;
    }
    if (!token) return;
    setError(null);
    try {
      await removeAuditMember(token, audit.id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      onMembersUpdated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  // Filter out users already in audit
  const existingUserIds = new Set(members.map((m) => m.userId));
  const candidateUsers = availableUsers.filter((u) => !existingUserIds.has(u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Audit Team & Members
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {audit.code} • {audit.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Member Form */}
          <form
            onSubmit={handleAddMember}
            className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
              <span>Add Auditee or Team Member</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {candidateUsers.length === 0 ? (
                    <option value="">No other users available</option>
                  ) : (
                    candidateUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) - {u.email}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <select
                  value={roleInAudit}
                  onChange={(e) => setRoleInAudit(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="auditee_reviewer">Auditee</option>
                  <option value="contributor">Contributor</option>
                  <option value="lead_auditor">Co-Auditor</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAdding || !selectedUserId || candidateUsers.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white shadow-xs cursor-pointer transition-colors"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Assign to Audit</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Current Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Assigned Team Members ({members.length})
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs">Loading audit members...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No members currently assigned to this audit project.
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isLead = member.roleInAudit === "lead_auditor";
                  const roleLabel =
                    member.roleInAudit === "lead_auditor"
                      ? "Lead Auditor"
                      : member.roleInAudit === "auditee_reviewer"
                      ? "Auditee Reviewer"
                      : "Contributor";

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isLead
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {member.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {member.user?.name || "User"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {member.user?.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isLead
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {roleLabel}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(
                              member.id,
                              member.user?.name || "this user",
                            )
                          }
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove from audit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

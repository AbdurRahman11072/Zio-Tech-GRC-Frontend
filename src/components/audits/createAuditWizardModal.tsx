"use client";

import { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FolderOpen,
  Layers,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UserCheck,
  UserPlus,
  Sparkles,
  BookOpen,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  fetchGuidelineCategories,
  fetchUsers,
  fetchCompanies,
  createAudit,
  type GuidelineCategory,
  type UserProfile,
  type Company,
  type AuditProject,
} from "@/lib/api";

interface CreateAuditWizardModalProps {
  token: string;
  currentUser: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onAuditCreated: (audit: AuditProject) => void;
  onSubscriptionRequired?: (company: Company) => void;
}

export default function CreateAuditWizardModal({
  token,
  currentUser,
  isOpen,
  onClose,
  onAuditCreated,
  onSubscriptionRequired,
}: CreateAuditWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Data fetching
  const [categories, setCategories] = useState<GuidelineCategory[]>([]);
  const [auditors, setAuditors] = useState<UserProfile[]>([]);
  const [auditees, setAuditees] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [scope, setScope] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [leadAuditorId, setLeadAuditorId] = useState<string>("");
  const [selectedAuditeeIds, setSelectedAuditeeIds] = useState<string[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (!isOpen || !token) return;

    let isMounted = true;
    setIsLoadingMeta(true);
    setErrorMessage(null);

    // Auto-generate code
    const randomCode = `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setCode(randomCode);

    Promise.all([
      fetchGuidelineCategories(token).catch(() => []),
      fetchUsers(token).catch(() => []),
      fetchCompanies(token).catch(() => []),
    ])
      .then(([cats, allUsers, comps]) => {
        if (!isMounted) return;
        setCategories(cats.filter((c) => c.isActive));
        setCompanies(comps);

        // Filter auditors (role admin or auditor)
        const auditorUsers = allUsers.filter(
          (u) => u.role === "auditor" || u.role === "admin",
        );
        setAuditors(auditorUsers);

        // Filter auditees (role auditee or company_user)
        const auditeeUsers = allUsers.filter(
          (u) => u.role === "auditee" || u.role === "company_user",
        );
        setAuditees(auditeeUsers);

        // Default company
        if (currentUser?.companyId) {
          setCompanyId(currentUser.companyId);
        } else if (comps.length > 0) {
          setCompanyId(comps[0].id);
        }

        // Default lead auditor
        if (currentUser?.role === "auditor") {
          setLeadAuditorId(currentUser.id);
        } else if (auditorUsers.length > 0) {
          setLeadAuditorId(auditorUsers[0].id);
        }

        // Default category
        if (cats.length > 0) {
          setSelectedCategoryId(cats[0].id);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingMeta(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, token, currentUser]);

  if (!isOpen) return null;

  // Step 1 Validation
  const canProceedStep1 = title.trim().length >= 3 && Boolean(companyId);

  // Step 2 Validation
  const canProceedStep2 = Boolean(selectedCategoryId);

  // Handle Auditee Toggle
  const toggleAuditee = (userId: string) => {
    setSelectedAuditeeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Submit Audit Project
  const handleSubmit = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

    // Only send framework if it exactly matches a valid backend enum value.
    // If not mappable, omit entirely (field is @IsOptional on backend) to avoid
    // class-validator enum errors that would mask the real subscription error.
    const VALID_FRAMEWORKS = [
      "ISO_27001",
      "SOC_2_TYPE_2",
      "NIST_CSF",
      "PCI_DSS",
      "HIPAA",
      "CUSTOM",
    ] as const;
    type ValidFramework = (typeof VALID_FRAMEWORKS)[number];
    const codeUpper = selectedCategory?.code?.toUpperCase() ?? "";
    const mappedFramework: ValidFramework | undefined = (
      VALID_FRAMEWORKS as readonly string[]
    ).includes(codeUpper)
      ? (codeUpper as ValidFramework)
      : undefined; // omit rather than send invalid value

    try {
      const created = await createAudit(token, {
        title: title.trim(),
        code: code.trim() || undefined,
        scope: scope.trim() || undefined,
        companyId,
        targetDate: targetDate || undefined,
        guidelineCategoryId: selectedCategoryId || undefined,
        leadAuditorId: leadAuditorId || undefined,
        auditeeIds: selectedAuditeeIds,
        ...(mappedFramework ? { framework: mappedFramework } : {}),
        status: "active",
      });

      onAuditCreated(created);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as Error & { status?: number };
      const msg = apiErr.message || "Failed to create audit project";
      const httpStatus = apiErr.status;

      // HTTP 403 = subscription required (ForbiddenException from backend)
      // Also catch keyword matches for robustness
      const isSubscriptionError =
        httpStatus === 403 ||
        msg.toLowerCase().includes("subscription") ||
        msg.toLowerCase().includes("active subscription") ||
        msg.toLowerCase().includes("upgrade") ||
        msg.toLowerCase().includes("purchase");

      if (isSubscriptionError) {
        const comp =
          companies.find((c) => c.id === companyId) ||
          (currentUser?.company as Company);
        if (comp && onSubscriptionRequired) {
          onSubscriptionRequired(comp);
          // Close wizard and let subscription modal handle it
          setIsSubmitting(false);
          return;
        }
      }

      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedAuditor = auditors.find((u) => u.id === leadAuditorId);
  const selectedCompany = companies.find((c) => c.id === companyId) || currentUser?.company;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                New Audit Project Wizard
              </h3>
              <p className="text-xs text-slate-500">
                Step-by-step audit initialization with guideline scoping &amp; team assignment
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

        {/* Wizard Stepper Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep === 1
                ? "text-indigo-600 font-bold"
                : currentStep > 1
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 1
                  ? "bg-indigo-600 text-white"
                  : currentStep > 1
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              1
            </span>
            <span>1. Details</span>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep === 2
                ? "text-indigo-600 font-bold"
                : currentStep > 2
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 2
                  ? "bg-indigo-600 text-white"
                  : currentStep > 2
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              2
            </span>
            <span>2. Guideline Category</span>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep === 3
                ? "text-indigo-600 font-bold"
                : currentStep > 3
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 3
                  ? "bg-indigo-600 text-white"
                  : currentStep > 3
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              3
            </span>
            <span>3. Assign Team</span>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep === 4 ? "text-indigo-600 font-bold" : "text-slate-400"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 4
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              4
            </span>
            <span>4. Review</span>
          </div>
        </div>

        {/* Modal Body / Steps */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoadingMeta ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              <p className="text-xs">Loading metadata &amp; guideline categories...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: Audit Project Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Audit Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q4 2026 ISO 27001 Security Audit"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Specify an official, descriptive title for this audit project.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Audit Tracking Code
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="AUD-2026-XXXX"
                        className="w-full font-mono rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Client Organization <span className="text-red-500">*</span>
                      </label>
                      {currentUser?.role === "company_user" ? (
                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold truncate">
                            {currentUser.company?.name || "Your Organization"}
                          </span>
                        </div>
                      ) : (
                        <select
                          value={companyId}
                          onChange={(e) => setCompanyId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.subscriptionPlan || "Standard"} Plan)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Completion Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Audit Scope &amp; Compliance Objectives
                    </label>
                    <textarea
                      rows={3}
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      placeholder="Outline target domains, environments, or specific regulatory scope to be verified in this audit cycle..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Guideline Category Selection */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Select Dynamic Guideline Category
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Choose the compliance guideline standard to govern this audit project and its TOR clauses.
                      </p>
                    </div>
                    <span className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 font-semibold">
                      {categories.length} Categories Available
                    </span>
                  </div>

                  {categories.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <BookOpen className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-medium">
                        No guideline categories found.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Categories can be created dynamically by Admins in the Guideline Categories tab.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                      {categories.map((cat) => {
                        const isSelected = selectedCategoryId === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500"
                                : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                                  {cat.code}
                                </span>
                                {isSelected ? (
                                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                                )}
                              </div>
                              <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                {cat.name}
                              </h5>
                              {cat.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Dynamic Standard</span>
                              <span className="text-emerald-600 font-semibold">Active</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Assign Team Members */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {/* Lead Auditor */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Assign Lead Auditor</span>
                      <span className="text-slate-400 font-normal">
                        (Audits &amp; TOR authoring lead)
                      </span>
                    </label>
                    <select
                      value={leadAuditorId}
                      onChange={(e) => setLeadAuditorId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {auditors.map((auditor) => (
                        <option key={auditor.id} value={auditor.id}>
                          {auditor.name} ({auditor.email}) - {auditor.role.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auditee Members */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Assign Auditee Members</span>
                        <span className="text-slate-400 font-normal">
                          (Task verification &amp; DRT upload team)
                        </span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {selectedAuditeeIds.length} assigned
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2">
                      Select organization auditees. Additional auditees can also be added later by the Auditor.
                    </p>

                    {auditees.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                        No auditee users registered yet. You can assign auditees anytime after creation.
                      </div>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                        {auditees.map((auditee) => {
                          const isAssigned = selectedAuditeeIds.includes(auditee.id);
                          return (
                            <div
                              key={auditee.id}
                              onClick={() => toggleAuditee(auditee.id)}
                              className={`px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isAssigned
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-950 font-medium"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                    isAssigned
                                      ? "bg-indigo-600 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {auditee.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold leading-tight">
                                    {auditee.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {auditee.email} {auditee.company?.name ? `- ${auditee.company.name}` : ""}
                                  </p>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => {}}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Final Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        ACTIVE DRAFT
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Organization
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedCompany?.name || "Client Org"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Guideline Category
                        </span>
                        <span className="font-semibold text-indigo-600">
                          {selectedCategory?.name || "Standard Guideline"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Lead Auditor
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedAuditor?.name || "Assigned Lead"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Auditee Members
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedAuditeeIds.length} members assigned
                        </span>
                      </div>
                    </div>

                    {scope && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-400 text-[11px] block">
                          Scope &amp; Objectives
                        </span>
                        <p className="text-slate-600 text-xs mt-0.5 italic">
                          &quot;{scope}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      After launching, the Auditor can draft hierarchical TOR clauses and assign verification tasks to auditee members.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2)
                }
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-5 py-2 rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Launching Project...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Launch Audit Project</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

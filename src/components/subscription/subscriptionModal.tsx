"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Check,
  Sparkles,
  Zap,
  Building,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { updateCompanySubscription, type Company } from "@/lib/api";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  companyId: string;
  companyName: string;
  currentPlan?: "none" | "starter" | "professional" | "enterprise";
  currentStatus?: "inactive" | "active" | "trial" | "past_due" | "cancelled";
  onSubscriptionUpdated?: (updatedCompany: Company) => void;
  reasonMessage?: string;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Essential GRC compliance for small teams",
    price: "$199",
    period: "/month",
    maxAudits: 3,
    badge: null,
    features: [
      "Up to 3 Active Audit Projects",
      "ISO 27001 & SOC 2 Frameworks",
      "Standard Evidence Vault (5 GB)",
      "1 Lead Auditor + 3 Auditees",
      "Email Notifications",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Comprehensive audit automation & dynamic rules",
    price: "$499",
    period: "/month",
    maxAudits: 10,
    badge: "Most Popular",
    recommended: true,
    features: [
      "Up to 10 Active Audit Projects",
      "All Frameworks (ISO, SOC 2, HIPAA, NIST, PCI)",
      "Dynamic Admin Guideline Categories",
      "Interactive TOR Hierarchy & Drag-and-Drop",
      "Full Auditee Review & Revision Queue",
      "Expanded Evidence Vault (50 GB)",
      "Unlimited Audit Team Members",
      "Priority Audit Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Unlimited audit volume with custom SLA",
    price: "$999",
    period: "/month",
    maxAudits: 999,
    badge: "Maximum Power",
    features: [
      "Unlimited Active Audit Projects",
      "Custom Governance & Regulatory Models",
      "Automated PDF & Excel Executive Reports",
      "Tamper-Evident Audit Trail & SIEM Logs",
      "Multi-Tenant Partitioned Storage (Unlimited)",
      "Dedicated Compliance Concierge & SLA",
    ],
  },
];

export default function SubscriptionModal({
  isOpen,
  onClose,
  token,
  companyId,
  companyName,
  currentPlan = "none",
  currentStatus = "inactive",
  onSubscriptionUpdated,
  reasonMessage,
}: SubscriptionModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (planId: "starter" | "professional" | "enterprise", maxAudits: number) => {
    setLoadingPlan(planId);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateCompanySubscription(token, companyId, {
        plan: planId,
        status: "active",
        maxAudits,
      });

      setSuccessMessage(
        `Successfully upgraded ${companyName} to the ${planId.toUpperCase()} plan! Audit creation is now fully unlocked.`,
      );

      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(updated);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to update subscription. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            Organization Subscription
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Unlock Audit Creation for {companyName}
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            {reasonMessage ||
              "An active subscription plan is required to initiate and manage audit projects on the Zio Tech GRC platform."}
          </p>

          {currentStatus === "active" ? (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              Current Plan: <span className="font-bold uppercase">{currentPlan}</span> (Active)
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
              Subscription Status: <span className="font-bold uppercase">Inactive</span> (Audit Creation Locked)
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in">
            <Check className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id && currentStatus === "active";
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 ${
                  plan.recommended
                    ? "bg-slate-800/80 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[11px] font-bold tracking-wide uppercase shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.tagline}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400">{plan.period}</span>
                  </div>

                  <div className="my-5 border-t border-slate-700/60" />

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/40">
                  <button
                    onClick={() => handleSelectPlan(plan.id as any, plan.maxAudits)}
                    disabled={isLoading || isCurrent}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
                      isCurrent
                        ? "bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/40"
                        : plan.recommended
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Activating...
                      </>
                    ) : isCurrent ? (
                      "Current Active Plan"
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Activate {plan.name}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Building className="w-4 h-4 text-slate-400" />
          <span>Organization Plan unlocks immediate audit initiation, TOR drafting, and DRT vaults.</span>
        </div>
      </div>
    </div>
  );
}

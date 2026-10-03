"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  ExternalLink,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  fetchCompanies,
  createCompany,
  deleteCompany,
  type Company,
} from "@/lib/api";

export default function CompanyManagement() {
  const { token, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [domain, setDomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");

  const canManage = user?.role === "admin" || user?.role === "auditor";

  const loadCompanies = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCompanies(token);
      setCompanies(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load company records",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [token]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      const newCompany = await createCompany(token, {
        name,
        registrationNumber: registrationNumber || undefined,
        industry: industry || undefined,
        domain: domain || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        address: address || undefined,
        status: "active",
      });

      setCompanies((prev) => [newCompany, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setName("");
      setRegistrationNumber("");
      setIndustry("Technology");
      setDomain("");
      setContactEmail("");
      setContactPhone("");
      setAddress("");
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to register company",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async (id: string, companyName: string) => {
    if (!token) return;
    if (
      !confirm(
        `Are you sure you want to remove "${companyName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteCompany(token, id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete company");
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.domain &&
        company.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.industry &&
        company.industry.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || company.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = companies.filter((c) => c.status === "active").length;
  const pendingCount = companies.filter(
    (c) => c.status === "pending_review",
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Client Organizations & Companies
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage multi-tenant enterprise profiles, audit boundaries, and client members.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Companies
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {companies.length}
          </p>
          <span className="text-[11px] text-slate-400">
            Registered on Zio GRC platform
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Tenants
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">
            Ready for audit projects
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pending Onboarding
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pendingCount}
          </p>
          <span className="text-[11px] text-amber-600 font-medium">
            Requires compliance review
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, domain, industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-slate-50 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending_review">Pending Review</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Companies List / Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">
            Loading tenant companies from Neon PostgreSQL...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
          <button
            onClick={loadCompanies}
            className="ml-auto underline font-medium text-red-700 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            No Organizations Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? "No companies match your current search criteria. Try adjusting filters."
              : "Get started by adding your first enterprise client or organization."}
          </p>
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Company</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((comp) => (
            <div
              key={comp.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                      {comp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                        {comp.name}
                      </h4>
                      {comp.domain && (
                        <a
                          href={`https://${comp.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600"
                        >
                          <span>{comp.domain}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      comp.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : comp.status === "pending_review"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {comp.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600">
                  {comp.industry && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Industry:</span>
                      <span className="font-medium text-slate-700">
                        {comp.industry}
                      </span>
                    </div>
                  )}

                  {comp.registrationNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Reg No:</span>
                      <span className="font-mono text-slate-700">
                        {comp.registrationNumber}
                      </span>
                    </div>
                  )}

                  {comp.contactEmail && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate pt-1">
                      <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{comp.contactEmail}</span>
                    </div>
                  )}

                  {comp.address && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{comp.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>{comp.users?.length ?? 0} Members</span>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleDeleteCompany(comp.id, comp.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Company"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Register New Organization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add client tenant for audit assignments
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

            <form onSubmit={handleCreateCompany} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Financials Inc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Technology">Technology & SaaS</option>
                    <option value="Financial Services">Financial Services & Fintech</option>
                    <option value="Healthcare">Healthcare & BioTech</option>
                    <option value="Manufacturing">Manufacturing & Supply Chain</option>
                    <option value="Government">Government & Public Sector</option>
                    <option value="Retail">Retail & E-Commerce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Domain / Website
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. apexfinancials.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REG-8890214"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="compliance@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Headquarters Address
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                    <span>Register Company</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

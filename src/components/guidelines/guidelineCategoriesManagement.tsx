"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Cloud,
  Activity,
  CreditCard,
  Cpu,
  Database,
  Eye,
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  fetchGuidelineCategories,
  createGuidelineCategory,
  updateGuidelineCategory,
  deleteGuidelineCategory,
  type GuidelineCategory,
} from "@/lib/api";

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Cloud,
  Activity,
  CreditCard,
  Cpu,
  Database,
  Eye,
  Award,
};

export default function GuidelineCategoriesManagement() {
  const { token, user } = useAuth();
  const [categories, setCategories] = useState<GuidelineCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GuidelineCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("ShieldCheck");
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      // Admin requests all (including inactive), others get active
      const data = await fetchGuidelineCategories(token, isAdmin);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load guideline categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, isAdmin]);

  const handleOpenAdd = () => {
    setName("");
    setCode("");
    setDescription("");
    setIcon("ShieldCheck");
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setFormError(null);
    setEditingCategory(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat: GuidelineCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setDescription(cat.description || "");
    setIcon(cat.icon || "ShieldCheck");
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name.trim()) {
      setFormError("Category name is required");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        const updated = await updateGuidelineCategory(token, editingCategory.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          icon,
          sortOrder: Number(sortOrder),
          isActive,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      } else {
        const created = await createGuidelineCategory(token, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          icon,
          sortOrder: Number(sortOrder),
          isActive,
        });
        setCategories((prev) => [...prev, created]);
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete guideline category "${catName}"?`)) {
      return;
    }

    try {
      await deleteGuidelineCategory(token, id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete category");
    }
  };

  const handleToggleActive = async (cat: GuidelineCategory) => {
    if (!token || !isAdmin) return;
    try {
      const updated = await updateGuidelineCategory(token, cat.id, {
        isActive: !cat.isActive,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch (err: any) {
      alert(err.message || "Failed to update category status");
    }
  };

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.isActive) ||
      (statusFilter === "inactive" && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Dynamic Compliance Governance
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Guideline Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Admin-managed dynamic guideline categories that feed directly into audit scoping and TOR parent requirements.
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Guideline Category</span>
          </button>
        ) : (
          <span className="text-xs text-slate-400 font-medium">
            Managed by System Administrator
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Categories
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{categories.length}</p>
          <span className="text-[11px] text-slate-400">Configured in system</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active for Audits
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Available during audit creation</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Framework Coverage
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">100%</p>
          <span className="text-[11px] text-slate-400">ISO 27001, SOC 2, HIPAA & custom</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search category name, code, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading guideline categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center px-4">
            <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No guideline categories found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first dynamic guideline category to establish standards across audits.
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Category</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Code Identifier</th>
                  <th className="py-3 px-4">Scope & Description</th>
                  <th className="py-3 px-4 text-center">Order</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.map((cat) => {
                  const IconComponent = ICON_MAP[cat.icon] || ShieldCheck;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm block">{cat.name}</span>
                            <span className="text-[10px] text-slate-400">
                              Added {new Date(cat.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {cat.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-slate-600 text-xs line-clamp-2">
                          {cat.description || "—"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-medium">
                        {cat.sortOrder}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          disabled={!isAdmin}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                          } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                          title={isAdmin ? "Click to toggle active status" : ""}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              cat.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span>{cat.isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? "Edit Guideline Category" : "Add Dynamic Guideline Category"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Categories are dynamically selectable when establishing audit projects.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Safety & Algorithmic Governance"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setCode(
                        e.target.value
                          .trim()
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "_")
                          .replace(/__+/g, "_"),
                      );
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI_SAFETY"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope & Compliance Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize standard controls, legal obligations, and mandatory safeguards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const Component = ICON_MAP[iconKey];
                    const isSelected = icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setIcon(iconKey)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Component className="h-4 w-4 mb-1" />
                        <span className="text-[10px] font-medium truncate max-w-full">
                          {iconKey}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="isActiveToggle"
                  className="text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Category is Active (Visible for new audit projects)
                </label>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                    <span>{editingCategory ? "Update Category" : "Create Category"}</span>
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

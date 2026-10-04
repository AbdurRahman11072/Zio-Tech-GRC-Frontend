export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "auditor" | "auditee" | "company_user";
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    subscriptionPlan: "none" | "starter" | "professional" | "enterprise";
    subscriptionStatus: "inactive" | "active" | "trial" | "past_due" | "cancelled";
    subscriptionExpiresAt?: string | null;
    maxAudits: number;
  } | null;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: UserProfile;
}

export interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("zio_tech_token");
  },
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zio_tech_token", token);
    }
  },
  getUser: (): UserProfile | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("zio_tech_user");
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  },
  setUser: (user: UserProfile) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zio_tech_user", JSON.stringify(user));
    }
  },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zio_tech_token");
      localStorage.removeItem("zio_tech_user");
    }
  },
};

export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to sign in. Please verify your credentials.";
    throw new Error(errorMsg);
  }

  authStorage.setToken(data.accessToken);
  authStorage.setUser(data.user);
  return data;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
  companyId?: string;
  companyName?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Registration failed. Please try again.";
    throw new Error(errorMsg);
  }

  authStorage.setToken(data.accessToken);
  authStorage.setUser(data.user);
  return data;
}

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Session expired");
  }

  return data.user;
}

export interface Company {
  id: string;
  name: string;
  registrationNumber?: string | null;
  industry?: string | null;
  domain?: string | null;
  logoUrl?: string | null;
  status: "active" | "pending_review" | "inactive";
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  subscriptionPlan?: "none" | "starter" | "professional" | "enterprise";
  subscriptionStatus?: "inactive" | "active" | "trial" | "past_due" | "cancelled";
  subscriptionExpiresAt?: string | null;
  maxAudits?: number;
  users?: UserProfile[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchCompanies(token: string): Promise<Company[]> {
  const res = await fetch(`${API_URL}/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch companies");
  }
  return data;
}

export async function fetchCompanyById(
  token: string,
  id: string,
): Promise<Company> {
  const res = await fetch(`${API_URL}/companies/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch company details");
  }
  return data;
}

export async function createCompany(
  token: string,
  payload: {
    name: string;
    registrationNumber?: string;
    industry?: string;
    domain?: string;
    status?: "active" | "pending_review" | "inactive";
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
  },
): Promise<Company> {
  const res = await fetch(`${API_URL}/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to create company";
    throw new Error(errorMsg);
  }
  return data;
}

export async function updateCompany(
  token: string,
  id: string,
  payload: Partial<Company>,
): Promise<Company> {
  const res = await fetch(`${API_URL}/companies/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update company";
    throw new Error(errorMsg);
  }
  return data;
}

export async function updateCompanySubscription(
  token: string,
  companyId: string,
  payload: {
    plan: "none" | "starter" | "professional" | "enterprise";
    status: "inactive" | "active" | "trial" | "past_due" | "cancelled";
    maxAudits?: number;
    expiresAt?: string;
  },
): Promise<Company> {
  const res = await fetch(`${API_URL}/companies/${companyId}/subscription`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update subscription";
    throw new Error(errorMsg);
  }
  return data;
}

export async function deleteCompany(
  token: string,
  id: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/companies/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to delete company");
  }
  return data;
}

export async function fetchUsers(token: string): Promise<UserProfile[]> {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }
  return data;
}

export interface AuditProject {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  framework:
    | "ISO_27001"
    | "SOC_2_TYPE_2"
    | "NIST_CSF"
    | "PCI_DSS"
    | "HIPAA"
    | "CUSTOM";
  status:
    | "draft"
    | "active"
    | "fieldwork"
    | "in_review"
    | "completed"
    | "archived";
  scope?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  completedDate?: string | null;
  companyId: string;
  company?: Company;
  leadAuditorId?: string | null;
  leadAuditor?: UserProfile | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAudits(token: string): Promise<AuditProject[]> {
  const res = await fetch(`${API_URL}/audits`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch audit projects");
  }
  return data;
}

export async function fetchAuditById(
  token: string,
  id: string,
): Promise<AuditProject> {
  const res = await fetch(`${API_URL}/audits/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch audit details");
  }
  return data;
}

export async function createAudit(
  token: string,
  payload: {
    title: string;
    code?: string;
    description?: string;
    framework?: string;
    status?: string;
    scope?: string;
    startDate?: string;
    targetDate?: string;
    companyId: string;
    leadAuditorId?: string;
  },
): Promise<AuditProject> {
  const res = await fetch(`${API_URL}/audits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to create audit project";
    throw new Error(errorMsg);
  }
  return data;
}

export async function updateAudit(
  token: string,
  id: string,
  payload: Partial<AuditProject>,
): Promise<AuditProject> {
  const res = await fetch(`${API_URL}/audits/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update audit project";
    throw new Error(errorMsg);
  }
  return data;
}

export async function deleteAudit(
  token: string,
  id: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/audits/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to delete audit project");
  }
  return data;
}

export interface TorClause {
  id: string;
  clauseNumber: string;
  title: string;
  description?: string | null;
  objective?: string | null;
  sortOrder: number;
  clauseType?: "tor" | "guideline";
  auditProjectId: string;
  auditProject?: AuditProject;
  parentClauseId?: string | null;
  children?: TorClause[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllTorClauses(
  token: string,
  options?: { type?: string; auditProjectId?: string },
): Promise<TorClause[]> {
  const params = new URLSearchParams();
  if (options?.type) params.append("type", options.type);
  if (options?.auditProjectId)
    params.append("auditProjectId", options.auditProjectId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/tor${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch clauses");
  }
  return data;
}

export async function fetchAuditTorTree(
  token: string,
  auditId: string,
): Promise<TorClause[]> {
  const res = await fetch(`${API_URL}/audits/${auditId}/tor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch TOR hierarchy");
  }
  return data;
}

export async function createTorClause(
  token: string,
  auditId: string,
  payload: {
    clauseNumber: string;
    title: string;
    description?: string;
    objective?: string;
    parentClauseId?: string;
    sortOrder?: number;
    clauseType?: string;
  },
): Promise<TorClause> {
  const res = await fetch(`${API_URL}/audits/${auditId}/tor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to create TOR clause";
    throw new Error(errorMsg);
  }
  return data;
}

export async function importTorTemplate(
  token: string,
  auditId: string,
  framework: string,
): Promise<TorClause[]> {
  const res = await fetch(
    `${API_URL}/audits/${auditId}/tor/import-template?framework=${encodeURIComponent(framework)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to import framework template");
  }
  return data;
}

export async function updateTorClause(
  token: string,
  id: string,
  payload: Partial<TorClause>,
): Promise<TorClause> {
  const res = await fetch(`${API_URL}/tor/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to update TOR clause");
  }
  return data;
}

export async function deleteTorClause(
  token: string,
  id: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/tor/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to delete TOR clause");
  }
  return data;
}

export type DrtRequirementStatus =
  | "pending"
  | "submitted"
  | "in_review"
  | "approved"
  | "revision_required";

export type ReviewDecision = "approved" | "revision_required" | "comment";

export interface EvidenceFile {
  id: string;
  submissionId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  createdAt: string;
}

export interface ReviewRemark {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  decision: ReviewDecision;
  comment: string;
  createdAt: string;
}

export interface DrtSubmission {
  id: string;
  requirementId: string;
  submittedById: string;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  version: number;
  status: DrtRequirementStatus;
  evidenceFiles: EvidenceFile[];
  reviewRemarks: ReviewRemark[];
  createdAt: string;
  updatedAt: string;
}

export interface DrtRequirement {
  id: string;
  code: string;
  title: string;
  description?: string;
  guidance?: string;
  isMandatory: boolean;
  status: DrtRequirementStatus;
  dueDate?: string;
  auditProjectId: string;
  auditProject?: AuditProject;
  torClauseId?: string;
  torClause?: {
    id: string;
    clauseNumber: string;
    title: string;
  };
  submissions: DrtSubmission[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllDrtRequirements(
  token: string,
): Promise<DrtRequirement[]> {
  const res = await fetch(`${API_URL}/drt`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch all DRT requirements");
  }
  return data;
}

export async function fetchAuditDrtRequirements(
  token: string,
  auditId: string,
): Promise<DrtRequirement[]> {
  const res = await fetch(`${API_URL}/audits/${auditId}/drt`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch DRT requirements");
  }
  return data;
}

export async function createDrtRequirement(
  token: string,
  auditId: string,
  payload: {
    code: string;
    title: string;
    description?: string;
    guidance?: string;
    isMandatory?: boolean;
    dueDate?: string;
    torClauseId?: string;
  },
): Promise<DrtRequirement> {
  const res = await fetch(`${API_URL}/audits/${auditId}/drt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to create DRT requirement";
    throw new Error(errorMsg);
  }
  return data;
}

export async function updateDrtRequirement(
  token: string,
  id: string,
  payload: Partial<DrtRequirement>,
): Promise<DrtRequirement> {
  const res = await fetch(`${API_URL}/drt/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to update DRT requirement");
  }
  return data;
}

export async function deleteDrtRequirement(
  token: string,
  id: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/drt/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to delete DRT requirement");
  }
  return data;
}

export async function submitDrtEvidence(
  token: string,
  requirementId: string,
  formData: FormData,
): Promise<DrtRequirement> {
  const res = await fetch(`${API_URL}/drt/${requirementId}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to submit evidence";
    throw new Error(errorMsg);
  }
  return data;
}

export async function reviewDrtSubmission(
  token: string,
  requirementId: string,
  decision: ReviewDecision,
  comment: string,
): Promise<DrtRequirement> {
  const res = await fetch(`${API_URL}/drt/${requirementId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ decision, comment }),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to submit review";
    throw new Error(errorMsg);
  }
  return data;
}

export function getEvidenceDownloadUrl(fileId: string): string {
  return `${API_URL}/evidence/${fileId}/download`;
}




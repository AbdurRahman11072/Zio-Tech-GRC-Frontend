export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "auditor" | "auditee" | "company_user";
  companyId?: string | null;
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

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  authStorage,
  loginUser,
  registerUser,
  fetchUserProfile,
  type UserProfile,
} from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    companyId?: string;
    companyName?: string;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = authStorage.getToken();
      const storedUser = authStorage.getUser();

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) setUser(storedUser);

        try {
          const freshUser = await fetchUserProfile(storedToken);
          setUser(freshUser);
          authStorage.setUser(freshUser);
        } catch {
          authStorage.clear();
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const response = await loginUser(credentials);
    setToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    companyId?: string;
    companyName?: string;
  }) => {
    const response = await registerUser(payload);
    setToken(response.accessToken);
    setUser(response.user);
  };

  const refreshProfile = async () => {
    const activeToken = token || authStorage.getToken();
    if (!activeToken) return;
    try {
      const freshUser = await fetchUserProfile(activeToken);
      setUser(freshUser);
      authStorage.setUser(freshUser);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const logout = () => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

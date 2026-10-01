"use client";

import { useAuth } from "@/context/authContext";
import AuthSwitch from "@/components/auth/auth";
import UserDashboard from "@/components/dashboard/userDashboard";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading session...</p>
        </div>
      </main>
    );
  }

  if (user) {
    return <UserDashboard />;
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center">
      <AuthSwitch />
    </main>
  );
}

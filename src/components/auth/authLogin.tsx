"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Loader2, AlertCircle } from "lucide-react";
import AuthSocial from "./authSocial";
import { useAuth } from "@/context/authContext";

interface AuthLoginProps {
  isActive: boolean;
  onSwitchToSignUp?: () => void;
}

export default function AuthLogin({ isActive, onSwitchToSignUp }: AuthLoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`col-start-1 row-start-1 flex flex-col items-center justify-center w-full px-6 sm:px-12 md:px-14 py-6 transition-all duration-700 ease-in-out ${
        isActive
          ? "opacity-100 z-20 pointer-events-auto scale-100"
          : "opacity-0 z-10 pointer-events-none scale-95"
      }`}
    >
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
        Sign in
      </h2>
      <p className="text-sm text-slate-500 mb-4 text-center">
        Enter your credentials to access your audits
      </p>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 flex w-full max-w-[360px] items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="group relative mb-3.5 flex h-13 w-full max-w-[360px] items-center rounded-full bg-slate-100 px-4 transition-all duration-200 border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
        <Mail className="h-5 w-5 shrink-0 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          required
          aria-label="Email"
          disabled={isSubmitting}
          className="w-full bg-transparent px-3 text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Password Field */}
      <div className="group relative mb-5 flex h-13 w-full max-w-[360px] items-center rounded-full bg-slate-100 px-4 transition-all duration-200 border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
        <LockKeyhole className="h-5 w-5 shrink-0 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          aria-label="Password"
          disabled={isSubmitting}
          className="w-full bg-transparent px-3 text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((prev) => !prev)}
          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-44 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 font-semibold uppercase tracking-wider text-xs sm:text-sm text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-500/40 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign in</span>
        )}
      </button>

      {/* Mobile Switch Link */}
      <div className="mt-4 text-xs text-slate-500 md:hidden">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-semibold text-indigo-600 hover:underline"
        >
          Sign up
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <p className="text-xs sm:text-sm text-slate-500 mb-2">Or sign in with social platforms</p>
        <AuthSocial />
      </div>
    </form>
  );
}

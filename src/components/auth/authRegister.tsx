"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";
import AuthSocial from "./authSocial";

interface AuthRegisterProps {
  isActive: boolean;
  onSwitchToSignIn?: () => void;
}

export default function AuthRegister({ isActive, onSwitchToSignIn }: AuthRegisterProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        Create Account
      </h2>
      <p className="text-sm text-slate-500 mb-5 text-center">
        Join Zio Tech GRC for streamlined compliance
      </p>

      {/* Username Field */}
      <div className="group relative mb-3 flex h-12 sm:h-13 w-full max-w-[360px] items-center rounded-full bg-slate-100 px-4 transition-all duration-200 border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
        <User className="h-5 w-5 shrink-0 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type="text"
          placeholder="Full name or username"
          autoComplete="name"
          required
          aria-label="Username"
          className="w-full bg-transparent px-3 text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Email Field */}
      <div className="group relative mb-3 flex h-12 sm:h-13 w-full max-w-[360px] items-center rounded-full bg-slate-100 px-4 transition-all duration-200 border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
        <Mail className="h-5 w-5 shrink-0 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type="email"
          placeholder="Business email"
          autoComplete="email"
          required
          aria-label="Email"
          className="w-full bg-transparent px-3 text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Password Field */}
      <div className="group relative mb-5 flex h-12 sm:h-13 w-full max-w-[360px] items-center rounded-full bg-slate-100 px-4 transition-all duration-200 border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
        <LockKeyhole className="h-5 w-5 shrink-0 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Create password"
          autoComplete="new-password"
          required
          aria-label="Password"
          className="w-full bg-transparent px-3 text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
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
        className="h-12 w-44 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 font-semibold uppercase tracking-wider text-xs sm:text-sm text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-500/40 focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        Sign up
      </button>

      {/* Mobile Switch Link */}
      <div className="mt-4 text-xs text-slate-500 md:hidden">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-semibold text-indigo-600 hover:underline"
        >
          Sign in
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <p className="text-xs sm:text-sm text-slate-500 mb-2">Or register with social platforms</p>
        <AuthSocial />
      </div>
    </form>
  );
}

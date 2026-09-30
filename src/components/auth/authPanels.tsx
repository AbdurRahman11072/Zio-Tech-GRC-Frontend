"use client";

interface AuthPanelsProps {
  isSignUp: boolean;
  onToggle: (signUp: boolean) => void;
}

export default function AuthPanels({ isSignUp, onToggle }: AuthPanelsProps) {
  return (
    <div className="absolute inset-0 hidden md:grid md:grid-cols-2 z-20 pointer-events-none">
      {/* Left Panel - Visible during Sign In mode */}
      <div
        className={`flex flex-col items-center justify-center text-center text-white px-10 lg:px-14 transition-transform duration-700 ease-in-out ${
          isSignUp ? "-translate-x-[800px] pointer-events-none" : "translate-x-0 pointer-events-auto"
        }`}
      >
        <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">
          New here?
        </h3>
        <p className="text-sm text-indigo-100 max-w-xs mb-6 leading-relaxed">
          Join Zio Tech GRC platform today and experience structured, traceable audit workflows.
        </p>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="h-11 w-36 rounded-full border-2 border-white/90 bg-transparent text-sm font-semibold tracking-wider uppercase text-white transition-all duration-300 hover:bg-white/15 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-white"
        >
          Sign up
        </button>
      </div>

      {/* Right Panel - Visible during Sign Up mode */}
      <div
        className={`flex flex-col items-center justify-center text-center text-white px-10 lg:px-14 transition-transform duration-700 ease-in-out ${
          !isSignUp ? "translate-x-[800px] pointer-events-none" : "translate-x-0 pointer-events-auto"
        }`}
      >
        <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">
          One of us?
        </h3>
        <p className="text-sm text-indigo-100 max-w-xs mb-6 leading-relaxed">
          Welcome back! Sign in to access your audit projects, guidelines, and document reviews.
        </p>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="h-11 w-36 rounded-full border-2 border-white/90 bg-transparent text-sm font-semibold tracking-wider uppercase text-white transition-all duration-300 hover:bg-white/15 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-white"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

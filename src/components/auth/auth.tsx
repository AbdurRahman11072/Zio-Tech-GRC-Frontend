"use client";

import { useState } from "react";
import AuthLogin from "./authLogin";
import AuthRegister from "./authRegister";
import AuthPanels from "./authPanels";

export default function AuthSwitch() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 p-4 sm:p-6 font-sans">
      {/* Outer Card */}
      <div className="relative w-full max-w-[960px] min-h-[580px] md:h-[600px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Animated Sliding Circle Background (Desktop) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-[10%] h-[2100px] w-[2100px] -translate-y-1/2 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-indigo-500 z-10 transition-all duration-[1400ms] ease-in-out hidden md:block ${
            isSignUp
              ? "right-[52%] translate-x-full"
              : "right-[48%] translate-x-0"
          }`}
        />

        {/* Forms Container */}
        <div className="absolute inset-0 w-full h-full">
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-full md:w-1/2 grid grid-cols-1 z-20 transition-all duration-1000 ease-in-out ${
              isSignUp
                ? "left-1/2 md:left-1/4 -translate-x-1/2"
                : "left-1/2 md:left-3/4 -translate-x-1/2"
            }`}
          >
            {/* Login Form */}
            <AuthLogin
              isActive={!isSignUp}
              onSwitchToSignUp={() => setIsSignUp(true)}
            />

            {/* Register Form */}
            <AuthRegister
              isActive={isSignUp}
              onSwitchToSignIn={() => setIsSignUp(false)}
            />
          </div>
        </div>

        {/* Sliding Side Panels with Welcome Copy (Desktop) */}
        <AuthPanels isSignUp={isSignUp} onToggle={setIsSignUp} />
      </div>
    </div>
  );
}

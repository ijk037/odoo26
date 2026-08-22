"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { DemoAccountPicker } from "@/components/auth/DemoAccountPicker";
import { Building2, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/unauthorized") ? "/dashboard" : rawCallback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await login(email, password);

    if (!res.success) {
      setError(res.error || "Login failed");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleSelectDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    const res = await login(demoEmail, demoPass);
    if (!res.success) {
      setError(res.error || "Login failed");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="retro-card-static bg-[#FAF7F2] p-6 sm:p-8 shadow-[5px_5px_0px_0px_rgba(21,29,34,1)] space-y-5 font-mono">
      {error && (
        <div className="p-3 bg-[#ffdad6] border-2 border-[#ba1a1a] flex items-start gap-2 text-xs text-[#ba1a1a] font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-[#151D22] uppercase mb-1">Work Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#717971]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@dayflow.com"
              className="block w-full pl-9 pr-3 py-2.5 retro-input text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-[#151D22] uppercase mb-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#717971]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-9 pr-3 py-2.5 retro-input text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full retro-btn-primary py-3 px-4 text-xs font-bold uppercase flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 1-Click Demo Accounts */}
      <div className="pt-2 border-t-2 border-[#151D22]">
        <DemoAccountPicker onSelect={handleSelectDemo} disabled={loading} />
      </div>

      {/* Registration link */}
      <div className="text-center pt-2 text-xs text-[#717971]">
        Need a new workforce account?{" "}
        <Link href="/register" className="font-bold text-[#346645] underline underline-offset-4">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F4EFEA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        {/* Header Logo */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#346645] border-2 border-[#151D22] shadow-[3px_3px_0px_0px_rgba(21,29,34,1)] text-white mb-2">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="font-display-lg text-2xl sm:text-3xl font-extrabold uppercase text-[#151D22] tracking-tight">
            Dayflow HRMS
          </h2>
          <p className="font-mono text-xs text-[#414942]">
            Retro-Tactile Enterprise Human Resource Management Portal
          </p>
        </div>

        <Suspense
          fallback={
            <div className="retro-card p-12 text-center text-[#717971] text-xs font-mono">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#346645] mb-2" />
              Loading login portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

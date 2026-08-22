"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Building2, ShieldCheck, ArrowRight, Lock, Users, CalendarCheck } from "lucide-react";

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">Dayflow</span>
            <span className="text-[10px] ml-1.5 uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              HRMS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/30"
          >
            Register Employee
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8 flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Phase 1 Architecture • Strict Server-Side RBAC & Data Isolation</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          Modern Human Resource Management with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Bulletproof RBAC
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
          Dayflow HRMS provides complete organizational data modeling, real-time attendance tracking, multi-tier leave approval workflows, and automated salary structures with strict role-based access control.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <span>Launch HRMS Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium text-sm px-6 py-3 rounded-xl transition-all"
          >
            <span>Create New Profile</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left w-full">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 w-fit">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Strict Role-Based Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Granular isolation separating Super Admin, HR Leaders, and Employees at database query and middleware levels.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Attendance & Time Logs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated check-in/out calculations, working hours deduction, late arrival detection, and historical calendar tracking.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Leave & Payroll Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Streamlined leave applications, HR multi-tier approval queue with audit logging, and automated salary structures.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        Dayflow HRMS • Enterprise Grade Human Capital Management
      </footer>
    </div>
  );
}

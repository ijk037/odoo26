"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Building2, ShieldCheck, ArrowRight, Lock, Users, CalendarCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#F4EFEA] text-[#151D22] font-mono flex flex-col justify-between selection:bg-[#346645] selection:text-white">
      {/* Navbar */}
      <header className="border-b-2 border-[#151D22] bg-[#FAF7F2] shadow-[0px_3px_0px_0px_rgba(21,29,34,1)] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#346645] border-2 border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] flex items-center justify-center text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display-lg text-xl font-extrabold uppercase tracking-tighter text-[#346645]">
              Dayflow
            </h1>
            <p className="text-[10px] uppercase font-bold text-[#414942] tracking-wider">
              Retro-Tactile HR Systems
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="retro-btn-secondary px-4 py-1.5 text-xs font-bold uppercase"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="retro-btn-primary px-4 py-1.5 text-xs font-bold uppercase"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E6A938] border-2 border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] text-xs font-bold text-[#151D22] uppercase">
          <Sparkles className="w-4 h-4" />
          <span>Retro-Tactile Enterprise HRMS • 16-Bit Cozy Brutalism</span>
        </div>

        <h1 className="font-display-lg text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-[#151D22] max-w-3xl leading-[1.2]">
          Enterprise HR Operations with{" "}
          <span className="bg-[#346645] text-white px-2 py-0.5 border-2 border-[#151D22] shadow-[3px_3px_0px_0px_rgba(21,29,34,1)] inline-block mt-1">
            Tactile Utility
          </span>
        </h1>

        <p className="text-[#414942] text-xs md:text-sm max-w-2xl leading-relaxed">
          Dayflow HRMS transforms workforce administration into an engaging, tactile experience. Featuring GPS geofence time tracking, automated leave quota policies, itemized payslip ledgers, and strict role-based access control.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="retro-btn-primary px-6 py-3 text-xs font-bold uppercase flex items-center gap-2"
          >
            <span>Launch Control Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="retro-btn-secondary px-6 py-3 text-xs font-bold uppercase"
          >
            <span>Create Profile</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left w-full">
          <div className="retro-card p-5 bg-[#FAF7F2] space-y-2">
            <div className="p-2 bg-[#ffdbce] border border-[#151D22] text-[#994621] w-fit">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">Strict RBAC Security</h3>
            <p className="text-xs text-[#414942] leading-relaxed">
              Complete data isolation distinguishing Super Admin, HR Director, and Employee permissions.
            </p>
          </div>

          <div className="retro-card p-5 bg-[#FAF7F2] space-y-2">
            <div className="p-2 bg-[#d6edd9] border border-[#151D22] text-[#346645] w-fit">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">GPS Time Card & Shifts</h3>
            <p className="text-xs text-[#414942] leading-relaxed">
              Browser geolocation verification against headquarters geofences with shift penalty rules and overtime accounting.
            </p>
          </div>

          <div className="retro-card p-5 bg-[#FAF7F2] space-y-2">
            <div className="p-2 bg-[#ffdeac] border border-[#151D22] text-[#7b5500] w-fit">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">Payslip Ledger & Leaves</h3>
            <p className="text-xs text-[#414942] leading-relaxed">
              Dynamic leave balance quota tracking, 2-column itemized paystub reconciliation, and approval inbox.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#151D22] bg-[#FAF7F2] py-4 text-center text-xs font-bold uppercase text-[#717971]">
        Dayflow HRMS • Retro-Tactile Enterprise Systems
      </footer>
    </div>
  );
}

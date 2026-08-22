"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Loader2 } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFEA] flex items-center justify-center p-6 text-[#151D22]">
        <div className="retro-card p-6 max-w-sm w-full text-center space-y-3">
          <div className="w-10 h-10 mx-auto bg-[#346645] border-2 border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] flex items-center justify-center text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <h3 className="font-display-lg text-sm font-bold uppercase">Dayflow HRMS</h3>
          <p className="text-xs font-mono text-[#414942]">Authenticating session credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4EFEA] text-[#151D22]">
      {/* Fixed Retro Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F4EFEA]">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

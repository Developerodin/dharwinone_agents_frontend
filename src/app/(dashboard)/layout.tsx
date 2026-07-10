"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { WebAgentProvider } from "@/components/web-agent/web-agent-context";
import { ROUTES } from "@/lib/constants";
import { getToken, logout } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const token = getToken();

  useEffect(() => {
    if (!token) {
      router.replace(ROUTES.signIn);
    }
  }, [router, token]);

  const handleSignOut = () => {
    logout();
    router.push(ROUTES.signIn);
  };

  if (!token) return null;

  return (
    <WebAgentProvider>
      <div className="min-h-screen bg-bodybg">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onSignOut={handleSignOut}
        />
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main
          className={`pt-[64px] min-h-screen transition-[margin] duration-300 ${
            sidebarCollapsed ? "lg:ms-[72px]" : "lg:ms-[260px]"
          }`}
        >
          <div className="px-4 sm:px-5 lg:px-7 py-5 lg:py-6 max-w-[1480px]">{children}</div>
        </main>
      </div>
    </WebAgentProvider>
  );
}

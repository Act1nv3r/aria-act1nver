"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userInitials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  return (
    <div className="min-h-screen bg-[#060D1A]">
      <header
        className="sticky top-0 z-50 h-[64px] flex items-center justify-between px-6"
        style={{
          background: "rgba(6,13,26,0.85)",
          backdropFilter: "blur(20px) saturate(1.8)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-[8px] flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-sm">A</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[#F0F4FA] font-bold text-sm leading-none">Actinver</span>
            <span className="text-[#C9A84C] text-[10px] tracking-[3px] uppercase leading-none mt-0.5">ArIA</span>
          </div>
        </Link>

        {/* Center: Nav pills (desktop only) */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              pathname?.startsWith("/dashboard") || pathname?.startsWith("/crm")
                ? "font-semibold text-[#F0F4FA] bg-[#1A3154]"
                : "text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-[#1A3154]/50"
            }`}
          >
            Mis Clientes
          </Link>
          {user?.rol === "admin" && (
            <Link
              href="/admin"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                pathname?.startsWith("/admin")
                  ? "font-semibold text-[#F0F4FA] bg-[#1A3154]"
                  : "text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-[#1A3154]/50"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right: User + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1A3154] border border-[#C9A84C]/20 flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-xs">{userInitials}</span>
            </div>
            <span className="text-sm text-[#8B9BB4] font-medium">
              {user?.nombre ?? "Asesor"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[#8B9BB4] hover:text-[#F0F4FA]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

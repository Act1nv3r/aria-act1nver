"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BarChart3, Users, Settings, BookOpen, FileText, Shield, Link2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const nav = [
  { href: "/admin", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/asesores", icon: Users, label: "Asesores" },
  { href: "/admin/parametros", icon: Settings, label: "Parámetros" },
  { href: "/admin/glosario", icon: BookOpen, label: "Glosario" },
  { href: "/admin/auditoria", icon: FileText, label: "Auditoría" },
  { href: "/admin/referrals", icon: Link2, label: "Referrals" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.rol !== "admin") {
      router.replace("/dashboard");
    }
  }, [user?.rol, router]);

  if (user?.rol !== "admin") {
    return (
      <div className="p-8 text-[#5A6A85]">Redirigiendo...</div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside
        className="w-[240px] shrink-0 border-r border-[#5A6A85]/20"
        style={{ backgroundColor: "#1A2433" }}
      >
        <nav className="p-4 space-y-1">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-[family-name:var(--font-poppins)] text-sm transition-colors ${
                pathname === href
                  ? "bg-[#317A70]/30 text-[#E6C78A]"
                  : "text-[#5A6A85] hover:text-white hover:bg-[#314566]/30"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <Link
            href="/admin/aviso-privacidad"
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-[family-name:var(--font-poppins)] text-sm text-[#5A6A85] hover:text-white hover:bg-[#314566]/30 transition-colors"
          >
            <Shield className="h-5 w-5" />
            Aviso privacidad
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

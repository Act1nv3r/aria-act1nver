"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, TrendingUp, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Requerido"),
});

type LoginForm = z.infer<typeof loginSchema>;

const features = [
  {
    icon: Shield,
    text: "Diagnóstico en 6 pasos",
  },
  {
    icon: TrendingUp,
    text: "Motores de cálculo financiero",
  },
  {
    icon: FileText,
    text: "Reportes PDF y Financial Wrapped",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const humanizeError = (msg: string): string => {
    if (msg.toLowerCase().includes("no se pudo conectar")) return msg;
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("401"))
      return "Credenciales incorrectas. Verifica tu email y contraseña.";
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("incorrect"))
      return "Credenciales incorrectas. Verifica tu email y contraseña.";
    if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch"))
      return "No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo.";
    return "Ocurrió un error al iniciar sesión. Intenta de nuevo.";
  };

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (e) {
      setError(humanizeError(e instanceof Error ? e.message : ""));
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060D1A]">

      {/* LEFT PANEL — decorative, hidden on mobile */}
      <div
        className="hidden lg:flex flex-col w-[45%] shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0C1829 0%, #060D1A 60%, #112038 100%)",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Gold orb glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 px-12 pt-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-[10px] flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-base">A</span>
            </div>
            <div>
              <p className="text-[#F0F4FA] font-bold text-sm leading-none">Actinver</p>
              <p className="text-[#C9A84C] text-[10px] tracking-[3px] uppercase leading-none mt-0.5">ArIA</p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col justify-center flex-1 px-12 max-w-sm">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#F0F4FA] leading-tight">
              Tu guía financiera<br />
              <span className="text-[#C9A84C]">inteligente</span>
            </h2>
            <p className="text-sm text-[#8B9BB4] mt-4 leading-relaxed">
              Diagnostica, planifica y protege el patrimonio de tus clientes con precisión y elegancia.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#C9A84C]" />
                </div>
                <span className="text-sm text-[#F0F4FA]/80">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-12 pb-8">
          <p className="text-xs text-[#4A5A72]">© 2025 Actinver</p>
        </div>
      </div>

      {/* RIGHT PANEL — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#060D1A]">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-[10px] flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-base">A</span>
            </div>
            <div>
              <p className="text-[#F0F4FA] font-bold text-sm leading-none">Actinver</p>
              <p className="text-[#C9A84C] text-[10px] tracking-[3px] uppercase leading-none mt-0.5">ArIA</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#F0F4FA] mb-2">
            Bienvenido
          </h1>
          <p className="text-sm text-[#8B9BB4] mb-8">
            Ingresa a tu cuenta de asesor
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            {error && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[10px] px-4 py-3">
                <p className="text-[#EF4444] text-sm font-[family-name:var(--font-poppins)]">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-[#4A5A72]">
            ¿Problemas para ingresar?{" "}
            <span className="text-[#8B9BB4] hover:text-[#C9A84C] cursor-pointer transition-colors">
              Contacta soporte
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

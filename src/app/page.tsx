"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const REFERRAL_KEY = "aria_referral_code";

function persistReferralFromUrl() {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref) sessionStorage.setItem(REFERRAL_KEY, ref);
}

export default function HomePage() {
  const router = useRouter();
  // Subscription ensures persist runs on the client (not only .persist API).
  useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    persistReferralFromUrl();

    let cancelled = false;

    const go = () => {
      if (cancelled) return;
      const hasSession = sessionStorage.getItem("isAuthenticated");
      const authed = useAuthStore.getState().isAuthenticated;
      router.replace(hasSession || authed ? "/dashboard" : "/login");
    };

    const fallback = window.setTimeout(go, 2500);

    void Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      window.clearTimeout(fallback);
      go();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E12]">
      <div className="animate-pulse text-[#5A6A85]">Cargando...</div>
    </div>
  );
}

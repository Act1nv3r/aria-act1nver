import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, setAccessToken, clearAuth } from "@/lib/api-client";

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const res = await api.auth.login(email, password);
        setAccessToken(res.access_token);
        set({
          user: res.user,
          accessToken: res.access_token,
          isAuthenticated: true,
        });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("isAuthenticated", "true");
        }
      },
      logout: () => {
        clearAuth();
        set({ user: null, accessToken: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("isAuthenticated");
          sessionStorage.removeItem("diagnostico-storage");
        }
      },
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const v = sessionStorage.getItem(name);
          if (v) {
            try {
              const parsed = JSON.parse(v);
              if (parsed?.state?.accessToken) {
                setAccessToken(parsed.state.accessToken);
              }
              return { state: parsed?.state ?? parsed, version: parsed?.version };
            } catch {
              return null;
            }
          }
          return null;
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(name);
          }
        },
      },
    }
  )
);

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api, queryClient, session } from "../../lib/api";
import type { User } from "../../lib/types";
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!session.get());
  const [failure, setFailure] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const expired = () => {
      setUser(null);
      queryClient.clear();
    };
    window.addEventListener("session-expired", expired);
    if (session.get())
      api<User>("/auth/me", { signal: controller.signal })
        .then((value) => {
          if (active) setUser(value);
        })
        .catch(() => {
          if (active && session.get()) setFailure(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  async function login(email: string, password: string) {
    const result = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    queryClient.clear();
    session.set(result.token);
    setUser(result.user);
  }
  function logout() {
    toast.dismiss();
    session.set(null);
    queryClient.clear();
    setUser(null);
  }
  if (failure)
    return (
      <div className="fullscreen-state">
        <h1>No se pudo recuperar la sesión</h1>
        <p>Comprueba que el servidor esté disponible.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Volver a intentar
        </button>
      </div>
    );
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}

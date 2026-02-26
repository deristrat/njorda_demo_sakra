import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserRole } from "@/types";

interface ImpersonatingAs {
  username: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  name: string | null;
  userId: number | null;
  advisorId: number | null;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonatingAs: ImpersonatingAs | null;
  effectiveRole: UserRole | null;
  login: (username: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  startImpersonation: (userId: number) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("auth_username"));
  const [role, setRole] = useState<UserRole | null>(() => localStorage.getItem("auth_role") as UserRole | null);
  const [name, setName] = useState<string | null>(() => localStorage.getItem("auth_name"));
  const [userId, setUserId] = useState<number | null>(() => {
    const v = localStorage.getItem("auth_user_id");
    return v ? parseInt(v, 10) : null;
  });
  const [advisorId, setAdvisorId] = useState<number | null>(() => {
    const v = localStorage.getItem("auth_advisor_id");
    return v ? parseInt(v, 10) : null;
  });
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatingAs, setImpersonatingAs] = useState<ImpersonatingAs | null>(null);

  const isAuthenticated = !!token;

  const effectiveRole = isImpersonating && impersonatingAs
    ? impersonatingAs.role
    : role;

  useEffect(() => {
    if (token) localStorage.setItem("auth_token", token);
    else localStorage.removeItem("auth_token");
    if (username) localStorage.setItem("auth_username", username);
    else localStorage.removeItem("auth_username");
    if (role) localStorage.setItem("auth_role", role);
    else localStorage.removeItem("auth_role");
    if (name) localStorage.setItem("auth_name", name);
    else localStorage.removeItem("auth_name");
    if (userId != null) localStorage.setItem("auth_user_id", String(userId));
    else localStorage.removeItem("auth_user_id");
    if (advisorId != null) localStorage.setItem("auth_advisor_id", String(advisorId));
    else localStorage.removeItem("auth_advisor_id");
  }, [token, username, role, name, userId, advisorId]);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsername(data.username);
      setRole(data.role);
      setName(data.name);
      setUserId(data.user_id);
      setAdvisorId(data.advisor_id);
      setIsImpersonating(data.is_impersonating);
      setImpersonatingAs(data.impersonating_as ?? null);
    } catch { /* ignore */ }
  }, [token]);

  // Restore impersonation state on page reload
  useEffect(() => {
    if (token) refreshMe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (user: string, password: string): Promise<UserRole> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password }),
    });
    if (!res.ok) {
      let message = "Inloggningen misslyckades";
      try {
        const body = await res.json();
        if (body.detail) message = body.detail;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    const data = await res.json();
    setToken(data.token);
    setUsername(data.username);
    setRole(data.role);
    setName(data.name);
    setUserId(data.user_id);
    setAdvisorId(data.advisor_id);
    setIsImpersonating(false);
    setImpersonatingAs(null);
    return data.role;
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* ignore */ }
    }
    setToken(null);
    setUsername(null);
    setRole(null);
    setName(null);
    setUserId(null);
    setAdvisorId(null);
    setIsImpersonating(false);
    setImpersonatingAs(null);
  };

  const startImpersonation = async (targetUserId: number) => {
    if (!token) return;
    const res = await fetch("/api/auth/impersonate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: targetUserId }),
    });
    if (!res.ok) throw new Error("Impersonation misslyckades");
    await refreshMe();
  };

  const stopImpersonation = async () => {
    if (!token) return;
    await fetch("/api/auth/stop-impersonation", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await refreshMe();
  };

  return (
    <AuthContext.Provider value={{
      token, username, role, name, userId, advisorId,
      isAuthenticated, isImpersonating, impersonatingAs, effectiveRole,
      login, logout, startImpersonation, stopImpersonation, refreshMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

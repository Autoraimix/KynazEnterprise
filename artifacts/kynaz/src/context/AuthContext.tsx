import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { User, AuthResult, setAuthTokenGetter } from "@workspace/api-client-react";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_CHECK_INTERVAL_MS = 30 * 1000; // check every 30 seconds

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  idleWarning: boolean;
  login: (auth: AuthResult) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  resetIdle: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [idleWarning, setIdleWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("kynaz_token");
    const storedUser = localStorage.getItem("kynaz_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }

    setAuthTokenGetter(() => localStorage.getItem("kynaz_token"));
    setIsLoading(false);
  }, []);

  // AFK idle tracking
  useEffect(() => {
    if (!user) {
      setIdleWarning(false);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      return;
    }

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleWarning(false);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));

    idleTimerRef.current = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= IDLE_TIMEOUT_MS) {
        // Auto-logout
        setUser(null);
        setToken(null);
        localStorage.removeItem("kynaz_token");
        localStorage.removeItem("kynaz_user");
        setIdleWarning(false);
        window.location.href = "/login?reason=idle";
      } else if (idle >= IDLE_TIMEOUT_MS - 60_000) {
        // Warn 1 minute before
        setIdleWarning(true);
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [user]);

  const login = (auth: AuthResult) => {
    setUser(auth.user);
    setToken(auth.token);
    localStorage.setItem("kynaz_token", auth.token);
    localStorage.setItem("kynaz_user", JSON.stringify(auth.user));
    lastActivityRef.current = Date.now();
    setIdleWarning(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("kynaz_user", JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("kynaz_token");
    localStorage.removeItem("kynaz_user");
    setIdleWarning(false);
  };

  const resetIdle = () => {
    lastActivityRef.current = Date.now();
    setIdleWarning(false);
  };

  const isAdmin = () => user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = () => user?.role === "superadmin";

  return (
    <AuthContext.Provider value={{ user, token, isLoading, idleWarning, login, logout, updateUser, resetIdle, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthResult, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (auth: AuthResult) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("kynaz_token");
    const storedUser = localStorage.getItem("kynaz_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // ignore parse error
      }
    }
    
    // Set the custom fetch auth token getter
    setAuthTokenGetter(() => localStorage.getItem("kynaz_token"));
    
    setIsLoading(false);
  }, []);

  const login = (auth: AuthResult) => {
    setUser(auth.user);
    setToken(auth.token);
    localStorage.setItem("kynaz_token", auth.token);
    localStorage.setItem("kynaz_user", JSON.stringify(auth.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("kynaz_token");
    localStorage.removeItem("kynaz_user");
  };

  const isAdmin = () => {
    return user?.role === "admin" || user?.role === "superadmin";
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

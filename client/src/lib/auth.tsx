import * as React from "react";
import { apiRequest } from "./queryClient";

interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string | null;
  role: "admin" | "financial" | "viewer";
  status?: string | null;
  team?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, fullName: string, role?: string, team?: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const checkAuth = React.useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = React.useCallback(async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    setUser(data.user);
  }, []);

  const logout = React.useCallback(async () => {
    await apiRequest("POST", "/api/auth/logout");
    sessionStorage.removeItem('dashboard_popup_shown');
    setUser(null);
  }, []);

  const register = React.useCallback(async (username: string, email: string, password: string, fullName: string, role?: string, team?: string) => {
    const response = await apiRequest("POST", "/api/auth/register", { username, email, password, fullName, role, team });
    const data = await response.json();
    setUser(data.user);
  }, []);

  React.useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, 10 * 60 * 1000); // 10 minutes (600,000 ms)
    };

    // Active events that reset the timer
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer start
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

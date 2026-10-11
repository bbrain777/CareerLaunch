import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  currentRole?: string;
  targetRole?: string;
  weeklyGoal?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  refreshToken: () => Promise<string | null>;
}

const TOKEN_KEY = "careerlaunch_token";
const USER_KEY = "careerlaunch_user";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem(USER_KEY);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    void queryClient.invalidateQueries();
  }, [queryClient]);

  const logout = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : undefined,
      });
    } catch {
      // Best-effort remote call
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const updateUser = useCallback((updated: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return null;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          setUser(data.user);
        }
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            setUser(data.user);
          }
        } else if (res.status === 401) {
          // Attempt token refresh on initial expired session
          const refreshed = await refreshToken();
          if (!refreshed) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      } catch {
        // Keep cached user if offline
      } finally {
        setLoading(false);
      }
    };

    void verifySession();
  }, [refreshToken]);

  // Periodic background token refresh before expiry
  useEffect(() => {
    if (!token) return;

    // Refresh every 45 minutes (session token expires in 1h)
    const REFRESH_INTERVAL_MS = 45 * 60 * 1000;
    const intervalId = setInterval(() => {
      void refreshToken();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [token, refreshToken]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

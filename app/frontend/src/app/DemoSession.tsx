import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  setUnauthorizedHandler,
  type DemoUser,
} from "@/services/api";

export interface SignInResult {
  ok: boolean;
  error?: string;
}

interface DemoSession {
  user: DemoUser | null;
  loading: boolean;
  signIn: (login: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<DemoUser | null>;
}

const SessionContext = createContext<DemoSession | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<DemoUser | null> => {
    try {
      const { user: activeUser } = await getMe();
      setUser(activeUser);
      return activeUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { user: activeUser } = await getMe();
        if (active) setUser(activeUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (userLogin: string, password: string): Promise<SignInResult> => {
      try {
        const { user: loggedUser } = await apiLogin(userLogin, password);
        setUser(loggedUser);
        return { ok: true };
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "No fue posible iniciar sesión. Intenta nuevamente.";
        return { ok: false, error: message };
      }
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await apiLogout();
    } catch {
      // Clear local session state even if network call fails.
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useDemoSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Se requiere DemoSessionProvider");
  return session;
}

export function useCurrentUser() {
  const { user } = useDemoSession();
  if (!user) throw new Error("Se requiere una sesión activa");
  return user;
}

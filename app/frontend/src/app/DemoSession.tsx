import { createContext, useContext, useState, type ReactNode } from "react";
import { demoUsers, type DemoUser } from "@/data/demo";

const key = "stt-one-demo-account";

function restoreAccount() {
  try {
    const login = sessionStorage.getItem(key);
    return demoUsers.find((account) => account.login === login) ?? null;
  } catch {
    return null;
  }
}

interface DemoSession {
  user: DemoUser | null;
  signIn: (login: string, password: string) => boolean;
  signOut: () => void;
}

const SessionContext = createContext<DemoSession | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(restoreAccount);

  function update(account: DemoUser | null) {
    if (account) sessionStorage.setItem(key, account.login);
    else sessionStorage.removeItem(key);
    setUser(account);
  }

  function signIn(login: string, password: string) {
    const account = demoUsers.find((candidate) => candidate.login === login);
    if (!account || password !== "Demo-One-2026") return false;
    update(account);
    return true;
  }

  return <SessionContext.Provider value={{ user, signIn, signOut: () => update(null) }}>{children}</SessionContext.Provider>;
}

export function useDemoSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Se requiere DemoSessionProvider");
  return session;
}

export function useCurrentUser() {
  const { user } = useDemoSession();
  if (!user) throw new Error("Se requiere una sesión de demostración");
  return user;
}

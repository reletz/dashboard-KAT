import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { DEMO_MODE, loginRequest } from "./msalConfig";

type AuthUser = { name: string; email: string };

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  demo: boolean;
  login: () => void;
  logout: () => void;
  /** id_token Microsoft untuk dikirim ke API (Bearer). null kalau demo/belum login. */
  getToken: () => Promise<string | null>;
};

/** Context khusus mode demo (POC tanpa Azure). */
const DemoContext = createContext<{
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
} | null>(null);

const DEMO_KEY = "kat-demo-user";

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const raw = sessionStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  const setUser = (u: AuthUser | null) => {
    if (u) sessionStorage.setItem(DEMO_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(DEMO_KEY);
    setUserState(u);
  };

  return (
    <DemoContext.Provider value={{ user, setUser }}>
      {children}
    </DemoContext.Provider>
  );
}

/**
 * Satu hook untuk dua dunia: MSAL (production) & demo (POC).
 * Kedua set hook dipanggil tanpa syarat agar patuh rules-of-hooks;
 * cabang hanya di nilai balik.
 */
export function useAuth(): AuthState {
  const msalAuthed = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const demoCtx = useContext(DemoContext);
  const acct = accounts[0];

  // getToken di-useCallback supaya stabil → useApi()/useEffect tidak loop.
  const getMsalToken = useCallback(async () => {
    if (!acct) return null;
    try {
      const res = await instance.acquireTokenSilent({ ...loginRequest, account: acct });
      return res.idToken;
    } catch {
      return null;
    }
  }, [instance, acct]);
  const getDemoToken = useCallback(async () => null, []);

  if (DEMO_MODE) {
    return {
      isAuthenticated: !!demoCtx?.user,
      user: demoCtx?.user ?? null,
      demo: true,
      login: () =>
        demoCtx?.setUser({
          name: "Panitia Demo",
          email: "demo@mahasiswa.itb.ac.id",
        }),
      logout: () => demoCtx?.setUser(null),
      getToken: getDemoToken,
    };
  }

  return {
    isAuthenticated: msalAuthed,
    user: acct ? { name: acct.name ?? acct.username, email: acct.username } : null,
    demo: false,
    login: () => void instance.loginPopup(loginRequest),
    logout: () => void instance.logoutPopup(),
    getToken: getMsalToken,
  };
}

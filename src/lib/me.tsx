import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useApi, ApiError } from "./api";
import type { Me } from "./types";

type MeState = {
  me: Me | null;
  /** ring 1 = boleh menulis & lihat kanban/admin. */
  canWrite: boolean;
  ring: number | null;
  loading: boolean;
  /** status & pesan error dari /me (mis. 403 = belum terdaftar). */
  error: { status: number; message: string } | null;
};

const Ctx = createContext<MeState | null>(null);

/** Ambil /me sekali di atas, sediakan ke seluruh app. Gerbang akses STRICT
 *  ditangani di AuthGuard berdasar state ini. */
export function MeProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [state, setState] = useState<MeState>({
    me: null,
    canWrite: false,
    ring: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    api
      .getMe()
      .then((me) => {
        if (live) setState({ me, canWrite: me.ring === 1, ring: me.ring, loading: false, error: null });
      })
      .catch((e) => {
        if (!live) return;
        const status = e instanceof ApiError ? e.status : 0;
        setState({
          me: null,
          canWrite: false,
          ring: null,
          loading: false,
          error: { status, message: e?.message ?? "Gagal memuat profil" },
        });
      });
    return () => {
      live = false;
    };
  }, [api]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useMe(): MeState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMe harus di dalam <MeProvider>");
  return v;
}

import type { ReactNode } from "react";
import { useAuth } from "./useAuth";
import { ALLOWED_DOMAINS } from "./msalConfig";
import { MeProvider, useMe } from "../lib/me";

function MicrosoftLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 23 23" className={className} aria-hidden>
      <path fill="#F25022" d="M0 0h11v11H0z" />
      <path fill="#7FBA00" d="M12 0h11v11H12z" />
      <path fill="#00A4EF" d="M0 12h11v11H0z" />
      <path fill="#FFB900" d="M12 12h11v11H12z" />
    </svg>
  );
}

function LoginScreen() {
  const { login, demo } = useAuth();

  return (
    <main className="kat-backdrop relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 z-0 bg-forest-900/10 backdrop-blur-[1px]" />

      <div className="relative z-20 w-full max-w-md animate-fade-up">
        <div className="glass-panel rounded-4xl p-7 sm:p-9">
          {/* Brand lockup */}
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-leaf/40 bg-leaf/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-mint-deep">
              Portal Internal
            </span>
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-mint-deep">
              Panitia
            </h2>
            <h1 className="font-display text-4xl font-extrabold leading-none text-cream sm:text-[2.75rem]">
              KAT ITB 2026
            </h1>
            <div className="mt-4 h-1.5 w-16 rounded-full bg-leaf" />
          </div>

          <p className="mb-7 text-center text-sm leading-relaxed text-mint-deep/90">
            Satu pintu masuk ke semua kebutuhan kepanitiaan — request links,
            kanban rakoor, kontak, dan pengumuman SC.
          </p>

          <button
            onClick={login}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-leaf-button px-4 py-3.5 font-extrabold tracking-wide text-forest-800 transition duration-200 hover:bg-leaf-bright active:scale-[0.98]"
          >
            <MicrosoftLogo className="h-5 w-5" />
            <span>Login dengan Microsoft ITB</span>
            <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
          </button>

          <div className="mt-6 flex items-center gap-3 text-[11px] text-mint-deep/70">
            <span className="h-px flex-1 bg-forest-600/60" />
            <span className="font-medium uppercase tracking-wider">
              Akses terbatas
            </span>
            <span className="h-px flex-1 bg-forest-600/60" />
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-mint-deep/60">
            Hanya untuk akun{" "}
            <span className="font-mono text-mint-deep/90">@itb.ac.id</span>.
            Konten internal tidak dapat diakses peserta meski link tersebar.
          </p>

          {demo && (
            <p className="mt-5 rounded-lg border border-cream/30 bg-cream/10 px-3 py-2 text-center text-[11px] font-medium text-cream/90">
              🌱 Mode demo aktif — klik tombol untuk masuk tanpa Azure.
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-xs font-medium text-forest-800/70">
          KAT ITB 2026
        </p>
      </div>
    </main>
  );
}

function ForbiddenScreen({
  email,
  title,
  message,
}: {
  email: string;
  title: string;
  message: ReactNode;
}) {
  const { logout } = useAuth();
  return (
    <main className="kat-backdrop relative flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel relative z-20 max-w-sm rounded-4xl p-8 text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-2xl">
          🚫
        </div>
        <h1 className="font-display text-xl font-bold text-cream">{title}</h1>
        <p className="mt-2 text-sm text-mint-deep/80">
          <span className="font-mono">{email}</span> {message}
        </p>
        <button
          onClick={logout}
          className="mt-6 rounded-lg bg-leaf-button px-5 py-2.5 text-sm font-bold text-forest-800 transition hover:bg-leaf-bright"
        >
          Logout
        </button>
      </div>
    </main>
  );
}

function Splash() {
  return (
    <main className="kat-backdrop relative flex min-h-screen items-center justify-center">
      <div className="glass-panel rounded-4xl px-8 py-6 text-sm font-medium text-mint-deep/80 animate-fade-in">
        Memuat portal…
      </div>
    </main>
  );
}

/** Gerbang STRICT: setelah login, /me menentukan boleh masuk atau belum terdaftar. */
function MeGate({ email, children }: { email: string; children: ReactNode }) {
  const { loading, error } = useMe();
  if (loading) return <Splash />;
  if (error) {
    const notRegistered = error.status === 403;
    return (
      <ForbiddenScreen
        email={email}
        title={notRegistered ? "Belum terdaftar" : "Tidak bisa masuk"}
        message={
          notRegistered ? (
            <>belum terdaftar sebagai panitia. Hubungi Bidang IT / kepala bidangmu untuk didaftarkan.</>
          ) : (
            <>tidak bisa diverifikasi ({error.message}). Coba logout lalu login ulang.</>
          )
        }
      />
    );
  }
  return <>{children}</>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, demo } = useAuth();

  if (!isAuthenticated || !user) return <LoginScreen />;

  // Cek domain dulu (UX cepat) untuk MSAL nyata; demo selalu lolos.
  if (!demo) {
    const ok = ALLOWED_DOMAINS.some((d) => user.email.toLowerCase().endsWith(d));
    if (!ok) {
      return (
        <ForbiddenScreen
          email={user.email}
          title="Akun tidak diizinkan"
          message={<>bukan akun ITB. Portal ini khusus panitia dengan akun @mahasiswa.itb.ac.id.</>}
        />
      );
    }
  }

  // Akses final ditentukan server (tabel users). MeProvider mengambil /me.
  return (
    <MeProvider>
      <MeGate email={user.email}>{children}</MeGate>
    </MeProvider>
  );
}

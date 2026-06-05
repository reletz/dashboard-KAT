import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useMe } from "../lib/me";
import config from "../content/config.json";

const navItems = [
  { to: "/", label: "Beranda", end: true },
  { to: "/links", label: "Request Links" },
  { to: "/kalender", label: "Kalender" },
  { to: "/kanban", label: "Kanban Rakoor", ring1: true },
  { to: "/admin", label: "Kelola Panitia", ring1: true },
];

function LeafMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#49DEA7" />
      <path
        d="M23 7c-7 0-12 4-12 11 0 2 .6 3.7 1.6 5.1C10 25 8.5 26 8.5 26s1.8-.2 3.4-1.4C13.4 25.5 15 26 17 26c7 0 8-7 8-13 0-2.4-1.2-6-2-6z"
        fill="#182F53"
      />
    </svg>
  );
}

function NavLinks({ onClick, ring1Ok }: { onClick?: () => void; ring1Ok: boolean }) {
  return (
    <>
      {navItems
        .filter((item) => !item.ring1 || ring1Ok)
        .map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClick}
          className={({ isActive }) =>
            `relative rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-leaf/15 text-leaf"
                : "text-mint-deep/80 hover:bg-white/5 hover:text-mint-deep"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { canWrite } = useMe();
  const [open, setOpen] = useState(false);
  const initials = (user?.name ?? "P")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className="kat-backdrop relative min-h-screen">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-4">
        <nav className="glass-panel-soft mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-3 py-2.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <LeafMark />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-cream">
                Portal Panitia
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-mint-deep/70">
                KAT ITB 2026
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <NavLinks ring1Ok={canWrite} />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2.5 rounded-full bg-forest-900/40 py-1 pl-1 pr-3 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf text-[11px] font-bold text-forest-800">
                {initials}
              </span>
              <span className="max-w-[140px] truncate text-xs font-medium text-mint-deep">
                {user?.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-forest-600/60 px-3 py-1.5 text-xs font-semibold text-mint-deep/80 transition hover:border-red-400/60 hover:text-red-300"
            >
              Logout
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-mint-deep md:hidden"
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d={open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"} />
              </svg>
            </button>
          </div>
        </nav>

        {open && (
          <div className="glass-panel-soft mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl p-2 md:hidden">
            <NavLinks ring1Ok={canWrite} onClick={() => setOpen(false)} />
          </div>
        )}
      </header>

      <main className="relative z-20 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="relative z-20 mx-auto max-w-6xl px-6 py-8 text-center text-xs font-medium text-forest-800/60">
        {config.eventName} · dibuat oleh Bidang IT
      </footer>
    </div>
  );
}

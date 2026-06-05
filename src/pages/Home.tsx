import { Link } from "react-router-dom";
import { Countdown } from "../components/Countdown";
import { Timeline } from "../components/Timeline";
import { Announcements } from "../components/Announcements";
import { useAuth } from "../auth/useAuth";
import config from "../content/config.json";
import links from "../content/links.json";

export function Home() {
  const { user } = useAuth();
  const firstName = (user?.name ?? "Panitia").split(" ")[0];

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <p className="text-sm font-medium text-forest-800/70">
          Halo, selamat datang kembali 🌿
        </p>
        <h1 className="font-display text-3xl font-extrabold text-forest-800 sm:text-4xl">
          Hai, {firstName}!
        </h1>
      </header>

      <div className="grid gap-4 animate-fade-up [animation-delay:80ms] lg:grid-cols-2">
        {config.countdowns.map((c) => (
          <Countdown key={c.label} target={c.date} label={`Menuju ${c.label}`} />
        ))}
      </div>

      <section className="animate-fade-up [animation-delay:120ms]">
        <Timeline />
      </section>

      <Announcements limit={6} />

      <section className="animate-fade-up [animation-delay:240ms]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-forest-800">
            Request per Bidang
          </h2>
          <Link
            to="/links"
            className="text-sm font-semibold text-forest-700 transition hover:text-leaf-button"
          >
            Buka semua →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((b) => {
            const comingSoon = b.status === "coming-soon";
            const count = b.sheets.length;
            return (
              <Link
                key={b.bidang}
                to={`/links?b=${encodeURIComponent(b.bidang)}`}
                className={`glass-panel-soft group rounded-2xl p-4 transition ${
                  comingSoon ? "opacity-60" : "hover:border-leaf/50"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">{b.icon}</span>
                  {comingSoon ? (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-mint-deep/60">
                      menyusul
                    </span>
                  ) : (
                    <span className="text-mint-deep/40 transition group-hover:text-leaf">
                      →
                    </span>
                  )}
                </div>
                <p className="font-semibold text-mint-deep group-hover:text-leaf">
                  {b.bidang}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-mint-deep/50">
                  {comingSoon ? "segera" : `${count} sheet`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

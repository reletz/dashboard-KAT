import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import links from "../content/links.json";

/** Ubah link /edit Google Sheets jadi URL embed read-only yang aman di-iframe. */
function toEmbedUrl(url: string): string {
  const id = url.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
  return id ? `https://docs.google.com/spreadsheets/d/${id}/preview` : url;
}

const active = links.filter((b) => b.status === "active");

export function Links() {
  const [params, setParams] = useSearchParams();
  const fromParam = links.findIndex(
    (b) => b.bidang.toLowerCase() === (params.get("b") ?? "").toLowerCase(),
  );
  const [selected, setSelected] = useState(
    fromParam >= 0 ? fromParam : links.indexOf(active[0]),
  );

  const current = links[selected];

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-extrabold text-forest-800">
          Request Links
        </h1>
        <p className="mt-1 text-sm text-forest-800/70">
          Pilih bidang — sheet request-nya langsung tampil di sini. Tidak perlu
          nyari link di grup.
        </p>
      </header>

      {/* Selector bidang */}
      <div className="flex flex-wrap gap-2 animate-fade-up [animation-delay:60ms]">
        {links.map((b, i) => {
          const isComingSoon = b.status === "coming-soon";
          const isSel = i === selected;
          return (
            <button
              key={b.bidang}
              disabled={isComingSoon}
              onClick={() => {
                setSelected(i);
                setParams({ b: b.bidang }, { replace: true });
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isSel
                  ? "glass-panel text-cream"
                  : isComingSoon
                    ? "cursor-not-allowed border border-forest-800/15 bg-white/30 text-forest-800/40"
                    : "border border-forest-800/15 bg-white/50 text-forest-800/80 hover:bg-white/80"
              }`}
            >
              <span>{b.icon}</span>
              <span>{b.bidang}</span>
              {isComingSoon && (
                <span className="rounded bg-forest-800/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  menyusul
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Konten bidang terpilih */}
      <div key={current.bidang} className="space-y-4 animate-fade-up">
        {current.note && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-cream/50 bg-cream/30 px-4 py-3 text-sm text-forest-800">
            <span className="mt-0.5">⚠️</span>
            <p className="font-medium leading-relaxed">{current.note}</p>
          </div>
        )}

        {current.sheets.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center rounded-4xl p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf/15 text-2xl">
              🌱
            </div>
            <p className="font-display text-lg font-bold text-cream">
              Belum tersedia
            </p>
            <p className="mt-1 text-sm text-mint-deep/70">
              Sheet request {current.bidang} menyusul.
            </p>
          </div>
        ) : (
          current.sheets.map((sheet) => (
            <section key={sheet.url} className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-forest-800">
                  {sheet.label}
                </h2>
                <a
                  href={sheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-leaf-button px-3.5 py-2 text-sm font-bold text-forest-800 transition hover:bg-leaf-bright"
                >
                  Buka & isi di Sheets
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              </div>
              <div className="glass-panel overflow-hidden rounded-2xl p-1.5">
                <iframe
                  src={toEmbedUrl(sheet.url)}
                  className="h-[60vh] min-h-[420px] w-full rounded-xl bg-white"
                  title={sheet.label}
                  loading="lazy"
                />
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

import config from "../content/config.json";
import { Timeline } from "../components/Timeline";

export function Calendar() {
  const url = (config as { gcalEmbedUrl?: string }).gcalEmbedUrl ?? "";

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-extrabold text-forest-800 sm:text-4xl">
          Kalender &amp; Linimasa
        </h1>
        <p className="mt-1 text-sm text-forest-800/70">
          Jadwal operasional (Google Calendar) &amp; milestone besar menuju OSKM &amp; OHU.
        </p>
      </header>

      <section className="animate-fade-up [animation-delay:80ms]">
        {url ? (
          <iframe
            src={url}
            className="h-[70vh] w-full rounded-4xl border-2 border-forest-600/40 bg-white shadow-glass"
            title="Kalender KAT ITB 2026"
            style={{ borderWidth: 0 }}
          />
        ) : (
          <div className="glass-panel flex flex-col items-center justify-center rounded-4xl p-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf/15 text-3xl">
              📅
            </div>
            <h2 className="font-display text-lg font-bold text-cream">
              Google Calendar belum dikonfigurasi
            </h2>
            <p className="mt-2 max-w-md text-sm text-mint-deep/70">
              Tim IT: buat kalender Google &quot;KAT ITB 2026&quot; → Settings → <em>Integrate
              calendar</em> → salin <span className="font-mono text-leaf">Embed code</span> UR-nya ke{" "}
              <code className="rounded bg-forest-900/50 px-1.5 py-0.5 font-mono text-leaf">
                gcalEmbedUrl
              </code>{" "}
              di{" "}
              <code className="rounded bg-forest-900/50 px-1.5 py-0.5 font-mono text-leaf">
                config.json
              </code>
              . Pastikan kalender di-share publik (read-only).
            </p>
          </div>
        )}
      </section>

      <section className="animate-fade-up [animation-delay:160ms]">
        <Timeline editable />
      </section>
    </div>
  );
}

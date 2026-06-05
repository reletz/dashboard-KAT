import { useState } from "react";
import { useTimeline, useMe } from "../lib/hooks";
import type { TimelineItem } from "../lib/types";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

/**
 * Linimasa milestone (DB-backed). `editable` + ring 1 → bisa tambah/ubah/hapus.
 * State visual (lewat/aktif/akan datang) diturunkan dari tanggal.
 */
export function Timeline({ editable = false }: { editable?: boolean }) {
  const { items, loading, error, create, update, remove } = useTimeline();
  const { canWrite } = useMe();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const canEdit = editable && canWrite;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sorted = [...items].sort((a, b) => (a.date < b.date ? -1 : 1));
  const activeIdx = sorted.findIndex((m) => new Date(m.date) >= today);

  return (
    <div className="glass-panel rounded-4xl p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-mint-deep">Linimasa</p>
          <h2 className="mt-1 font-display text-xl font-bold text-cream sm:text-2xl">
            Menuju OSKM &amp; OHU 2026
          </h2>
        </div>
        {canEdit && !adding && (
          <button
            onClick={() => {
              setAdding(true);
              setEditId(null);
            }}
            className="shrink-0 rounded-lg bg-leaf-button px-3 py-1.5 text-xs font-bold text-forest-800 transition hover:bg-leaf-bright"
          >
            + Milestone
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">{error}</p>
      )}

      {adding && (
        <div className="mb-5">
          <Editor onCancel={() => setAdding(false)} onSave={async (i) => { await create(i); setAdding(false); }} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-mint-deep/60">Memuat linimasa…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-mint-deep/60">Belum ada milestone.</p>
      ) : (
        <ol className="relative ml-2 space-y-6 border-l border-forest-600/50 pl-6">
          {sorted.map((m, i) => {
            const past = activeIdx === -1 ? true : i < activeIdx;
            const active = i === activeIdx;
            if (editId === m.id) {
              return (
                <li key={m.id}>
                  <Editor
                    initial={m}
                    onCancel={() => setEditId(null)}
                    onSave={async (input) => {
                      await update(m.id, input);
                      setEditId(null);
                    }}
                  />
                </li>
              );
            }
            return (
              <li key={m.id} className="group relative">
                <span
                  className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    active
                      ? "border-leaf bg-leaf shadow-leaf-glow"
                      : past
                        ? "border-forest-600 bg-forest-600"
                        : "border-forest-600/70 bg-forest-900"
                  }`}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-forest-800" />}
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3
                    className={`font-display text-base font-bold ${
                      active ? "text-leaf" : past ? "text-mint-deep/60" : "text-cream"
                    }`}
                  >
                    {m.label}
                  </h3>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mint-deep/50">
                    {fmt(m.date)}
                  </span>
                  {active && (
                    <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-leaf">
                      berikutnya
                    </span>
                  )}
                  {canEdit && (
                    <span className="ml-auto flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => { setEditId(m.id); setAdding(false); }} className="text-mint-deep/50 hover:text-leaf" aria-label="Edit">✎</button>
                      <button onClick={() => confirm("Hapus milestone ini?") && remove(m.id)} className="text-mint-deep/50 hover:text-red-300" aria-label="Hapus">✕</button>
                    </span>
                  )}
                </div>
                {m.description && (
                  <p className="mt-1 text-sm leading-relaxed text-mint-deep/70">{m.description}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Editor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TimelineItem;
  onSave: (i: { label: string; date: string; description?: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const field =
    "rounded-lg bg-forest-900/50 px-2.5 py-1.5 text-sm text-cream outline-none ring-1 ring-forest-600/50 focus:ring-leaf/50";

  const save = async () => {
    if (!label.trim() || !date) return;
    setSaving(true);
    try {
      await onSave({ label: label.trim(), date, description: description.trim() || null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel-soft rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nama milestone" className={`${field} flex-1 font-semibold`} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Deskripsi (opsional)" className={`${field} w-full resize-none`} />
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-mint-deep/70 hover:text-mint-deep">Batal</button>
        <button onClick={save} disabled={saving} className="rounded-lg bg-leaf-button px-3.5 py-1.5 text-xs font-bold text-forest-800 transition hover:bg-leaf-bright disabled:opacity-50">
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { AnnouncementCard } from "./AnnouncementCard";
import { useAnnouncements, useMe } from "../lib/hooks";
import type { Announcement, AnnouncementInput } from "../lib/types";

const TAGS = ["info", "deadline", "rakoor"];

export function Announcements({ limit }: { limit?: number }) {
  const { items, loading, error, create, update, remove } = useAnnouncements();
  const { canWrite } = useMe();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const shown = limit ? items.slice(0, limit) : items;

  return (
    <section className="animate-fade-up [animation-delay:160ms]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-forest-800">Pengumuman</h2>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="rounded-full bg-forest-800/10 px-2.5 py-0.5 text-xs font-semibold text-forest-800/70">
              {items.length} total
            </span>
          )}
          {canWrite && !adding && (
            <button
              onClick={() => {
                setAdding(true);
                setEditId(null);
              }}
              className="rounded-lg bg-forest-800 px-3 py-1 text-xs font-bold text-cream transition hover:bg-forest-700"
            >
              + Pengumuman
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">
          {error}
        </p>
      )}

      {adding && (
        <div className="mb-3">
          <Editor
            onCancel={() => setAdding(false)}
            onSave={async (input) => {
              await create(input);
              setAdding(false);
            }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-forest-800/60">Memuat pengumuman…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-forest-800/60">Belum ada pengumuman.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) =>
            editId === item.id ? (
              <Editor
                key={item.id}
                initial={item}
                onCancel={() => setEditId(null)}
                onSave={async (input) => {
                  await update(item.id, input);
                  setEditId(null);
                }}
              />
            ) : (
              <AnnouncementCard
                key={item.id}
                item={item}
                actions={
                  canWrite ? (
                    <>
                      <button
                        onClick={() => {
                          setEditId(item.id);
                          setAdding(false);
                        }}
                        className="rounded bg-forest-900/60 px-1.5 text-mint-deep/70 hover:text-leaf"
                        aria-label="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => confirm("Hapus pengumuman ini?") && remove(item.id)}
                        className="rounded bg-forest-900/60 px-1.5 text-mint-deep/70 hover:text-red-300"
                        aria-label="Hapus"
                      >
                        ✕
                      </button>
                    </>
                  ) : undefined
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

function Editor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Announcement;
  onSave: (input: AnnouncementInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [fromWho, setFromWho] = useState(initial?.fromWho ?? "SC");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !body.trim() || !fromWho.trim()) return;
    setSaving(true);
    try {
      await onSave({ fromWho: fromWho.trim(), tag: tag || null, title: title.trim(), body: body.trim(), date });
    } finally {
      setSaving(false);
    }
  };

  const field = "rounded-lg bg-forest-900/50 px-2.5 py-1.5 text-sm text-cream outline-none ring-1 ring-forest-600/50 focus:ring-leaf/50";

  return (
    <div className="glass-panel-soft rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <input
          value={fromWho}
          onChange={(e) => setFromWho(e.target.value)}
          placeholder="Dari (mis. SC)"
          className={`${field} w-28`}
        />
        <select value={tag} onChange={(e) => setTag(e.target.value)} className={`${field} w-32`}>
          <option value="">tanpa tag</option>
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${field} flex-1`}
        />
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul"
        className={`${field} mb-2 w-full font-semibold`}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Isi pengumuman…"
        className={`${field} w-full resize-none`}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-mint-deep/70 hover:text-mint-deep"
        >
          Batal
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-leaf-button px-3.5 py-1.5 text-xs font-bold text-forest-800 transition hover:bg-leaf-bright disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>
  );
}

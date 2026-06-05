import { useState } from "react";
import { useUsers, useMe } from "../lib/hooks";
import type { User, UserInput } from "../lib/types";

const RING_LABEL: Record<number, string> = {
  1: "Ring 1 · Kepala/Wakil Bidang",
  2: "Ring 2 · Kepala/Wakil Divisi · Koord",
  3: "Ring 3 · Anggota",
};
const ringPill: Record<number, string> = {
  1: "bg-leaf/15 text-leaf",
  2: "bg-cream/15 text-cream",
  3: "bg-white/10 text-mint-deep/70",
};

export function Admin() {
  const { items, loading, error, create, update, remove } = useUsers();
  const { me } = useMe();
  const [adding, setAdding] = useState(false);
  const [editEmail, setEditEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const wrap = (fn: () => Promise<void>) => async () => {
    setFormError(null);
    try {
      await fn();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-forest-800 sm:text-4xl">
            Kelola Panitia &amp; Role
          </h1>
          <p className="mt-1 text-sm text-forest-800/70">
            Hanya NIM/akun yang terdaftar di sini yang bisa masuk portal. Ring menentukan akses.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setEditEmail(null); }}
            className="rounded-lg bg-forest-800 px-4 py-2 text-sm font-bold text-cream transition hover:bg-forest-700"
          >
            + Tambah panitia
          </button>
        )}
      </header>

      {(error || formError) && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">
          {formError ?? error}
        </p>
      )}

      {adding && (
        <Editor
          onCancel={() => setAdding(false)}
          onSave={async (i) => {
            await create(i);
            setAdding(false);
          }}
        />
      )}

      <div className="glass-panel overflow-hidden rounded-4xl animate-fade-up [animation-delay:80ms]">
        {loading ? (
          <p className="p-6 text-sm text-mint-deep/60">Memuat daftar panitia…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-mint-deep/60">Belum ada panitia terdaftar.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-forest-600/40 text-[11px] uppercase tracking-wider text-mint-deep/60">
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">NIM</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold">Ring</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((u) =>
                editEmail === u.email ? (
                  <tr key={u.email}>
                    <td colSpan={5} className="p-2">
                      <Editor
                        initial={u}
                        onCancel={() => setEditEmail(null)}
                        onSave={async (i) => {
                          await update(u.email, { name: i.name, nim: i.nim, ring: i.ring });
                          setEditEmail(null);
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={u.email} className="border-b border-forest-600/20 last:border-0">
                    <td className="px-4 py-3 font-semibold text-cream">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-mint-deep/80">{u.nim ?? "—"}</td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-mint-deep/60 sm:table-cell">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ringPill[u.ring] ?? ""}`} title={RING_LABEL[u.ring]}>
                        Ring {u.ring}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditEmail(u.email); setAdding(false); }}
                        className="rounded px-2 py-1 text-mint-deep/60 hover:text-leaf"
                        aria-label="Edit"
                      >
                        ✎
                      </button>
                      {u.email !== me?.email && (
                        <button
                          onClick={wrap(() => confirm(`Hapus ${u.name} dari panitia?`) ? remove(u.email) : Promise.resolve())}
                          className="rounded px-2 py-1 text-mint-deep/60 hover:text-red-300"
                          aria-label="Hapus"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-forest-800/50">
        {items.length} panitia terdaftar · kamu tidak bisa menghapus akun sendiri.
      </p>
    </div>
  );
}

function Editor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: User;
  onSave: (i: UserInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [nim, setNim] = useState(initial?.nim ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [ring, setRing] = useState(initial?.ring ?? 3);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;
  const field =
    "rounded-lg bg-forest-900/50 px-2.5 py-1.5 text-sm text-cream outline-none ring-1 ring-forest-600/50 focus:ring-leaf/50";

  const save = async () => {
    if (!email.trim() || !name.trim()) return;
    setSaving(true);
    try {
      await onSave({ email: email.trim(), nim: nim.trim() || null, name: name.trim(), ring: Number(ring) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel-soft rounded-2xl p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isEdit}
          placeholder="email @mahasiswa.itb.ac.id"
          className={`${field} font-mono ${isEdit ? "opacity-60" : ""}`}
        />
        <input value={nim} onChange={(e) => setNim(e.target.value)} placeholder="NIM (opsional)" className={`${field} font-mono`} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className={`${field} font-semibold`} />
        <select value={ring} onChange={(e) => setRing(Number(e.target.value))} className={field}>
          <option value={1}>Ring 1 · Kepala/Wakil Bidang</option>
          <option value={2}>Ring 2 · Kepala/Wakil Divisi · Koord</option>
          <option value={3}>Ring 3 · Anggota</option>
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-mint-deep/70 hover:text-mint-deep">Batal</button>
        <button onClick={save} disabled={saving} className="rounded-lg bg-leaf-button px-3.5 py-1.5 text-xs font-bold text-forest-800 transition hover:bg-leaf-bright disabled:opacity-50">
          {saving ? "Menyimpan…" : isEdit ? "Simpan" : "Tambah"}
        </button>
      </div>
    </div>
  );
}

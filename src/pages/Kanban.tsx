import { useState } from "react";
import { useKanban, useMe } from "../lib/hooks";
import type { KanbanCard, KanbanColumn } from "../lib/types";
import config from "../content/config.json";

const BIDANG = (config as { kanbanBidang?: string[] }).kanbanBidang ?? [];
const DEFAULT_COLS = ["To-do", "Sedang Dikerjakan", "Selesai"];

export function Kanban() {
  const [bidang, setBidang] = useState(BIDANG[0] ?? "");
  const k = useKanban(bidang);
  const { canWrite } = useMe();
  const [dragId, setDragId] = useState<string | null>(null);

  const cardsOf = (columnId: string) =>
    k.board.cards.filter((c) => c.columnId === columnId);

  // Drop di kartu target → sisip dragId TEPAT sebelum target.
  const dropBefore = (target: KanbanCard) => {
    if (!dragId || dragId === target.id) return;
    const list = cardsOf(target.columnId).filter((c) => c.id !== dragId);
    const idx = list.findIndex((c) => c.id === target.id);
    const prevId = idx > 0 ? list[idx - 1].id : undefined;
    k.moveCard(dragId, target.columnId, prevId, target.id);
    setDragId(null);
  };

  // Drop di badan kolom → append ke akhir kolom.
  const dropEnd = (column: KanbanColumn) => {
    if (!dragId) return;
    const list = cardsOf(column.id).filter((c) => c.id !== dragId);
    const prevId = list.length ? list[list.length - 1].id : undefined;
    k.moveCard(dragId, column.id, prevId, undefined);
    setDragId(null);
  };

  const addDefaultColumns = async () => {
    for (const t of DEFAULT_COLS) await k.addColumn(t);
  };

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-forest-800">
            Kanban Rakoor
          </h1>
          <p className="mt-1 text-sm text-forest-800/70">
            Board koordinasi per bidang — pilih bidang lalu buka di proyektor saat rakoor.
          </p>
        </div>
        {k.error && (
          <span className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300">
            {k.error}
          </span>
        )}
      </header>

      {/* Selector bidang */}
      <div className="flex flex-wrap gap-2 animate-fade-up [animation-delay:60ms]">
        {BIDANG.map((b) => (
          <button
            key={b}
            onClick={() => setBidang(b)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              b === bidang
                ? "glass-panel text-cream"
                : "border border-forest-800/15 bg-white/50 text-forest-800/80 hover:bg-white/80"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {k.loading ? (
        <div className="glass-panel flex flex-1 items-center justify-center rounded-4xl text-mint-deep/60">
          Memuat board…
        </div>
      ) : k.board.columns.length === 0 ? (
        <div className="glass-panel flex flex-1 flex-col items-center justify-center rounded-4xl p-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf/15 text-3xl">
            🗂️
          </div>
          <h2 className="font-display text-lg font-bold text-cream">
            Board {bidang} masih kosong
          </h2>
          {canWrite ? (
            <>
              <p className="mt-2 max-w-sm text-sm text-mint-deep/70">
                Buat kolom untuk mulai menata kartu rakoor bidang ini.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={addDefaultColumns}
                  className="rounded-lg bg-leaf-button px-4 py-2 text-sm font-bold text-forest-800 transition hover:bg-leaf-bright"
                >
                  Buat kolom default
                </button>
                <AddColumn onAdd={k.addColumn} />
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-mint-deep/70">Belum ada kolom.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
          {k.board.columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              cards={cardsOf(col.id)}
              canWrite={canWrite}
              dragId={dragId}
              onDragStartCard={setDragId}
              onDropBefore={dropBefore}
              onDropEnd={() => dropEnd(col)}
              k={k}
            />
          ))}
          {canWrite && <AddColumn onAdd={k.addColumn} />}
        </div>
      )}
    </div>
  );
}

type K = ReturnType<typeof useKanban>;

function Column({
  column,
  cards,
  canWrite,
  dragId,
  onDragStartCard,
  onDropBefore,
  onDropEnd,
  k,
}: {
  column: KanbanColumn;
  cards: KanbanCard[];
  canWrite: boolean;
  dragId: string | null;
  onDragStartCard: (id: string) => void;
  onDropBefore: (c: KanbanCard) => void;
  onDropEnd: () => void;
  k: K;
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(column.title);

  return (
    <div
      className="flex w-72 shrink-0 flex-col rounded-2xl bg-forest-900/40 p-2"
      onDragOver={(e) => canWrite && e.preventDefault()}
      onDrop={() => canWrite && onDropEnd()}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-2 pt-1">
        {renaming ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setRenaming(false);
              if (title.trim() && title !== column.title) k.renameColumn(column.id, title.trim());
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="w-full rounded bg-forest-800 px-2 py-1 text-sm font-bold text-cream outline-none ring-1 ring-leaf/50"
          />
        ) : (
          <h2
            className={`font-display text-sm font-bold text-cream ${canWrite ? "cursor-text" : ""}`}
            onClick={() => canWrite && setRenaming(true)}
          >
            {column.title}
          </h2>
        )}
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-forest-800/70 px-1.5 text-[11px] font-semibold text-mint-deep/60">
            {cards.length}
          </span>
          {canWrite && (
            <button
              onClick={() => {
                if (confirm(`Hapus kolom "${column.title}" beserta semua kartunya?`))
                  k.deleteColumn(column.id);
              }}
              className="text-mint-deep/40 transition hover:text-red-300"
              aria-label="Hapus kolom"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            canWrite={canWrite}
            dimmed={dragId === card.id}
            onDragStart={() => onDragStartCard(card.id)}
            onDropBefore={() => onDropBefore(card)}
            k={k}
          />
        ))}
      </div>

      {canWrite && <AddCard onAdd={(t, b) => k.addCard(column.id, t, b)} />}
    </div>
  );
}

function Card({
  card,
  canWrite,
  dimmed,
  onDragStart,
  onDropBefore,
  k,
}: {
  card: KanbanCard;
  canWrite: boolean;
  dimmed: boolean;
  onDragStart: () => void;
  onDropBefore: () => void;
  k: K;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [body, setBody] = useState(card.body ?? "");

  if (editing) {
    return (
      <div className="rounded-xl bg-forest-800 p-2.5 ring-1 ring-leaf/40">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded bg-forest-900/60 px-2 py-1 text-sm font-semibold text-cream outline-none"
          placeholder="Judul"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          className="mt-1.5 w-full resize-none rounded bg-forest-900/60 px-2 py-1 text-xs text-mint-deep/90 outline-none"
          placeholder="Deskripsi (opsional)"
        />
        <div className="mt-1.5 flex justify-end gap-1.5">
          <button
            onClick={() => {
              setEditing(false);
              setTitle(card.title);
              setBody(card.body ?? "");
            }}
            className="rounded px-2 py-1 text-[11px] font-semibold text-mint-deep/60 hover:text-mint-deep"
          >
            Batal
          </button>
          <button
            onClick={() => {
              if (title.trim()) k.editCard(card.id, { title: title.trim(), body: body.trim() || null });
              setEditing(false);
            }}
            className="rounded bg-leaf-button px-2.5 py-1 text-[11px] font-bold text-forest-800 hover:bg-leaf-bright"
          >
            Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <article
      draggable={canWrite}
      onDragStart={onDragStart}
      onDragOver={(e) => canWrite && e.preventDefault()}
      onDrop={(e) => {
        if (!canWrite) return;
        e.stopPropagation();
        onDropBefore();
      }}
      className={`group rounded-xl bg-forest-800 p-2.5 shadow-sm transition ${
        canWrite ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-leaf/40" : ""
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-cream">{card.title}</p>
        {canWrite && (
          <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => setEditing(true)}
              className="text-mint-deep/40 hover:text-leaf"
              aria-label="Edit kartu"
            >
              ✎
            </button>
            <button
              onClick={() => confirm("Hapus kartu ini?") && k.deleteCard(card.id)}
              className="text-mint-deep/40 hover:text-red-300"
              aria-label="Hapus kartu"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {card.body && (
        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-mint-deep/70">
          {card.body}
        </p>
      )}
    </article>
  );
}

function AddCard({ onAdd }: { onAdd: (title: string, body?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-mint-deep/50 transition hover:bg-white/5 hover:text-mint-deep"
      >
        + Tambah kartu
      </button>
    );

  const submit = () => {
    if (title.trim()) onAdd(title.trim());
    setTitle("");
    setOpen(false);
  };

  return (
    <div className="mt-2 px-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={submit}
        placeholder="Judul kartu…"
        className="w-full rounded-lg bg-forest-800 px-2.5 py-2 text-sm text-cream outline-none ring-1 ring-leaf/40 placeholder:text-mint-deep/40"
      />
    </div>
  );
}

function AddColumn({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-fit w-60 shrink-0 rounded-2xl border border-dashed border-forest-600/50 px-3 py-3 text-sm font-semibold text-mint-deep/50 transition hover:border-leaf/50 hover:text-mint-deep"
      >
        + Tambah kolom
      </button>
    );

  const submit = () => {
    if (title.trim()) onAdd(title.trim());
    setTitle("");
    setOpen(false);
  };

  return (
    <div className="w-72 shrink-0">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={submit}
        placeholder="Nama kolom…"
        className="w-full rounded-2xl bg-forest-900/40 px-3 py-2.5 text-sm font-bold text-cream outline-none ring-1 ring-leaf/40 placeholder:text-mint-deep/40"
      />
    </div>
  );
}

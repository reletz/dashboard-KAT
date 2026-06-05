import { useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import type {
  Announcement,
  CardMove,
  KanbanBoard,
  KanbanCard,
  KanbanColumn,
  Me,
  PortalApi,
  TimelineItem,
  User,
} from "./types";

// BASE_URL = "/dashboard/" → API di "/dashboard/api". Same-origin (Traefik route).
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ── Client asli (fetch + Bearer id_token) ────────────────────────────────
function realApi(getToken: () => Promise<string | null>): PortalApi {
  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    const res = await fetch(API_BASE + path, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const msg = await res
        .json()
        .then((b) => (b as { error?: string }).error)
        .catch(() => null);
      throw new ApiError(res.status, msg ?? `HTTP ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }
  const json = (v: unknown) => ({ body: JSON.stringify(v) });

  const enc = encodeURIComponent;

  return {
    getMe: () => call<Me>("/me"),

    listUsers: () => call<User[]>("/users"),
    createUser: (i) => call<User>("/users", { method: "POST", ...json(i) }),
    updateUser: (email, p) => call<User>(`/users/${enc(email)}`, { method: "PATCH", ...json(p) }),
    deleteUser: (email) => call<void>(`/users/${enc(email)}`, { method: "DELETE" }).then(() => undefined),

    listTimeline: () => call<TimelineItem[]>("/timeline"),
    createTimeline: (i) => call<TimelineItem>("/timeline", { method: "POST", ...json(i) }),
    updateTimeline: (id, p) => call<TimelineItem>(`/timeline/${id}`, { method: "PATCH", ...json(p) }),
    deleteTimeline: (id) => call<void>(`/timeline/${id}`, { method: "DELETE" }).then(() => undefined),

    listAnnouncements: () => call<Announcement[]>("/announcements"),
    createAnnouncement: (i) => call<Announcement>("/announcements", { method: "POST", ...json(i) }),
    updateAnnouncement: (id, i) =>
      call<Announcement>(`/announcements/${id}`, { method: "PATCH", ...json(i) }),
    deleteAnnouncement: (id) =>
      call<void>(`/announcements/${id}`, { method: "DELETE" }).then(() => undefined),

    getKanban: (bidang) =>
      call<KanbanBoard>(`/kanban${bidang ? `?bidang=${enc(bidang)}` : ""}`),
    createColumn: (title, bidang) =>
      call<KanbanColumn>("/kanban/columns", { method: "POST", ...json({ title, bidang }) }),
    updateColumn: (id, patch) =>
      call<KanbanColumn>(`/kanban/columns/${id}`, { method: "PATCH", ...json(patch) }),
    deleteColumn: (id) =>
      call<void>(`/kanban/columns/${id}`, { method: "DELETE" }).then(() => undefined),

    createCard: (i) => call<KanbanCard>("/kanban/cards", { method: "POST", ...json(i) }),
    updateCard: (id, patch) =>
      call<KanbanCard>(`/kanban/cards/${id}`, { method: "PATCH", ...json(patch) }),
    deleteCard: (id) =>
      call<void>(`/kanban/cards/${id}`, { method: "DELETE" }).then(() => undefined),
  };
}

// ── Mock demo (in-memory, interaktif tanpa Azure/backend) ─────────────────
const pad = (n: number) => String(n).padStart(6, "0");
const uid = () => Math.random().toString(36).slice(2, 10);
const nowIso = () => new Date().toISOString();

function createDemoApi(): PortalApi {
  const announcements: Announcement[] = [
    {
      id: uid(),
      date: "2026-06-05",
      fromWho: "SC",
      tag: "info",
      title: "Portal panitia resmi aktif",
      body: "Bookmark halaman ini. Semua request link, kanban rakoor, dan pengumuman ada di sini.",
      createdBy: "demo",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uid(),
      date: "2026-06-03",
      fromWho: "Kesekjenan",
      tag: "deadline",
      title: "Deadline pengumpulan TOR divisi",
      body: "Setiap kabid wajib submit Terms of Reference paling lambat Jumat 12 Juni 2026.",
      createdBy: "demo",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  const DEMO_BIDANG = "Operasional"; // demo: cuma bidang ini yang terisi
  const columns: KanbanColumn[] = ["To-do", "Sedang Dikerjakan", "Selesai"].map((title, i) => ({
    id: uid(),
    bidang: DEMO_BIDANG,
    title,
    position: pad(i),
    createdAt: nowIso(),
  }));
  const order: string[] = []; // urutan global id kartu
  const cards: Record<string, KanbanCard> = {};
  const seedCard = (columnId: string, title: string, body: string | null) => {
    const id = uid();
    cards[id] = {
      id,
      columnId,
      title,
      body,
      position: pad(order.length),
      createdBy: "demo",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    order.push(id);
  };
  seedCard(columns[0].id, "Susun rundown rakoor", "Contoh kartu — coba drag ke kolom lain.");
  seedCard(columns[0].id, "Follow-up TOR divisi", null);
  seedCard(columns[1].id, "Desain feed pengumuman", null);

  const renumber = () => order.forEach((id, i) => (cards[id].position = pad(i)));

  const demoUsers: User[] = [
    { email: "demo@mahasiswa.itb.ac.id", nim: null, name: "Panitia Demo", ring: 1, createdAt: nowIso(), updatedAt: nowIso() },
    { email: "13522001@mahasiswa.itb.ac.id", nim: "13522001", name: "Budi Divisi", ring: 2, createdAt: nowIso(), updatedAt: nowIso() },
    { email: "13522099@mahasiswa.itb.ac.id", nim: "13522099", name: "Citra Anggota", ring: 3, createdAt: nowIso(), updatedAt: nowIso() },
  ];
  const demoTimeline: TimelineItem[] = [
    { label: "Open Recruitment Panitia", date: "2026-06-15", description: "Pendaftaran & seleksi panitia." },
    { label: "Rakoor Perdana", date: "2026-07-01", description: "Rapat koordinasi pertama." },
    { label: "OSKM ITB 2026", date: "2026-08-19", description: "Hari-H OSKM." },
    { label: "OHU 2026", date: "2026-08-30", description: "Open House Unit." },
  ].map((t) => ({ id: uid(), createdBy: "demo", createdAt: nowIso(), updatedAt: nowIso(), ...t }));

  return {
    getMe: async () => ({ email: "demo@mahasiswa.itb.ac.id", name: "Panitia Demo", ring: 1 }),

    listUsers: async () => [...demoUsers].sort((a, b) => a.ring - b.ring || a.name.localeCompare(b.name)),
    createUser: async (i) => {
      if (demoUsers.some((u) => u.email === i.email.toLowerCase())) throw new ApiError(409, "Email sudah terdaftar");
      const row: User = {
        email: i.email.toLowerCase(),
        nim: i.nim ?? (i.email.split("@")[0].match(/^\d+$/)?.[0] ?? null),
        name: i.name,
        ring: i.ring,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      demoUsers.push(row);
      return row;
    },
    updateUser: async (email, p) => {
      const u = demoUsers.find((x) => x.email === email.toLowerCase());
      if (!u) throw new ApiError(404, "Tidak ditemukan");
      Object.assign(u, p, { updatedAt: nowIso() });
      return u;
    },
    deleteUser: async (email) => {
      const idx = demoUsers.findIndex((x) => x.email === email.toLowerCase());
      if (idx >= 0) demoUsers.splice(idx, 1);
    },

    listTimeline: async () => [...demoTimeline].sort((a, b) => (a.date < b.date ? -1 : 1)),
    createTimeline: async (i) => {
      const row: TimelineItem = {
        id: uid(),
        label: i.label,
        date: i.date,
        description: i.description ?? null,
        createdBy: "demo",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      demoTimeline.push(row);
      return row;
    },
    updateTimeline: async (id, p) => {
      const t = demoTimeline.find((x) => x.id === id);
      if (!t) throw new ApiError(404, "Tidak ditemukan");
      Object.assign(t, p, { updatedAt: nowIso() });
      return t;
    },
    deleteTimeline: async (id) => {
      const idx = demoTimeline.findIndex((x) => x.id === id);
      if (idx >= 0) demoTimeline.splice(idx, 1);
    },

    listAnnouncements: async () =>
      [...announcements].sort((a, b) => (a.date < b.date ? 1 : -1)),
    createAnnouncement: async (i) => {
      const row: Announcement = {
        id: uid(),
        date: i.date || nowIso().slice(0, 10),
        fromWho: i.fromWho,
        tag: i.tag ?? null,
        title: i.title,
        body: i.body,
        createdBy: "demo",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      announcements.unshift(row);
      return row;
    },
    updateAnnouncement: async (id, i) => {
      const row = announcements.find((a) => a.id === id);
      if (!row) throw new ApiError(404, "Tidak ditemukan");
      Object.assign(row, i, { updatedAt: nowIso() });
      return row;
    },
    deleteAnnouncement: async (id) => {
      const idx = announcements.findIndex((a) => a.id === id);
      if (idx >= 0) announcements.splice(idx, 1);
    },

    getKanban: async (bidang) => {
      const cols = columns
        .filter((c) => !bidang || c.bidang === bidang)
        .sort((a, b) => (a.position < b.position ? -1 : 1));
      const colIds = new Set(cols.map((c) => c.id));
      return { columns: cols, cards: order.map((id) => cards[id]).filter((c) => colIds.has(c.columnId)) };
    },
    createColumn: async (title, bidang) => {
      const col = { id: uid(), bidang, title, position: pad(columns.length), createdAt: nowIso() };
      columns.push(col);
      return col;
    },
    updateColumn: async (id, patch) => {
      const col = columns.find((c) => c.id === id);
      if (!col) throw new ApiError(404, "Tidak ditemukan");
      Object.assign(col, patch);
      return col;
    },
    deleteColumn: async (id) => {
      const idx = columns.findIndex((c) => c.id === id);
      if (idx >= 0) columns.splice(idx, 1);
      for (const cid of [...order]) {
        if (cards[cid].columnId === id) {
          delete cards[cid];
          order.splice(order.indexOf(cid), 1);
        }
      }
      renumber();
    },

    createCard: async (i) => {
      const id = uid();
      cards[id] = {
        id,
        columnId: i.columnId,
        title: i.title,
        body: i.body ?? null,
        position: pad(order.length),
        createdBy: "demo",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      order.push(id);
      renumber();
      return cards[id];
    },
    updateCard: async (id, patch) => {
      const card = cards[id];
      if (!card) throw new ApiError(404, "Tidak ditemukan");
      if (patch.title !== undefined) card.title = patch.title;
      if (patch.body !== undefined) card.body = patch.body;
      const move = patch as CardMove;
      if (move.columnId !== undefined || move.prevId !== undefined || move.nextId !== undefined) {
        if (move.columnId) card.columnId = move.columnId;
        order.splice(order.indexOf(id), 1);
        let at = order.length;
        if (move.nextId && order.includes(move.nextId)) at = order.indexOf(move.nextId);
        else if (move.prevId && order.includes(move.prevId)) at = order.indexOf(move.prevId) + 1;
        order.splice(at, 0, id);
        renumber();
      }
      card.updatedAt = nowIso();
      return card;
    },
    deleteCard: async (id) => {
      if (cards[id]) {
        delete cards[id];
        order.splice(order.indexOf(id), 1);
        renumber();
      }
    },
  };
}

let demoSingleton: PortalApi | null = null;

/** Hook utama — pilih client asli vs mock demo sesuai mode auth. */
export function useApi(): PortalApi {
  const { demo, getToken } = useAuth();
  return useMemo(() => {
    if (demo) {
      demoSingleton ??= createDemoApi();
      return demoSingleton;
    }
    return realApi(getToken);
  }, [demo, getToken]);
}

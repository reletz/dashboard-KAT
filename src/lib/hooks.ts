import { useCallback, useEffect, useState } from "react";
import { useApi, ApiError } from "./api";
import type {
  Announcement,
  AnnouncementInput,
  KanbanBoard,
  TimelineInput,
  TimelineItem,
  User,
  UserInput,
} from "./types";

export { useMe } from "./me";

export function errMsg(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Terjadi kesalahan";
}

export function useAnnouncements() {
  const api = useApi();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await api.listAnnouncements());
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (input: AnnouncementInput) => {
      await api.createAnnouncement(input);
      await reload();
    },
    [api, reload],
  );
  const update = useCallback(
    async (id: string, input: Partial<AnnouncementInput>) => {
      await api.updateAnnouncement(id, input);
      await reload();
    },
    [api, reload],
  );
  const remove = useCallback(
    async (id: string) => {
      await api.deleteAnnouncement(id);
      await reload();
    },
    [api, reload],
  );

  return { items, loading, error, reload, create, update, remove };
}

const EMPTY: KanbanBoard = { columns: [], cards: [] };

export function useKanban(bidang?: string) {
  const api = useApi();
  const [board, setBoard] = useState<KanbanBoard>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setBoard(await api.getKanban(bidang));
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [api, bidang]);

  useEffect(() => {
    setLoading(true); // tampilkan loading saat ganti bidang
    reload();
  }, [reload]);

  /** Optimistic: pindahkan kartu di state lokal dulu, lalu PATCH + reconcile. */
  const moveCard = useCallback(
    async (cardId: string, columnId: string, prevId?: string, nextId?: string) => {
      setBoard((prev) => {
        const cards = prev.cards.map((c) =>
          c.id === cardId ? { ...c, columnId } : c,
        );
        // perkiraan posisi sementara: taruh tepat sebelum nextId / setelah prevId
        const moved = cards.find((c) => c.id === cardId);
        if (moved) {
          const ref =
            (nextId && cards.find((c) => c.id === nextId)?.position) ??
            (prevId && cards.find((c) => c.id === prevId)?.position);
          if (ref) moved.position = nextId ? ref + " " : ref + "~";
        }
        return { ...prev, cards };
      });
      try {
        await api.updateCard(cardId, { columnId, prevId, nextId });
      } catch (e) {
        setError(errMsg(e));
      } finally {
        await reload(); // reconcile dengan posisi asli dari server
      }
    },
    [api, reload],
  );

  return {
    board,
    loading,
    error,
    reload,
    moveCard,
    addColumn: useCallback(
      async (title: string) => {
        if (!bidang) return;
        await api.createColumn(title, bidang);
        await reload();
      },
      [api, reload, bidang],
    ),
    renameColumn: useCallback(
      async (id: string, title: string) => {
        await api.updateColumn(id, { title });
        await reload();
      },
      [api, reload],
    ),
    deleteColumn: useCallback(
      async (id: string) => {
        await api.deleteColumn(id);
        await reload();
      },
      [api, reload],
    ),
    addCard: useCallback(
      async (columnId: string, title: string, body?: string) => {
        await api.createCard({ columnId, title, body });
        await reload();
      },
      [api, reload],
    ),
    editCard: useCallback(
      async (id: string, patch: { title?: string; body?: string | null }) => {
        await api.updateCard(id, patch);
        await reload();
      },
      [api, reload],
    ),
    deleteCard: useCallback(
      async (id: string) => {
        await api.deleteCard(id);
        await reload();
      },
      [api, reload],
    ),
  };
}

export function useUsers() {
  const api = useApi();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await api.listUsers());
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    items,
    loading,
    error,
    reload,
    create: useCallback(async (i: UserInput) => { await api.createUser(i); await reload(); }, [api, reload]),
    update: useCallback(async (email: string, p: Partial<UserInput>) => { await api.updateUser(email, p); await reload(); }, [api, reload]),
    remove: useCallback(async (email: string) => { await api.deleteUser(email); await reload(); }, [api, reload]),
  };
}

export function useTimeline() {
  const api = useApi();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await api.listTimeline());
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    items,
    loading,
    error,
    reload,
    create: useCallback(async (i: TimelineInput) => { await api.createTimeline(i); await reload(); }, [api, reload]),
    update: useCallback(async (id: string, p: Partial<TimelineInput>) => { await api.updateTimeline(id, p); await reload(); }, [api, reload]),
    remove: useCallback(async (id: string) => { await api.deleteTimeline(id); await reload(); }, [api, reload]),
  };
}

// Kontrak data — mirror server/src/schema.ts. Satu sumber tipe untuk client
// asli & mock demo, supaya kalau schema berubah dua jalur sama-sama gagal compile.

export type Announcement = {
  id: string;
  date: string; // YYYY-MM-DD
  fromWho: string;
  tag: string | null;
  title: string;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementInput = {
  date?: string;
  fromWho: string;
  tag?: string | null;
  title: string;
  body: string;
};

export type KanbanColumn = {
  id: string;
  bidang: string;
  title: string;
  position: string;
  createdAt: string;
};

export type KanbanCard = {
  id: string;
  columnId: string;
  title: string;
  body: string | null;
  position: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type KanbanBoard = { columns: KanbanColumn[]; cards: KanbanCard[] };

/** Pindah kartu: tetangga di urutan ascending pada kolom tujuan. */
export type CardMove = { columnId?: string; prevId?: string; nextId?: string };

export type Me = { email: string; name: string; ring: number };

export type User = {
  email: string;
  nim: string | null;
  name: string;
  ring: number;
  createdAt: string;
  updatedAt: string;
};
export type UserInput = { email: string; nim?: string | null; name: string; ring: number };

export type TimelineItem = {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
export type TimelineInput = { label: string; date: string; description?: string | null };

export interface PortalApi {
  getMe(): Promise<Me>;

  listUsers(): Promise<User[]>;
  createUser(input: UserInput): Promise<User>;
  updateUser(email: string, patch: Partial<UserInput>): Promise<User>;
  deleteUser(email: string): Promise<void>;

  listTimeline(): Promise<TimelineItem[]>;
  createTimeline(input: TimelineInput): Promise<TimelineItem>;
  updateTimeline(id: string, patch: Partial<TimelineInput>): Promise<TimelineItem>;
  deleteTimeline(id: string): Promise<void>;

  listAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(input: AnnouncementInput): Promise<Announcement>;
  updateAnnouncement(id: string, input: Partial<AnnouncementInput>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;

  getKanban(bidang?: string): Promise<KanbanBoard>;
  createColumn(title: string, bidang: string): Promise<KanbanColumn>;
  updateColumn(id: string, patch: { title?: string; position?: string }): Promise<KanbanColumn>;
  deleteColumn(id: string): Promise<void>;

  createCard(input: { columnId: string; title: string; body?: string }): Promise<KanbanCard>;
  updateCard(
    id: string,
    patch: { title?: string; body?: string | null } & CardMove,
  ): Promise<KanbanCard>;
  deleteCard(id: string): Promise<void>;
}

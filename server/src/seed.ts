import { randomUUID } from "node:crypto";
import { db } from "./db";
import { announcements, timeline, users } from "./schema";
import { RING1_BOOTSTRAP } from "./auth";

/** Diambil dari src/content/announcements.json — dipakai seed sekali (insert-if-empty). */
const SEED_ANNOUNCEMENTS = [
  {
    date: "2026-06-05",
    fromWho: "SC",
    tag: "info",
    title: "Portal panitia resmi aktif",
    body: "Bookmark halaman ini. Semua request link, kanban rakoor, dan pengumuman ada di sini. Tidak perlu lagi tanya 'link-nya mana' di grup.",
  },
  {
    date: "2026-06-03",
    fromWho: "Kesekjenan",
    tag: "deadline",
    title: "Deadline pengumpulan TOR divisi",
    body: "Setiap kabid wajib submit Terms of Reference divisi paling lambat Jumat 12 Juni 2026 lewat form di tab Request Links.",
  },
  {
    date: "2026-06-01",
    fromWho: "SC",
    tag: "rakoor",
    title: "Rakoor rutin tiap Rabu 19.30",
    body: "Rapat koordinasi mingguan dibuka di tab Kanban Rakoor (proyektor). Pastikan kartu divisi kamu sudah ter-update sebelum rapat.",
  },
];

const SEED_TIMELINE = [
  { label: "Open Recruitment Panitia", date: "2026-06-15", description: "Pendaftaran & seleksi panitia inti dibuka." },
  { label: "Rakoor Perdana", date: "2026-07-01", description: "Rapat koordinasi pertama seluruh bidang." },
  { label: "Pekan Persiapan", date: "2026-08-04", description: "Gladi, finalisasi rundown, dan logistik." },
  { label: "OSKM ITB 2026", date: "2026-08-19", description: "Hari-H rangkaian Orientasi Studi Keluarga Mahasiswa." },
  { label: "OHU 2026", date: "2026-08-30", description: "Open House Unit — penutup rangkaian KAT." },
];

const nimFromEmail = (email: string) => {
  const local = email.split("@")[0];
  return /^\d+$/.test(local) ? local : null;
};

export async function seed() {
  const now = new Date().toISOString();

  if ((await db.select().from(announcements)).length === 0) {
    await db.insert(announcements).values(
      SEED_ANNOUNCEMENTS.map((a) => ({
        id: randomUUID(),
        ...a,
        createdBy: "seed",
        createdAt: now,
        updatedAt: now,
      })),
    );
    console.log(`  seeded ${SEED_ANNOUNCEMENTS.length} announcements`);
  }

  // Kanban kini per-bidang & kosong di awal — ring 1 membuat kolomnya
  // (atau pakai tombol "Buat kolom default" di UI). Tidak ada seed kolom.

  if ((await db.select().from(timeline)).length === 0) {
    await db.insert(timeline).values(
      SEED_TIMELINE.map((t) => ({
        id: randomUUID(),
        ...t,
        createdBy: "seed",
        createdAt: now,
        updatedAt: now,
      })),
    );
    console.log(`  seeded ${SEED_TIMELINE.length} timeline items`);
  }

  // Bootstrap: masukkan email RING1_EMAILS ke tabel users sebagai ring 1 (sekali),
  // supaya muncul di panel admin dan bisa dikelola dari sana.
  if ((await db.select().from(users)).length === 0 && RING1_BOOTSTRAP.size > 0) {
    await db.insert(users).values(
      [...RING1_BOOTSTRAP].map((email) => ({
        email,
        nim: nimFromEmail(email),
        name: email.split("@")[0],
        ring: 1,
        createdAt: now,
        updatedAt: now,
      })),
    );
    console.log(`  seeded ${RING1_BOOTSTRAP.size} ring-1 users (bootstrap)`);
  }
}

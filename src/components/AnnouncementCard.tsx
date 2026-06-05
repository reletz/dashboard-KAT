import type { ReactNode } from "react";
import type { Announcement } from "../lib/types";

const tagStyle: Record<string, string> = {
  info: "bg-leaf/15 text-leaf",
  deadline: "bg-red-400/15 text-red-300",
  rakoor: "bg-cream/15 text-cream",
};

export function AnnouncementCard({
  item,
  actions,
}: {
  item: Announcement;
  actions?: ReactNode;
}) {
  return (
    <article className="glass-panel-soft group relative rounded-2xl p-4 transition hover:border-leaf/50">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-forest-900/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mint-deep">
          {item.fromWho}
        </span>
        {item.tag && (
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              tagStyle[item.tag] ?? "bg-white/10 text-mint-deep"
            }`}
          >
            {item.tag}
          </span>
        )}
        <span className="ml-auto text-[11px] font-medium text-mint-deep/50">
          {new Date(item.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <h3 className="font-display text-base font-bold text-cream">{item.title}</h3>
      {/* body adalah teks yang ditulis user — dirender sebagai teks, BUKAN HTML. */}
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-mint-deep/80">
        {item.body}
      </p>
      {actions && (
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
          {actions}
        </div>
      )}
    </article>
  );
}

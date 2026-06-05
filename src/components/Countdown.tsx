import { useEffect, useState } from "react";

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: false,
  };
}

export function Countdown({ target, label }: { target: string; label: string }) {
  const [t, setT] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { label: "Hari", value: t.days },
    { label: "Jam", value: t.hours },
    { label: "Menit", value: t.minutes },
    { label: "Detik", value: t.seconds },
  ];

  return (
    <div className="glass-panel relative overflow-hidden rounded-4xl p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-leaf/10 blur-2xl" />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-mint-deep">
          Hitung Mundur
        </p>
        <p className="mt-1 font-display text-xl font-bold text-cream sm:text-2xl">
          {label}
        </p>
        <div className="mt-5 grid grid-cols-4 gap-2.5 sm:gap-3">
          {units.map((u) => (
            <div
              key={u.label}
              className="flex flex-col items-center rounded-2xl border border-forest-600/50 bg-forest-900/40 px-1 py-3"
            >
              <span className="font-display text-3xl font-extrabold tabular-nums text-leaf sm:text-4xl">
                {String(u.value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-mint-deep/70">
                {u.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

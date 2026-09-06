import { cn } from "@/lib/utils";

/** Weekday labels — index matches the DB convention (0 = الاثنين … 6 = الأحد). */
const DAY_LABELS = [
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
  "الأحد",
];

export type WeeklyScheduleSlot = {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  title: string;
  teacherName?: string | null;
};

/** "HH:MM:SS" or "HH:MM" → "HH:MM". */
function hhmm(value: string) {
  return value.slice(0, 5);
}

function dayLabel(day: number) {
  return DAY_LABELS[day] ?? `يوم ${day}`;
}

function SlotCard({ slot }: { slot: WeeklyScheduleSlot }) {
  return (
    <div className="border-border bg-card rounded-md border p-2.5">
      <p dir="ltr" className="text-muted-foreground text-end text-xs font-medium">
        {hhmm(slot.starts_at)}–{hhmm(slot.ends_at)}
      </p>
      <p className="mt-0.5 text-sm font-medium">{slot.title}</p>
      {slot.teacherName ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{slot.teacherName}</p>
      ) : null}
    </div>
  );
}

/**
 * Read-only weekly schedule view.
 * Desktop: one column per day (RTL → first day rightmost) inside a horizontal
 * scroll wrapper. Mobile: a stacked section per day.
 */
export function WeeklySchedule({
  slots,
  days = [0, 1, 2, 3, 4, 5],
}: {
  slots: WeeklyScheduleSlot[];
  days?: number[];
}) {
  const byDay = new Map<number, WeeklyScheduleSlot[]>();
  for (const day of days) byDay.set(day, []);
  for (const slot of slots) {
    const list = byDay.get(slot.weekday);
    if (list) list.push(slot);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  return (
    <div>
      {/* Desktop grid */}
      <div className="hidden overflow-x-auto sm:block">
        <div
          className={cn("grid min-w-[640px] gap-3")}
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          {days.map((day) => {
            const items = byDay.get(day) ?? [];
            return (
              <div key={day} className="space-y-2">
                <h3 className="text-muted-foreground text-center text-sm font-medium">
                  {dayLabel(day)}
                </h3>
                {items.length === 0 ? (
                  <p className="text-muted-foreground/60 text-center text-sm">
                    —
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((slot) => (
                      <SlotCard key={slot.id} slot={slot} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile stack */}
      <div className="space-y-4 sm:hidden">
        {days.map((day) => {
          const items = byDay.get(day) ?? [];
          return (
            <div key={day} className="space-y-2">
              <h3 className="text-sm font-medium">{dayLabel(day)}</h3>
              {items.length === 0 ? (
                <p className="text-muted-foreground/60 text-sm">—</p>
              ) : (
                <div className="space-y-2">
                  {items.map((slot) => (
                    <SlotCard key={slot.id} slot={slot} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

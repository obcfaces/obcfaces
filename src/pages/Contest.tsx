import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import PostCard from "@/components/profile/PostCard";
import contestant1 from "@/assets/contestant-1.jpg";
import contestant2 from "@/assets/contestant-2.jpg";
import contestant3 from "@/assets/contestant-3.jpg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Week {
  key: string;
  label: string;
}

interface Entry {
  id: string;
  authorName: string;
  imageSrc: string;
  weekKey: string;
  createdAt: string; // ISO date
}

const weeks: Week[] = [
  { key: "2025-07-24_2025-07-30", label: "July 24–30, 2025" },
  { key: "2025-07-17_2025-07-23", label: "July 17–23, 2025" },
];

const allEntries: Entry[] = [
  {
    id: "e1",
    authorName: "Anna P.",
    imageSrc: contestant1,
    weekKey: "2025-07-24_2025-07-30",
    createdAt: "2025-07-25T10:00:00Z",
  },
  {
    id: "e2",
    authorName: "Bella R.",
    imageSrc: contestant2,
    weekKey: "2025-07-24_2025-07-30",
    createdAt: "2025-07-27T12:30:00Z",
  },
  {
    id: "e3",
    authorName: "Clara M.",
    imageSrc: contestant3,
    weekKey: "2025-07-17_2025-07-23",
    createdAt: "2025-07-20T14:15:00Z",
  },
];

function formatTimeForCard(iso: string, weekLabel: string) {
  const d = new Date(iso);
  return `${weekLabel} · ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

const Contest = () => {
  const [selectedWeek, setSelectedWeek] = useState<string>(weeks[0].key);
  const week = useMemo(() => weeks.find(w => w.key === selectedWeek)!, [selectedWeek]);
  const entries = useMemo(() => allEntries.filter(e => e.weekKey === selectedWeek), [selectedWeek]);

  return (
    <>
      <Helmet>
        <title>Contest – Weekly Entries</title>
        <meta name="description" content="Browse weekly contest entries and finalists." />
        <link rel="canonical" href="/contest" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-0 sm:px-6 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-contest-text">Contest – Weekly Entries</h1>
            <p className="text-muted-foreground">Select a week to see the girls’ participation posts.</p>
          </header>

          <div className="mb-6 max-w-xs">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger aria-label="Select week">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map(w => (
                  <SelectItem key={w.key} value={w.key}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {entries.map(e => (
              <article key={e.id}>
                <PostCard
                  authorName={e.authorName}
                  time={formatTimeForCard(e.createdAt, week.label)}
                  content={`Contest entry for ${week.label}`}
                  imageSrc={e.imageSrc}
                  likes={0}
                  comments={0}
                />
              </article>
            ))}
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground">No entries for this week yet.</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default Contest;

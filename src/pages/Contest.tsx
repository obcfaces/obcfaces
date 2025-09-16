import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import PostCard from "@/components/profile/PostCard";
import { useParticipantData } from "@/hooks/useParticipantData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AlignJustify, Grid2X2 } from "lucide-react";

interface Week {
  key: string;
  label: string;
}

interface Entry {
  id: string;
  authorName: string;
  imageSrc: string;
  weekKey: string;
  createdAt: string;
  participantData?: any;
}

const weeks: Week[] = [
  { key: "current", label: "Current Week" },
  { key: "previous", label: "Previous Week" },
];

function formatTimeForCard(iso: string, weekLabel: string) {
  const d = new Date(iso);
  return `${weekLabel} · ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

const Contest = () => {
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('compact');
  const [selectedWeek, setSelectedWeek] = useState<string>(weeks[0].key);
  const week = useMemo(() => weeks.find(w => w.key === selectedWeek)!, [selectedWeek]);
  
  // Get real participant data from database
  const { data: participants, loading } = useParticipantData();
  
  // Convert participant data to entry format for display
  const entries = useMemo(() => {
    return participants.map(p => ({
      id: p.participant_id,
      authorName: `${p.first_name} ${p.last_name}`,
      imageSrc: p.photo_1_url || "/placeholder.svg",
      weekKey: selectedWeek, // All current participants are for current week
      createdAt: new Date().toISOString(),
      participantData: p
    }));
  }, [participants, selectedWeek]);

  return (
    <>
      <Helmet>
        <title>Contest – Weekly Entries</title>
        <meta name="description" content="Browse weekly contest entries and finalists." />
        <link rel="canonical" href="/contest" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-0 sm:px-6 py-8">
          {/* View controls moved below, above cards */}

          <header className="mb-6">
            <h1 className="text-3xl font-bold text-contest-text">THIS WEEK</h1>
            <p className="text-sm text-muted-foreground">{week.label}</p>
            <p className="text-muted-foreground">Help us choose the winner.</p>
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

          <div className="mb-4">
            <div className="relative">
              <div aria-hidden className="absolute inset-x-0 bottom-0 border-b border-border" />
              <div className="relative z-10 flex items-end justify-evenly w-full pb-0" role="tablist" aria-label="View mode">
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  aria-pressed={viewMode === 'full'}
                  aria-label="List view"
                  className="p-1 rounded-md hover:bg-accent transition-colors"
                >
                  <AlignJustify 
                    size={28} 
                    strokeWidth={1}
                    className={viewMode === 'full' ? "text-primary" : "text-muted-foreground"}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  aria-pressed={viewMode === 'compact'}
                  aria-label="Grid view"
                  className="p-1 rounded-md hover:bg-accent transition-colors"
                >
                  <Grid2X2 
                    size={28} 
                    strokeWidth={1}
                    className={viewMode === 'compact' ? "text-primary" : "text-muted-foreground"}
                  />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'compact' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 sm:gap-2">
              {entries.map(e => (
                <article key={e.id} className="relative">
                  <AspectRatio ratio={1}>
                    <img
                      src={e.imageSrc}
                      alt={`Contest entry by ${e.authorName}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </AspectRatio>
                </article>
              ))}
              {entries.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">No entries for this week yet.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {entries.map(e => (
                <article key={e.id}>
                  <PostCard
                    authorName={e.authorName}
                    time={formatTimeForCard(e.createdAt, week.label)}
                    content={`${e.participantData?.age} yo · ${e.participantData?.weight_kg} kg · ${e.participantData?.height_cm} cm · ${e.participantData?.country}`}
                    imageSrc={e.imageSrc}
                    likes={0}
                    comments={0}
                    authorProfileId={e.participantData?.user_id}
                  />
                </article>
              ))}
              {entries.length === 0 && (
                <p className="text-sm text-muted-foreground">No entries for this week yet.</p>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Contest;

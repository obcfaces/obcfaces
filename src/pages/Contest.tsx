import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import PostCard from "@/components/profile/PostCard";
// Use direct paths to public images
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AlignJustify, Grid2X2 } from "lucide-react";

interface Week {
  key: string;
  label: string;
}

const Contest = () => {
  const [selectedWeek, setSelectedWeek] = useState("current");
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('full');

  const weeks: Week[] = [
    { key: "current", label: "This Week (25-31 Aug 2025)" },
    { key: "week1", label: "1 Week Ago (18-24 Aug 2025)" },
    { key: "week2", label: "2 Weeks Ago (11-17 Aug 2025)" },
    { key: "week3", label: "3 Weeks Ago (4-10 Aug 2025)" },
  ];

  const samplePosts = useMemo(() => [
    {
      id: "1",
      authorName: "Maria Santos",
      authorAvatarUrl: "/lovable-uploads/1147be30-a1d2-466f-a9a8-067f4628cbb2.png",
      time: "2 hours ago",
      content: "Excited to be part of this week's competition! 🌟",
      imageSrc: "/lovable-uploads/1147be30-a1d2-466f-a9a8-067f4628cbb2.png",
      likes: 245,
      comments: 18,
      hasLiked: false
    },
    {
      id: "2", 
      authorName: "Anna Cruz",
      authorAvatarUrl: "/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png",
      time: "5 hours ago",
      content: "Thank you everyone for the support! 💖",
      imageSrc: "/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png",
      likes: 189,
      comments: 23,
      hasLiked: true
    },
    {
      id: "3",
      authorName: "Sofia Reyes", 
      authorAvatarUrl: "/lovable-uploads/c4e9d90c-eeda-44db-94e3-08c6a959f1a5.png",
      time: "1 day ago",
      content: "Beautiful sunset photoshoot today! What do you think? ✨",
      imageSrc: "/lovable-uploads/c4e9d90c-eeda-44db-94e3-08c6a959f1a5.png",
      likes: 156,
      comments: 31,
      hasLiked: false
    }
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contest Gallery - OBC Philippines</title>
        <meta name="description" content="Browse contest entries and participate in the Online Beauty Contest Philippines. Vote for your favorite contestants." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4">Contest Gallery</h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Explore entries from current and past contests. Vote for your favorites and see who takes home the prizes!
          </p>
        </div>

        {/* Week Filter and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <div className="w-full sm:w-80">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week.key} value={week.key}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <AlignJustify size={20} />
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'full' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Grid2X2 size={20} />
            </button>
          </div>
        </div>

        {/* Contest Posts Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'full' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 max-w-2xl mx-auto'
        }`}>
          {samplePosts.map((post) => (
            <div key={post.id} className="w-full">
              {viewMode === 'full' ? (
                <AspectRatio ratio={3/4}>
                <div className="h-full">
                  <PostCard {...post} />
                </div>
                </AspectRatio>
              ) : (
                <PostCard
                  {...post}
                />
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors">
            Load More Posts
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contest;
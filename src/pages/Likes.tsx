import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import LikedItem from "@/components/profile/LikedItem";
import SearchableSelect from "@/components/ui/searchable-select";
import { Heart, AlignJustify, Grid2X2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data for likes (copying the structure from Profile.tsx)
const mockLikedItems = [
  {
    likeId: "1",
    contentType: "contest" as const,
    contentId: "1",
    authorName: "Anna Petrova",
    authorAvatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    authorProfileId: "user1",
    time: "2 часа назад",
    content: "Participating in beauty contest",
    imageSrc: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    likes: 124,
    comments: 18,
    candidateData: {
      country: "Russia",
      age: 24,
      height: 165
    },
    participantType: "candidate" as const
  },
  {
    likeId: "2", 
    contentType: "photo" as const,
    contentId: "2",
    authorName: "Elena Martinez",
    authorAvatarUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face",
    authorProfileId: "user2",
    time: "1 день назад",
    content: "Beautiful sunset photoshoot",
    imageSrc: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face",
    likes: 89,
    comments: 12,
    candidateData: {
      country: "Philippines",
      age: 22,
      height: 160
    }
  },
  {
    likeId: "3",
    contentType: "post" as const,
    contentId: "3", 
    authorName: "Sofia Chen",
    authorAvatarUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face",
    authorProfileId: "user3",
    time: "3 дня назад",
    content: "Morning coffee vibes ☕",
    imageSrc: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face",
    likes: 45,
    comments: 8,
    candidateData: {
      country: "Singapore",
      age: 26,
      height: 158
    }
  }
];

const Likes = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [likesViewMode, setLikesViewMode] = useState<'compact' | 'full'>('compact');
  const [likesCountryFilter, setLikesCountryFilter] = useState<string>("all");

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(user.id);
      setLoading(false);
    };
    getCurrentUser();
  }, [navigate]);

  // Load liked items
  useEffect(() => {
    if (currentUserId) {
      // For now, using mock data
      setLikedItems(mockLikedItems);
    }
  }, [currentUserId]);

  const handleUnlike = (likeId: string) => {
    setLikedItems(prev => prev.filter(item => item.likeId !== likeId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>I Like - OBC faces</title>
        <meta name="description" content="Content you liked" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">I Like</h1>
        </div>

        {likedItems.length > 0 ? (
          <div className="px-0 sm:px-6">
            {/* Country filter and view mode toggle */}
            <div className="flex justify-between items-center gap-4 mb-4 px-6 sm:px-0">
              {/* Country filter */}
              <div className="flex-1 max-w-48">
                <SearchableSelect
                  value={likesCountryFilter}
                  onValueChange={setLikesCountryFilter}
                  options={[
                    { value: "all", label: "All countries" },
                    ...Array.from(new Set(likedItems
                      .map(item => item.candidateData?.country)
                      .filter(Boolean)
                    )).sort().map((country) => ({
                      value: country,
                      label: country
                    }))
                  ]}
                  placeholder="All countries"
                  highlightSelected
                />
              </div>
              
              {/* View mode toggle buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLikesViewMode("compact")}
                  aria-pressed={likesViewMode === "compact"}
                  aria-label="List view"
                  className="p-1 rounded-md hover:bg-accent transition-colors"
                >
                  <AlignJustify 
                    size={28} 
                    strokeWidth={1}
                    className={likesViewMode === "compact" ? "text-primary" : "text-muted-foreground"}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setLikesViewMode("full")}
                  aria-pressed={likesViewMode === "full"}
                  aria-label="Grid view"
                  className="p-1 rounded-md hover:bg-accent transition-colors"
                >
                  <Grid2X2 
                    size={28} 
                    strokeWidth={1}
                    className={likesViewMode === "full" ? "text-primary" : "text-muted-foreground"}
                  />
                </button>
              </div>
            </div>
            
            {/* Liked items grid */}
            <div className={`grid gap-1 sm:gap-3 ${
              likesViewMode === 'compact' 
                ? 'grid-cols-1' 
                : 'grid-cols-1 lg:grid-cols-2'
            }`}>
              {likedItems
                .filter(item => 
                  likesCountryFilter === "all" || 
                  item.candidateData?.country === likesCountryFilter
                )
                .map((item) => (
                <LikedItem
                  key={item.likeId}
                  likeId={item.likeId}
                  contentType={item.contentType}
                  contentId={item.contentId}
                  authorName={item.authorName}
                  authorAvatarUrl={item.authorAvatarUrl}
                  authorProfileId={item.authorProfileId}
                  time={item.time}
                  content={item.content}
                  imageSrc={item.imageSrc}
                  likes={item.likes}
                  comments={item.comments}
                  onUnlike={handleUnlike}
                  viewMode={likesViewMode}
                  candidateData={item.candidateData}
                  participantType={item.participantType}
                  showStatusBadge={false}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">You haven't liked anything yet</p>
            <p className="text-sm text-muted-foreground mt-2">Like posts and photos to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Likes;
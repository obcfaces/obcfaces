import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import LikedItem from "@/components/profile/LikedItem";
import SearchableSelect from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Mock data for who liked me
const mockWhoLikedMe = [
  {
    likeId: "w1",
    contentType: "post" as const,
    contentId: "my1",
    authorName: "Maria Santos",
    authorAvatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    authorProfileId: "liker1",
    time: "1 час назад",
    content: "liked your photo",
    imageSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    likes: 67,
    comments: 5,
    candidateData: {
      country: "Brazil",
      age: 23,
      height: 168
    }
  },
  {
    likeId: "w2",
    contentType: "contest" as const,
    contentId: "my2",
    authorName: "Lisa Johnson",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    authorProfileId: "liker2",
    time: "4 часа назад",
    content: "liked your contest participation",
    imageSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    likes: 156,
    comments: 23,
    candidateData: {
      country: "USA",
      age: 25,
      height: 172
    }
  }
];

const Likes = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [whoLikedMe, setWhoLikedMe] = useState<any[]>([]);
  const [likesViewMode, setLikesViewMode] = useState<'compact' | 'full'>('compact');
  const [likesCountryFilter, setLikesCountryFilter] = useState<string>("all");
  const [whoLikedMeViewMode, setWhoLikedMeViewMode] = useState<'compact' | 'full'>('compact');
  const [whoLikedMeCountryFilter, setWhoLikedMeCountryFilter] = useState<string>("all");

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
      setWhoLikedMe(mockWhoLikedMe);
    }
  }, [currentUserId]);

  const handleUnlike = (likeId: string) => {
    setLikedItems(prev => prev.filter(item => item.likeId !== likeId));
  };

  const handleRemoveWhoLikedMe = (likeId: string) => {
    setWhoLikedMe(prev => prev.filter(item => item.likeId !== likeId));
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
          <h1 className="text-3xl font-bold">Likes</h1>
        </div>

        <Tabs defaultValue="i-liked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="i-liked">I Liked</TabsTrigger>
            <TabsTrigger value="i-was-liked">I Was Liked</TabsTrigger>
          </TabsList>

          <TabsContent value="i-liked" className="mt-6">
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
          </TabsContent>

          <TabsContent value="i-was-liked" className="mt-6">
            {whoLikedMe.length > 0 ? (
              <div className="px-0 sm:px-6">
                {/* Country filter and view mode toggle */}
                <div className="flex justify-between items-center gap-4 mb-4 px-6 sm:px-0">
                  {/* Country filter */}
                  <div className="flex-1 max-w-48">
                    <SearchableSelect
                      value={whoLikedMeCountryFilter}
                      onValueChange={setWhoLikedMeCountryFilter}
                      options={[
                        { value: "all", label: "All countries" },
                        ...Array.from(new Set(whoLikedMe
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
                      onClick={() => setWhoLikedMeViewMode("compact")}
                      aria-pressed={whoLikedMeViewMode === "compact"}
                      aria-label="List view"
                      className="p-1 rounded-md hover:bg-accent transition-colors"
                    >
                      <AlignJustify 
                        size={28} 
                        strokeWidth={1}
                        className={whoLikedMeViewMode === "compact" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhoLikedMeViewMode("full")}
                      aria-pressed={whoLikedMeViewMode === "full"}
                      aria-label="Grid view"
                      className="p-1 rounded-md hover:bg-accent transition-colors"
                    >
                      <Grid2X2 
                        size={28} 
                        strokeWidth={1}
                        className={whoLikedMeViewMode === "full" ? "text-primary" : "text-muted-foreground"}
                      />
                    </button>
                  </div>
                </div>
                
                {/* Who liked me grid */}
                <div className={`grid gap-1 sm:gap-3 ${
                  whoLikedMeViewMode === 'compact' 
                    ? 'grid-cols-1' 
                    : 'grid-cols-1 lg:grid-cols-2'
                }`}>
                  {whoLikedMe
                    .filter(item => 
                      whoLikedMeCountryFilter === "all" || 
                      item.candidateData?.country === whoLikedMeCountryFilter
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
                      onUnlike={handleRemoveWhoLikedMe}
                      viewMode={whoLikedMeViewMode}
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
                <p className="text-muted-foreground text-lg">No one has liked your content yet</p>
                <p className="text-sm text-muted-foreground mt-2">Share more content to get likes</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Likes;
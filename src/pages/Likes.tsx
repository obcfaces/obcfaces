import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import LikedItem from "@/components/profile/LikedItem";
import SearchableSelect from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, AlignJustify, Grid2X2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadLikes } from "@/hooks/useUnreadLikes";

// Interface for liked item data
interface LikedItemData {
  likeId: string;
  contentType: 'contest' | 'photo' | 'post';
  contentId: string;
  authorName: string;
  authorAvatarUrl: string;
  authorProfileId: string;
  time: string;
  content: string;
  imageSrc: string;
  likes: number;
  comments: number;
  candidateData: {
    age: number;
    weight: number;
    height: number;
    country: string;
    city: string;
    state: string;
    faceImage: string;
    fullBodyImage: string;
    additionalPhotos: string[];
  };
  participantType?: 'candidate' | 'finalist' | 'winner';
}

const Likes = () => {
  const navigate = useNavigate();
  const { markLikesAsViewed } = useUnreadLikes();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<LikedItemData[]>([]);
  const [whoLikedMe, setWhoLikedMe] = useState<LikedItemData[]>([]);
  const [likesViewMode, setLikesViewMode] = useState<'compact' | 'full'>('compact');
  const [likesCountryFilter, setLikesCountryFilter] = useState<string>("all");
  const [whoLikedMeViewMode, setWhoLikedMeViewMode] = useState<'compact' | 'full'>('compact');
  const [whoLikedMeCountryFilter, setWhoLikedMeCountryFilter] = useState<string>("all");

  // Mark likes as viewed when user visits this page
  useEffect(() => {
    console.log('Likes page: Calling markLikesAsViewed');
    markLikesAsViewed();
  }, []); // Remove dependency to prevent infinite loop

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

  // Load liked items from database
  useEffect(() => {
    if (!currentUserId) return;

    const loadLikedItems = async () => {
      try {
        console.log('Loading likes for user:', currentUserId);
        
        // Get users the current user has liked using the database function
        const { data: usersILiked, error: likedError } = await supabase
          .rpc('get_users_i_liked', { target_user_id: currentUserId });

        console.log('Users I liked result:', { data: usersILiked, error: likedError });

        if (likedError) throw likedError;

        // Transform the data for display - now using real-time data from unified hook
        const transformedLikes: LikedItemData[] = (usersILiked || []).map((user: any) => ({
          likeId: user.like_id,
          contentType: user.content_type as 'contest' | 'photo' | 'post',
          contentId: user.content_id,
          authorName: user.display_name || 'Unknown User',
          authorAvatarUrl: user.avatar_url || user.photo_1_url || '/placeholder.svg',
          authorProfileId: user.liked_user_id,
          time: new Date(user.created_at).toLocaleDateString('ru-RU'),
          content: user.content_type === 'contest' ? 'Contest participation' : 'Liked content',
          imageSrc: user.photo_1_url || user.avatar_url || '/placeholder.svg',
          likes: 0, // Will be loaded by useCardData in LikedItem component
          comments: 0, // Will be loaded by useCardData in LikedItem component
          candidateData: {
            age: user.age || 25,
            weight: user.weight_kg || 52,
            height: user.height_cm || 168,
            country: user.country || 'Philippines',
            city: user.city || 'Unknown',
            state: user.state || '',
            faceImage: user.photo_1_url,
            fullBodyImage: user.photo_2_url,
            additionalPhotos: []
          },
          participantType: (user.participant_type as 'candidate' | 'finalist' | 'winner') || 'candidate'
        }));

        setLikedItems(transformedLikes);

        // Get users who liked the current user's content
        const { data: usersWhoLikedMe, error: whoLikedError } = await supabase
          .rpc('get_users_who_liked_me', { target_user_id: currentUserId });

        if (whoLikedError) throw whoLikedError;

        // Transform the data for display - People Who Liked Me
        const transformedWhoLikedMe: LikedItemData[] = (usersWhoLikedMe || []).map((user: any) => ({
          likeId: user.like_id,
          contentType: user.content_type as 'contest' | 'photo' | 'post',
          contentId: user.content_id,
          authorName: user.display_name || 'Unknown User',
          authorAvatarUrl: user.avatar_url || user.photo_1_url || '/placeholder.svg',
          authorProfileId: user.liker_user_id,
          time: new Date(user.created_at).toLocaleDateString('ru-RU'),
          content: 'liked your contest photo',
          imageSrc: user.photo_1_url || user.avatar_url || '/placeholder.svg',
          likes: 0,
          comments: 0,
          candidateData: {
            age: user.age || 25,
            weight: user.weight_kg || 52,
            height: user.height_cm || 168,
            country: user.country || 'Philippines',
            city: user.city || 'Unknown',
            state: user.state || '',
            faceImage: user.photo_1_url,
            fullBodyImage: user.photo_2_url,
            additionalPhotos: []
          },
          participantType: (user.participant_type as 'candidate' | 'finalist' | 'winner') || 'candidate'
        }));

        setWhoLikedMe(transformedWhoLikedMe);

      } catch (error) {
        console.error('Error loading likes:', error);
        setLikedItems([]);
        setWhoLikedMe([]);
      }
    };

    loadLikedItems();
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
        <title>Likes - OBC faces</title>
        <meta name="description" content="Content you liked" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-0 sm:px-6 py-8">
        <Tabs defaultValue="i-liked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="i-liked">People I Liked</TabsTrigger>
            <TabsTrigger value="i-was-liked">People Who Liked Me</TabsTrigger>
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